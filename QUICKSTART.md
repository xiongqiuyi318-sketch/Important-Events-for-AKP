# 快速开始指南

本指南帮助您快速部署和使用重要事件管理应用。

## 🚀 5 分钟快速部署

### 方式一：使用 Vercel（最简单）

1. **Fork 本项目到你的 GitHub**

2. **访问 [Vercel](https://vercel.com)**
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 导入你 fork 的仓库

3. **配置环境变量**
   
   在 Vercel 项目设置中添加以下环境变量：
   ```
   TARO_APP_SUPABASE_URL=你的Supabase项目URL
   TARO_APP_SUPABASE_ANON_KEY=你的Supabase匿名密钥
   TARO_APP_NAME=重要事件管理
   TARO_APP_APP_ID=你的应用ID
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待几分钟，完成！

5. **访问你的应用**
   - Vercel 会提供一个 URL（如 `your-app.vercel.app`）
   - 可以绑定自定义域名

### 方式二：使用 Netlify

1. **访问 [Netlify](https://netlify.com)**
   - 登录账号
   - 点击 "Add new site" → "Import an existing project"

2. **连接 Git 仓库**
   - 选择你的 Git 提供商
   - 选择本项目仓库

3. **配置构建设置**
   ```
   Build command: pnpm build:h5
   Publish directory: dist
   ```

4. **添加环境变量**（同 Vercel）

5. **部署并访问**

## 📱 作为微信小程序使用

如果你想在微信小程序中使用：

1. **构建小程序版本**
   ```bash
   pnpm install
   pnpm build:weapp
   ```

2. **使用微信开发者工具**
   - 打开微信开发者工具
   - 导入 `dist` 目录
   - 配置小程序 AppID
   - 上传发布

## 🔧 获取 Supabase 配置

如果你还没有 Supabase 项目：

1. **访问 [Supabase](https://supabase.com)**
   - 注册/登录账号
   - 创建新项目

2. **获取配置信息**
   - 进入项目设置 → API
   - 复制 `Project URL`（这是 `TARO_APP_SUPABASE_URL`）
   - 复制 `anon public` 密钥（这是 `TARO_APP_SUPABASE_ANON_KEY`）

3. **运行数据库迁移**
   
   本项目已包含数据库迁移文件（`supabase/migrations/`），你需要：
   - 在 Supabase 控制台的 SQL Editor 中
   - 依次执行 `supabase/migrations/` 目录下的 SQL 文件
   - 按文件名顺序执行

## 💡 使用提示

### 首次使用

1. **注册账号**
   - 打开应用
   - 使用手机号或邮箱注册
   - 第一个注册的用户自动成为管理员

2. **创建第一个事件**
   - 点击首页的 "+" 按钮
   - 填写事件信息
   - 系统会自动生成执行步骤

3. **管理事件**
   - 在首页查看所有待办事件
   - 点击事件卡片查看详情
   - 完成步骤，跟踪进度

### 核心功能

- **智能步骤生成**：创建事件时自动生成执行步骤
- **四象限视图**：按重要性和紧急程度管理事件
- **进度跟踪**：实时查看事件完成进度
- **历史记录**：查看已完成的事件

### 视图切换

在首页可以切换两种视图：
- **列表视图**：按优先级排列的事件列表
- **四象限视图**：时间管理矩阵，分为：
  - 紧急且重要
  - 重要
  - 一般
  - 不紧急不重要

## 🎨 自定义配置

### 修改应用名称

编辑 `.env` 文件：
```env
TARO_APP_NAME=你的应用名称
```

### 修改主题颜色

编辑 `src/app.scss` 文件中的颜色变量。

### 添加新的事件类别

在 `src/db/stepGenerator.ts` 中添加新的类别和对应的步骤生成逻辑。

## 📊 数据管理

### 备份数据

在 Supabase 控制台：
- Database → Backups
- 可以手动创建备份或设置自动备份

### 导出数据

使用 Supabase 的 SQL Editor 导出数据：
```sql
-- 导出所有事件
SELECT * FROM events;

-- 导出所有步骤
SELECT * FROM steps;
```

## 🔒 安全建议

1. **定期更新密码**
2. **不要分享 Supabase 密钥**
3. **使用 HTTPS**（Vercel/Netlify 自动提供）
4. **定期备份数据**

## 🐛 常见问题

### 问题：无法登录

**解决方案**：
1. 检查 Supabase 配置是否正确
2. 确认数据库迁移已执行
3. 检查浏览器控制台的错误信息

### 问题：步骤生成失败

**解决方案**：
1. 确保事件描述清晰
2. 选择正确的事件类别
3. 检查网络连接

### 问题：页面刷新后 404

**解决方案**：
- Vercel/Netlify 会自动处理路由
- 如果自己部署，参考 `DEPLOYMENT.md` 配置服务器

## 📚 更多资源

- [完整部署指南](./DEPLOYMENT.md)
- [项目文档](./README.md)
- [Taro 文档](https://taro-docs.jd.com/)
- [Supabase 文档](https://supabase.com/docs)

## 🤝 获取帮助

如果遇到问题：
1. 查看 [README.md](./README.md)
2. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
3. 检查浏览器控制台错误
4. 查看 Supabase 日志

## 🎉 开始使用

现在你已经准备好了！选择一个部署方式，开始使用你的事件管理应用吧！

---

**提示**：建议先在 Vercel 或 Netlify 上快速部署一个测试版本，熟悉流程后再考虑自定义部署。
