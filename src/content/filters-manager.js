// GitLab Board Plus - 过滤管理器
// console.log('🎯 GitLab Board Plus filters manager loaded');

// 快捷过滤管理器类
if (typeof FiltersShortcutsManager === 'undefined') {
class FiltersShortcutsManager {
  constructor(container, boardEnhancer) {
    this.container = container;
    this.boardEnhancer = boardEnhancer;
    this.activeFilters = new Set();
    this.filterGroups = [];
    this.currentUser = null;
    this.projectMembers = [];
    this.milestones = [];
    
    this.initializeData();
  }

  // 初始化数据
  async initializeData() {
    try {
      // 获取当前用户信息
      this.currentUser = GitLabUtils.getCurrentUser();
      
      // 初始化过滤组配置
      this.initializeFilterGroups();
      
      // 首次渲染基础结构
      this.render();
      
      // 异步加载动态数据
      setTimeout(() => {
        this.loadDynamicData();
      }, 500);
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error initializing shortcuts data:', error);
      // 即使出错也要渲染基础界面
      this.render();
    }
  }

  // 初始化过滤组配置
  initializeFilterGroups() {
    // 删除顶级选项，使用重置按钮替代
    this.topLevelItems = [];

    // 分组过滤选项
    this.filterGroups = [
      {
        id: 'milestone',
        name: '里程碑',
        icon: '🎯',
        type: 'multiple',
        loadDynamic: true,
        items: []
      },
      {
        id: 'assignee',
        name: '指派人',
        icon: '👤',
        type: 'multiple',
        loadDynamic: true,
        items: [
          {
            id: 'assigned-to-me',
            name: '我',
            icon: '👤',
            filter: `assignee:@${this.currentUser?.username || 'me'}`,
            active: false,
            isDefault: true,
            userData: this.currentUser // 使用当前用户数据
          }
        ]
      },
      {
        id: 'author',
        name: '创建人',
        icon: '✍️',
        type: 'multiple',
        loadDynamic: true,
        items: [
          {
            id: 'created-by-me',
            name: '我',
            icon: '✍️',
            filter: `author:@${this.currentUser?.username || 'me'}`,
            active: false,
            isDefault: true,
            userData: this.currentUser // 使用当前用户数据
          }
        ]
      }
    ];
  }

  // 加载动态数据
  async loadDynamicData() {
    try {
      // 首先获取统计数据
      const statistics = await GitLabUtils.fetchIssuesStatistics();
      this.statistics = statistics;
      
      // 并行加载各种数据
      await Promise.all([
        this.loadProjectMembers(),
        this.loadMilestones()
      ]);
      
      // 数据加载完成后重新渲染
      this.render();
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error loading dynamic data:', error);
    }
  }

  // 加载项目成员
  async loadProjectMembers() {
    try {
      // 使用新的 Issues GraphQL API 获取用户信息（创建人和指派人）
      const users = await GitLabUtils.fetchUsersFromIssuesAPI();
      
      // 更新指派人和创建人组
      const assigneeGroup = this.filterGroups.find(g => g.id === 'assignee');
      const authorGroup = this.filterGroups.find(g => g.id === 'author');
      
      // 获取统计数据
      const assigneeStats = this.statistics?.assigneeStats || {};
      const authorStats = this.statistics?.authorStats || {};
      const totalIssues = this.statistics?.totalIssues || 0;
      
      // 计算没有指派人和没有创建人的issue数量
      const issuesWithAssignees = Object.values(assigneeStats).reduce((sum, count) => sum + count, 0);
      const issuesWithoutAssignees = totalIssues - issuesWithAssignees;
      
      // 注意：所有issues都应该有创建人，所以issuesWithoutAuthors通常为0
      const issuesWithAuthors = Object.values(authorStats).reduce((sum, count) => sum + count, 0);
      const issuesWithoutAuthors = totalIssues - issuesWithAuthors;
      
      if (assigneeGroup) {
        // 重新构建指派人组选项列表
        const assigneeItems = [];
        
        // 添加 "All" 选项（显示所有issues，不过滤指派人）
        assigneeItems.push({
          id: 'assignee-all',
          name: 'All',
          icon: '📋',
          filter: 'assignee:All',
          active: true, // 默认激活
          count: totalIssues,
          isAllOption: true
        });
        
        // 添加 "None" 选项（没有指派人的issues）
        if (issuesWithoutAssignees > 0 || totalIssues === 0) {
          assigneeItems.push({
            id: 'assignee-none',
            name: 'None',
            icon: '🚫',
            filter: 'assignee:None',
            active: false,
            count: issuesWithoutAssignees,
            isNoneOption: true
          });
        }
        
        // 添加"我"选项
        if (this.currentUser?.username) {
          const myCount = assigneeStats[this.currentUser.username] || 0;
          assigneeItems.push({
            id: 'assigned-to-me',
            name: '我',
            icon: '👤',
            filter: `assignee:@${this.currentUser.username}`,
            active: false,
            isDefault: true,
            userData: this.currentUser,
            count: myCount
          });
        }
        
        // 添加其他指派人（除了"我"），按issue数量降序排序
        if (users.length > 0) {
          const assignees = users.filter(user => user.isAssignee && user.username !== this.currentUser?.username);
          
          // 按issue数量降序排序
          const sortedAssignees = assignees.sort((a, b) => {
            const countA = assigneeStats[a.username] || 0;
            const countB = assigneeStats[b.username] || 0;
            return countB - countA; // 降序排序
          });
          
          sortedAssignees.forEach(user => {
            const count = assigneeStats[user.username] || 0;
            assigneeItems.push({
              id: `assignee-${user.username}`,
              name: user.username,
              icon: null,
              filter: `assignee:@${user.username}`,
              active: false,
              userData: user,
              count: count
            });
          });
        }
        
        assigneeGroup.items = assigneeItems;
      }
      
      if (authorGroup) {
        // 重新构建创建人组选项列表
        const authorItems = [];
        
        // 添加 "All" 选项（显示所有issues，不过滤创建人）
        authorItems.push({
          id: 'author-all',
          name: 'All',
          icon: '✍️',
          filter: 'author:All',
          active: true, // 默认激活
          count: totalIssues,
          isAllOption: true
        });
        
        // 添加 "None" 选项（没有创建人的issues - 通常不会有，但为了一致性保留）
        if (issuesWithoutAuthors > 0) {
          authorItems.push({
            id: 'author-none',
            name: 'None',
            icon: '🚫',
            filter: 'author:None',
            active: false,
            count: issuesWithoutAuthors,
            isNoneOption: true
          });
        }
        
        // 添加"我"选项
        if (this.currentUser?.username) {
          const myCount = authorStats[this.currentUser.username] || 0;
          authorItems.push({
            id: 'created-by-me',
            name: '我',
            icon: '✍️',
            filter: `author:@${this.currentUser.username}`,
            active: false,
            isDefault: true,
            userData: this.currentUser,
            count: myCount
          });
        }
        
        // 添加其他创建人（除了"我"），按issue数量降序排序
        if (users.length > 0) {
          const authors = users.filter(user => user.isAuthor && user.username !== this.currentUser?.username);
          
          // 按issue数量降序排序
          const sortedAuthors = authors.sort((a, b) => {
            const countA = authorStats[a.username] || 0;
            const countB = authorStats[b.username] || 0;
            return countB - countA; // 降序排序
          });
          
          sortedAuthors.forEach(user => {
            const count = authorStats[user.username] || 0;
            authorItems.push({
              id: `author-${user.username}`,
              name: user.username,
              icon: null,
              filter: `author:@${user.username}`,
              active: false,
              userData: user,
              count: count
            });
          });
        }
        
        authorGroup.items = authorItems;
      }
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error loading project members:', error);
    }
  }

  // 加载里程碑
  async loadMilestones() {
    try {
      // 使用 GraphQL API 获取里程碑信息
      const milestones = await GitLabUtils.fetchMilestonesFromAPI();
      
      const milestoneGroup = this.filterGroups.find(g => g.id === 'milestone');
      if (milestoneGroup) {
        // 获取里程碑统计数据
        const milestoneStats = this.statistics?.milestoneStats || {};
        
        // 计算没有里程碑的issue数量
        const totalIssues = this.statistics?.totalIssues || 0;
        const issuesWithMilestones = Object.values(milestoneStats).reduce((sum, count) => sum + count, 0);
        const issuesWithoutMilestones = totalIssues - issuesWithMilestones;
        
        // 创建里程碑选项列表
        const milestoneItems = [];
        
        // 添加 "All" 选项（显示所有issues，不过滤里程碑）
        milestoneItems.push({
          id: 'milestone-all',
          name: 'All',
          icon: '📋',
          filter: 'milestone_title:All',
          active: true, // 默认激活
          count: totalIssues,
          isAllOption: true
        });
        
        // 添加 "None" 选项（没有里程碑的issues）
        if (issuesWithoutMilestones > 0 || totalIssues === 0) {
          milestoneItems.push({
            id: 'milestone-none',
            name: 'None',
            icon: '🚫',
            filter: 'milestone_title:None',
            active: false,
            count: issuesWithoutMilestones,
            isNoneOption: true
          });
        }
        
        // 添加实际的里程碑选项
        if (milestones.length > 0) {
          // 按照名称升序排序
          const sortedMilestones = milestones.sort((a, b) => 
            a.title.localeCompare(b.title, 'zh-CN', { numeric: true, sensitivity: 'base' })
          );
          
          const milestoneOptions = sortedMilestones.map(milestone => {
            const count = milestoneStats[milestone.title] || 0;
            return {
              id: `milestone-${milestone.id}`,
              name: milestone.title,
              icon: '🎯',
              filter: `milestone_title:${milestone.title}`,
              active: false,
              milestoneData: milestone,
              count: count
            };
          });
          
          milestoneItems.push(...milestoneOptions);
        }
        
        milestoneGroup.items = milestoneItems;
      }
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error loading milestones:', error);
    }
  }

  // 渲染快捷过滤界面
  render() {
    const shortcutsContent = `
      <div class="shortcuts-content">
        ${this.renderTopLevelItems()}
        ${this.renderFilterGroups()}
      </div>
    `;
    
    this.container.innerHTML = shortcutsContent;
    
    // 添加搜索功能
    this.addSearchFunction();
    
    // 绑定事件
    this.bindEvents();
    
    // 恢复分组折叠状态
    this.restoreGroupCollapsedStates();
    
    // 设置激活状态
    this.setActiveFiltersFromUrl();
  }

  // 渲染顶级过滤选项
  renderTopLevelItems() {
    if (!this.topLevelItems || this.topLevelItems.length === 0) {
      return '';
    }
    
    return `
      <div class="top-level-items">
        ${this.topLevelItems.map(item => this.renderFilterItem(item, item.type)).join('')}
      </div>
    `;
  }

  // 渲染过滤组
  renderFilterGroups() {
    return this.filterGroups.map(group => this.renderFilterGroup(group)).join('');
  }

  // 渲染单个过滤组
  renderFilterGroup(group) {
    // 默认展开的分组列表
    const defaultExpandedGroups = ['milestone', 'assignee'];
    const isDefaultExpanded = defaultExpandedGroups.includes(group.id);
    const collapsedClass = isDefaultExpanded ? '' : '';
    
    return `
      <div class="filter-group ${collapsedClass}" data-group-id="${group.id}">
        <div class="filter-group-header">
          <span class="group-icon">${group.icon}</span>
          <span class="group-name">${group.name}</span>
          ${group.loadDynamic ? '<span class="group-loading">⟳</span>' : ''}
        </div>
        <div class="filter-group-items">
          ${group.items.map(item => this.renderFilterItem(item, group.id)).join('')}
        </div>
      </div>
    `;
  }

  // 计算文字颜色的对比度
  getContrastColor(backgroundColor, providedTextColor) {
    // 如果提供了文字颜色，直接使用
    if (providedTextColor) {
      return providedTextColor;
    }
    
    // 如果没有提供文字颜色，根据背景色计算
    if (!backgroundColor) {
      return '#374151';
    }
    
    try {
      // 处理不同的颜色格式
      let hex = backgroundColor;
      
      // 如果是 #RRGGBB 格式
      if (hex.startsWith('#')) {
        hex = hex.substring(1);
      }
      
      // 如果是 3 位十六进制，扩展为 6 位
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      // 确保是 6 位十六进制
      if (hex.length !== 6) {
        console.warn('Invalid color format:', backgroundColor);
        return '#374151';
      }
      
      // 解析 RGB 值
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // 计算相对亮度
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // 如果背景较亮，使用深色文字；如果背景较暗，使用浅色文字
      return luminance > 0.5 ? '#1f2937' : '#ffffff';
    } catch (error) {
      // 保留错误日志
      console.error('Error calculating contrast color:', error);
      return '#000000';
    }
  }

  // 渲染单个过滤项
  renderFilterItem(item, groupType) {
    const activeClass = item.active ? 'active' : '';
    
    // 渲染图标或头像
    let iconHtml = '';
    if (item.userData && item.userData.avatarUrl) {
      // 如果有用户数据和头像URL，显示头像
      iconHtml = `<img class="user-avatar" src="${item.userData.avatarUrl}" alt="${item.name}" title="${item.userData.name || item.name}">`;
    } else if (item.icon) {
      // 否则显示普通图标
      iconHtml = `<span class="item-icon">${item.icon}</span>`;
    }
    
    // 为标签类型的项目生成特殊样式
    let itemStyle = '';
    let itemNameClass = 'item-name';
    
    // 生成统计数量显示
    let countHtml = '';
    if (typeof item.count === 'number') {
      countHtml = ` <span class="item-count">(${item.count})</span>`;
    }
    
    // 所有组都使用单选模式
    const inputType = 'radio';
    const tooltipText = '点击选择（单选）';
    const radioName = `filter-${groupType}`;
    
    return `
      <div class="filter-item ${activeClass}" 
           data-item-id="${item.id}" 
           data-filter="${item.filter}"
           data-group-type="${groupType}"
           title="${tooltipText}">
        <input type="${inputType}" name="${radioName}" ${item.active ? 'checked' : ''} />
        <div class="item-content">
          ${iconHtml}
          <span class="${itemNameClass}" ${itemStyle}>${item.name}${countHtml}</span>
        </div>
      </div>
    `;
  }

  // 绑定事件
  bindEvents() {
    // 重置按钮事件（现在在搜索区域）
    const resetBtn = this.container.querySelector('.shortcuts-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleResetFilters();
      });
    }

    // 分组折叠/展开事件
    const groupHeaders = this.container.querySelectorAll('.filter-group-header');
    groupHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        // 如果点击的是加载图标，不处理折叠/展开
        if (e.target.classList.contains('group-loading')) {
          return;
        }
        this.handleGroupToggle(header);
      });
    });

    // 过滤项点击事件 - 指派人、创建人和里程碑使用单选
    const filterItems = this.container.querySelectorAll('.filter-item');
    filterItems.forEach(item => {
      // 整个项目可点击，根据组类型使用不同的选择模式
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleFilterItemClick(item);
      });
    });
  }

  // 处理过滤项点击
  handleFilterItemClick(item) {
    const filter = item.getAttribute('data-filter');
    const groupType = item.getAttribute('data-group-type');
    
    // 对于指派人、创建人和里程碑组，使用单选模式
    this.handleSingleSelectFilter(item, filter, groupType);
    
    // 应用过滤器 - 通过Vue实例
    this.applyFiltersViaVue();
  }

  // 处理单选过滤器（指派人、创建人、里程碑）
  handleSingleSelectFilter(item, filter, groupType) {
    const input = item.querySelector('input[type="radio"], input[type="checkbox"]');
    
    if (item.classList.contains('active')) {
      // 取消激活
      item.classList.remove('active');
      if (input) input.checked = false;
      this.activeFilters.delete(filter);
    } else {
      // 先清除同组的其他激活项
      this.clearGroupActiveItems(groupType);
      
      // 激活当前项
      item.classList.add('active');
      if (input) input.checked = true;
      this.activeFilters.add(filter);
    }
  }

  // 清除指定组的所有激活项
  clearGroupActiveItems(groupType) {
    // 找到该组的所有项目
    const groupItems = this.container.querySelectorAll(`[data-group-type="${groupType}"].filter-item.active`);
    
    groupItems.forEach(groupItem => {
      const groupFilter = groupItem.getAttribute('data-filter');
      
      // 清除激活状态
      groupItem.classList.remove('active');
      const groupInput = groupItem.querySelector('input[type="checkbox"], input[type="radio"]');
      if (groupInput) groupInput.checked = false;
      
      // 从激活过滤器集合中移除
      this.activeFilters.delete(groupFilter);
    });
  }

  // 通过URL参数应用过滤器
  applyFiltersViaVue() {
    const componentElement = document.querySelector('.vue-filtered-search-bar-container');
    if (!componentElement || !componentElement.__vue__) {
      console.error('Vue instance not found. Falling back to URL-based filtering.');
      this.applyFiltersViaUrl();
      return;
    }

    const vueInstance = componentElement.__vue__;
    const filterTokens = [];

    this.activeFilters.forEach(filter => {
      const [type, value] = filter.split(':');
      if (value === 'All') return;

      let token;
      switch (type) {
        case 'assignee':
          token = { type: 'assignee', value: { data: value === 'None' ? value : value.replace('@', ''), operator: '=' } };
          break;
        case 'author':
          token = { type: 'author', value: { data: value.replace('@', ''), operator: '=' } };
          break;
        case 'milestone_title':
          token = { type: 'milestone', value: { data: value, operator: '=' } };
          break;
      }
      if (token) filterTokens.push(token);
    });

    vueInstance.filterValue = filterTokens;
    vueInstance.$mount().handleFilterSubmit();

    // Update URL for persistence
    const url = new URL(window.location.href);
    GitLabUtils.clearFilterParams(url);
    this.activeFilters.forEach(filter => this.addFilterToUrl(url, filter));
    window.history.pushState({}, '', url.toString());
  }

  // 通过URL参数应用过滤器
  applyFiltersViaUrl() {
    // 创建一个URL对象，用于累积所有过滤器参数
    const url = new URL(window.location.href);
    
    // 首先清除现有的过滤参数
    GitLabUtils.clearFilterParams(url);
    
    // 根据激活的过滤器设置URL参数
    let filterCount = 0;
    this.activeFilters.forEach(filter => {
      filterCount++;
      this.addFilterToUrl(url, filter); // 使用同一个url对象
    });
    
    console.log('🔄 Applying filters to URL:', url.toString());
    
    // 重新加载页面
    window.location.href = url.toString();
  }

  // 将单个过滤器添加到URL
  addFilterToUrl(url, filter) {
    // 解析过滤器格式，例如：assignee:@me, author:@username, milestone:"title"
    if (filter.startsWith('assignee:')) {
      const assignee = filter.replace('assignee:', '');
      if (assignee === 'All') {
        // 对于 "All" 指派人，不添加任何过滤参数（显示所有）
      } else if (assignee === 'None') {
        // 对于 "None" 指派人，使用 GitLab 的特殊参数
        url.searchParams.set('assignee_username', 'None');
      } else if (assignee.startsWith('@')) {
        const username = assignee.replace('@', '');
        url.searchParams.set('assignee_username', username);
      }
    } else if (filter.startsWith('author:')) {
      const author = filter.replace('author:', '');
      if (author === 'All') {
        // 对于 "All" 创建人，不添加任何过滤参数（显示所有）
      } else if (author === 'None') {
        // 对于 "None" 创建人，使用 GitLab 的特殊参数
        url.searchParams.set('author_username', 'None');
      } else if (author.startsWith('@')) {
        const username = author.replace('@', '');
        url.searchParams.set('author_username', username);
      }
    } else if (filter.startsWith('milestone_title:')) {
      const milestone = filter.replace('milestone_title:', '');
      if (milestone === 'All') {
        // 对于 "All" 里程碑，不添加任何过滤参数（显示所有）
      } else if (milestone === 'None') {
        // 处理没有里程碑的情况
        url.searchParams.set('milestone_title', 'None');
      } else {
        url.searchParams.set('milestone_title', milestone);
      }
    } else {
      // 移除未知过滤器格式的日志
    }
  }

  // 应用当前过滤器（保留原方法作为备用）
  applyCurrentFilters() {
    const filterQuery = Array.from(this.activeFilters).join(' ');
    this.applyFiltersViaVue();
  }

  // 根据URL设置激活状态
  setActiveFiltersFromUrl() {
    try {
      // 获取URL参数
      const assignee = new URL(window.location.href).searchParams.get('assignee_username');
      const author = new URL(window.location.href).searchParams.get('author_username');
      const milestone = new URL(window.location.href).searchParams.get('milestone_title');
      
      // 重置状态
      this.clearAllActiveStates();
      this.activeFilters.clear();
      
      // 根据URL参数设置激活状态
      let hasAssigneeFilter = false;
      let hasAuthorFilter = false;
      let hasMilestoneFilter = false;
      
      // 处理指派人（单个）
      if (assignee) {
        this.activateFilterByValue('assignee', assignee);
        hasAssigneeFilter = true;
      } else {
        // 没有指派人过滤器时，激活"All"
        this.activateFilterByValue('assignee', 'All');
      }
      
      // 处理创建人（单个）
      if (author) {
        this.activateFilterByValue('author', author);
        hasAuthorFilter = true;
      } else {
        // 没有创建人过滤器时，激活"All"
        this.activateFilterByValue('author', 'All');
      }
      
      // 处理里程碑（单个）
      if (milestone) {
        this.activateFilterByValue('milestone', milestone);
        hasMilestoneFilter = true;
      } else {
        // 没有里程碑过滤器时，激活"All"
        this.activateFilterByValue('milestone', 'All');
      }
      
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error setting active filters from URL:', error);
      // 出错时激活所有组的"All"选项
      this.activateFilterByValue('assignee', 'All');
      this.activateFilterByValue('author', 'All');
      this.activateFilterByValue('milestone', 'All');
    }
  }

  // 根据值激活过滤器
  activateFilterByValue(type, value) {
    // 构建查询选择器，针对里程碑使用正确的前缀
    let searchPrefix = type;
    if (type === 'milestone') {
      searchPrefix = 'milestone_title';
    }
    
    const items = this.container.querySelectorAll(`.filter-item[data-filter*="${searchPrefix}:"]`);
    
    items.forEach(item => {
      const filter = item.getAttribute('data-filter');
      
      // 根据不同类型进行匹配
      let shouldActivate = false;
      
      if (type === 'assignee' && filter.startsWith('assignee:')) {
        const filterValue = filter.replace('assignee:', '');
        if (value === 'None' && filterValue === 'None') {
          shouldActivate = true;
        } else if (value === 'All' && filterValue === 'All') {
          shouldActivate = true;
        } else if (filterValue.startsWith('@')) {
          const filterUsername = filterValue.replace('@', '');
          shouldActivate = filterUsername === value;
        }
      } else if (type === 'author' && filter.startsWith('author:')) {
        const filterValue = filter.replace('author:', '');
        if (value === 'None' && filterValue === 'None') {
          shouldActivate = true;
        } else if (value === 'All' && filterValue === 'All') {
          shouldActivate = true;
        } else if (filterValue.startsWith('@')) {
          const filterUsername = filterValue.replace('@', '');
          shouldActivate = filterUsername === value;
        }
      } else if (type === 'milestone' && filter.startsWith('milestone_title:')) {
        const filterMilestone = filter.replace('milestone_title:', '');
        shouldActivate = filterMilestone === value;
      }
      
      if (shouldActivate) {
        item.classList.add('active');
        const input = item.querySelector('input[type="checkbox"], input[type="radio"]');
        if (input) input.checked = true;
        this.activeFilters.add(filter);
      }
    });
  }

  // 处理重置过滤器
  handleResetFilters() {
    // 清除所有激活状态
    this.clearAllActiveStates();
    
    // 清空过滤器集合
    this.activeFilters.clear();
    
    // 添加重置动画效果
    const resetBtn = this.container.querySelector('.shortcuts-reset-btn');
    if (resetBtn) {
      resetBtn.classList.add('resetting');
    }
    
    // 通过清除URL参数来重置过滤器
    this.resetFiltersViaVue();
  }

  resetFiltersViaVue() {
    const componentElement = document.querySelector('.vue-filtered-search-bar-container');
    if (componentElement && componentElement.__vue__) {
      const vueInstance = componentElement.__vue__;
      vueInstance.filterValue = [];
      vueInstance.$mount().handleFilterSubmit();
    }

    // Update URL for persistence
    const url = new URL(window.location.href);
    GitLabUtils.clearFilterParams(url);
    window.history.pushState({}, '', url.toString());
    this.setActiveFiltersFromUrl();
  }

  // 通过URL参数重置过滤器
  resetFiltersViaUrl() {
    const url = new URL(window.location.href);
    
    // 清除所有过滤参数
    url.searchParams.delete('assignee_username');
    url.searchParams.delete('author_username');
    url.searchParams.delete('milestone_title');
    
    // 重新加载页面
    window.location.href = url.toString();
  }

  // 激活默认过滤器（在取消所有多选项时调用）
  activateDefaultFilter() {
    // 清除所有过滤器
    this.activeFilters.clear();
    
    // 激活所有组的"All"选项
    const groupsWithAllOption = ['assignee', 'author', 'milestone'];
    
    groupsWithAllOption.forEach(groupType => {
      const allItems = this.container.querySelectorAll(`.filter-item[data-group-type="${groupType}"]`);
      allItems.forEach(item => {
        const filter = item.getAttribute('data-filter');
        if (filter && filter.endsWith(':All')) {
          item.classList.add('active');
          const input = item.querySelector('input[type="checkbox"], input[type="radio"]');
          if (input) input.checked = true;
          this.activeFilters.add(filter);
        }
      });
    });
  }

  // 处理分组折叠/展开
  handleGroupToggle(header) {
    const group = header.closest('.filter-group');
    if (group) {
      const groupId = group.getAttribute('data-group-id');
      
      group.classList.toggle('collapsed');
      
      // 保存折叠状态到本地存储
      const isCollapsed = group.classList.contains('collapsed');
      this.saveGroupCollapsedState(groupId, isCollapsed);
    }
  }

  // 保存分组折叠状态
  saveGroupCollapsedState(groupId, isCollapsed) {
    try {
      const key = 'gitlab-board-plus-group-collapsed-states';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      states[groupId] = isCollapsed;
      localStorage.setItem(key, JSON.stringify(states));
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error saving group collapsed state:', error);
    }
  }

  // 恢复分组折叠状态
  restoreGroupCollapsedStates() {
    try {
      const key = 'gitlab-board-plus-group-collapsed-states';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      
      // 默认展开的分组列表 - 如果用户没有明确设置过折叠状态，这些分组默认展开
      const defaultExpandedGroups = ['milestone', 'assignee'];
      
      // 处理所有分组
      this.filterGroups.forEach(group => {
        const groupElement = this.container.querySelector(`[data-group-id="${group.id}"]`);
        if (!groupElement) return;
        
        // 如果有保存的状态，使用保存的状态
        if (states.hasOwnProperty(group.id)) {
          if (states[group.id]) {
            groupElement.classList.add('collapsed');
          } else {
            groupElement.classList.remove('collapsed');
          }
        } else {
          // 如果没有保存的状态，使用默认设置
          if (defaultExpandedGroups.includes(group.id)) {
            groupElement.classList.remove('collapsed'); // 确保默认展开
          }
          // 其他分组保持当前状态（默认是展开的，因为没有collapsed类）
        }
      });
    } catch (error) {
      // 保留错误日志
      console.error('❌ Error restoring group collapsed states:', error);
    }
  }

  // 清除所有激活状态
  clearAllActiveStates() {
    // 清除顶级选项和分组选项的激活状态
    const activeItems = this.container.querySelectorAll('.filter-item.active');
    activeItems.forEach(item => {
      item.classList.remove('active');
      const input = item.querySelector('input[type="checkbox"], input[type="radio"]');
      if (input) input.checked = false;
    });
  }

  // 添加搜索功能
  addSearchFunction() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'shortcuts-search';
    searchContainer.innerHTML = `
      <div class="search-row">
        <input type="text" 
               placeholder="搜索过滤选项..." 
               class="shortcuts-search-input" />
      </div>
      <div class="reset-row">
        <button class="shortcuts-reset-btn" title="清除所有过滤条件">
          <span class="reset-icon">🔄</span>
          <span class="reset-text">清除重置</span>
        </button>
      </div>
    `;
    
    // 插入到内容区域最前面
    const content = this.container.querySelector('.shortcuts-content');
    if (content) {
      content.insertAdjacentElement('afterbegin', searchContainer);
      
      // 绑定搜索事件
      const searchInput = searchContainer.querySelector('.shortcuts-search-input');
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
  }

  // 处理搜索
  handleSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // 搜索顶级选项
    if (this.topLevelItems) {
      this.topLevelItems.forEach(item => {
        const itemElement = this.container.querySelector(`[data-item-id="${item.id}"]`);
        if (!itemElement) return;
        
        const isVisible = normalizedQuery === '' || 
                         item.name.toLowerCase().includes(normalizedQuery) ||
                         item.filter.toLowerCase().includes(normalizedQuery);
        
        itemElement.style.display = isVisible ? 'flex' : 'none';
      });
    }
    
    // 搜索分组选项
    this.filterGroups.forEach(group => {
      const groupElement = this.container.querySelector(`[data-group-id="${group.id}"]`);
      if (!groupElement) return;
      
      let hasVisibleItems = false;
      
      group.items.forEach(item => {
        const itemElement = groupElement.querySelector(`[data-item-id="${item.id}"]`);
        if (!itemElement) return;
        
        const isVisible = normalizedQuery === '' || 
                         item.name.toLowerCase().includes(normalizedQuery) ||
                         item.filter.toLowerCase().includes(normalizedQuery);
        
        itemElement.style.display = isVisible ? 'flex' : 'none';
        if (isVisible) hasVisibleItems = true;
      });
      
      // 隐藏没有可见项的分组
      groupElement.style.display = hasVisibleItems ? 'flex' : 'none';
    });
  }

  // 测试方法：验证URL参数处理
  testUrlParameterHandling() {
    const testUrl = new URL('https://gitlab.example.com/project/-/boards/1?assignee_username=user1&milestone_title=v1.0');
        
    this.setActiveFiltersFromURL();
        
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('assignee_username', 'user2');
    newUrl.searchParams.set('milestone_title', 'v2.0');
  }

  // 测试添加过滤器
  testAddFilter() {
    const newUrl = new URL(window.location.href);
    
    // 测试添加过滤器
    this.addFilterToUrl(newUrl, 'assignee:@xiaojiezhi-jk');
    this.addFilterToUrl(newUrl, 'milestone_title:2025-07-03');
    
    window.location.href = newUrl.toString();
  }
}

// 导出过滤管理器类
window.FiltersShortcutsManager = FiltersShortcutsManager;
} 