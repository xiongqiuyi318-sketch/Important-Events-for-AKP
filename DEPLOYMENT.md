# 部署指南

本文档说明如何将重要事件管理应用部署为网页应用。

## 前置要求

- Node.js 18+ 
- pnpm 包管理器
- 已配置的 Supabase 项目

## 构建步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

确保 `.env` 文件包含正确的配置：

```env
TARO_APP_SUPABASE_URL=https://your-project.supabase.co
TARO_APP_SUPABASE_ANON_KEY=your-anon-key
TARO_APP_NAME=重要事件管理
TARO_APP_APP_ID=your-app-id
```

### 3. 构建生产版本

```bash
# 构建 H5 网页应用
pnpm build:h5

# 或构建微信小程序
pnpm build:weapp
```

构建完成后，所有文件将输出到 `dist` 目录。

## 部署方案

### 方案一：Vercel（推荐）

1. 将代码推送到 GitHub/GitLab
2. 在 Vercel 中导入项目
3. 配置构建命令：
   - Build Command: `pnpm build:h5`
   - Output Directory: `dist`
4. 添加环境变量（与 .env 文件相同）
5. 部署

### 方案二：Netlify

1. 将代码推送到 Git 仓库
2. 在 Netlify 中新建站点
3. 配置：
   - Build command: `pnpm build:h5`
   - Publish directory: `dist`
4. 添加环境变量
5. 部署

### 方案三：静态文件托管

如果使用传统的静态文件托管（如 Nginx、Apache、云存储等）：

1. 构建项目：
   ```bash
   pnpm build:h5
   ```

2. 将 `dist` 目录的所有内容上传到服务器

3. 配置服务器：
   
   **Nginx 配置示例：**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # 启用 gzip 压缩
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

   **Apache 配置示例（.htaccess）：**
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

### 方案四：GitHub Pages

1. 构建项目：
   ```bash
   pnpm build:h5
   ```

2. 将 `dist` 目录内容推送到 `gh-pages` 分支：
   ```bash
   cd dist
   git init
   git add -A
   git commit -m 'Deploy'
   git push -f git@github.com:username/repo.git master:gh-pages
   ```

3. 在 GitHub 仓库设置中启用 GitHub Pages，选择 `gh-pages` 分支

## 本地预览

如果需要在本地预览构建后的应用：

```bash
# 安装 http-server（全局安装一次即可）
npm install -g http-server

# 进入 dist 目录并启动服务器
cd dist
http-server -p 8080

# 或使用 Python（如果已安装）
python -m http.server 8080
```

然后在浏览器访问 `http://localhost:8080`

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `TARO_APP_SUPABASE_URL` | Supabase 项目 URL | 是 |
| `TARO_APP_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 是 |
| `TARO_APP_NAME` | 应用名称 | 是 |
| `TARO_APP_APP_ID` | 应用唯一标识 | 是 |

## 注意事项

1. **HTTPS 要求**：生产环境建议使用 HTTPS，特别是涉及用户认证的应用

2. **CORS 配置**：确保 Supabase 项目的 CORS 设置允许你的域名访问

3. **环境变量安全**：
   - 不要将 `.env` 文件提交到 Git
   - 在部署平台的环境变量设置中配置敏感信息
   - `SUPABASE_ANON_KEY` 是公开的，可以在前端使用

4. **缓存策略**：
   - 静态资源（JS、CSS）使用长期缓存
   - `index.html` 不应缓存或使用短期缓存

5. **路由配置**：
   - 确保服务器配置了 SPA 路由回退
   - 所有路由都应返回 `index.html`

## 性能优化建议

1. **启用 Gzip/Brotli 压缩**
2. **配置 CDN**（如 Cloudflare）
3. **启用浏览器缓存**
4. **使用 HTTP/2**
5. **图片优化**（已使用 WebP 格式）

## 故障排查

### 问题：页面刷新后 404

**原因**：服务器未配置 SPA 路由回退

**解决**：参考上面的 Nginx 或 Apache 配置示例

### 问题：API 请求失败

**原因**：CORS 配置或环境变量错误

**解决**：
1. 检查 Supabase 项目的 CORS 设置
2. 确认环境变量配置正确
3. 检查浏览器控制台的错误信息

### 问题：白屏

**原因**：JavaScript 加载失败或环境变量缺失

**解决**：
1. 检查浏览器控制台错误
2. 确认所有环境变量已配置
3. 检查网络请求是否成功

## 更新部署

当代码更新后，重新构建并部署：

```bash
# 1. 拉取最新代码
git pull

# 2. 安装可能的新依赖
pnpm install

# 3. 重新构建
pnpm build:h5

# 4. 部署（根据你使用的方案）
# - Vercel/Netlify: 自动部署
# - 静态托管: 上传新的 dist 目录内容
```

## 监控和维护

1. **日志监控**：使用 Sentry 或类似工具监控前端错误
2. **性能监控**：使用 Google Analytics 或类似工具
3. **定期备份**：定期备份 Supabase 数据库
4. **安全更新**：定期更新依赖包

## 支持

如有问题，请查看：
- [Taro 官方文档](https://taro-docs.jd.com/)
- [Supabase 文档](https://supabase.com/docs)
- 项目 README.md
