// GitLab Board Plus - 弹窗界面逻辑

class PopupManager {
  constructor() {
    this.settings = {};
    this.projects = [];
    this.init();
  }

  // 初始化
  async init() {
    console.log('初始化弹窗界面');
    
    // 绑定事件
    this.bindEvents();
    
    // 加载设置
    await this.loadSettings();
    
    // 更新界面
    this.updateUI();
    
    // 检查当前页面是否需要注入脚本
    await this.checkCurrentPage();
    
    // 如果已配置，加载数据
    if (this.isConfigured()) {
      this.loadData();
    }
  }

  // 检查当前页面
  async checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (this.settings.gitlabUrl && tab.url.includes(new URL(this.settings.gitlabUrl).host)) {
        // 检查是否已有权限
        const hasPermission = await chrome.permissions.contains({
          origins: [`${new URL(this.settings.gitlabUrl).protocol}//${new URL(this.settings.gitlabUrl).host}/*`]
        });
        
        if (hasPermission) {
          // 检查脚本是否已注入
          const injected = await this.checkScriptInjected(tab.id);
          if (!injected) {
            this.showInfo('检测到 GitLab 页面，点击"注入脚本"按钮激活增强功能');
            this.addInjectButton();
          }
        }
      }
    } catch (error) {
      console.error('检查当前页面失败:', error);
    }
  }

  // 检查脚本是否已注入
  async checkScriptInjected(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => window.gitlabBoardPlusInjected === true
      });
      return results[0]?.result || false;
    } catch (error) {
      return false;
    }
  }

  // 添加注入按钮
  addInjectButton() {
    if (document.getElementById('injectScriptBtn')) return;
    
    const container = document.querySelector('.main-content');
    const injectBtn = document.createElement('button');
    injectBtn.id = 'injectScriptBtn';
    injectBtn.className = 'btn btn-primary';
    injectBtn.textContent = '注入脚本到当前页面';
    injectBtn.style.marginTop = '10px';
    
    injectBtn.addEventListener('click', async () => {
      await this.injectContentScript(this.settings.gitlabUrl);
      injectBtn.remove();
    });
    
    container.appendChild(injectBtn);
  }

  // 显示信息提示
  showInfo(message) {
    const container = document.querySelector('.main-content');
    const infoDiv = document.createElement('div');
    infoDiv.className = 'alert alert-info';
    infoDiv.textContent = message;
    infoDiv.style.marginTop = '10px';
    container.appendChild(infoDiv);
  }

  // 绑定事件
  bindEvents() {
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showSettings();
    });

    // 关闭设置按钮
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
      this.hideSettings();
    });

    // 设置表单提交
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    // 测试连接按钮
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // 快速操作按钮
    document.getElementById('createIssueBtn').addEventListener('click', () => {
      this.createIssue();
    });

    document.getElementById('viewBoardsBtn').addEventListener('click', () => {
      this.viewBoards();
    });

    document.getElementById('refreshDataBtn').addEventListener('click', () => {
      this.refreshData();
    });
  }

  // 加载设置
  async loadSettings() {
    try {
      const response = await this.sendMessage({ action: 'getSettings' });
      if (response.success) {
        this.settings = response.data;
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  // 更新界面
  updateUI() {
    // 更新配置状态
    const gitlabUrlElement = document.getElementById('gitlabUrl');
    const accessTokenElement = document.getElementById('accessToken');

    if (this.settings.gitlabUrl) {
      gitlabUrlElement.textContent = this.settings.gitlabUrl;
    } else {
      gitlabUrlElement.textContent = '未配置';
    }

    if (this.settings.accessToken) {
      accessTokenElement.textContent = '已配置';
    } else {
      accessTokenElement.textContent = '未配置';
    }

    // 更新设置表单
    if (this.settings.gitlabUrl) {
      document.getElementById('gitlabUrlInput').value = this.settings.gitlabUrl;
    }
    if (this.settings.accessToken) {
      document.getElementById('accessTokenInput').value = this.settings.accessToken;
    }
  }

  // 检查是否已配置
  isConfigured() {
    return this.settings.gitlabUrl && this.settings.accessToken;
  }

  // 显示设置面板
  showSettings() {
    document.getElementById('settingsPanel').style.display = 'block';
  }

  // 隐藏设置面板
  hideSettings() {
    document.getElementById('settingsPanel').style.display = 'none';
  }

  // 保存设置
  async saveSettings() {
    const gitlabUrl = document.getElementById('gitlabUrlInput').value.trim();
    const accessToken = document.getElementById('accessTokenInput').value.trim();

    if (!gitlabUrl || !accessToken) {
      this.showError('请填写完整的 GitLab URL 和 Access Token');
      return;
    }

    // 移除 URL 末尾的斜杠
    const cleanUrl = gitlabUrl.replace(/\/$/, '');

    try {
      // 请求动态权限
      const permissionGranted = await this.requestHostPermission(cleanUrl);
      if (!permissionGranted) {
        this.showError('需要访问权限才能正常工作，请点击"允许"');
        return;
      }

      const response = await this.sendMessage({
        action: 'saveSettings',
        settings: {
          gitlabUrl: cleanUrl,
          accessToken: accessToken
        }
      });

      if (response.success) {
        this.settings.gitlabUrl = cleanUrl;
        this.settings.accessToken = accessToken;
        this.updateUI();
        this.hideSettings();
        this.showSuccess('设置保存成功！正在注入脚本...');
        
        // 注入内容脚本到当前标签页
        await this.injectContentScript(cleanUrl);
        
        // 重新加载数据
        setTimeout(() => {
          this.loadData();
        }, 1000);
      } else {
        this.showError('保存设置失败: ' + response.error);
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showError('保存设置失败: ' + error.message);
    }
  }

  // 请求主机权限
  async requestHostPermission(gitlabUrl) {
    try {
      const url = new URL(gitlabUrl);
      const hostPattern = `${url.protocol}//${url.host}/*`;
      
      // 检查是否已有权限
      const hasPermission = await chrome.permissions.contains({
        origins: [hostPattern]
      });
      
      if (hasPermission) {
        return true;
      }
      
      // 请求权限
      const granted = await chrome.permissions.request({
        origins: [hostPattern]
      });
      
      return granted;
    } catch (error) {
      console.error('请求权限失败:', error);
      return false;
    }
  }

  // 注入内容脚本
  async injectContentScript(gitlabUrl) {
    try {
      // 获取当前活动标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 检查是否是 GitLab 页面
      if (!tab.url.includes(new URL(gitlabUrl).host)) {
        this.showError('请先打开你的 GitLab 页面，然后重新保存设置');
        return;
      }
      
      // 注入内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content.js']
      });
      
      // 注入样式
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/styles/content.css']
      });
      
      this.showSuccess('脚本注入成功！请刷新页面查看效果');
    } catch (error) {
      console.error('注入脚本失败:', error);
      this.showError('脚本注入失败: ' + error.message);
    }
  }

  // 测试连接
  async testConnection() {
    const gitlabUrl = document.getElementById('gitlabUrlInput').value.trim();
    const accessToken = document.getElementById('accessTokenInput').value.trim();

    if (!gitlabUrl || !accessToken) {
      this.showError('请先填写 GitLab URL 和 Access Token');
      return;
    }

    const statusElement = document.getElementById('connectionStatus');
    statusElement.innerHTML = '<div class="testing">正在测试连接...</div>';

    try {
      // 先请求权限
      const permissionGranted = await this.requestHostPermission(gitlabUrl);
      if (!permissionGranted) {
        statusElement.innerHTML = '<div class="error">❌ 需要访问权限</div>';
        return;
      }

      // 临时保存设置用于测试
      const response = await this.sendMessage({
        action: 'saveSettings',
        settings: {
          gitlabUrl: gitlabUrl.replace(/\/$/, ''),
          accessToken: accessToken
        }
      });

      if (response.success) {
        // 测试获取用户信息
        const projectsResponse = await this.sendMessage({ action: 'getProjects' });
        
        if (projectsResponse.success) {
          statusElement.innerHTML = '<div class="success">✅ 连接成功！</div>';
        } else {
          statusElement.innerHTML = '<div class="error">❌ 连接失败: ' + projectsResponse.error + '</div>';
        }
      } else {
        statusElement.innerHTML = '<div class="error">❌ 设置保存失败</div>';
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      statusElement.innerHTML = '<div class="error">❌ 连接失败: ' + error.message + '</div>';
    }
  }

  // 加载数据
  async loadData() {
    if (!this.isConfigured()) {
      return;
    }

    try {
      // 加载项目列表
      await this.loadProjects();
      
      // 加载统计信息
      await this.loadStatistics();
    } catch (error) {
      console.error('加载数据失败:', error);
      this.showError('加载数据失败: ' + error.message);
    }
  }

  // 加载项目列表
  async loadProjects() {
    const projectsListElement = document.getElementById('projectsList');
    
    try {
      const response = await this.sendMessage({ action: 'getProjects' });
      
      if (response.success) {
        this.projects = response.data;
        this.renderProjects();
      } else {
        projectsListElement.innerHTML = '<div class="error">加载项目失败: ' + response.error + '</div>';
      }
    } catch (error) {
      projectsListElement.innerHTML = '<div class="error">加载项目失败: ' + error.message + '</div>';
    }
  }

  // 渲染项目列表
  renderProjects() {
    const projectsListElement = document.getElementById('projectsList');
    
    if (this.projects.length === 0) {
      projectsListElement.innerHTML = '<div class="no-data">暂无项目</div>';
      return;
    }

    const projectsHtml = this.projects.slice(0, 5).map(project => `
      <div class="project-item" data-project-id="${project.id}">
        <div class="project-info">
          <div class="project-name">${project.name}</div>
          <div class="project-path">${project.path_with_namespace}</div>
        </div>
        <button class="project-action" data-action="boards" data-project-id="${project.id}">
          Boards
        </button>
      </div>
    `).join('');

    projectsListElement.innerHTML = projectsHtml;

    // 绑定项目操作事件
    projectsListElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('project-action')) {
        const projectId = e.target.dataset.projectId;
        const action = e.target.dataset.action;
        
        if (action === 'boards') {
          this.openProjectBoards(projectId);
        }
      }
    });
  }

  // 加载统计信息
  async loadStatistics() {
    // 这里可以实现更复杂的统计逻辑
    // 现在先显示基本信息
    document.getElementById('totalIssues').textContent = this.projects.length;
    document.getElementById('assignedToMe').textContent = '-';
    document.getElementById('overdueIssues').textContent = '-';
  }

  // 创建 Issue
  createIssue() {
    // 打开当前标签页的新 Issue 页面
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url.includes('gitlab')) {
        // 提取项目路径并打开新 Issue 页面
        const match = currentTab.url.match(/https?:\/\/[^\/]+\/([^\/]+\/[^\/]+)/);
        if (match) {
          const projectPath = match[1];
          const newIssueUrl = `${this.settings.gitlabUrl}/${projectPath}/-/issues/new`;
          chrome.tabs.create({ url: newIssueUrl });
        }
      } else {
        this.showError('请先打开 GitLab 项目页面');
      }
    });
  }

  // 查看 Boards
  viewBoards() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url.includes('gitlab')) {
        const match = currentTab.url.match(/https?:\/\/[^\/]+\/([^\/]+\/[^\/]+)/);
        if (match) {
          const projectPath = match[1];
          const boardsUrl = `${this.settings.gitlabUrl}/${projectPath}/-/boards`;
          chrome.tabs.update({ url: boardsUrl });
        }
      } else {
        this.showError('请先打开 GitLab 项目页面');
      }
    });
  }

  // 打开项目 Boards
  openProjectBoards(projectId) {
    const project = this.projects.find(p => p.id == projectId);
    if (project) {
      const boardsUrl = `${this.settings.gitlabUrl}/${project.path_with_namespace}/-/boards`;
      chrome.tabs.create({ url: boardsUrl });
    }
  }

  // 刷新数据
  refreshData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    const originalText = refreshBtn.querySelector('.action-text').textContent;
    
    refreshBtn.querySelector('.action-text').textContent = '刷新中...';
    refreshBtn.disabled = true;

    this.loadData().finally(() => {
      refreshBtn.querySelector('.action-text').textContent = originalText;
      refreshBtn.disabled = false;
    });
  }

  // 发送消息到后台脚本
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // 显示错误消息
  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.className = 'error-message error';
    errorElement.style.display = 'block';
    
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  // 显示成功消息
  showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.className = 'error-message success';
    errorElement.style.display = 'block';
    
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 3000);
  }
}

// 初始化弹窗管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 