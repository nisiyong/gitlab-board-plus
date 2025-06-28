// GitLab Board Plus - 主入口文件
console.log('🚀 GitLab Board Plus content script loaded');

// 调试模式检测
if (typeof window.DEBUG_MODE === 'undefined') {
  window.DEBUG_MODE = window.location.search.includes('debug=true') || 
                      localStorage.getItem('gitlab-board-plus-debug') === 'true';
}

if (window.DEBUG_MODE) {
  console.log('🔧 Debug mode enabled');
  // 动态加载调试脚本
  const debugScript = document.createElement('script');
  debugScript.src = chrome.runtime.getURL('debug-boards.js');
  debugScript.onload = () => console.log('🛠️ Debug script loaded');
  document.head.appendChild(debugScript);
}

// GitLab Board 增强器主类
if (typeof GitLabBoardEnhancer === 'undefined') {
class GitLabBoardEnhancer {
  constructor() {
    this.currentUrl = window.location.href;
    this.projectId = GitLabUtils.extractProjectId();
    this.boardEnhancer = new BoardEnhancer(this);
    
    // 标记脚本已注入
    window.gitlabBoardPlusInjected = true;
    
    // 只在 GitLab 页面初始化
    if (this.isGitLabPage()) {
      this.init();
    }
  }

  // 检查是否是 GitLab 页面
  isGitLabPage() {
    // 检查页面是否包含 GitLab 的特征元素或路径
    const hasGitLabPath = window.location.pathname.includes('/-/');
    const hasGitLabElements = document.querySelector('.navbar-gitlab') || 
                             document.querySelector('[data-qa-selector="gitlab_logo"]') ||
                             document.querySelector('.header-logo') ||
                             document.querySelector('.tanuki-logo') ||
                             document.querySelector('.gitlab-logo') ||
                             document.body.classList.contains('ui_indigo') ||
                             document.title.toLowerCase().includes('gitlab');
    
    // 检查页面 HTML 中是否包含 GitLab 相关的 meta 标签或脚本
    const hasGitLabMeta = document.querySelector('meta[content*="GitLab"]') ||
                         document.querySelector('script[src*="gitlab"]') ||
                         document.querySelector('link[href*="gitlab"]');
    
    const result = hasGitLabPath || hasGitLabElements || hasGitLabMeta;
    
    if (result) {
      console.log('检测到 GitLab 页面:', {
        url: window.location.href,
        hasGitLabPath,
        hasGitLabElements: !!hasGitLabElements,
        hasGitLabMeta: !!hasGitLabMeta
      });
    }
    
    return result;
  }

  // 初始化增强功能
  init() {
    console.log('GitLab Board Plus 内容脚本已加载');
    
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.enhance();
      });
    } else {
      this.enhance();
    }

    // 监听页面变化（GitLab 是 SPA）
    this.observePageChanges();
  }

  // 检测当前页面类型
  detectPageType() {
    const path = window.location.pathname;
    
    if (path.includes('/-/boards')) {
      return 'board';
    }
    
    return 'other';
  }

  // 应用增强功能
  enhance() {
    const pageType = this.detectPageType();

    switch (pageType) {
      case 'board':
        this.enhanceBoard();
        break;
      case 'issues':
        this.enhanceIssues();
        break;
      case 'merge_requests':
        this.enhanceMergeRequests();
        break;
      default:
        this.enhanceGeneral();
    }
  }

  // 增强 Board 页面
  enhanceBoard() {
    console.log('增强 Board 页面功能');
    
    // 委托给 BoardEnhancer
    this.boardEnhancer.enhanceBoard();
  }

  // 应用过滤模版
  applyFilterTemplate(templateType) {
    console.log(`🔍 Applying filter template: ${templateType}`);
    
    // 使用URL参数的方式来应用过滤
    this.applyFilterViaUrl(templateType);
  }

  // 通过URL参数应用过滤
  applyFilterViaUrl(templateType) {
    try {
      const currentUrl = new URL(window.location.href);
      
      // 清除现有的过滤参数
      GitLabUtils.clearFilterParams(currentUrl);
      
      // 根据模版类型添加相应的URL参数
      switch (templateType) {
        case 'default':
          // 默认情况下不添加任何参数，已经在clearFilterParams中清除了
          break;
        case 'assigned-to-me':
          // 获取当前用户信息
          const currentUser = GitLabUtils.getCurrentUser();
          if (currentUser && currentUser.username) {
            currentUrl.searchParams.set('assignee_username', currentUser.username);
          } else {
            // 如果无法获取用户名，使用GitLab的特殊参数
            currentUrl.searchParams.set('assignee_id', 'me');
          }
          break;
        case 'created-by-me':
          // 获取当前用户信息
          const currentAuthor = GitLabUtils.getCurrentUser();
          if (currentAuthor && currentAuthor.username) {
            currentUrl.searchParams.set('author_username', currentAuthor.username);
          } else {
            // 如果无法获取用户名，使用GitLab的特殊参数
            currentUrl.searchParams.set('author_id', 'me');
          }
          break;
      }
      
      console.log(`🔄 Navigating to: ${currentUrl.toString()}`);
      
      // 直接导航到新的URL
      window.location.href = currentUrl.toString();
      
    } catch (error) {
      console.error('❌ Error applying filter via URL:', error);
      // 如果URL方式失败，回退到搜索框方式
      this.fallbackToSearchInput(templateType);
    }
  }

  // 根据模版类型获取描述
  getFilterDescriptionByType(templateType) {
    switch (templateType) {
      case 'default':
        return '';
      case 'assigned-to-me':
        return '指派给我的问题';
      case 'created-by-me':
        return '我创建的问题';
      default:
        return templateType;
    }
  }

  // 回退到搜索框方式（如果URL方式失败）
  fallbackToSearchInput(templateType) {
    console.log('🔄 Falling back to search input method');
    
    const searchInput = GitLabUtils.getSearchInput();
    if (!searchInput) {
      console.warn('❌ Search input not found for fallback');
      return;
    }

    let filterQuery = '';
    
    switch (templateType) {
      case 'default':
        filterQuery = '';
        break;
      case 'assigned-to-me':
        const currentUser = GitLabUtils.getCurrentUser();
        if (currentUser && currentUser.username) {
          filterQuery = `assignee:@${currentUser.username}`;
        } else {
          filterQuery = 'assignee:@me';
        }
        break;
      case 'created-by-me':
        const currentAuthor = GitLabUtils.getCurrentUser();
        if (currentAuthor && currentAuthor.username) {
          filterQuery = `author:@${currentAuthor.username}`;
        } else {
          filterQuery = 'author:@me';
        }
        break;
    }
    
    this.applySearchFilter(searchInput, filterQuery);
  }

  // 应用搜索过滤（封装方法）
  applySearchFilter(searchInput, filterQuery) {
    GitLabUtils.applySearchFilter(searchInput, filterQuery);
    
    // 显示用户反馈
    GitLabUtils.showFilterFeedback(filterQuery);
  }

  // 根据当前URL参数设置活跃模版
  setActiveFilterTemplate() {
    const url = new URL(window.location.href);
    const assignee = url.searchParams.get('assignee_username');
    const author = url.searchParams.get('author_username');
    
    let activeTemplate = 'default';
    
    // 根据URL参数判断当前应该激活的模版
    if (assignee === GitLabUtils.getCurrentUser()?.username) {
      activeTemplate = 'assigned-to-me';
    } else if (author === GitLabUtils.getCurrentUser()?.username) {
      activeTemplate = 'created-by-me';
    }
    
    // 设置活跃状态
    const shortcutItems = document.querySelectorAll('.shortcut-item');
    shortcutItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-template') === activeTemplate);
    });
  }

  // 清除过滤模版
  clearFilterTemplate() {
    console.log('🧹 Clearing filter template');
    
    // 重置为默认模版
    const defaultTemplate = document.querySelector('.filter-template-item[data-template="default"]');
    if (defaultTemplate) {
      // 移除所有活跃状态
      document.querySelectorAll('.filter-template-item').forEach(t => t.classList.remove('active'));
      // 设置默认为活跃
      defaultTemplate.classList.add('active');
      
      // 应用默认过滤（清空所有过滤参数）
      this.applyFilterTemplate('default');
    }
  }

  // 增强 Issues 页面
  enhanceIssues() {
    console.log('增强 Issues 页面功能');
    // 这里可以添加 Issues 页面的增强功能
  }

  // 增强 Merge Requests 页面
  enhanceMergeRequests() {
    console.log('增强 Merge Requests 页面功能');
    // 这里可以添加 MR 页面的增强功能
  }

  // 通用增强功能
  enhanceGeneral() {
    console.log('应用通用增强功能');
    // 添加项目快速切换等通用功能
  }

  // 监听页面变化
  observePageChanges() {
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.currentUrl = url;
        this.projectId = GitLabUtils.extractProjectId();
        
        // 延迟执行，等待新页面内容加载
        setTimeout(() => {
          // 只在 GitLab 页面执行增强功能
          if (this.isGitLabPage()) {
            this.enhance();
          }
        }, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // 保留方法用于向后兼容
  bindShortcutsEvents(container) {
    console.log('🔄 Shortcuts events now handled by FiltersShortcutsManager');
  }

  setActiveShortcutFromUrl(container) {
    console.log('🔄 Active shortcut URL sync now handled by FiltersShortcutsManager');
  }
}

// 初始化增强器
if (typeof window.gitlabBoardEnhancer === 'undefined') {
  const enhancer = new GitLabBoardEnhancer();
  // 将增强器实例暴露到全局对象以便调试
  window.gitlabBoardEnhancer = enhancer;
}
} 