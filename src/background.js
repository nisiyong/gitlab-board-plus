// GitLab Board Plus - 后台脚本
// 处理 GitLab API 调用和数据缓存

class GitLabAPI {
  constructor() {
    this.baseUrl = '';
    this.token = '';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  // 初始化 API 配置
  async init() {
    const settings = await this.getStoredSettings();
    this.baseUrl = settings.gitlabUrl || '';
    this.token = settings.accessToken || '';
  }

  // 获取存储的设置
  async getStoredSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['gitlabUrl', 'accessToken'], (result) => {
        resolve(result);
      });
    });
  }

  // 保存设置
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        this.baseUrl = settings.gitlabUrl || '';
        this.token = settings.accessToken || '';
        resolve();
      });
    });
  }

  // 发送 API 请求
  async apiRequest(endpoint, options = {}) {
    if (!this.baseUrl || !this.token) {
      throw new Error('GitLab URL 和 Access Token 未配置');
    }

    const url = `${this.baseUrl}/api/v4${endpoint}`;
    const headers = {
      'PRIVATE-TOKEN': this.token,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GitLab API 请求错误:', error);
      throw error;
    }
  }

  // 获取项目列表
  async getProjects() {
    const cacheKey = 'projects';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const projects = await this.apiRequest('/projects?membership=true&per_page=100');
    this.setCache(cacheKey, projects);
    return projects;
  }

  // 获取项目的 Board 列表
  async getProjectBoards(projectId) {
    const cacheKey = `boards_${projectId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const boards = await this.apiRequest(`/projects/${projectId}/boards`);
    this.setCache(cacheKey, boards);
    return boards;
  }

  // 获取 Board 的列表
  async getBoardLists(projectId, boardId) {
    const cacheKey = `lists_${projectId}_${boardId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const lists = await this.apiRequest(`/projects/${projectId}/boards/${boardId}/lists`);
    this.setCache(cacheKey, lists);
    return lists;
  }

  // 获取 Issue 列表
  async getIssues(projectId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `issues_${projectId}_${queryString}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const endpoint = `/projects/${projectId}/issues?${queryString}`;
    const issues = await this.apiRequest(endpoint);
    this.setCache(cacheKey, issues, 2 * 60 * 1000); // Issues 缓存2分钟
    return issues;
  }

  // 更新 Issue
  async updateIssue(projectId, issueIid, data) {
    const endpoint = `/projects/${projectId}/issues/${issueIid}`;
    const result = await this.apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    // 清除相关缓存
    this.clearCacheByPattern(`issues_${projectId}`);
    return result;
  }

  // 缓存管理
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data, timeout = this.cacheTimeout) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout
    });
  }

  clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// 初始化 API 实例
const gitlabAPI = new GitLabAPI();

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(async () => {
  console.log('GitLab Board Plus 插件已安装');
  await gitlabAPI.init();
});

// 监听来自 content script 和 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持消息通道开放
});

// 消息处理函数
async function handleMessage(request, sender, sendResponse) {
  try {
    await gitlabAPI.init(); // 确保 API 已初始化

    switch (request.action) {
      case 'getProjects':
        const projects = await gitlabAPI.getProjects();
        sendResponse({ success: true, data: projects });
        break;

      case 'getBoards':
        const boards = await gitlabAPI.getProjectBoards(request.projectId);
        sendResponse({ success: true, data: boards });
        break;

      case 'getBoardLists':
        const lists = await gitlabAPI.getBoardLists(request.projectId, request.boardId);
        sendResponse({ success: true, data: lists });
        break;

      case 'getIssues':
        const issues = await gitlabAPI.getIssues(request.projectId, request.params);
        sendResponse({ success: true, data: issues });
        break;

      case 'updateIssue':
        const updatedIssue = await gitlabAPI.updateIssue(
          request.projectId, 
          request.issueIid, 
          request.data
        );
        sendResponse({ success: true, data: updatedIssue });
        break;

      case 'getSettings':
        const settings = await gitlabAPI.getStoredSettings();
        sendResponse({ success: true, data: settings });
        break;

      case 'saveSettings':
        await gitlabAPI.saveSettings(request.settings);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: '未知的操作类型' });
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    sendResponse({ success: false, error: error.message });
  }
} 