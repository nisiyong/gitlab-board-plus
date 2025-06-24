# 指派人列表动态加载功能更新总结

## 修改概述

将原本写死的指派人列表改为通过 GitLab GraphQL API 动态获取，并将原来的 emoji 图标改为用户头像显示。

## 修改的文件

### 1. `src/content/utils.js`
- **新增功能**: `fetchProjectMembersFromAPI()` 方法
  - 通过 GitLab GraphQL API 获取项目成员列表
  - 构建完整的 GraphQL 查询请求
  - 包含错误处理和回退机制
  
- **增强功能**: `getCurrentUser()` 方法
  - 返回完整的用户对象，包含 `username`, `name`, `avatarUrl`
  - 保持向后兼容性
  - 从多个数据源获取用户头像信息

### 2. `src/content/filters-manager.js`
- **修改**: `loadProjectMembers()` 方法
  - 使用新的 `fetchProjectMembersFromAPI()` 而不是页面抓取
  - 将成员名称改为使用 `username`
  - 移除 emoji 图标，改用头像数据
  
- **修改**: 初始化过滤组配置
  - "我" 选项也使用用户头像数据

- **增强**: `renderFilterItem()` 方法
  - 支持头像显示
  - 头像和 emoji 图标的优雅回退机制

### 3. `src/styles/content.css`
- **新增**: `.user-avatar` 样式
  - 20x20 像素圆形头像
  - 边框和悬停效果
  - 激活状态的特殊样式

### 4. `prompts/GraphQL.md`
- **更新**: 添加了获取指派人列表的 GraphQL 查询示例

## 功能特性

### ✅ 动态数据获取
- 通过 GitLab GraphQL API 实时获取项目成员
- 包含用户 ID、用户名、姓名、头像 URL
- API 调用失败时自动回退到页面抓取方式

### ✅ 头像显示
- 替换原有的 emoji 图标为用户头像
- 20x20 像素圆形头像设计
- 悬停和选中状态的视觉反馈

### ✅ 数据格式
- 使用 `username` 作为显示名称（而不是 `name`）
- 保持过滤器语法的一致性 (`assignee:@username`)

### ✅ 向后兼容
- 当用户没有头像时优雅降级到 emoji 图标
- 保持现有的过滤逻辑不变
- API 不可用时回退到原有的页面抓取方式

## GraphQL API 集成

使用的 GraphQL 查询：
```graphql
query searchUsers($fullPath: ID!, $search: String, $isProject: Boolean = false) {
  project(fullPath: $fullPath) @include(if: $isProject) {
    id
    projectMembers(search: $search, relations: [DIRECT, INHERITED, INVITED_GROUPS]) {
      nodes {
        id
        user {
          id
          avatarUrl
          name
          username
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
```

## 安全性考虑

- 使用 CSRF Token 进行 API 调用认证
- 项目 ID 从当前页面 URL 提取
- 错误处理和日志记录

## 测试建议

1. 在 GitLab 项目的看板页面测试
2. 验证指派人列表能正确加载
3. 检查头像是否正确显示
4. 测试过滤功能是否正常工作
5. 验证 API 失败时的回退机制

## 注意事项

- 需要在 GitLab 实例中测试，因为依赖 GitLab 的 GraphQL API
- 确保用户有访问项目成员列表的权限
- 头像 URL 可能需要认证，在某些情况下可能无法加载 