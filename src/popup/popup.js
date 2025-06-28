// GitLab Board Plus - 弹窗界面逻辑

class PopupManager {
  constructor() {
    this.settings = {};
    this.init();
  }

  // 初始化
  async init() {
    // 绑定事件
    this.bindEvents();
    
    // 加载设置
    await this.loadSettings();
    
    // 更新界面
    this.updateUI();
    
    // 检查当前页面是否需要注入脚本
    await this.checkCurrentPage();
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
          this.showInfo('✅ 增强功能已激活');
        } else {
          this.showInfo('需要授权访问此 GitLab 实例，请在设置中保存配置');
        }
      }
    } catch (error) {
      console.error('检查当前页面失败:', error);
    }
  }

  // 显示信息提示
  showInfo(message) {
    const container = document.querySelector('.popup-main');
    // 移除之前的信息提示
    const existingInfo = container.querySelector('.info-message');
    if (existingInfo) {
      existingInfo.remove();
    }
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.textContent = message;
    infoDiv.style.cssText = `
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
      padding: 8px 12px;
      margin-top: 10px;
      font-size: 13px;
      color: #1976d2;
    `;
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

    if (this.settings.gitlabUrl) {
      gitlabUrlElement.textContent = this.settings.gitlabUrl;
    } else {
      gitlabUrlElement.textContent = '未配置';
    }

    // 更新设置表单
    if (this.settings.gitlabUrl) {
      document.getElementById('gitlabUrlInput').value = this.settings.gitlabUrl;
    }
  }

  // 检查是否已配置
  isConfigured() {
    return this.settings.gitlabUrl;
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

    if (!gitlabUrl) {
      this.showError('请填写 GitLab URL');
      return;
    }

    // 移除 URL 末尾的斜杠
    const cleanUrl = gitlabUrl.replace(/\/+$/, '');

    try {
      // 请求主机权限
      const permissionResult = await this.requestHostPermission(cleanUrl);
      if (!permissionResult.success) {
        this.showError(`权限请求失败: ${permissionResult.message}`);
        return;
      }

      // 保存设置
      await this.sendMessage({
        action: 'saveSettings',
        settings: {
          gitlabUrl: cleanUrl
        }
      });

      this.settings.gitlabUrl = cleanUrl;
      this.updateUI();
      this.hideSettings();
      this.showSuccess('设置保存成功！');

      // 权限已授予，content scripts 会自动生效

    } catch (error) {
      this.showError(`保存设置失败: ${error.message}`);
    }
  }

  // 请求主机权限
  async requestHostPermission(gitlabUrl) {
    try {
      const url = new URL(gitlabUrl);
      const origin = `${url.protocol}//${url.host}/*`;

      // 检查是否已有权限
      const hasPermission = await chrome.permissions.contains({
        origins: [origin]
      });

      if (hasPermission) {
        return { success: true, message: '权限已存在' };
      }

      // 请求权限
      const granted = await chrome.permissions.request({
        origins: [origin]
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

  // 测试连接
  async testConnection() {
    const gitlabUrl = document.getElementById('gitlabUrlInput').value.trim();

    if (!gitlabUrl) {
      this.showError('请先填写 GitLab URL');
      return;
    }

    const statusElement = document.getElementById('connectionStatus');
    statusElement.innerHTML = '<div class="testing">🔄 测试连接中...</div>';

    try {
      // 简单的连接测试：尝试访问 GitLab 主页
      const response = await fetch(gitlabUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });

      statusElement.innerHTML = '<div class="success">✅ 连接成功！</div>';
    } catch (error) {
      statusElement.innerHTML = '<div class="error">❌ 连接失败，请检查 URL 是否正确</div>';
    }
  }

  // 发送消息到 background script
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
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