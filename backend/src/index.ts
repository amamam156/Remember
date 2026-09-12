import app from './app.js';
import { prisma } from './database/prisma.js';
import path from 'path';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function startServer() {
  try {
    // 确保数据库目录存在
    const { mkdir, access } = await import('fs/promises');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // 创建数据目录（如果不存在）
    try {
      await mkdir('./prisma/data', { recursive: true });
      console.log('✅ 数据目录已就绪');
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        console.warn('⚠️  创建数据目录失败:', err.message);
      }
    }
    
    // 检查数据库文件是否存在
    const databaseUrl = process.env.DATABASE_URL || 'file:./data/memories.db';
    const configuredPath = databaseUrl.replace(/^file:/, '');
    const dbPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), 'prisma', configuredPath);
    let needsInit = false;
    try {
      await access(dbPath);
      console.log('✅ 数据库文件存在');
    } catch {
      console.log('⚠️  数据库文件不存在，正在初始化...');
      needsInit = true;
      try {
        // 使用 db push 创建数据库（不创建迁移文件）
        // 注意：移除了 --accept-data-loss 标志以保护数据
        await execAsync('npx prisma db push');
        console.log('✅ 数据库初始化成功');
      } catch (pushErr: any) {
        console.error('❌ 数据库初始化失败:', pushErr.message);
        throw pushErr;
      }
    }
    
    // 验证数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查并初始化用户
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('⚠️  未发现用户，正在创建默认用户...');
      const bcrypt = await import('bcryptjs');
      const initialPassword = process.env.REMEMBER_INITIAL_PASSWORD;

      if (!initialPassword) {
        throw new Error('首次启动必须配置 REMEMBER_INITIAL_PASSWORD');
      }
      
      await prisma.user.create({
        data: {
          name: 'Remember User',
          username: 'remember',
          password: await bcrypt.default.hash(initialPassword, 10)
        }
      });
      
      console.log('✅ 默认用户创建成功');
      console.log('   - Remember User');
    } else {
      console.log(`✅ 用户数据已存在 (${userCount} 个用户)`);
    }
    
    // 检查基础数据是否存在（只读检查，不修改数据）
    const countryCount = await prisma.country.count();
    const admin1Count = await prisma.admin1.count();
    const cityCount = await prisma.city.count();
    
    if (countryCount === 0 || admin1Count === 0 || cityCount === 0) {
      console.warn('⚠️  警告：基础数据不完整！');
      console.warn(`   国家: ${countryCount}, 省份/州: ${admin1Count}, 城市: ${cityCount}`);
      console.warn('   请运行: npm run db:seed 来初始化基础数据');
    } else {
      console.log(`✅ 基础数据完整 (国家: ${countryCount}, 省份/州: ${admin1Count}, 城市: ${cityCount})`);
    }
    
    // 启动服务器 - 监听所有网络接口
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📱 本地访问: http://localhost:${PORT}/api`);
      console.log(`📱 局域网访问: http://0.0.0.0:${PORT}/api`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

startServer();
