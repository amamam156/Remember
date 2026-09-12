# 多阶段构建 - 构建阶段
FROM node:18-slim AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN rm -f package-lock.json && npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 构建参数 - 在构建时传入
ARG VITE_API_BASE=http://localhost:3001
ENV VITE_API_BASE=${VITE_API_BASE}

# 构建应用
RUN npm run build

# 生产阶段 - 使用 Nginx 提供静态文件服务
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

