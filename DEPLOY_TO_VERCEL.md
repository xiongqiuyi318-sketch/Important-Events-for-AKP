# Vercel 部署完整指南

## ✅ 配置文件已就绪

项目根目录已包含 `vercel.json` 配置文件，包含：
- ✅ 构建命令配置
- ✅ 输出目录配置
- ✅ 前端路由回退配置（history fallback）
- ✅ 静态资源处理

## 🚀 快速部署步骤

### 方法一：通过 Vercel 网站（推荐）

1. **访问 Vercel 并登录**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录（如果项目在 GitHub）

2. **导入项目**
   - 点击右上角 "Add New..." → "Project"
   - 在 "Import Git Repository" 中找到你的仓库
   - 点击 "Import" 按钮

3. **配置项目设置**
   - **Framework Preset**: 选择 "Other" 或保持默认
   - **Root Directory**: 留空（使用根目录）
   - **Build Command**: 已通过 `vercel.json` 自动配置为 `pnpm install && pnpm build:h5`
   - **Output Directory**: 已自动配置为 `dist`
   - **Install Command**: 已自动配置为 `pnpm install`

4. **配置环境变量** ⚠️ 重要！
   点击 "Environment Variables" 添加以下变量：
   
   ```
   TARO_APP_SUPABASE_URL = https://your-project.supabase.co
   TARO_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   TARO_APP_NAME = 重要事件管理
   TARO_APP_APP_ID = your-app-id
   ```

   **注意**：
   - 每个环境变量都要分别添加（Production、Preview、Development）
   - 或者勾选所有环境，一次性添加

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常 2-5 分钟）
   - 部署成功后，你会看到一个 URL（如 `your-project.vercel.app`）

### 方法二：通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 在项目根目录登录
vercel login

# 3. 部署（首次会引导配置）
vercel

# 4. 配置环境变量
vercel env add TARO_APP_SUPABASE_URL production
vercel env add TARO_APP_SUPABASE_ANON_KEY production
vercel env add TARO_APP_NAME production
vercel env add TARO_APP_APP_ID production

# 5. 生产环境部署
vercel --prod
```

## 📋 部署前检查清单

- [ ] 代码已推送到 GitHub/GitLab/Bitbucket
- [ ] `vercel.json` 文件在项目根目录
- [ ] 已准备好 Supabase 项目 URL 和密钥
- [ ] 已准备好环境变量值

## 🔧 配置文件说明

### vercel.json

```json
{
  "buildCommand": "pnpm install && pnpm build:h5",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**配置说明**：
- `buildCommand`: 安装依赖并构建 H5 版本
- `outputDirectory`: 构建输出目录（Taro 默认）
- `routes`: 路由配置，所有路径都返回 `index.html`（支持前端路由）
- `rewrites`: 重写规则，同样支持前端路由回退

## 🐛 常见问题排查

### 问题 1: 构建失败

**错误信息**: Build failed

**解决方案**:
1. 检查 Vercel 构建日志中的错误信息
2. 确认 Node.js 版本（建议 18.x 或 20.x）
3. 检查环境变量是否全部配置
4. 确认 pnpm 已正确安装（Vercel 自动检测）

### 问题 2: 页面空白

**错误信息**: 页面加载后显示空白

**解决方案**:
1. 打开浏览器开发者工具（F12）
2. 查看 Console 中的错误信息
3. 检查 Network 标签，确认资源加载是否成功
4. 验证环境变量是否正确配置
5. 检查 Supabase CORS 设置（允许你的 Vercel 域名）

### 问题 3: 路由 404

**错误信息**: 刷新页面或直接访问子路由时出现 404

**解决方案**:
- ✅ 已通过 `vercel.json` 配置路由回退
- 如果仍有问题，检查 `vercel.json` 是否正确提交到 Git
- 确认 Vercel 使用的是最新代码

### 问题 4: 环境变量未生效

**错误信息**: 应用无法连接到 Supabase

**解决方案**:
1. 在 Vercel Dashboard 中检查环境变量是否正确添加
2. 确认环境变量名称完全匹配（大小写敏感）
3. 重新部署项目（修改环境变量后需要重新部署）
4. 检查环境变量值是否正确（无多余空格）

## 🔄 自动部署

配置完成后，Vercel 会自动：
- ✅ 监听 Git 仓库推送
- ✅ 自动构建和部署
- ✅ 为每个分支创建预览部署
- ✅ 为主分支创建生产部署

## 🌐 自定义域名

1. 在 Vercel Dashboard 中进入项目
2. 点击 "Settings" → "Domains"
3. 输入你的域名
4. 按照提示配置 DNS 记录

## 📊 部署后验证

部署成功后，请检查：

1. **首页加载**
   - 访问 Vercel 提供的 URL
   - 确认页面正常显示

2. **路由跳转**
   - 点击页面内的链接
   - 确认可以正常跳转

3. **页面刷新**
   - 在任意页面按 F5 刷新
   - 确认不会出现 404

4. **功能测试**
   - 测试登录功能
   - 测试创建事件
   - 测试页面导航

## 🔐 环境变量说明

| 变量名 | 必需 | 说明 | 获取方式 |
|--------|------|------|----------|
| `TARO_APP_SUPABASE_URL` | ✅ | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `TARO_APP_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| `TARO_APP_NAME` | ✅ | 应用名称 | 自定义，如：重要事件管理 |
| `TARO_APP_APP_ID` | ✅ | 应用唯一标识 | 自定义字符串 |

## 📝 更新部署

代码更新后：

1. **自动部署**（推荐）
   - 推送到 Git 仓库
   - Vercel 自动检测并部署

2. **手动部署**
   - 在 Vercel Dashboard 中点击 "Redeploy"
   - 或使用 CLI: `vercel --prod`

## 🆘 获取帮助

如果部署遇到问题：

1. 查看 Vercel 构建日志
2. 检查浏览器控制台错误
3. 参考项目文档：
   - [README.md](./README.md)
   - [DEPLOYMENT.md](./DEPLOYMENT.md)
   - [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

## ✨ 部署成功标志

看到以下内容说明部署成功：
- ✅ Vercel 显示 "Ready" 状态
- ✅ 可以访问提供的 URL
- ✅ 页面正常显示，无错误
- ✅ 所有功能正常工作

---

**现在你可以开始部署了！** 🚀

如有任何问题，请检查上述故障排查部分或查看 Vercel 官方文档。

