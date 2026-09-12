import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import https from 'https';

const prisma = new PrismaClient();
const FLAG_DIR = path.join(__dirname, '../../../frontend/public/flag');

async function download(url: string, filePath: string) {
  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(FLAG_DIR)) {
    fs.mkdirSync(FLAG_DIR, { recursive: true });
  }

  const countries = await prisma.country.findMany();
  console.log(`准备为 ${countries.length} 个国家下载国旗...`);

  for (const c of countries) {
    const iso2 = c.iso2.toLowerCase();
    const filePath = path.join(FLAG_DIR, `${iso2}.png`);

    if (!fs.existsSync(filePath)) {
      try {
        // 使用 flagcdn 获取 160px 宽度的国旗
        await download(`https://flagcdn.com/w160/${iso2}.png`, filePath);
        console.log(`✅ 已保存: ${c.name} (${iso2}.png)`);
      } catch (e: any) {
        console.warn(`❌ 无法下载 ${c.name} 的国旗: ${e.message}`);
      }
    } else {
      console.log(`⏩ 已存在: ${c.name}`);
    }
  }

  console.log('✨ 国旗下载任务完成！');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
