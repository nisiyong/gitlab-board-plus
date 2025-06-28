// GitLab Board Plus - 后台脚本
// 处理配置管理和权限请求

// 配置管理器类
class ConfigManager {
  constructor() {
    this.supportedDomains = [
      'gitlab.com',
      'gitlab.io'
    ];
  }

  // 生成权限模式
  generatePermissionPattern(gitlabUrl) {
    try {
      const url = new URL(gitlabUrl);
      return `${url.protocol}//${url.host}/*`;
    } catch (error) {
      throw new Error('无效的 GitLab URL');
    }
  }

  // 请求权限
  async requestPermission(gitlabUrl) {
    try {
      const pattern = this.generatePermissionPattern(gitlabUrl);
      
      // 检查是否已有权限
      const hasPermission = await chrome.permissions.contains({
        origins: [pattern]
      });
      
      if (hasPermission) {
        return { success: true, message: '权限已存在' };
      }
      
      // 请求新权限
      const granted = await chrome.permissions.request({
        origins: [pattern]
      });
      
      if (granted) {
        return { success: true, message: '权限授予成功' };
      } else {
        return { success: false, message: '用户拒绝授予权限' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 验证 GitLab URL 格式
  validateGitLabUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // 检查协议
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, message: '仅支持 HTTP 和 HTTPS 协议' };
      }
      
      // 检查主机名
      if (!parsedUrl.hostname) {
        return { valid: false, message: '无效的主机名' };
      }
      
      return { valid: true, message: 'URL 格式正确' };
    } catch (error) {
      return { valid: false, message: '无效的 URL 格式' };
    }
  }
}

// 设置管理器类
class SettingsManager {
  // 获取存储的设置
  async getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['gitlabUrl'], (result) => {
        resolve(result);
      });
    });
  }

  // 保存设置
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        resolve();
      });
    });
  }
}

// 初始化实例
const configManager = new ConfigManager();
const settingsManager = new SettingsManager();

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(async () => {
  // 移除插件安装日志
  // console.log('GitLab Board Plus 插件已安装');
});

// 监听标签页更新，自动检测 GitLab Board 页面
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只在页面完全加载后处理
  if (changeInfo.status === 'complete' && tab.url) {
    await handleTabUpdate(tabId, tab);
  }
});

// 处理标签页更新
async function handleTabUpdate(tabId, tab) {
  try {
    // 检查是否是 GitLab Board 页面
    if (isGitLabBoardPage(tab.url)) {
      // 移除检测GitLab Board页面的日志
      // console.log('检测到 GitLab Board 页面:', tab.url);
      
      // 自动检测 GitLab 实例并保存配置
      const gitlabUrl = extractGitLabBaseUrl(tab.url);
      if (gitlabUrl) {
        // 保存检测到的 GitLab URL（如果还没有配置的话）
        const settings = await settingsManager.getStoredSettings();
        if (!settings.gitlabUrl) {
          await settingsManager.saveSettings({
            gitlabUrl: gitlabUrl
          });
          // 移除自动保存URL的日志
          // console.log('自动保存 GitLab URL:', gitlabUrl);
        }
      }
    }
  } catch (error) {
    // 保留错误日志
    console.error('处理标签页更新时出错:', error);
  }
}

// 检查是否是 GitLab Board 页面
function isGitLabBoardPage(url) {
  try {
    const urlObj = new URL(url);
    // 检查路径是否包含 /-/boards
    return urlObj.pathname.includes('/-/boards');
  } catch (error) {
    return false;
  }
}

// 提取 GitLab 基础 URL
function extractGitLabBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    return null;
  }
}

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持消息通道开放
});

// 消息处理函数
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getSettings':
        const settings = await settingsManager.getStoredSettings();
        sendResponse({ success: true, data: settings });
        break;

      case 'saveSettings':
        await settingsManager.saveSettings(request.settings);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: '未知的操作类型' });
    }
  } catch (error) {
    // 保留错误日志
    console.error('处理消息时出错:', error);
    sendResponse({ success: false, error: error.message });
  }
} 