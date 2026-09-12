import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

/** 使用环境变量中的密码初始化一个通用账户。 */
async function initUsers() {
  try {
    console.log('🔐 开始初始化用户账户...\n');

    const initialPassword = process.env.REMEMBER_INITIAL_PASSWORD;
    if (!initialPassword) {
      throw new Error('必须配置 REMEMBER_INITIAL_PASSWORD');
    }

    // 加密密码
    console.log('🔒 加密密码中...');
    const password = await bcrypt.hash(initialPassword, 10);
    console.log('✅ 密码加密完成\n');

    const user = await prisma.user.upsert({
      where: { username: 'remember' },
      update: { password },
      create: {
        name: 'Remember User',
        username: 'remember',
        password
      }
    });
    console.log(`✅ Remember 用户创建成功`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - 用户名: ${user.username}`);

    console.log('🎉 用户初始化完成！');
    console.log('密码已从环境变量安全加载。');

  } catch (error) {
    console.error('❌ 初始化用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行初始化
initUsers().catch((error) => {
  console.error('执行失败:', error);
  process.exit(1);
});
