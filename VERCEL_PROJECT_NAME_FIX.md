# Vercel 项目名称问题解决方案

## 问题说明

Vercel 对项目名称有严格要求：
- ✅ 必须是小写字母
- ✅ 最多 100 个字符
- ✅ 可以包含：字母、数字、`.`、`_`、`-`
- ❌ 不能包含：大写字母、空格、特殊字符
- ❌ 不能包含连续三个连字符 `---`

## 解决方案

### 方案一：使用符合要求的项目名称（推荐）

在 Vercel 导入项目时，**项目名称**应该设置为：

```
important-events-for-akp
```

或者更简短的名称：

```
important-events
```

或者：

```
akp-events
```

### 方案二：在 Vercel Dashboard 中修改项目名称

如果项目已经创建但名称不符合要求：

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 "Settings"（设置）
4. 找到 "General" → "Project Name"
5. 修改为符合要求的名称（全小写，使用 `-` 分隔）
6. 保存更改

### 方案三：重新导入项目

如果无法修改现有项目名称：

1. 删除当前项目（如果已创建）
2. 重新导入 GitHub 仓库
3. 在 "Project Name" 字段输入：`important-events-for-akp`
4. 确保名称全小写，使用连字符分隔

## 正确的项目名称示例

✅ **推荐使用的名称**：
- `important-events-for-akp`
- `important-events`
- `akp-events`
- `events-manager`
- `akp-event-tracker`

❌ **不符合要求的名称**：
- `Important-Events-for-AKP`（包含大写字母）
- `Important Events for AKP`（包含空格）
- `important---events`（包含三个连续连字符）
- `important_events_for_akp`（虽然可以使用下划线，但连字符更推荐）

## 部署步骤（修正版）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择 `Important-Events-for-AKP` 仓库
   - 点击 "Import"

3. **配置项目名称** ⚠️ 重要！
   - 在 "Project Name" 字段输入：`important-events-for-akp`
   - 确保全小写，使用连字符分隔
   - 不要使用空格或大写字母

4. **配置构建设置**
   - Framework Preset: 选择 "Other" 或留空
   - Root Directory: 留空
   - Build Command: `pnpm install && pnpm build:h5`（已通过 vercel.json 自动配置）
   - Output Directory: `dist`（已自动配置）
   - Install Command: `pnpm install`（已自动配置）

5. **配置环境变量**
   ```
   TARO_APP_SUPABASE_URL = 你的 Supabase URL
   TARO_APP_SUPABASE_ANON_KEY = 你的 Supabase 匿名密钥
   TARO_APP_NAME = 重要事件管理
   TARO_APP_APP_ID = 你的应用 ID
   ```

6. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成

## 注意事项

- **项目名称**和 **GitHub 仓库名称**可以不同
- Vercel 会自动将项目名称转换为 URL 的一部分
- 例如：项目名称 `important-events-for-akp` 会生成 URL `important-events-for-akp.vercel.app`
- 项目名称可以在部署后修改，但 URL 不会改变（除非删除重建）

## 验证

部署成功后，你应该能够：
- ✅ 访问 `https://important-events-for-akp.vercel.app`（或你设置的项目名称）
- ✅ 看到应用正常加载
- ✅ 所有功能正常工作

## 如果仍然遇到问题

1. **检查项目名称格式**
   - 确保全小写
   - 确保没有空格
   - 确保没有连续三个连字符

2. **清除浏览器缓存**
   - 刷新页面
   - 或使用无痕模式

3. **检查 Vercel 状态**
   - 访问 https://vercel.com/status
   - 确认服务正常

4. **联系支持**
   - 如果问题持续，可以联系 Vercel 支持

---

**记住**：项目名称必须全小写，使用连字符分隔单词！

