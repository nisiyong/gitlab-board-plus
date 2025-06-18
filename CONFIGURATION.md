# GitLab Board Plus 配置指南

## 🎯 动态域名配置

本扩展支持动态配置 GitLab 域名，无需在代码中写死域名配置。

## 📋 支持的 GitLab 环境

### 自动支持（无需额外配置）
- ✅ **GitLab.com** (`https://*.gitlab.com`)
- ✅ **GitLab Pages** (`https://*.gitlab.io`)
- ✅ **本地开发环境** (`http://localhost:*`)

### 自定义域名（需要配置）
- 🔧 **企业自托管 GitLab**
- 🔧 **私有域名 GitLab 实例**
- 🔧 **内网 GitLab 环境**

## 🚀 配置步骤

### 1. 安装扩展
```bash
# 克隆项目
git clone https://github.com/your-username/gitlab-board-plus.git
cd gitlab-board-plus

# 在 Chrome 中加载
# 1. 打开 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目文件夹
```

### 2. 配置自定义域名

#### 步骤 1：打开你的 GitLab 页面
```
例如：https://your-gitlab.company.com
```

#### 步骤 2：点击扩展图标
在浏览器工具栏中点击 GitLab Board Plus 图标

#### 步骤 3：填写配置信息
1. 点击设置按钮（⚙️）
2. 填写以下信息：
   - **GitLab URL**: `https://your-gitlab.company.com`
   - **Access Token**: 你的个人访问令牌

#### 步骤 4：测试连接
1. 点击"测试连接"按钮
2. 系统会自动请求访问权限
3. 在弹出的权限对话框中点击"允许"

#### 步骤 5：保存设置
1. 点击"保存设置"按钮
2. 扩展会自动注入脚本到当前页面
3. 刷新页面查看增强功能

## 🔑 获取 GitLab Access Token

### 创建个人访问令牌
1. 登录你的 GitLab 实例
2. 进入 `用户设置` > `访问令牌`
3. 创建新的个人访问令牌
4. 选择以下权限：
   - ✅ `api` - 访问 API
   - ✅ `read_user` - 读取用户信息
   - ✅ `read_repository` - 读取仓库信息

### 权限说明
```
api          - 完整的 API 访问权限
read_user    - 读取用户配置文件信息
read_repository - 读取仓库和项目信息
```

## 🔒 权限管理

### 动态权限请求
扩展使用 Chrome 的动态权限 API：
- 只在需要时请求权限
- 用户可以随时撤销权限
- 不会在 manifest 中暴露私有域名

### 权限范围
```
https://your-domain.com/*  - 你的 GitLab 域名
```

### 权限验证
```javascript
// 检查权限状态
chrome.permissions.contains({
  origins: ['https://your-domain.com/*']
})

// 请求权限
chrome.permissions.request({
  origins: ['https://your-domain.com/*']
})
```

## 🛠️ 验证配置

### 1. 检查浏览器控制台
打开 GitLab Board 页面，按 F12 查看控制台：
```
✅ GitLab Board Plus 内容脚本已加载
✅ 检测到页面类型: board
✅ 增强 Board 页面功能
```

### 2. 检查页面元素
在 Board 页面顶部应该看到：
- 快速过滤器按钮
- 批量操作工具
- 统计信息面板

### 3. 检查扩展状态
在 `chrome://extensions/` 页面：
- 扩展状态为"已启用"
- 网站访问权限包含你的域名

## 🐛 常见问题

### Q: 权限请求失败
**A:** 确保：
- GitLab URL 格式正确（包含协议）
- 当前页面是目标 GitLab 域名
- 浏览器允许扩展请求权限

### Q: 脚本注入失败
**A:** 尝试：
1. 刷新 GitLab 页面
2. 重新点击扩展图标
3. 点击"注入脚本到当前页面"按钮

### Q: API 调用失败
**A:** 检查：
- Access Token 是否有效
- 网络连接是否正常
- GitLab 实例是否可访问

### Q: 功能不生效
**A:** 确认：
- 当前页面是 GitLab Board 页面
- 扩展已正确注入脚本
- 浏览器控制台无错误信息

## 📱 多域名支持

可以配置多个 GitLab 实例：
1. 为每个域名分别配置
2. 扩展会记住所有配置
3. 自动检测当前页面对应的配置

## 🔄 更新配置

### 修改域名
1. 打开扩展设置
2. 修改 GitLab URL
3. 重新测试连接
4. 保存新配置

### 更新 Token
1. 在 GitLab 中生成新 Token
2. 在扩展设置中更新
3. 测试连接确认有效

## 🛡️ 安全考虑

### 数据存储
- 配置信息存储在 Chrome 同步存储中
- Access Token 经过加密处理
- 不会向第三方发送数据

### 权限最小化
- 只请求必要的权限
- 用户可以随时撤销权限
- 支持细粒度权限控制

## 📞 技术支持

如果遇到问题：
1. 查看浏览器控制台错误
2. 检查扩展错误日志
3. 提交 Issue 到项目仓库
4. 提供详细的环境信息 