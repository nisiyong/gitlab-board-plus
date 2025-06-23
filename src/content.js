// GitLab Board Plus - 内容脚本
console.log('🚀 GitLab Board Plus content script loaded');

// 调试模式检测
const DEBUG_MODE = window.location.search.includes('debug=true') || 
                   localStorage.getItem('gitlab-board-plus-debug') === 'true';

if (DEBUG_MODE) {
  console.log('🔧 Debug mode enabled');
  // 动态加载调试脚本
  const debugScript = document.createElement('script');
  debugScript.src = chrome.runtime.getURL('debug-boards.js');
  debugScript.onload = () => console.log('🛠️ Debug script loaded');
  document.head.appendChild(debugScript);
}

class GitLabBoardEnhancer {
  constructor() {
    this.currentUrl = window.location.href;
    this.projectId = this.extractProjectId();
    
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

  // 提取项目 ID
  extractProjectId() {
    const match = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  }

  // 检测当前页面类型
  detectPageType() {
    const path = window.location.pathname;
    
    if (path.includes('/-/boards')) {
      return 'board';
    // } else if (path.includes('/-/issues')) {
    //   return 'issues';
    // } else if (path.includes('/merge_requests')) {
    //   return 'merge_requests';
    // } else if (path.includes('/-/milestones')) {
    //   return 'milestones';
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
    
    // 重新组织整个 boards-app 结构
    this.restructureBoardsApp();
  }

  // 重新组织 boards-app 结构
  restructureBoardsApp() {
    const boardsApp = document.querySelector('.boards-app');
    if (!boardsApp) {
      console.warn('Boards app not found');
      return;
    }

    // 检查是否已经处理过
    if (boardsApp.classList.contains('gitlab-board-plus-restructured')) {
      console.log('Boards app already restructured');
      return;
    }

    console.log('Starting boards app restructuring...');

    try {
      // 添加调试模式类，让原始下拉框可见
      boardsApp.classList.add('gitlab-board-plus-debug');
      
      // 创建新的结构
      const newStructure = this.createNewBoardStructure();
      
      // 将原有内容移动到新结构中
      this.moveExistingContent(boardsApp, newStructure);
      
      // 将新结构插入到页面中
      boardsApp.innerHTML = '';
      boardsApp.appendChild(newStructure);
      
      // 尝试获取 boards 数据并创建 tabs
      this.initializeBoardsTabs().then((success) => {
        if (success) {
          console.log('✅ Boards tabs initialized successfully');
          // 成功获取数据后，隐藏原始下拉框
          boardsApp.classList.remove('gitlab-board-plus-debug');
          boardsApp.classList.add('gitlab-board-plus-restructured');
        } else {
          console.warn('⚠️ Failed to initialize boards tabs, keeping debug mode');
          // 保持调试模式，让用户能看到原始下拉框
        }
      });

      console.log('✅ Board restructuring completed');
      
    } catch (error) {
      console.error('❌ Error during board restructuring:', error);
      // 出错时也保持调试模式
    }
  }

  async initializeBoardsTabs() {
    const topTabsArea = document.querySelector('.gitlab-board-plus-top-tabs');
    if (!topTabsArea) {
      console.error('Top tabs area not found');
      return false;
    }

    try {
      // 查找 boards dropdown
      const boardsDropdown = document.querySelector('[data-testid="boards-selector"]') || 
                            document.querySelector('.boards-switcher');
      
      if (!boardsDropdown) {
        console.error('Boards dropdown not found');
        return false;
      }

      console.log('Found boards dropdown, initializing tabs...');
      
      // 获取当前 board ID
      const currentBoardId = this.getCurrentBoardId();
      
      // 创建 tabs
      await this.createBoardTabs(topTabsArea, currentBoardId, boardsDropdown);
      
      // 检查是否成功创建了 tabs
      const tabs = topTabsArea.querySelectorAll('.boards-tab');
      if (tabs.length > 0) {
        console.log(`✅ Successfully created ${tabs.length} board tabs`);
        return true;
      } else {
        console.warn('⚠️ No tabs were created');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error initializing boards tabs:', error);
      return false;
    }
  }

  // 创建新的 board 结构
  createNewBoardStructure() {
    const container = document.createElement('div');
    container.className = 'gitlab-board-plus-container';
    
    // 顶部 Tabs 区域
    const topTabsArea = document.createElement('div');
    topTabsArea.className = 'gitlab-board-plus-top-tabs';
    
    // 主要内容区域
    const mainContent = document.createElement('div');
    mainContent.className = 'gitlab-board-plus-main-content';
    
    // 左侧过滤面板
    const leftPanel = this.createLeftFilterPanel();
    
    // 右侧内容区域
    const rightPanel = document.createElement('div');
    rightPanel.className = 'gitlab-board-plus-right-panel';
    
    // 右侧搜索区域
    const searchSection = document.createElement('div');
    searchSection.className = 'gitlab-board-plus-search-section';
    
    // 右侧 Boards 区域
    const boardsSection = document.createElement('div');
    boardsSection.className = 'gitlab-board-plus-boards-section';
    
    // 组装结构
    rightPanel.appendChild(searchSection);
    rightPanel.appendChild(boardsSection);
    
    mainContent.appendChild(leftPanel);
    mainContent.appendChild(rightPanel);
    
    container.appendChild(topTabsArea);
    container.appendChild(mainContent);
    
    return container;
  }

  moveExistingContent(boardsApp, newStructure) {
    try {
      // 保存原有的元素引用
      const originalIssuesFilters = boardsApp.querySelector('.issues-filters');
      const originalBoardsList = boardsApp.querySelector('[data-qa-selector="boards_list"]');
      const originalFilteredSearch = boardsApp.querySelector('[data-testid="issue-board-filtered-search"]');
      
      // 获取新结构中的目标区域
      const searchSection = newStructure.querySelector('.gitlab-board-plus-search-section');
      const boardsSection = newStructure.querySelector('.gitlab-board-plus-boards-section');
      
      // 移动搜索区域
      if (originalFilteredSearch && searchSection) {
        searchSection.appendChild(originalFilteredSearch);
        console.log('✅ Moved filtered search to search section');
      }
      
      // 移动 boards 列表
      if (originalBoardsList && boardsSection) {
        boardsSection.appendChild(originalBoardsList);
        console.log('✅ Moved boards list to boards section');
      }
      
      // 如果原有的 issues-filters 还有其他内容，也保留
      if (originalIssuesFilters) {
        const remainingElements = Array.from(originalIssuesFilters.children);
        remainingElements.forEach(element => {
          // 跳过已经移动的元素
          if (!element.querySelector('[data-testid="issue-board-filtered-search"]') &&
              !element.hasAttribute('data-qa-selector')) {
            searchSection.appendChild(element);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error moving existing content:', error);
    }
  }

  // 创建顶部 Boards Tabs
  createBoardsTabs(container) {
    // 查找现有的 boards dropdown 来获取 boards 数据
    const boardsDropdown = document.querySelector('[data-testid="boards-selector"]') || 
                          document.querySelector('.boards-switcher');
    
    if (!boardsDropdown) {
      // 如果找不到原始的下拉框，创建一个基本的 tab
      container.innerHTML = `
        <div class="boards-tabs-wrapper">
          <div class="boards-tab active">
            <span class="tab-icon">📋</span>
            <span class="tab-name">当前 Board</span>
          </div>
        </div>
      `;
      return;
    }

    // 获取当前 Board ID
    const currentBoardId = this.getCurrentBoardId();
    
    // 创建 tabs 容器
    const tabsWrapper = document.createElement('div');
    tabsWrapper.className = 'boards-tabs-wrapper';
    
    // 创建 tabs
    this.createBoardTabs(tabsWrapper, currentBoardId, boardsDropdown);
    
    container.appendChild(tabsWrapper);
    
    // 监听 boards dropdown 的变化，更新 tabs
    this.observeBoardsDropdown(boardsDropdown, tabsWrapper, currentBoardId);
  }

  // 创建左侧过滤面板
  createLeftFilterPanel(container = null) {
    // 如果没有传递容器，创建一个新的
    if (!container) {
      container = document.createElement('div');
      container.className = 'gitlab-board-plus-left-panel';
    }
    
    container.innerHTML = `
      <div class="left-panel-header">
        <h3 class="panel-title">过滤条件</h3>
        <button class="panel-toggle-btn" aria-label="收起/展开">
          <span class="toggle-icon">⏷</span>
        </button>
      </div>
      <div class="left-panel-content">
        <div class="filter-section">
          <div class="filter-section-header" data-section="assignees">
            <span class="section-icon">👤</span>
            <span class="section-title">指派人</span>
            <span class="section-count" id="assignees-count">0</span>
            <span class="section-toggle">⏷</span>
          </div>
          <div class="filter-items" id="assignees-list">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <div class="filter-section">
          <div class="filter-section-header" data-section="authors">
            <span class="section-icon">✍️</span>
            <span class="section-title">创建者</span>
            <span class="section-count" id="authors-count">0</span>
            <span class="section-toggle">⏷</span>
          </div>
          <div class="filter-items" id="authors-list">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <div class="filter-section">
          <div class="filter-section-header" data-section="milestones">
            <span class="section-icon">🎯</span>
            <span class="section-title">里程碑</span>
            <span class="section-count" id="milestones-count">0</span>
            <span class="section-toggle">⏷</span>
          </div>
          <div class="filter-items" id="milestones-list">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <div class="filter-section">
          <div class="filter-section-header" data-section="labels">
            <span class="section-icon">🏷️</span>
            <span class="section-title">标签</span>
            <span class="section-count" id="labels-count">0</span>
            <span class="section-toggle">⏷</span>
          </div>
          <div class="filter-items" id="labels-list">
            <div class="loading-placeholder">加载中...</div>
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="clear-all-btn">清除所有过滤</button>
        </div>
      </div>
    `;

    // 加载过滤数据
    this.loadFilterData();
    
    // 绑定事件
    this.bindLeftPanelEvents(container);
    
    // 返回容器元素（用于新的调用方式）
    return container;
  }

  // 初始化新结构的功能
  initializeNewStructure() {
    // 添加统计信息
    this.addBoardStatistics();
    
    // 增强拖拽功能
    this.enhanceDragAndDrop();
  }

  // 加载过滤数据
  loadFilterData() {
    // 重用之前的 loadAttributeData 方法
    this.loadAttributeData();
  }

  // 绑定左侧面板事件
  bindLeftPanelEvents(container) {
    // 面板收起/展开
    const toggleBtn = container.querySelector('.panel-toggle-btn');
    const panelContent = container.querySelector('.left-panel-content');
    
    if (toggleBtn && panelContent) {
      toggleBtn.addEventListener('click', () => {
        const isCollapsed = panelContent.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('.toggle-icon');
        icon.textContent = isCollapsed ? '⏵' : '⏷';
        container.classList.toggle('collapsed', isCollapsed);
      });
    }

    // 过滤分组收起/展开
    const sectionHeaders = container.querySelectorAll('.filter-section-header');
    sectionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const section = header.parentElement;
        const items = section.querySelector('.filter-items');
        const toggle = header.querySelector('.section-toggle');
        
        if (items && toggle) {
          const isCollapsed = items.classList.toggle('collapsed');
          toggle.textContent = isCollapsed ? '⏵' : '⏷';
        }
      });
    });

    // 清除所有过滤
    const clearAllBtn = container.querySelector('.clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }

    // 重用之前的过滤事件绑定逻辑
    this.bindAttributeListEvents(container);
  }

  // 清除所有过滤
  clearAllFilters() {
    // 清除所有激活的过滤项
    const activeItems = document.querySelectorAll('.filter-items .filter-item.active');
    activeItems.forEach(item => {
      item.classList.remove('active');
    });

    // 重新应用过滤（实际上是清除过滤）
    this.reapplyAllFilters();
  }

  async createBoardTabs(container, currentBoardId, boardsDropdown) {
    // 检查是否已经有 tabs，如果有则不再修改
    const existingTabs = container.querySelectorAll('.boards-tab');
    if (existingTabs.length > 0) {
      console.log('Tabs already exist, no modifications allowed');
      return;
    }
    
    // 标记容器已初始化，防止重复创建
    if (container.hasAttribute('data-tabs-initialized')) {
      console.log('Tabs container already initialized, skipping');
      return;
    }
    
    // 清空容器（仅当没有现有 tabs 时）
    container.innerHTML = '';
    
    // 创建 tabs wrapper
    const tabsWrapper = document.createElement('div');
    tabsWrapper.className = 'boards-tabs-wrapper';
    container.appendChild(tabsWrapper);
    
    // 尝试加载 boards 数据
    console.log('🔄 Loading boards data...');
    let boards = [];
    
    try {
      // 先尝试从已展开的下拉框获取数据
      boards = this.extractBoardsFromDropdown(boardsDropdown);
      
      // 如果没有数据，尝试展开下拉框获取数据
      if (boards.length === 0) {
        console.log('No immediate boards found, trying to load data...');
        boards = await this.loadBoardsData(boardsDropdown);
      }
    } catch (error) {
      console.error('Error loading boards data:', error);
    }
    
    // 如果仍然没有数据，创建当前 board 的 tab
    if (boards.length === 0) {
      console.log('No boards data available, creating current board tab');
      const currentBoardName = this.getCurrentBoardName(boardsDropdown);
      this.createSingleBoardTab(tabsWrapper, currentBoardName, currentBoardId, true);
    } else {
      console.log(`✅ Found ${boards.length} boards, creating tabs`);
      // 为每个 board 创建 tab
      boards.forEach(board => {
        const isActive = board.id === currentBoardId || 
                        board.name === this.getCurrentBoardName(boardsDropdown) ||
                        board.url === window.location.pathname;
        this.createBoardTab(tabsWrapper, board, isActive);
      });
    }
    
    // 标记容器已初始化
    container.setAttribute('data-tabs-initialized', 'true');
    console.log(`✅ Tabs created and locked: ${tabsWrapper.children.length} tabs`);
    
    // 设置观察器（但由于 tabs 已锁定，实际上不会触发重建）
    this.observeBoardsDropdown(boardsDropdown, tabsWrapper, currentBoardId);
  }

  // 后台尝试加载更多 boards（不阻塞主流程）
  tryLoadMoreBoards(boardsDropdown, currentBoardId) {
    console.log('Trying to load more boards in background...');
    
    // 简单尝试点击下拉框，但不等待结果
    setTimeout(() => {
      try {
        const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle') ||
                              boardsDropdown.querySelector('button[aria-haspopup="true"]');
        
        if (dropdownButton && dropdownButton.getAttribute('aria-expanded') !== 'true') {
          dropdownButton.click();
          
          // 等待一小段时间后关闭
          setTimeout(() => {
            if (dropdownButton.getAttribute('aria-expanded') === 'true') {
              dropdownButton.click(); // 关闭下拉框
            }
          }, 1000);
        }
      } catch (error) {
        console.log('Background board loading failed (non-critical):', error);
      }
    }, 500);
  }

  async loadBoardsData(boardsDropdown) {
    return new Promise((resolve) => {
      console.log('🔄 Starting to load boards data...');
      
      // 查找下拉框按钮
      const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle') ||
                            boardsDropdown.querySelector('button[aria-haspopup="true"]') ||
                            boardsDropdown.querySelector('button[data-toggle="dropdown"]') ||
                            boardsDropdown.querySelector('.dropdown-toggle');
      
      if (!dropdownButton) {
        console.warn('❌ Cannot find dropdown button');
        resolve([]);
        return;
      }

      console.log('✅ Found dropdown button:', dropdownButton);

      let hasFoundBoards = false;
      
      // 创建观察器来监听下拉框内容的加载
      const observer = new MutationObserver((mutations) => {
        if (hasFoundBoards) return; // 防止重复处理
        
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            // 尝试提取 boards
            const boards = this.extractBoardsFromDropdown(boardsDropdown);
            if (boards.length > 0) {
              hasFoundBoards = true;
              console.log(`🎉 Found ${boards.length} boards via observer`);
              observer.disconnect();
              
              // 延迟关闭下拉框，确保数据提取完成
              setTimeout(() => {
                this.closeDropdown(boardsDropdown);
                resolve(boards);
              }, 100);
            }
          }
        });
      });

      // 观察多个可能的容器
      const observeTargets = [
        boardsDropdown,
        boardsDropdown.querySelector('.dropdown-menu'),
        boardsDropdown.querySelector('[data-qa-selector="boards_dropdown"]'),
        boardsDropdown.querySelector('.gl-dropdown-contents'),
        document.querySelector('.dropdown-menu'), // 有时下拉框内容在 body 下
        document.body // 最后的备选方案
      ].filter(Boolean);

      observeTargets.forEach(target => {
        if (target) {
          observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-expanded', 'class']
          });
        }
      });

      // 设置超时，避免无限等待
      const timeout = setTimeout(() => {
        if (!hasFoundBoards) {
          observer.disconnect();
          this.closeDropdown(boardsDropdown);
          console.warn('⏰ Timeout waiting for boards data');
          resolve([]);
        }
      }, 8000);

      // 触发下拉框展开
      try {
        // 检查下拉框是否已经展开
        const isExpanded = dropdownButton.getAttribute('aria-expanded') === 'true' ||
                          dropdownButton.classList.contains('show') ||
                          boardsDropdown.classList.contains('show');
        
        console.log('🔍 Dropdown expanded state:', isExpanded);
        
        if (!isExpanded) {
          console.log('👆 Clicking dropdown button to expand...');
          
          // 尝试多种点击方式
          dropdownButton.click();
          
          // 如果第一次点击没有效果，尝试其他方式
          setTimeout(() => {
            if (dropdownButton.getAttribute('aria-expanded') !== 'true') {
              console.log('🔄 Trying alternative click methods...');
              
              // 尝试触发 mousedown/mouseup 事件
              dropdownButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
              dropdownButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
              dropdownButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
          }, 200);
          
          // 检查是否有立即可用的数据
          setTimeout(() => {
            if (!hasFoundBoards) {
              const immediateBoards = this.extractBoardsFromDropdown(boardsDropdown);
              if (immediateBoards.length > 0) {
                hasFoundBoards = true;
                clearTimeout(timeout);
                observer.disconnect();
                this.closeDropdown(boardsDropdown);
                console.log(`⚡ Found ${immediateBoards.length} boards immediately`);
                resolve(immediateBoards);
              }
            }
          }, 500);
          
        } else {
          // 如果已经展开，直接尝试提取数据
          console.log('📋 Dropdown already expanded, extracting data...');
          setTimeout(() => {
            if (!hasFoundBoards) {
              const boards = this.extractBoardsFromDropdown(boardsDropdown);
              if (boards.length > 0) {
                hasFoundBoards = true;
                clearTimeout(timeout);
                observer.disconnect();
                console.log(`📊 Found ${boards.length} boards from already opened dropdown`);
                resolve(boards);
              } else {
                console.log('❌ No boards found in already opened dropdown');
                // 尝试重新点击
                dropdownButton.click();
              }
            }
          }, 200);
        }
        
      } catch (error) {
        console.error('❌ Error triggering dropdown:', error);
        clearTimeout(timeout);
        observer.disconnect();
        resolve([]);
      }
    });
  }

  closeDropdown(boardsDropdown) {
    try {
      // 尝试多种方式关闭下拉框
      const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle') ||
                            boardsDropdown.querySelector('button[aria-haspopup="true"]');
      
      if (dropdownButton) {
        const isExpanded = dropdownButton.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          dropdownButton.click();
        }
      }
      
      // 或者通过按 ESC 键关闭
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
    } catch (error) {
      console.warn('Error closing dropdown:', error);
    }
  }

  extractBoardsFromDropdown(boardsDropdown) {
    const boards = [];
    
    try {
      // 查找 dropdown 内容区域的多种可能选择器
      let dropdownContent = boardsDropdown.querySelector('[data-qa-selector="boards_dropdown_content"]') ||
                           boardsDropdown.querySelector('.dropdown-content') ||
                           boardsDropdown.querySelector('.gl-dropdown-contents') ||
                           boardsDropdown.querySelector('.dropdown-menu') ||
                           boardsDropdown.querySelector('[role="menu"]') ||
                           boardsDropdown.querySelector('.gl-dropdown-inner');
      
      if (!dropdownContent) {
        console.log('🔍 No dropdown content found, searching in entire dropdown...');
        dropdownContent = boardsDropdown;
      }
    
      // 查找所有 board 选项的多种方式
      let boardItems = [];
      
      // 尝试不同的选择器组合
      const selectors = [
        '.gl-dropdown-item button[role="menuitem"]',
        '.gl-dropdown-item a[role="menuitem"]', 
        '.gl-dropdown-item',
        'li[role="presentation"] button',
        'li[role="presentation"] a',
        '[role="menuitem"]',
        'button[data-board-id]',
        'a[href*="/boards/"]'
      ];
      
      for (const selector of selectors) {
        boardItems = dropdownContent.querySelectorAll(selector);
        if (boardItems.length > 0) {
          console.log(`✅ Found ${boardItems.length} items using selector: ${selector}`);
          break;
        }
      }
      
      if (boardItems.length === 0) {
        console.log('❌ No board items found with any selector');
        return boards;
      }
    
      boardItems.forEach((item, index) => {
        // 获取可点击元素
        let clickableElement = item;
        if (item.tagName !== 'BUTTON' && item.tagName !== 'A') {
          clickableElement = item.querySelector('button[role="menuitem"]') || 
                           item.querySelector('a[role="menuitem"]') ||
                           item.querySelector('button') || 
                           item.querySelector('a');
        }
        
        if (clickableElement && !clickableElement.querySelector('[data-qa-selector="create_new_board_button"]')) {
          // 获取 board 名称
          let boardName = '';
          
          // 尝试多种方式获取文本
          const textElement = clickableElement.querySelector('.gl-dropdown-item-text-primary') ||
                             clickableElement.querySelector('.gl-dropdown-item-text-wrapper') ||
                             clickableElement.querySelector('.gl-dropdown-button-text') ||
                             clickableElement.querySelector('.board-item-name') ||
                             clickableElement;
          
          if (textElement) {
            boardName = textElement.textContent.trim();
            
            // 过滤掉无效的项目
            if (boardName && 
                !boardName.includes('No matching boards found') && 
                !boardName.includes('Create new board') &&
                !boardName.includes('Switch board') &&
                !boardName.includes('Loading') &&
                boardName !== '' &&
                boardName.length > 0) {
              
              // 尝试获取 board ID 和 URL
              const boardId = this.extractBoardIdFromItem(item, clickableElement);
              const boardUrl = this.extractBoardUrlFromItem(item, clickableElement);
              
              console.log(`📋 Found board: "${boardName}" (ID: ${boardId}, URL: ${boardUrl})`);
              
              boards.push({
                id: boardId || `board_${index}`,
                name: boardName,
                url: boardUrl,
                element: clickableElement
              });
            }
          }
        }
      });
    
      console.log(`✅ Extracted ${boards.length} valid boards`);
      return boards;
    } catch (error) {
      console.warn('❌ Error extracting boards from dropdown:', error);
      return boards;
    }
  }

  extractBoardIdFromItem(item, clickableElement) {
    // 尝试从各种属性中提取 board ID
    const dataId = clickableElement.getAttribute('data-board-id') || 
                   clickableElement.getAttribute('data-id') ||
                   item.getAttribute('data-board-id') ||
                   item.getAttribute('data-id');
    
    if (dataId) return dataId;
    
    // 尝试从 href 中提取 board ID
    const href = clickableElement.getAttribute('href');
    if (href) {
      const boardMatch = href.match(/\/boards\/(\d+)/);
      if (boardMatch) {
        return boardMatch[1];
      }
    }
    
    // 尝试从 onclick 或其他事件处理器中提取
    const onclick = clickableElement.getAttribute('onclick');
    if (onclick) {
      const boardMatch = onclick.match(/board[_-]?id['":\s]*(\d+)/i);
      if (boardMatch) {
        return boardMatch[1];
      }
    }
    
    // 如果没有找到 ID，返回 null（将使用索引作为 fallback）
    return null;
  }

  extractBoardUrlFromItem(item, clickableElement) {
    // 尝试从 href 属性获取 URL
    const href = clickableElement.getAttribute('href');
    if (href) {
      return href;
    }
    
    // 尝试从父元素获取 href
    const parentLink = item.querySelector('a[href*="/boards/"]');
    if (parentLink) {
      return parentLink.getAttribute('href');
    }
    
    // 尝试从数据属性获取 URL
    const dataUrl = clickableElement.getAttribute('data-url') ||
                   clickableElement.getAttribute('data-href') ||
                   item.getAttribute('data-url') ||
                   item.getAttribute('data-href');
    
    if (dataUrl) {
      return dataUrl;
    }
    
    return null;
  }

  getCurrentBoardName(boardsDropdown) {
    try {
      // 尝试从下拉框按钮的文本获取当前 board 名称
      const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle') ||
                            boardsDropdown.querySelector('button[aria-haspopup="true"]') ||
                            boardsDropdown.querySelector('.dropdown-toggle');
      
      if (dropdownButton) {
        // 尝试多种方式获取按钮文本
        const textElements = [
          dropdownButton.querySelector('.gl-dropdown-button-text'),
          dropdownButton.querySelector('.gl-button-text'),
          dropdownButton.querySelector('.dropdown-toggle-text'),
          dropdownButton.querySelector('.board-name'),
          dropdownButton.querySelector('span:not(.gl-icon)'),
          dropdownButton
        ];
        
        for (const textElement of textElements) {
          if (textElement) {
            const text = textElement.textContent.trim();
            if (text && 
                text !== 'Switch board' && 
                text !== 'Board' && 
                text !== '' &&
                !text.includes('Select board') &&
                !text.includes('Choose board')) {
              console.log(`📋 Found current board name: "${text}"`);
              return text;
            }
          }
        }
      }
      
      // 尝试从页面标题获取
      const pageTitle = document.title;
      const titleMatch = pageTitle.match(/(.+?)\s*·\s*Boards/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
      
      // 尝试从面包屑导航获取
      const breadcrumb = document.querySelector('.breadcrumbs-list .breadcrumb-item-text');
      if (breadcrumb) {
        return breadcrumb.textContent.trim();
      }
      
      // 尝试从 URL 获取 board ID
      const urlMatch = window.location.pathname.match(/\/boards\/(\d+)/);
      if (urlMatch) {
        return `Board ${urlMatch[1]}`;
      }
      
      // 最后的备选方案
      return '当前 Board';
    } catch (error) {
      console.warn('❌ Error getting current board name:', error);
      return '当前 Board';
    }
  }

  createSingleBoardTab(container, boardName, boardId, isActive = true) {
    const tab = document.createElement('div');
    tab.className = `boards-tab ${isActive ? 'active' : ''}`;
    tab.dataset.boardId = boardId;
    
    tab.innerHTML = `
      <span class="tab-icon">📋</span>
      <span class="tab-name" title="${boardName || '当前 Board'}">${boardName || '当前 Board'}</span>
    `;
    
    // 添加点击事件
    tab.addEventListener('click', () => {
      // 如果有原始的下拉框，触发对应的 board 切换
      const boardsDropdown = document.querySelector('[data-testid="boards-selector"]');
      if (boardsDropdown) {
        // 这里可以添加切换 board 的逻辑
        console.log(`Switch to board: ${boardName} (${boardId})`);
      }
    });
    
    container.appendChild(tab);
  }

  createBoardTab(container, board, isActive = false) {
    const tab = document.createElement('div');
    tab.className = `boards-tab ${isActive ? 'active' : ''}`;
    tab.dataset.boardId = board.id;
    tab.dataset.boardUrl = board.url || '';
    
    tab.innerHTML = `
      <span class="tab-icon">📋</span>
      <span class="tab-name" title="${board.name}">${board.name}</span>
    `;
    
    // 添加点击事件
    tab.addEventListener('click', () => {
      console.log(`🎯 Switching to board: "${board.name}" (ID: ${board.id})`);
      
      // 更新活跃状态
      container.querySelectorAll('.boards-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 尝试多种方式切换 board
      this.switchToBoard(board);
    });
    
    container.appendChild(tab);
  }

  switchToBoard(board) {
    console.log(`🔄 Attempting to switch to board:`, board);
    
    // 方法1: 如果有 URL，直接跳转
    if (board.url) {
      console.log(`🌐 Navigating via URL: ${board.url}`);
      if (board.url.startsWith('/')) {
        // 相对路径，添加当前域名
        window.location.href = window.location.origin + board.url;
      } else if (board.url.startsWith('http')) {
        // 绝对路径
        window.location.href = board.url;
      } else {
        // 构建完整路径
        this.navigateToBoard(board);
      }
      return;
    }
    
    // 方法2: 尝试点击原始下拉框中的元素
    if (board.element && typeof board.element.click === 'function') {
      console.log(`👆 Clicking board element`);
      try {
        // 确保下拉框是展开的
        const boardsDropdown = document.querySelector('[data-testid="boards-selector"]');
        if (boardsDropdown) {
          const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle');
          if (dropdownButton && dropdownButton.getAttribute('aria-expanded') !== 'true') {
            dropdownButton.click();
            // 等待下拉框展开后再点击
            setTimeout(() => {
              board.element.click();
            }, 200);
          } else {
            board.element.click();
          }
        } else {
          board.element.click();
        }
      } catch (error) {
        console.error('❌ Error clicking board element:', error);
        // 如果点击失败，尝试 URL 跳转
        this.navigateToBoard(board);
      }
    } else {
      // 方法3: 通过 URL 跳转
      console.log(`🔗 Fallback to URL navigation`);
      this.navigateToBoard(board);
    }
  }

  navigateToBoard(board) {
    // 构建 board URL（这需要根据实际的 GitLab URL 结构调整）
    const currentUrl = window.location.href;
    const urlParts = currentUrl.split('/boards/');
    
    if (urlParts.length > 1) {
      // 替换 board ID
      const newUrl = `${urlParts[0]}/boards/${board.id}`;
      window.location.href = newUrl;
    }
  }

  observeBoardsDropdown(boardsDropdown, tabsContainer, currentBoardId) {
    // 如果 tabs 已经初始化，则不再监听变化
    if (tabsContainer.hasAttribute('data-tabs-initialized')) {
      console.log('Tabs are locked, no observation needed');
      return;
    }
    
    // 创建 MutationObserver 来监听 dropdown 内容的变化（仅用于初始化）
    const observer = new MutationObserver((mutations) => {
      // 如果 tabs 已经创建，停止观察
      if (tabsContainer.hasAttribute('data-tabs-initialized')) {
        console.log('Tabs initialized, stopping observation');
        observer.disconnect();
        return;
      }
      
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // 只在还没有 tabs 时才考虑更新
          const existingTabs = tabsContainer.querySelectorAll('.boards-tab');
          if (existingTabs.length === 0) {
            shouldUpdate = true;
          }
        }
      });
      
      // 只有在真正需要初始化时才创建 tabs
      if (shouldUpdate) {
        // 延迟更新，避免频繁重建
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(async () => {
          // 再次检查是否已经初始化
          if (!tabsContainer.hasAttribute('data-tabs-initialized')) {
            await this.createBoardTabs(tabsContainer, currentBoardId, boardsDropdown);
          }
        }, 300);
      }
    });
    
    // 监听 dropdown 内容区域
    const dropdownContent = boardsDropdown.querySelector('[data-qa-selector="boards_dropdown_content"]');
    if (dropdownContent) {
      observer.observe(dropdownContent, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    // 也监听 dropdown 按钮的变化（当前 board 名称）
    const dropdownButton = boardsDropdown.querySelector('.gl-dropdown-toggle');
    if (dropdownButton) {
      observer.observe(dropdownButton, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }



  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  loadAttributeData() {
    // 从当前页面的 issues 中提取属性数据
    const cards = document.querySelectorAll('.board-card');
    const assignees = new Map();
    const authors = new Map();
    const milestones = new Map();
    const labels = new Map();

    cards.forEach(card => {
      // 提取指派人
      const assigneeImg = card.querySelector('.board-card-assignee img');
      if (assigneeImg) {
        const assigneeName = assigneeImg.alt || 'Unknown';
        const assigneeAvatar = assigneeImg.src;
        assignees.set(assigneeName, {
          name: assigneeName,
          avatar: assigneeAvatar,
          count: (assignees.get(assigneeName)?.count || 0) + 1
        });
      }

      // 提取标签
      const labelElements = card.querySelectorAll('.gl-label');
      labelElements.forEach(labelEl => {
        const labelText = labelEl.querySelector('.gl-label-text')?.textContent?.trim();
        const labelColor = labelEl.style.getPropertyValue('--label-background-color');
        if (labelText) {
          labels.set(labelText, {
            name: labelText,
            color: labelColor,
            count: (labels.get(labelText)?.count || 0) + 1
          });
        }
      });

      // 提取里程碑（如果有的话）
      const milestoneEl = card.querySelector('[data-testid="milestone"]');
      if (milestoneEl) {
        const milestoneName = milestoneEl.textContent.trim();
        milestones.set(milestoneName, {
          name: milestoneName,
          count: (milestones.get(milestoneName)?.count || 0) + 1
        });
      }
    });

    // 渲染属性列表
    this.renderAttributeItems('assignees-list', assignees, 'assignee');
    this.renderAttributeItems('authors-list', authors, 'author');
    this.renderAttributeItems('milestones-list', milestones, 'milestone');
    this.renderAttributeItems('labels-list', labels, 'label');

    // 更新计数
    this.updateAttributeCounts(assignees.size, authors.size, milestones.size, labels.size);
  }

  renderAttributeItems(containerId, itemsMap, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    // 按计数排序
    const sortedItems = Array.from(itemsMap.values()).sort((a, b) => b.count - a.count);
    
    sortedItems.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'filter-item';
      itemEl.setAttribute('data-type', type);
      itemEl.setAttribute('data-value', item.name);
      
      let itemContent = '';
      
      switch (type) {
        case 'assignee':
        case 'author':
          itemContent = `
            <img class="attribute-avatar" src="${item.avatar}" alt="${item.name}">
            <span class="attribute-name">${this.escapeHtml(item.name)}</span>
            <span class="attribute-count">${item.count}</span>
          `;
          break;
        case 'label':
          itemContent = `
            <span class="attribute-label-color" style="background-color: ${item.color}"></span>
            <span class="attribute-name">${this.escapeHtml(item.name)}</span>
            <span class="attribute-count">${item.count}</span>
          `;
          break;
        default:
          itemContent = `
            <span class="attribute-name">${this.escapeHtml(item.name)}</span>
            <span class="attribute-count">${item.count}</span>
          `;
      }
      
      itemEl.innerHTML = itemContent;
      container.appendChild(itemEl);
    });
  }

  updateAttributeCounts(assigneeCount, authorCount, milestoneCount, labelCount) {
    const assigneesCount = document.getElementById('assignees-count');
    const authorsCount = document.getElementById('authors-count');
    const milestonesCount = document.getElementById('milestones-count');
    const labelsCount = document.getElementById('labels-count');
    
    if (assigneesCount) assigneesCount.textContent = assigneeCount;
    if (authorsCount) authorsCount.textContent = authorCount;
    if (milestonesCount) milestonesCount.textContent = milestoneCount;
    if (labelsCount) labelsCount.textContent = labelCount;
  }

  bindAttributeListEvents(container) {
    // 属性项点击事件
    container.addEventListener('click', (e) => {
      const filterItem = e.target.closest('.filter-item');
      if (filterItem) {
        this.toggleAttributeFilter(filterItem);
      }
    });
  }

  toggleAttributeFilter(filterItem) {
    const isActive = filterItem.classList.contains('active');
    const type = filterItem.getAttribute('data-type');
    const value = filterItem.getAttribute('data-value');
    
    if (isActive) {
      // 取消过滤
      filterItem.classList.remove('active');
      this.clearAttributeFilter(type, value);
    } else {
      // 应用过滤
      filterItem.classList.add('active');
      this.applyAttributeFilter(type, value);
    }
  }

  applyAttributeFilter(type, value) {
    const cards = document.querySelectorAll('.board-card');
    
    cards.forEach(card => {
      let matches = false;
      
      switch (type) {
        case 'assignee':
          const assigneeImg = card.querySelector('.board-card-assignee img');
          matches = assigneeImg && assigneeImg.alt === value;
          break;
        case 'label':
          const labels = card.querySelectorAll('.gl-label .gl-label-text');
          matches = Array.from(labels).some(label => label.textContent.trim() === value);
          break;
        case 'milestone':
          const milestoneEl = card.querySelector('[data-testid="milestone"]');
          matches = milestoneEl && milestoneEl.textContent.trim() === value;
          break;
      }
      
      if (!matches) {
        card.style.display = 'none';
      }
    });
  }

  clearAttributeFilter(type, value) {
    // 检查是否还有其他活跃的过滤器
    const activeFilters = document.querySelectorAll('.filter-item.active');
    
    if (activeFilters.length === 0) {
      // 如果没有活跃过滤器，显示所有卡片
      const cards = document.querySelectorAll('.board-card');
      cards.forEach(card => {
        card.style.display = 'block';
      });
    } else {
      // 重新应用所有活跃的过滤器
      this.reapplyAllFilters();
    }
  }

  reapplyAllFilters() {
    const cards = document.querySelectorAll('.board-card');
    const activeFilters = document.querySelectorAll('.filter-item.active');
    
    cards.forEach(card => {
      let shouldShow = true;
      
      activeFilters.forEach(filter => {
        const type = filter.getAttribute('data-type');
        const value = filter.getAttribute('data-value');
        
        let matches = false;
        switch (type) {
          case 'assignee':
            const assigneeImg = card.querySelector('.board-card-assignee img');
            matches = assigneeImg && assigneeImg.alt === value;
            break;
          case 'label':
            const labels = card.querySelectorAll('.gl-label .gl-label-text');
            matches = Array.from(labels).some(label => label.textContent.trim() === value);
            break;
          case 'milestone':
            const milestoneEl = card.querySelector('[data-testid="milestone"]');
            matches = milestoneEl && milestoneEl.textContent.trim() === value;
            break;
        }
        
        if (!matches) {
          shouldShow = false;
        }
      });
      
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // 获取当前 Board ID
  getCurrentBoardId() {
    const match = window.location.pathname.match(/\/boards\/(\d+)/);
    return match ? match[1] : null;
  }

  // 添加 Board 统计信息
  addBoardStatistics() {
    const rightPanel = document.querySelector('.gitlab-board-plus-right-panel');
    if (!rightPanel || document.querySelector('.gitlab-board-plus-stats')) {
      return;
    }

    const statsContainer = document.createElement('div');
    statsContainer.className = 'gitlab-board-plus-stats';
    statsContainer.innerHTML = `
      <div class="board-stats">
        <span class="stat-item">
          <strong>总计:</strong> <span id="total-issues">-</span>
        </span>
        <span class="stat-item">
          <strong>已分配:</strong> <span id="assigned-issues">-</span>
        </span>
        <span class="stat-item">
          <strong>逾期:</strong> <span id="overdue-issues">-</span>
        </span>
      </div>
    `;

    // 插入到搜索区域之后
    const searchSection = rightPanel.querySelector('.gitlab-board-plus-search-section');
    if (searchSection) {
      searchSection.appendChild(statsContainer);
    }

    // 计算统计信息
    this.updateBoardStatistics();
  }

  // 更新 Board 统计信息
  updateBoardStatistics() {
    const cards = document.querySelectorAll('.board-card');
    const totalIssues = cards.length;
    
    let assignedIssues = 0;
    let overdueIssues = 0;

    cards.forEach(card => {
      if (card.querySelector('.board-card-assignee')) {
        assignedIssues++;
      }
      if (this.isOverdue(card)) {
        overdueIssues++;
      }
    });

    // 更新显示
    const totalElement = document.getElementById('total-issues');
    const assignedElement = document.getElementById('assigned-issues');
    const overdueElement = document.getElementById('overdue-issues');

    if (totalElement) totalElement.textContent = totalIssues;
    if (assignedElement) assignedElement.textContent = assignedIssues;
    if (overdueElement) overdueElement.textContent = overdueIssues;
  }

  // 检查是否逾期
  isOverdue(card) {
    const dueDateElement = card.querySelector('.board-card-due-date');
    if (!dueDateElement) return false;
    
    const dueDate = new Date(dueDateElement.textContent);
    return dueDate < new Date();
  }

  // 增强拖拽功能
  enhanceDragAndDrop() {
    // 添加拖拽时的视觉反馈
    document.addEventListener('dragstart', (e) => {
      if (e.target.closest('.board-card')) {
        e.target.closest('.board-card').classList.add('dragging');
      }
    });

    document.addEventListener('dragend', (e) => {
      if (e.target.closest('.board-card')) {
        e.target.closest('.board-card').classList.remove('dragging');
      }
    });
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
        this.projectId = this.extractProjectId();
        
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
}

// 初始化增强器
const enhancer = new GitLabBoardEnhancer();

// 将增强器实例暴露到全局对象以便调试
window.gitlabBoardEnhancer = enhancer; 