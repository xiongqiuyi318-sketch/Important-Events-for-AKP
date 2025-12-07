# Vercel 配置冲突问题解决方案

## 问题描述

在部署到 Vercel 时遇到错误：
```
If 'rewrites', 'redirects', 'headers', 'cleanUrls' or 'trailingSlash' are used, 
then 'routes' cannot be present.
```

## 问题原因

在 `vercel.json` 配置文件中，**不能同时使用 `routes` 和 `rewrites`**。

Vercel 的规则：
- 如果使用了 `rewrites`、`redirects`、`headers`、`cleanUrls` 或 `trailingSlash`，就不能使用 `routes`
- `routes` 是旧版配置方式
- `rewrites` 是推荐的现代配置方式

## 解决方案

已修复 `vercel.json` 配置文件，移除了 `routes`，只保留 `rewrites`。

### 修复前（错误配置）：
```json
{
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

### 修复后（正确配置）：
```json
{
  "buildCommand": "pnpm install && pnpm build:h5",
  "outputDirectory": "dist",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 配置说明

### `rewrites` 的作用

`rewrites` 配置用于实现前端路由回退（history fallback），确保：
- ✅ 所有路由都返回 `index.html`
- ✅ 刷新页面不会出现 404
- ✅ 支持单页应用（SPA）路由

### 配置解释

```json
{
  "source": "/(.*)",           // 匹配所有路径
  "destination": "/index.html" // 都重写到 index.html
}
```

这个配置会：
- 匹配所有请求路径（`/(.*)` 是正则表达式）
- 将所有请求重写到 `/index.html`
- 让前端路由系统处理实际的路由

## 现在可以重新部署

1. **代码已修复并推送**
   - ✅ `vercel.json` 已更新
   - ✅ 已推送到 GitHub

2. **在 Vercel 中重新部署**
   - Vercel 会自动检测到新的提交
   - 或者手动点击 "Redeploy"

3. **验证部署**
   - 检查构建日志，应该不再有配置错误
   - 部署成功后，访问应用 URL
   - 测试路由跳转和页面刷新

## 其他 Vercel 配置选项

如果需要更多配置，可以参考：

### 添加重定向
```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### 添加响应头
```json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 清理 URL（移除尾部斜杠）
```json
{
  "cleanUrls": true
}
```

### 强制尾部斜杠
```json
{
  "trailingSlash": true
}
```

**注意**：所有这些选项都不能与 `routes` 同时使用。

## 相关文档

- [Vercel 配置文档](https://vercel.com/docs/project-configuration)
- [Vercel rewrites 文档](https://vercel.com/docs/project-configuration#rewrites)
- [项目部署指南](./DEPLOY_TO_VERCEL.md)

---

**问题已解决！** 现在可以正常部署到 Vercel 了。🚀

