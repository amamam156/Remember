FROM node:18-slim

WORKDIR /app

# 安装编译依赖
RUN apt-get update && apt-get install -y \
    python3 make g++ libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖配置
COPY package*.json ./

# 只复制 Prisma schema 文件，避免复制本地数据库和嵌套目录
RUN mkdir -p prisma
COPY prisma/schema.prisma ./prisma/schema.prisma

# 安装依赖
RUN npm install --legacy-peer-deps 2>&1

# 生成 Prisma Client
RUN npx prisma generate 2>&1

# 复制源码
COPY tsconfig.json ./
COPY src ./src

# 编译
RUN npm run build 2>&1

# 创建数据目录
RUN mkdir -p prisma/data uploads

EXPOSE 3001

ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/index.js"]
