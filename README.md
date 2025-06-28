# GitLab Board Plus

一个增强 GitLab Board 管理功能的 Chrome 插件，提供更好的项目管理体验。

## 功能特性

### 🚀 Board 增强功能
- **全新界面布局**: 采用现代化的三层结构设计
  - 顶部 Tabs: Board 选择器从下拉框改为横向标签页
  - 左侧过滤面板: 按人员、标签、里程碑等维度快速过滤
  - 右侧内容区: 搜索栏在上，Board 列表在下
- **智能过滤系统**: 多维度过滤支持，实时统计计数
- **可折叠界面**: 左侧面板支持折叠，节省屏幕空间
- **实时统计**: 显示 Board 上的 Issues 总数、已分配数量、逾期数量
- **拖拽增强**: 改进的拖拽视觉反馈和动画效果
- **视觉提示**: 高优先级、逾期、分配给我的 Issues 的特殊视觉标识
- **响应式设计**: 适配不同屏幕尺寸，支持移动端查看

### 🎯 快捷过滤功能
- **快速过滤**: 直接在 GitLab Board 页面上使用快捷过滤功能
- **多维度过滤**: 支持按里程碑、指派人、创建人、标签进行过滤
- **无需额外配置**: 直接使用 GitLab 页面的认证，无需配置 Access Token

## 安装使用

### 1. 下载插件
```bash
git clone https://github.com/your-username/gitlab-board-plus.git
cd gitlab-board-plus
```

### 2. 加载到 Chrome
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

### 3. 配置 GitLab
1. 点击插件图标打开弹窗
2. 点击设置按钮（⚙️）
3. 填写你的 GitLab URL（例如：https://gitlab.example.com）
4. 点击"测试连接"验证配置
5. 保存设置

### 4. 使用增强功能
1. 访问任何 GitLab Board 页面
2. 插件会自动检测并激活增强功能
3. 在左侧面板使用快捷过滤功能

## 支持的 GitLab 版本
- GitLab.com
- GitLab 自托管实例（版本 13.0+）
- GitLab CE/EE

## 项目结构

```
gitlab-board-plus/
├── manifest.json              # Chrome 插件配置
├── package.json              # 项目依赖
├── README.md                 # 项目说明
├── 
├── src/
│   ├── background.js         # 后台脚本（配置管理）
│   ├── content/              # 内容脚本
│   │   ├── index.js         # 主入口
│   │   ├── board-enhancer.js # Board 增强功能
│   │   ├── filters-manager.js # 过滤管理器
│   │   ├── utils.js         # 工具函数
│   │   └── content-main.js  # 主要内容脚本
│   ├── popup/
│   │   ├── popup.html       # 弹窗页面
│   │   ├── popup.js         # 弹窗逻辑
│   │   └── popup.css        # 弹窗样式
│   └── styles/
│       └── content.css      # 页面注入样式
└── icons/                   # 插件图标
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 开发指南

### 本地开发
1. 修改代码后，在 `chrome://extensions/` 页面点击刷新按钮
2. 重新加载 GitLab 页面查看效果

### 构建发布
```bash
npm run package
```
这将创建一个 `gitlab-board-plus.zip` 文件，可以上传到 Chrome Web Store。

### 技术实现
插件主要通过以下方式工作：
- 使用 GitLab 页面自身的 CSRF Token 进行 API 调用
- 通过 GraphQL API 获取 Issues 数据
- 直接操作 GitLab 页面的 DOM 元素
- 使用 URL 参数来应用过滤条件

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境设置
1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 代码规范
- 使用 ES6+ 语法
- 遵循 JavaScript Standard Style
- 添加适当的注释
- 保持代码简洁易读

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 更新日志

### v1.1.0
- 简化配置：移除 Access Token 要求
- 优化用户体验：只需配置 GitLab URL
- 增强稳定性：直接使用 GitLab 页面认证

### v1.0.0
- 初始版本发布
- 基础 Board 增强功能
- GitLab API 集成
- 弹窗界面和设置

## 支持

如果你遇到问题或有功能建议，请：
1. 查看 [Issues](https://github.com/your-username/gitlab-board-plus/issues)
2. 创建新的 Issue
3. 提供详细的问题描述和环境信息

## 致谢

感谢 GitLab 团队提供优秀的 API 和平台。 