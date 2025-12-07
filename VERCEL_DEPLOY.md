# Vercel 部署指南

本文档说明如何将项目部署到 Vercel。

## 前置要求

1. 拥有 Vercel 账号（可通过 GitHub 账号登录）
2. 项目已推送到 GitHub/GitLab/Bitbucket
3. 已配置 Supabase 项目并获取相关密钥

## 部署步骤

### 方法一：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub/GitLab/Bitbucket 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择你的 Git 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: 选择 "Other" 或留空（已通过 vercel.json 配置）
   - **Root Directory**: 留空（使用项目根目录）
   - **Build Command**: `pnpm build:h5`（已自动配置）
   - **Output Directory**: `dist`（已自动配置）
   - **Install Command**: `pnpm install`（已自动配置）

4. **配置环境变量**
   在 "Environment Variables" 部分添加以下变量：
   
   ```
   TARO_APP_SUPABASE_URL=your_supabase_project_url
   TARO_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   TARO_APP_NAME=重要事件管理
   TARO_APP_APP_ID=your_app_id
   ```

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（通常需要 2-5 分钟）
   - 部署成功后，Vercel 会提供一个 URL（如 `your-project.vercel.app`）

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目目录中部署**
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add TARO_APP_SUPABASE_URL
   vercel env add TARO_APP_SUPABASE_ANON_KEY
   vercel env add TARO_APP_NAME
   vercel env add TARO_APP_APP_ID
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TARO_APP_SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `TARO_APP_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `TARO_APP_NAME` | 应用名称 | `重要事件管理` |
| `TARO_APP_APP_ID` | 应用唯一标识 | 自定义字符串 |

## 自动部署

配置完成后，Vercel 会自动：
- 监听 Git 仓库的推送
- 在每次推送时自动构建和部署
- 为每个分支创建预览部署
- 为主分支（通常是 `main` 或 `master`）创建生产部署

## 自定义域名

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 "Domains"
3. 添加你的自定义域名
4. 按照提示配置 DNS 记录

## 性能优化

Vercel 已自动配置：
- ✅ SPA 路由回退（所有路由返回 index.html）
- ✅ 静态资源缓存（CSS、JS 文件长期缓存）
- ✅ 全球 CDN 加速
- ✅ HTTPS 自动配置
- ✅ Gzip/Brotli 压缩

## 故障排查

### 构建失败

**问题**: 构建命令执行失败

**解决方案**:
1. 检查 Vercel 构建日志
2. 确认 Node.js 版本（建议 18+）
3. 确认 pnpm 已正确安装
4. 检查环境变量是否配置正确

### 页面空白

**问题**: 部署后页面显示空白

**解决方案**:
1. 检查浏览器控制台错误
2. 确认环境变量已正确配置
3. 检查 Supabase CORS 设置
4. 查看 Vercel 函数日志

### 路由 404

**问题**: 刷新页面后出现 404

**解决方案**:
- 已通过 `vercel.json` 配置路由回退，确保所有路由返回 `index.html`
- 如果仍有问题，检查 `vercel.json` 配置是否正确

## 更新部署

代码更新后，Vercel 会自动：
1. 检测到 Git 推送
2. 触发新的构建
3. 部署新版本
4. 保留旧版本以便回滚

你也可以手动触发部署：
- 在 Vercel Dashboard 中点击 "Redeploy"
- 或使用 CLI: `vercel --prod`

## 回滚部署

如果需要回滚到之前的版本：
1. 在 Vercel Dashboard 中进入 "Deployments"
2. 找到要回滚的版本
3. 点击 "..." 菜单
4. 选择 "Promote to Production"

## 监控和分析

Vercel 提供：
- 实时日志查看
- 性能分析
- 错误追踪
- 访问统计

在 Dashboard 中可以查看这些信息。

## 支持

如有问题，请查看：
- [Vercel 官方文档](https://vercel.com/docs)
- [项目 README](./README.md)
- [详细部署指南](./DEPLOYMENT.md)

