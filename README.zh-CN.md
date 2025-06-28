# GitLab Board Plus

[English](README.md) | 中文

一个增强 GitLab Board 管理功能的 Chrome 插件，让项目管理更高效。

## 为什么会有这个项目？

GitLab Board Plus 是一个为小团队设计的轻量级项目管理插件。

在许多公司中，GitLab（特别是开源版本）被广泛用作内部代码托管平台，但其项目管理功能相对基础。对于技术人员来说，虽然 GitLab 的 Issue 本身已足够强大，但在任务逐渐增多的情况下，缺少像 GitHub Projects 那样直观、灵活的看板体验。

我希望通过一个小插件，提供一些实用的增强功能，帮助团队更方便地过滤 Issue、查看任务状态，从而提升协作效率。它并没有 Github Project 那么强大复杂，只是一个简单的扩展工具，补足一些日常使用中的小痛点。

这是一个 Vibe Coding 项目，我并不擅长开发 Chrome 插件，但在 AI 的帮助下，我得以快速上手，把一个点子变成了实际可用的工具。这次创作也让我重新认识了个人开发者在 AI 时代的创造力边界。

希望这个小工具对你也有所启发 🙂

## ✨ 主要功能

- **🎯 智能过滤**: 按人员、标签、里程碑等快速过滤 Issues
- **📊 实时统计**: 显示 Issues 总数、已分配数量、逾期数量
- **🎨 界面优化**: 现代化三层布局，左侧过滤面板，右侧内容区
- **⚡ 快捷操作**: 无需配置 Token，直接使用 GitLab 页面认证
- **📱 响应式设计**: 支持不同屏幕尺寸，移动端友好

## 🚀 快速开始

### 1. 安装插件

```bash
# 下载源码
git clone https://github.com/nisiyong/gitlab-board-plus.git
```

### 2. 加载到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

### 3. 配置 GitLab

1. 点击插件图标 🧩
2. 点击设置按钮 ⚙️
3. 填写你的 GitLab URL（如：`https://gitlab.example.com`）
4. 点击"测试连接"验证
5. 保存设置

### 4. 开始使用

1. 访问任何 GitLab Board 页面
2. 插件自动激活增强功能
3. 使用左侧面板进行快捷过滤

## 💡 使用技巧

- **快速过滤**: 点击左侧过滤选项，实时筛选 Issues
- **折叠面板**: 点击左侧面板顶部按钮可折叠，节省空间
- **视觉标识**: 高优先级、逾期、分配给我的 Issues 有特殊标记
- **统计信息**: 顶部显示当前过滤条件下的 Issues 统计

## 🔧 支持环境

- ✅ GitLab.com
- ✅ GitLab 自托管实例（13.0+）
- ✅ GitLab CE/EE

## ❓ 常见问题

**Q: 为什么不显示增强功能？**
A: 确保已正确配置 GitLab URL，并刷新页面

**Q: 过滤功能不工作？**
A: 检查网络连接和 GitLab 访问权限

**Q: 支持哪些 GitLab 版本？**
A: 支持 GitLab 13.0 及以上版本

## 📞 反馈支持

遇到问题或有建议？欢迎：
- 提交 [Issues](https://github.com/your-username/gitlab-board-plus/issues)
- 创建 Pull Request
- 联系开发者

---

**MIT License** | 让 GitLab Board 管理更简单 🎉 