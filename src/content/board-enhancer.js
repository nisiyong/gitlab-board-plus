// GitLab Board Plus - Board 增强器
// console.log('📋 GitLab Board Plus board enhancer loaded');

// Board 增强功能类
if (typeof BoardEnhancer === 'undefined') {
class BoardEnhancer {
  constructor(enhancer) {
    this.enhancer = enhancer;
    this.shortcutsManager = null;
  }

  // 增强 Board 页面
  enhanceBoard() {
    // 移除增强Board页面的日志
    // console.log('增强 Board 页面功能');
    
    // 重新组织整个 boards-app 结构
    this.restructureBoardsApp();
  }

  // 重新组织 boards-app 结构
  restructureBoardsApp() {
    const boardsApp = document.querySelector('.boards-app');
    if (!boardsApp) {
      // 保留警告日志
      console.warn('Boards app not found');
      return;
    }

    if (boardsApp.classList.contains('gitlab-board-plus-restructured')) {
      // 移除已重构的日志
      // console.log('Boards app already restructured');
      return;
    }

    // 移除开始重构的日志
    // console.log('Starting boards app restructuring...');

    try {
      // 创建新的结构
      const newStructure = this.createNewBoardStructure();
      
      // 将原有内容移动到新结构中
      this.moveExistingContent(boardsApp, newStructure);
      
      // 创建快捷过滤模块
      const filtersShortcuts = newStructure.querySelector('.issues-filters-shortcuts');
      if (filtersShortcuts) {
        this.createFiltersShortcuts(filtersShortcuts);
      }
      
      // 将新结构插入到页面中
      boardsApp.innerHTML = '';
      boardsApp.appendChild(newStructure);
      
      // 标记已完成重构
      boardsApp.classList.add('gitlab-board-plus-restructured');

      // 移除重构完成的日志
      // console.log('✅ Board restructuring completed');
      
      // 创建 board tabs - 延迟一点确保 DOM 更新完成
      setTimeout(() => {
        this.createBoardTabsAfterRestructure();
      }, 100);
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error during board restructuring:', error);
    }
  }

  // 创建新的 board 结构
  createNewBoardStructure() {
    // 按照期望布局：boards-tabs 容器 > (顶部: tabs UI, 下方: 左右布局)
    const boardsTabs = document.createElement('div');
    boardsTabs.setAttribute('data-testid', 'boards-tabs');
    boardsTabs.className = 'boards-tabs-container';
    
    // 顶部：真正的 tabs UI 容器
    const tabsWrapper = document.createElement('div');
    tabsWrapper.className = 'boards-tabs-wrapper';
    
    // 下方：左右布局容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'boards-content-container';
    
    // 左侧：看板快捷过滤模块
    const filtersShortcuts = document.createElement('div');
    filtersShortcuts.className = 'issues-filters-shortcuts';
    
    // 右侧：过滤模块+看板列表的容器
    const rightContainer = document.createElement('div');
    rightContainer.className = 'boards-right-container';
    
    // 右侧内的过滤模块容器（将在moveExistingContent中填充）
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'issues-filters-container';
    
    // 右侧内的看板列表容器（将在moveExistingContent中填充）
    const boardsListContainer = document.createElement('div');
    boardsListContainer.className = 'boards-list-container';
    
    // 组装右侧容器
    rightContainer.appendChild(filtersContainer);
    rightContainer.appendChild(boardsListContainer);
    
    // 组装左右布局容器
    contentContainer.appendChild(filtersShortcuts);
    contentContainer.appendChild(rightContainer);
    
    // 组装最终结构：tabs 在顶部，左右布局在下方
    boardsTabs.appendChild(tabsWrapper);
    boardsTabs.appendChild(contentContainer);
    
    return boardsTabs;
  }

  // 移动现有内容
  moveExistingContent(boardsApp, newStructure) {
    try {
      // 保存原有的元素引用
      const originalIssuesFilters = boardsApp.querySelector('.issues-filters');
      const originalBoardsList = boardsApp.querySelector('[data-qa-selector="boards_list"]');
      const originalVPortal = boardsApp.querySelector('.v-portal');
      
      // 获取新结构中的目标区域
      const filtersContainer = newStructure.querySelector('.issues-filters-container');
      const boardsListContainer = newStructure.querySelector('.boards-list-container');
      
      // 将原有的 issues-filters 整体移动到过滤容器
      if (originalIssuesFilters && filtersContainer) {
        filtersContainer.appendChild(originalIssuesFilters);
        // 移除移动filters的日志
        // console.log('✅ Moved original issues-filters to filters container');
      }
      
      // 移动 boards 列表
      if (originalBoardsList && boardsListContainer) {
        boardsListContainer.appendChild(originalBoardsList);
        // 移除移动boards list的日志
        // console.log('✅ Moved boards list to boards list container');
      }
      
      // 移动 v-portal（如果存在）
      if (originalVPortal && boardsListContainer) {
        boardsListContainer.appendChild(originalVPortal);
        // 移除移动v-portal的日志
        // console.log('✅ Moved v-portal to boards list container');
      }
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error moving existing content:', error);
    }
  }

  // 创建快捷过滤模块
  createFiltersShortcuts(container) {
    // 创建快捷过滤管理器
    this.shortcutsManager = new FiltersShortcutsManager(container, this.enhancer);
  }

  // 创建 board tabs 后处理逻辑
  createBoardTabsAfterRestructure() {
    try {
      // 移除创建board tabs的日志
      // console.log('🔄 Creating board tabs after restructure...');
      
      // 查找 boards-selector 
      const boardsSelector = document.querySelector('[data-testid="boards-selector"]');
      if (!boardsSelector) {
        console.warn('❌ boards-selector not found for tabs creation');
        return;
      }
      
      // 获取当前 board ID
      const currentBoardId = GitLabUtils.getCurrentBoardId();
      // console.log('Current board ID:', currentBoardId);
      
      // 查找已经创建的 tabs 容器
      const tabsContainer = boardsSelector.querySelector('.boards-tabs-wrapper');
      if (!tabsContainer) {
        console.warn('❌ boards-tabs-wrapper not found for tabs');
        return;
      }
      
      // 创建 board tabs
      this.createBoardTabs(tabsContainer, currentBoardId);
      
      // 移除创建board tabs的日志
      // console.log('✅ Board tabs creation completed');
      
    } catch (error) {
      console.error('❌ Error creating board tabs after restructure:', error);
    }
  }

  // 创建 Board Tabs（完整版本）
  async createBoardTabs(container, currentBoardId) {
    // 检查是否已经有 tabs，如果有则不再修改
    const existingTabs = container.querySelectorAll('.boards-tab');
    if (existingTabs.length > 0) {
      // console.log('Tabs already exist, no modifications allowed');
      return;
    }
    
    // 标记容器已初始化，防止重复创建
    if (container.hasAttribute('data-tabs-initialized')) {
      // console.log('Tabs container already initialized, skipping');
      return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建 tabs wrapper
    const tabsWrapper = document.createElement('div');
    tabsWrapper.className = 'boards-tabs-wrapper';
    container.appendChild(tabsWrapper);
    
    // 尝试加载 boards 数据
    // console.log('🔄 Loading boards data...');
    let boards = [];
    
    try {
      // 通过 GraphQL 获取 boards 数据
      boards = await this.loadBoardsData();
    } catch (error) {
      console.error('Error loading boards data:', error);
      return;
    }
    
    // 如果仍然没有数据，创建当前 board 的 tab
    if (!boards || boards.length === 0) {
      // console.log('📋 No additional boards found - creating single tab for current board');
      const currentBoardName = this.getCurrentBoardName();
      // console.log(`✅ Created single board tab: "${currentBoardName}"`);
      this.createSingleBoardTab(tabsWrapper, currentBoardName, currentBoardId, true);
    } else {
      // console.log(`✅ Found ${boards.length} boards, creating multiple tabs`);
      // 为每个 board 创建 tab
      boards.forEach(board => {
        const isActive = board.id === currentBoardId || 
                        board.name === this.getCurrentBoardName() ||
                        board.url.includes(`/boards/${currentBoardId}`);
        this.createBoardTab(tabsWrapper, board, isActive);
      });
      // console.log(`✅ Created ${boards.length} board tabs successfully`);
    }
    
    // 标记容器已初始化
    container.setAttribute('data-tabs-initialized', 'true');
    // console.log(`✅ Tabs created and locked: ${tabsWrapper.children.length} tabs`);
  }

  // 获取当前 Board 名称
  getCurrentBoardName() {
    try {
      // 方法1: 从 boards-selector 获取当前 board 名称  
      const boardsSelector = document.querySelector('[data-testid="boards-selector"]');
      if (boardsSelector) {
        const dropdownButton = boardsSelector.querySelector('.gl-dropdown-toggle') ||
                              boardsSelector.querySelector('button[aria-haspopup="true"]') ||
                              boardsSelector.querySelector('.dropdown-toggle');
        
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
                // console.log(`📋 Found current board name: "${text}"`);
                return text;
              }
            }
          }
        }
      }
      
      // 方法2: 从页面标题获取
      const pageTitle = document.title;
      const titleMatch = pageTitle.match(/(.+?)\s*·\s*Boards/);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
      
      // 方法3: 从 URL 获取 board ID
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

  // 从下拉框中提取 boards 数据
  // 通过 GraphQL 获取 boards 数据 (替代之前的下拉框方式)
  async loadBoardsData() {
    // console.log('🔄 Loading boards via GraphQL API...');
    return await this.loadBoardsViaGraphQL();
  }

  // 创建 Board Tab
  createBoardTab(container, board, isActive = false) {
    const tab = document.createElement('div');
    tab.className = `boards-tab ${isActive ? 'active' : ''}`;
    tab.dataset.boardId = board.id;
    tab.dataset.boardUrl = board.url;
    
    tab.innerHTML = `
      <span class="tab-icon">📋</span>
      <span class="tab-name" title="${board.name}">${board.name}</span>
    `;
    
    // 添加点击事件
    tab.addEventListener('click', () => {
      // console.log(`🎯 Board tab clicked: ${board.name} (${board.id})`);
      
      // 检查是否是当前 board
      if (isActive) {
        // console.log('Already on this board');
        return;
      }
      
      // 导航到目标 board
      if (board.url && board.url !== window.location.pathname) {
        // console.log(`🚀 Navigating to: ${board.url}`);
        window.location.href = board.url;
      }
    });
    
    container.appendChild(tab);
  }



  // 创建单个 Board Tab（兼容性方法）
  createSingleBoardTab(container, boardName, boardId, isActive = true) {
    const boardData = {
      id: boardId,
      name: boardName || '当前 Board',
      url: window.location.pathname
    };
    
    this.createBoardTab(container, boardData, isActive);
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
      if (GitLabUtils.isOverdue(card)) {
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

  // 通过 GraphQL 获取 boards 数据
  async loadBoardsViaGraphQL() {
    // console.log('🚀 Loading boards via GraphQL...');
    
    try {
      // 获取项目路径
      const projectPath = GitLabUtils.extractProjectId();
      if (!projectPath) {
        console.error('❌ Cannot extract project path for GraphQL request');
        return [];
      }

      // 获取 GitLab 的基础 URL
      const baseUrl = window.location.origin;
      const graphqlUrl = `${baseUrl}/api/graphql`;

      // 构建 GraphQL 查询
      const queries = [
        {
          operationName: "project_boards",
          variables: {
            fullPath: projectPath
          },
          query: "query project_boards($fullPath: ID!) {\n  project(fullPath: $fullPath) {\n    id\n    boards {\n      edges {\n        node {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
        },
        {
          operationName: "project_recent_boards",
          variables: {
            fullPath: projectPath
          },
          query: "query project_recent_boards($fullPath: ID!) {\n  project(fullPath: $fullPath) {\n    id\n    recentIssueBoards {\n      edges {\n        node {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
        }
      ];

      // 获取 CSRF Token
      const csrfToken = GitLabUtils.getCSRFToken();
      if (!csrfToken) {
        console.error('❌ Cannot get CSRF token for GraphQL request');
        return [];
      }

      // 发送 GraphQL 请求
      // console.log(`📡 Sending GraphQL request to: ${graphqlUrl}`);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': csrfToken,
          'X-GitLab-Feature-Category': 'team_planning'
        },
        credentials: 'same-origin',
        body: JSON.stringify(queries)
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      // console.log('📊 GraphQL response received:', results);

      // 解析响应数据
      const boards = new Map(); // 使用 Map 来去重

      results.forEach((result, index) => {
        if (result.data && result.data.project) {
          const queryType = queries[index].operationName;
          const boardsData = queryType === 'project_boards' 
            ? result.data.project.boards 
            : result.data.project.recentIssueBoards;

          if (boardsData && boardsData.edges) {
            boardsData.edges.forEach(edge => {
              const board = edge.node;
              if (board && board.id && board.name) {
                // 提取数字 ID
                const numericId = board.id.match(/\d+$/)?.[0];
                if (numericId) {
                  boards.set(board.id, {
                    id: numericId,
                    name: board.name,
                    url: `/${projectPath}/-/boards/${numericId}`,
                    gqlId: board.id
                  });
                }
              }
            });
          }
        }
      });

      const boardsList = Array.from(boards.values());
      // console.log(`✅ Successfully loaded ${boardsList.length} boards via GraphQL:`, boardsList);
      
      return boardsList;

    } catch (error) {
      console.error('❌ Error loading boards via GraphQL:', error);
      return [];
    }
  }
}

// 导出 Board 增强器类
window.BoardEnhancer = BoardEnhancer;
} 