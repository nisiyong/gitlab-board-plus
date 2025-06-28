# GitLab Board Plus

English | [中文](README.zh-CN.md)

A Chrome extension that enhances GitLab Board management functionality for more efficient project management.

## Why This Exists

GitLab Board Plus is a lightweight project management extension designed for small teams.

In many companies, GitLab (especially the open-source version) is widely used as an internal code hosting platform, but its project management features are relatively basic. For technical teams, while GitLab's Issues are powerful enough on their own, as tasks gradually increase, there's a lack of intuitive and flexible board experience like GitHub Projects.

I wanted to provide some practical enhancement features through a small extension to help teams filter Issues more conveniently and view task status, thereby improving collaboration efficiency. It's not as powerful and complex as GitHub Projects, just a simple extension tool to address some daily pain points.

This is a Vibe Coding project. I'm not skilled at developing Chrome extensions, but with AI's help, I was able to quickly get started and turn an idea into a practical tool. This creative process also made me re-recognize the creative boundaries of individual developers in the AI era.

I hope this little tool can also inspire you 🙂

## ✨ Key Features

- **🎯 Smart Filtering**: Quickly filter Issues by assignee, labels, milestones, etc.
- **📊 Real-time Statistics**: Display total Issues count, assigned count, and overdue count
- **🎨 Interface Optimization**: Modern three-layer layout with left filter panel and right content area
- **⚡ Quick Operations**: No Token configuration needed, uses GitLab page authentication directly
- **📱 Responsive Design**: Supports different screen sizes, mobile-friendly

## 🚀 Quick Start

### 1. Install Extension

```bash
# Download source code
git clone https://github.com/nisiyong/gitlab-board-plus.git
```

### 2. Load into Chrome

1. Open Chrome browser
2. Visit `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked extension"
5. Select the project folder

### 3. Configure GitLab

1. Click extension icon 🧩
2. Click settings button ⚙️
3. Enter your GitLab URL (e.g., `https://gitlab.example.com`)
4. Click "Test Connection" to verify
5. Save settings

### 4. Start Using

1. Visit any GitLab Board page
2. Extension automatically activates enhanced features
3. Use left panel for quick filtering

## 💡 Usage Tips

- **Quick Filtering**: Click left panel filter options to filter Issues in real-time
- **Collapsible Panel**: Click the button at the top of left panel to collapse and save space
- **Visual Indicators**: High priority, overdue, and assigned-to-me Issues have special markings
- **Statistics Info**: Top area shows Issues statistics under current filter conditions

## 🔧 Supported Environments

- ✅ GitLab.com
- ✅ GitLab Self-hosted (13.0+)
- ✅ GitLab CE/EE

## ❓ FAQ

**Q: Why don't enhanced features show up?**
A: Make sure GitLab URL is correctly configured and refresh the page

**Q: Filtering doesn't work?**
A: Check network connection and GitLab access permissions

**Q: Which GitLab versions are supported?**
A: Supports GitLab 13.0 and above

## 📞 Feedback & Support

Having issues or suggestions? Welcome to:
- Submit [Issues](https://github.com/your-username/gitlab-board-plus/issues)
- Create Pull Requests
- Contact developers

---

**MIT License** | Making GitLab Board management easier 🎉 