// GitLab Board Plus - 内容脚本
// 在 GitLab 页面上添加增强功能

class GitLabBoardEnhancer {
  constructor() {
    this.currentUrl = window.location.href;
    this.projectId = this.extractProjectId();
    this.init();
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
    return match ? encodeURIComponent(match[1]) : null;
  }

  // 检测当前页面类型
  detectPageType() {
    const path = window.location.pathname;
    
    if (path.includes('/-/boards')) {
      return 'board';
    } else if (path.includes('/-/issues')) {
      return 'issues';
    } else if (path.includes('/merge_requests')) {
      return 'merge_requests';
    } else if (path.includes('/-/milestones')) {
      return 'milestones';
    }
    
    return 'other';
  }

  // 应用增强功能
  enhance() {
    const pageType = this.detectPageType();
    console.log(`检测到页面类型: ${pageType}`);

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
    
    // 添加快速过滤器
    this.addQuickFilters();
    
    // 添加批量操作按钮
    this.addBulkActions();
    
    // 增强拖拽功能
    this.enhanceDragAndDrop();
    
    // 添加统计信息
    this.addBoardStatistics();
  }

  // 添加快速过滤器
  addQuickFilters() {
    const boardHeader = document.querySelector('.boards-app-loading, .board-header');
    if (!boardHeader || document.querySelector('.gitlab-board-plus-filters')) {
      return;
    }

    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'gitlab-board-plus-filters';
    filtersContainer.innerHTML = `
      <div class="board-plus-filters">
        <button class="btn btn-sm filter-btn" data-filter="assigned-to-me">
          分配给我的
        </button>
        <button class="btn btn-sm filter-btn" data-filter="created-by-me">
          我创建的
        </button>
        <button class="btn btn-sm filter-btn" data-filter="high-priority">
          高优先级
        </button>
        <button class="btn btn-sm filter-btn" data-filter="overdue">
          已逾期
        </button>
      </div>
    `;

    boardHeader.appendChild(filtersContainer);

    // 绑定过滤器事件
    filtersContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        this.applyFilter(e.target.dataset.filter);
        
        // 更新按钮状态
        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
      }
    });
  }

  // 应用过滤器
  applyFilter(filterType) {
    console.log(`应用过滤器: ${filterType}`);
    
    const cards = document.querySelectorAll('.board-card');
    
    cards.forEach(card => {
      let shouldShow = true;
      
      switch (filterType) {
        case 'assigned-to-me':
          shouldShow = this.isAssignedToCurrentUser(card);
          break;
        case 'created-by-me':
          shouldShow = this.isCreatedByCurrentUser(card);
          break;
        case 'high-priority':
          shouldShow = this.isHighPriority(card);
          break;
        case 'overdue':
          shouldShow = this.isOverdue(card);
          break;
      }
      
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // 检查是否分配给当前用户
  isAssignedToCurrentUser(card) {
    const currentUser = document.querySelector('.header-user-dropdown-toggle .avatar')?.alt;
    const assignee = card.querySelector('.board-card-assignee img')?.alt;
    return assignee === currentUser;
  }

  // 检查是否由当前用户创建
  isCreatedByCurrentUser(card) {
    // 这里需要通过 API 获取更详细的信息
    return false; // 临时返回 false
  }

  // 检查是否高优先级
  isHighPriority(card) {
    const labels = card.querySelectorAll('.board-card-labels .label');
    return Array.from(labels).some(label => 
      label.textContent.toLowerCase().includes('high') ||
      label.textContent.toLowerCase().includes('urgent') ||
      label.textContent.toLowerCase().includes('critical')
    );
  }

  // 检查是否逾期
  isOverdue(card) {
    const dueDateElement = card.querySelector('.board-card-due-date');
    if (!dueDateElement) return false;
    
    const dueDate = new Date(dueDateElement.textContent);
    return dueDate < new Date();
  }

  // 添加批量操作
  addBulkActions() {
    const boardHeader = document.querySelector('.boards-app-loading, .board-header');
    if (!boardHeader || document.querySelector('.gitlab-board-plus-bulk-actions')) {
      return;
    }

    const bulkActionsContainer = document.createElement('div');
    bulkActionsContainer.className = 'gitlab-board-plus-bulk-actions';
    bulkActionsContainer.innerHTML = `
      <div class="bulk-actions" style="display: none;">
        <button class="btn btn-sm bulk-action-btn" data-action="assign">
          批量分配
        </button>
        <button class="btn btn-sm bulk-action-btn" data-action="label">
          批量标签
        </button>
        <button class="btn btn-sm bulk-action-btn" data-action="milestone">
          设置里程碑
        </button>
        <button class="btn btn-sm btn-danger bulk-action-btn" data-action="close">
          批量关闭
        </button>
      </div>
    `;

    boardHeader.appendChild(bulkActionsContainer);
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
    const boardHeader = document.querySelector('.boards-app-loading, .board-header');
    if (!boardHeader || document.querySelector('.gitlab-board-plus-stats')) {
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

    boardHeader.appendChild(statsContainer);

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
          this.enhance();
        }, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
  }
}

// 初始化增强器
const enhancer = new GitLabBoardEnhancer(); 