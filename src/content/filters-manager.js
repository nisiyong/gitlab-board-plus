// GitLab Board Plus - 过滤管理器
console.log('🎯 GitLab Board Plus filters manager loaded');

// 快捷过滤管理器类
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
      },
      {
        id: 'label',
        name: '标签',
        icon: '🏷️',
        type: 'multiple',
        loadDynamic: true,
        items: []
      }
    ];
  }

  // 加载动态数据
  async loadDynamicData() {
    try {
      console.log('🔄 Loading dynamic data for filters...');
      
      // 首先获取统计数据
      const statistics = await GitLabUtils.fetchIssuesStatistics();
      this.statistics = statistics;
      
      // 并行加载各种数据
      await Promise.all([
        this.loadProjectMembers(),
        this.loadMilestones(),
        this.loadLabels()
      ]);
      
      // 数据加载完成后重新渲染
      this.render();
      
      console.log('✅ Dynamic data loading completed');
      
    } catch (error) {
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
      
      // 更新"我"的统计数量
      if (assigneeGroup && this.currentUser?.username) {
        const myAssigneeItem = assigneeGroup.items.find(item => item.isDefault);
        if (myAssigneeItem) {
          myAssigneeItem.count = assigneeStats[this.currentUser.username] || 0;
        }
      }
      
      if (authorGroup && this.currentUser?.username) {
        const myAuthorItem = authorGroup.items.find(item => item.isDefault);
        if (myAuthorItem) {
          myAuthorItem.count = authorStats[this.currentUser.username] || 0;
        }
      }
      
      if (assigneeGroup && users.length > 0) {
        // 添加指派人到指派人组（除了默认的"我"）
        const assignees = users.filter(user => user.isAssignee && user.username !== this.currentUser?.username);
        assignees.forEach(user => {
          const count = assigneeStats[user.username] || 0;
          assigneeGroup.items.push({
            id: `assignee-${user.username}`,
            name: user.username, // 直接使用 username
            icon: null, // 不使用 emoji，使用头像
            filter: `assignee:@${user.username}`,
            active: false,
            userData: user,
            count: count
          });
        });
        console.log(`✅ Added ${assignees.length} assignees to filter group`);
      }
      
      if (authorGroup && users.length > 0) {
        // 添加创建人到创建人组（除了默认的"我"）
        const authors = users.filter(user => user.isAuthor && user.username !== this.currentUser?.username);
        authors.forEach(user => {
          const count = authorStats[user.username] || 0;
          authorGroup.items.push({
            id: `author-${user.username}`,
            name: user.username, // 直接使用 username
            icon: null, // 不使用 emoji，使用头像
            filter: `author:@${user.username}`,
            active: false,
            userData: user,
            count: count
          });
        });
        console.log(`✅ Added ${authors.length} authors to filter group`);
      }
      
    } catch (error) {
      console.error('❌ Error loading project members:', error);
    }
  }

  // 加载里程碑
  async loadMilestones() {
    try {
      // 使用 GraphQL API 获取里程碑信息
      const milestones = await GitLabUtils.fetchMilestonesFromAPI();
      
      const milestoneGroup = this.filterGroups.find(g => g.id === 'milestone');
      if (milestoneGroup && milestones.length > 0) {
        // 获取里程碑统计数据
        const milestoneStats = this.statistics?.milestoneStats || {};
        
        // 按照名称升序排序
        const sortedMilestones = milestones.sort((a, b) => 
          a.title.localeCompare(b.title, 'zh-CN', { numeric: true, sensitivity: 'base' })
        );
        
        milestoneGroup.items = sortedMilestones.map(milestone => {
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
      }
      
    } catch (error) {
      console.error('❌ Error loading milestones:', error);
    }
  }

  // 加载标签
  async loadLabels() {
    try {
      // 使用 GraphQL API 获取标签信息
      const labels = await GitLabUtils.fetchLabelsFromAPI();
      
      const labelGroup = this.filterGroups.find(g => g.id === 'label');
      if (labelGroup && labels.length > 0) {
        labelGroup.items = labels.map(label => ({
          id: `label-${label.name || label.title}`,
          name: label.name || label.title,
          icon: '🏷️',
          filter: `label:"${label.name || label.title}"`,
          active: false,
          labelData: label // 保存完整的标签数据，包含 color 和 textColor
        }));
      }
      
    } catch (error) {
      console.error('❌ Error loading labels:', error);
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
    return `
      <div class="filter-group" data-group-id="${group.id}">
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
      console.error('Error calculating contrast color:', error);
      return '#374151';
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
          if (groupType === 'label' && item.labelData) {
        const { color, textColor } = item.labelData;
        if (color) {
          // 计算最佳的文字颜色
          const finalTextColor = this.getContrastColor(color, textColor);
          
          // 为标签项目添加背景色和文字颜色
          itemStyle = `style="background-color: ${color}; color: ${finalTextColor};"`;
          itemNameClass = 'item-name label-styled';
          // 不显示标签图标，因为整个项目都有颜色背景了
          iconHtml = '';
        }
      }
    
    // 生成统计数量显示
    let countHtml = '';
    if (typeof item.count === 'number') {
      countHtml = ` <span class="item-count">(${item.count})</span>`;
    }
    
    // 根据组类型设置不同的提示和交互模式
    const isRadioGroup = groupType === 'assignee' || groupType === 'author' || groupType === 'milestone';
    const inputType = isRadioGroup ? 'radio' : 'checkbox';
    const tooltipText = isRadioGroup ? '点击选择（单选）' : '点击切换选中状态（多选）';
    const radioName = isRadioGroup ? `filter-${groupType}` : '';
    
    return `
      <div class="filter-item ${activeClass}" 
           data-item-id="${item.id}" 
           data-filter="${item.filter}"
           data-group-type="${groupType}"
           title="${tooltipText}">
        <input type="${inputType}" ${radioName ? `name="${radioName}"` : ''} ${item.active ? 'checked' : ''} />
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

    // 过滤项点击事件 - 指派人、创建人和里程碑使用单选，标签使用多选
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
    const checkbox = item.querySelector('input[type="checkbox"]');
    
    // 对于指派人、创建人和里程碑组，使用单选模式
    if (groupType === 'assignee' || groupType === 'author' || groupType === 'milestone') {
      this.handleSingleSelectFilter(item, filter, groupType);
    } else {
      // 其他组（标签）使用多选模式
      this.handleMultiSelectFilter(item, filter, checkbox);
    }
    
    // 应用过滤器 - 通过URL参数
    this.applyFiltersViaUrl();
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

  // 处理多选过滤器（标签）
  handleMultiSelectFilter(item, filter, checkbox) {
    if (item.classList.contains('active')) {
      // 取消激活
      item.classList.remove('active');
      if (checkbox) checkbox.checked = false;
      this.activeFilters.delete(filter);
    } else {
      // 激活
      item.classList.add('active');
      if (checkbox) checkbox.checked = true;
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
  applyFiltersViaUrl() {
    console.log('🔍 Applying filters via URL:', Array.from(this.activeFilters));
    console.log('📊 Active filters count:', this.activeFilters.size);
    
    const url = new URL(window.location.href);
    
    // 清除现有的过滤参数
    url.searchParams.delete('assignee_username');
    url.searchParams.delete('author_username');
    url.searchParams.delete('milestone_title');
    url.searchParams.delete('label_name');
    url.searchParams.delete('label_name[]');
    
    // 根据激活的过滤器设置URL参数
    let filterCount = 0;
    this.activeFilters.forEach(filter => {
      filterCount++;
      console.log(`🔗 Processing filter ${filterCount}/${this.activeFilters.size}:`, filter);
      this.addFilterToUrl(url, filter);
    });
    
    // 显示最终的URL参数
    console.log('📋 Final URL parameters:');
    console.log('  assignee_username:', url.searchParams.get('assignee_username'));
    console.log('  author_username:', url.searchParams.get('author_username'));
    console.log('  milestone_title:', url.searchParams.get('milestone_title'));
    console.log('  label_name[]:', url.searchParams.getAll('label_name[]'));
    
    // 重新加载页面
    console.log('🌐 Navigating to:', url.toString());
    window.location.href = url.toString();
  }

  // 将单个过滤器添加到URL
  addFilterToUrl(url, filter) {
    console.log('🔗 Adding filter to URL:', filter);
    
    // 解析过滤器格式，例如：assignee:@me, author:@username, milestone:"title", label:"name"
    if (filter.startsWith('assignee:@')) {
      const username = filter.replace('assignee:@', '');
      // 指派人使用单个参数，不使用数组格式
      url.searchParams.set('assignee_username', username);
      console.log('  ➡️ Added assignee:', username);
    } else if (filter.startsWith('author:@')) {
      const username = filter.replace('author:@', '');
      url.searchParams.set('author_username', username);
      console.log('  ➡️ Added author:', username);
    } else if (filter.startsWith('milestone_title:')) {
      const milestone = filter.replace('milestone_title:', '');
      url.searchParams.set('milestone_title', milestone);
      console.log('  ➡️ Added milestone:', milestone);
    } else if (filter.startsWith('label:"') && filter.endsWith('"')) {
      const label = filter.slice(7, -1); // 去掉 label:" 和最后的 "
      // GitLab使用数组格式的参数
      url.searchParams.append('label_name[]', label);
      console.log('  ➡️ Added label:', label);
    } else {
      console.log('  ❌ Unknown filter format:', filter);
    }
  }

  // 应用当前过滤器（保留原方法作为备用）
  applyCurrentFilters() {
    const filterQuery = Array.from(this.activeFilters).join(' ');
    console.log('🔍 Applying filters:', filterQuery);
    
    // 通过URL参数应用过滤
    this.applyFiltersViaUrl();
  }

  // 根据URL设置激活状态
  setActiveFiltersFromUrl() {
    try {
      const url = new URL(window.location.href);
      console.log('🔍 Setting active filters from URL:', url.toString());
      
      // 获取URL参数
      const assignee = url.searchParams.get('assignee_username');
      const author = url.searchParams.get('author_username');
      const milestone = url.searchParams.get('milestone_title');
      const labels = url.searchParams.getAll('label_name[]') || 
                    (url.searchParams.get('label_name') ? [url.searchParams.get('label_name')] : []);
      
      console.log('📋 URL parameters parsed:');
      console.log('  assignee:', assignee);
      console.log('  author:', author);
      console.log('  milestone:', milestone);
      console.log('  labels:', labels);
      
      // 重置状态
      this.clearAllActiveStates();
      this.activeFilters.clear();
      
      // 根据URL参数设置激活状态
      let hasActiveFilters = false;
      
      // 处理指派人（单个）
      if (assignee) {
        this.activateFilterByValue('assignee', assignee);
        hasActiveFilters = true;
      }
      
      // 处理创建人（单个）
      if (author) {
        this.activateFilterByValue('author', author);
        hasActiveFilters = true;
      }
      
      // 处理里程碑（单个）
      if (milestone) {
        this.activateFilterByValue('milestone', milestone);
        hasActiveFilters = true;
      }
      
      // 处理标签（支持多个）
      labels.forEach(label => {
        if (label) {
          this.activateFilterByValue('label', label);
          hasActiveFilters = true;
        }
      });
      
      // 如果没有任何激活的过滤器，激活默认的"全部"
      if (!hasActiveFilters) {
        this.activateDefaultFilter();
      }
      
    } catch (error) {
      console.error('❌ Error setting active filters from URL:', error);
      this.activateDefaultFilter();
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
    console.log(`🔍 Looking for ${type} filters with value "${value}", found ${items.length} items`);
    
    items.forEach(item => {
      const filter = item.getAttribute('data-filter');
      console.log(`  📝 Checking filter: ${filter}`);
      
      // 根据不同类型进行匹配
      let shouldActivate = false;
      
      if (type === 'assignee' && filter.startsWith('assignee:@')) {
        const filterUsername = filter.replace('assignee:@', '');
        shouldActivate = filterUsername === value;
      } else if (type === 'author' && filter.startsWith('author:@')) {
        const filterUsername = filter.replace('author:@', '');
        shouldActivate = filterUsername === value;
      } else if (type === 'milestone' && filter.startsWith('milestone_title:')) {
        const filterMilestone = filter.replace('milestone_title:', '');
        shouldActivate = filterMilestone === value;
        console.log(`    🎯 Milestone comparison: "${filterMilestone}" === "${value}" = ${shouldActivate}`);
      } else if (type === 'label' && filter.startsWith('label:"') && filter.endsWith('"')) {
        const filterLabel = filter.slice(7, -1); // 去掉 label:" 和最后的 "
        shouldActivate = filterLabel === value;
      }
      
      if (shouldActivate) {
        console.log(`  ✅ Activating filter: ${filter}`);
        item.classList.add('active');
        const input = item.querySelector('input[type="checkbox"], input[type="radio"]');
        if (input) input.checked = true;
        this.activeFilters.add(filter);
      }
    });
  }

  // 处理重置过滤器
  handleResetFilters() {
    console.log('🔄 Resetting all filters');
    
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
    this.resetFiltersViaUrl();
  }

  // 通过URL参数重置过滤器
  resetFiltersViaUrl() {
    const url = new URL(window.location.href);
    
    // 清除所有过滤参数
    url.searchParams.delete('assignee_username');
    url.searchParams.delete('author_username');
    url.searchParams.delete('milestone_title');
    url.searchParams.delete('label_name');
    url.searchParams.delete('label_name[]');
    
    // 重新加载页面
    console.log('🌐 Resetting to:', url.toString());
    window.location.href = url.toString();
  }

  // 激活默认过滤器（在取消所有多选项时调用）
  activateDefaultFilter() {
    // 由于删除了"全部"选项，这里不需要激活任何选项
    // 只是确保所有过滤器都被清除
    this.activeFilters.clear();
  }

  // 处理分组折叠/展开
  handleGroupToggle(header) {
    const group = header.closest('.filter-group');
    if (group) {
      const groupId = group.getAttribute('data-group-id');
      
      // 默认展开的分组不允许折叠
      const defaultExpandedGroups = ['milestone', 'assignee'];
      if (defaultExpandedGroups.includes(groupId)) {
        return;
      }
      
      group.classList.toggle('collapsed');
      
      // 保存折叠状态到本地存储
      const isCollapsed = group.classList.contains('collapsed');
      this.saveGroupCollapsedState(groupId, isCollapsed);
    }
  }

  // 保存分组折叠状态
  saveGroupCollapsedState(groupId, isCollapsed) {
    // 默认展开的分组不保存折叠状态
    const defaultExpandedGroups = ['milestone', 'assignee'];
    if (defaultExpandedGroups.includes(groupId)) {
      return;
    }
  
    try {
      const key = 'gitlab-board-plus-group-collapsed-states';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      states[groupId] = isCollapsed;
      localStorage.setItem(key, JSON.stringify(states));
    } catch (error) {
      console.error('❌ Error saving group collapsed state:', error);
    }
  }

  // 恢复分组折叠状态
  restoreGroupCollapsedStates() {
    try {
      const key = 'gitlab-board-plus-group-collapsed-states';
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      
      // 默认展开的分组列表
      const defaultExpandedGroups = ['milestone', 'assignee'];
      
      Object.entries(states).forEach(([groupId, isCollapsed]) => {
        // 如果是默认展开的分组，强制展开
        if (defaultExpandedGroups.includes(groupId)) {
          const group = this.container.querySelector(`[data-group-id="${groupId}"]`);
          if (group) {
            group.classList.remove('collapsed');
          }
          return;
        }
        
        // 其他分组按照保存的状态处理
        if (isCollapsed) {
          const group = this.container.querySelector(`[data-group-id="${groupId}"]`);
          if (group) {
            group.classList.add('collapsed');
          }
        }
      });
    } catch (error) {
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
    console.log('🧪 Testing URL parameter handling...');
    
    // 测试多条件组合的URL
    const testUrl = new URL('https://gitlab.example.com/boards/123?assignee_username=xiaojiezhi-jk&milestone_title=2025-07-03&label_name%5B%5D=bug&label_name%5B%5D=feature');
    
    console.log('Test URL with multiple filters:', testUrl.toString());
    console.log('Assignee:', testUrl.searchParams.get('assignee_username'));
    console.log('Author:', testUrl.searchParams.get('author_username'));
    console.log('Milestone:', testUrl.searchParams.get('milestone_title'));
    console.log('Labels:', testUrl.searchParams.getAll('label_name[]'));
    
         // 测试反向过程：从多个过滤器生成URL
     const testFilters = [
       'assignee:@xiaojiezhi-jk',
       'milestone_title:2025-07-03',
       'label:"bug"',
       'label:"feature"',
       'label:"enhancement"'
     ];
    
    const newUrl = new URL('https://gitlab.example.com/boards/123');
    console.log('🔗 Building URL from multiple filters:', testFilters);
    
    testFilters.forEach(filter => {
      this.addFilterToUrl(newUrl, filter);
    });
    
    console.log('Generated URL with multiple conditions:', newUrl.toString());
    console.log('Generated assignee:', newUrl.searchParams.get('assignee_username'));
    console.log('Generated author:', newUrl.searchParams.get('author_username'));
    console.log('Generated milestone:', newUrl.searchParams.get('milestone_title'));
    console.log('Generated labels:', newUrl.searchParams.getAll('label_name[]'));
    
    // 测试各种组合场景
    console.log('🧪 Testing various filter combinations:');
    
    // 场景1：只有指派人
    const url1 = new URL('https://gitlab.example.com/boards/123');
    this.addFilterToUrl(url1, 'assignee:@user1');
    console.log('  只有指派人:', url1.search);
    
    // 场景2：指派人 + 里程碑
    const url2 = new URL('https://gitlab.example.com/boards/123');
    this.addFilterToUrl(url2, 'assignee:@user1');
    this.addFilterToUrl(url2, 'milestone:"Sprint 1"');
    console.log('  指派人 + 里程碑:', url2.search);
    
         // 场景3：指派人 + 里程碑（单选） + 多个标签
     const url3 = new URL('https://gitlab.example.com/boards/123');
     this.addFilterToUrl(url3, 'assignee:@user1');
     this.addFilterToUrl(url3, 'milestone:"Sprint 1"');
     this.addFilterToUrl(url3, 'label:"bug"');
     this.addFilterToUrl(url3, 'label:"priority::high"');
     console.log('  指派人 + 里程碑（单选） + 多标签:', url3.search);
    
    // 场景4：创建人 + 里程碑 + 标签
    const url4 = new URL('https://gitlab.example.com/boards/123');
    this.addFilterToUrl(url4, 'author:@author1');
    this.addFilterToUrl(url4, 'milestone:"Release 2.0"');
    this.addFilterToUrl(url4, 'label:"feature"');
    console.log('  创建人 + 里程碑 + 标签:', url4.search);
  }
}

// 导出过滤管理器类
window.FiltersShortcutsManager = FiltersShortcutsManager; 