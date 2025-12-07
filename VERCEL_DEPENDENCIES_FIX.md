# Vercel 依赖安装问题解决方案

## 问题描述

在 Vercel 部署时，`pnpm install` 命令失败（退出码 1），可能的原因包括：

1. **依赖包不存在或版本不兼容**
2. **私有包无法访问**
3. **Taro 版本问题**

## 已实施的修复

### 1. 更新 Taro 版本

将 Taro 从 `^4.0.0` 改为 `3.6.0`（稳定版本）：
- `@tarojs/taro`: `3.6.0`
- `@tarojs/components`: `3.6.0`
- `@tarojs/cli`: `3.6.0`
- 其他 Taro 相关包统一为 `3.6.0`

### 2. 创建 .npmrc 配置文件

创建了 `.npmrc` 文件，配置 pnpm 行为：
```
strict-peer-dependencies=false
auto-install-peers=true
shamefully-hoist=true
```

这些配置可以：
- 允许 peer dependencies 不严格匹配
- 自动安装 peer dependencies
- 提升依赖到根目录（解决某些包的依赖问题）

### 3. 移除可能不存在的私有包

移除了 `optionalDependencies` 中的私有包：
- `miaoda-auth-taro`
- `miaoda-sc-plugin`
- `supabase-wechat-js`

**注意**：如果这些包在代码中被使用，可能需要：
1. 确保这些包在 npm 上可用
2. 或者使用私有 npm registry
3. 或者创建这些包的占位符

## 如果构建仍然失败

### 检查构建日志

查看 Vercel 构建日志中的具体错误信息，常见错误包括：

1. **包不存在**
   ```
   ERR_PNPM_NO_MATCHING_VERSION  No matching version found for xxx
   ```
   - 解决方案：检查包名和版本是否正确

2. **私有包无法访问**
   ```
   ERR_PNPM_FETCH_401  Unauthorized
   ```
   - 解决方案：配置私有 npm registry 或使用环境变量

3. **依赖冲突**
   ```
   ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies
   ```
   - 解决方案：`.npmrc` 已配置 `strict-peer-dependencies=false`

### 可能的解决方案

#### 方案一：添加缺失的依赖

如果构建日志显示缺少某些包，在 `package.json` 中添加：

```json
{
  "dependencies": {
    "missing-package": "^1.0.0"
  }
}
```

#### 方案二：使用私有 npm registry

如果项目使用私有包，在 `.npmrc` 中配置：

```
@your-scope:registry=https://your-registry.com/
//your-registry.com/:_authToken=${NPM_TOKEN}
```

然后在 Vercel 环境变量中添加 `NPM_TOKEN`。

#### 方案三：创建占位符包

如果某些包不存在但代码需要，可以创建简单的占位符：

```javascript
// 在项目中创建 src/utils/miaoda-auth-taro.js
export const AuthProvider = ({ children }) => children;
export const useAuth = () => ({ user: null });
```

然后在 `package.json` 中使用别名或直接导入。

#### 方案四：使用 postinstall 脚本

在 `package.json` 中添加 postinstall 脚本来处理缺失的包：

```json
{
  "scripts": {
    "postinstall": "node scripts/install-missing-packages.js"
  }
}
```

## 验证修复

1. **检查 package.json**
   - 确认所有依赖版本正确
   - 确认没有不存在的包

2. **检查 .npmrc**
   - 确认配置正确
   - 确认已提交到 Git

3. **重新部署**
   - 在 Vercel 中重新部署
   - 查看构建日志确认 `pnpm install` 成功

## 本地测试

在推送到 Vercel 之前，可以在本地测试：

```bash
# 清理缓存
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install

# 如果安装成功，尝试构建
pnpm build:h5
```

如果本地安装和构建都成功，说明配置正确。

## 相关文档

- [pnpm 配置文档](https://pnpm.io/npmrc)
- [Taro 官方文档](https://taro-docs.jd.com/)
- [Vercel 构建日志](https://vercel.com/docs/concepts/builds)

---

**如果问题仍然存在，请查看 Vercel 构建日志中的具体错误信息，然后根据错误信息进一步调整配置。** 🔧

