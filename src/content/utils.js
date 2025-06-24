// GitLab Board Plus - 工具函数
console.log('🔧 GitLab Board Plus utils loaded');

// 用户信息和数据提取工具类
class GitLabUtils {
  // 获取当前用户
  static getCurrentUser() {
    try {
      // 尝试从多个地方获取当前用户信息
      let username = null;
      let avatarUrl = null;
      let name = null;
      
      // 方法1: 从页面的 gon 对象获取（GitLab 的全局对象）
      if (window.gon && window.gon.current_username) {
        username = window.gon.current_username;
        name = window.gon.current_user_fullname || username;
        avatarUrl = window.gon.current_user_avatar_url;
        console.log(`✅ Found current user from gon: ${username}`);
      }
      
      // 方法2: 从用户菜单获取
      if (!username) {
        const userMenu = document.querySelector('[data-qa-selector="user_menu"]') ||
                        document.querySelector('.header-user-dropdown-toggle') ||
                        document.querySelector('.user-menu') ||
                        document.querySelector('.navbar-nav .dropdown');
        
        if (userMenu) {
          // 尝试从用户头像获取信息
          const userImg = userMenu.querySelector('img');
          if (userImg) {
            avatarUrl = userImg.src;
            username = userImg.getAttribute('data-username') || 
                      userImg.getAttribute('data-user') ||
                      userImg.alt;
            name = userImg.getAttribute('title') || userImg.alt;
          }
          
          // 尝试从链接href获取用户名
          if (!username) {
            const userLink = userMenu.querySelector('a[href*="/"]');
            if (userLink) {
              const href = userLink.getAttribute('href');
              const userMatch = href.match(/\/([^\/]+)$/);
              if (userMatch && userMatch[1] && !userMatch[1].includes('.')) {
                username = userMatch[1];
                name = userLink.textContent.trim() || username;
              }
            }
          }
          
          if (username) {
            console.log(`✅ Found current user from user menu: ${username}`);
          }
        }
      }
      
      // 方法3: 从页面的 data 属性获取
      if (!username) {
        const bodyData = document.body.dataset;
        if (bodyData.user || bodyData.username) {
          username = bodyData.user || bodyData.username;
          console.log(`✅ Found current user from body data: ${username}`);
        }
      }
      
      // 方法4: 从 meta 标签获取
      if (!username) {
        const userMeta = document.querySelector('meta[name="user-login"]') ||
                        document.querySelector('meta[name="current-user"]') ||
                        document.querySelector('meta[name="current-user-id"]');
        if (userMeta) {
          username = userMeta.getAttribute('content');
          console.log(`✅ Found current user from meta: ${username}`);
        }
      }
      
      // 方法5: 从当前URL路径尝试提取（如果在用户profile页面）
      if (!username) {
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/users/')) {
          const userMatch = currentPath.match(/\/users\/([^\/]+)/);
          if (userMatch && userMatch[1]) {
            username = userMatch[1];
            console.log(`✅ Found current user from URL path: ${username}`);
          }
        }
      }
      
      if (username) {
        // 返回完整的用户对象
        const userObj = {
          username,
          name: name || username,
          avatarUrl
        };
        
        // 为了向后兼容，设置一个username属性到返回对象上
        userObj.toString = () => username;
        Object.defineProperty(userObj, 'valueOf', {
          value: () => username,
          enumerable: false
        });
        
        return userObj;
      }
      
      console.warn('❌ Could not determine current user from any source');
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  // 从页面提取成员信息
  static async extractMembersFromPage() {
    try {
      // 使用Map来存储成员信息，避免Set无法正确去重对象的问题
      const membersMap = new Map();
      
      // 方法1: 从已有的issue卡片中提取指派人信息
      const assigneeElements = document.querySelectorAll('[data-testid="assignee-avatar"], .board-card-assignee img, .assignee-avatar img');
      assigneeElements.forEach(el => {
        const username = el.getAttribute('data-username') || 
                        el.getAttribute('data-user-id') ||
                        el.getAttribute('alt')?.match(/@(\w+)/)?.[1];
        const name = el.getAttribute('alt') || el.getAttribute('title');
        if (username && !membersMap.has(username)) {
          membersMap.set(username, { username, name: name || username });
        }
      });
      
      // 方法2: 从用户头像和链接中提取
      const userLinks = document.querySelectorAll('a[href*="/users/"], a[href*="/-/user/"]');
      userLinks.forEach(link => {
        const href = link.getAttribute('href');
        const match = href.match(/\/users\/([^\/\?]+)/);
        if (match) {
          const username = match[1];
          const name = link.textContent.trim() || link.getAttribute('title');
          if (!membersMap.has(username)) {
            membersMap.set(username, { username, name: name || username });
          }
        }
      });
      
      // 方法3: 从GitLab的assignee dropdown中提取（如果存在）
      const assigneeOptions = document.querySelectorAll('[data-testid="assignee-dropdown"] .gl-dropdown-item, .assignee-dropdown .dropdown-item');
      assigneeOptions.forEach(option => {
        const username = option.getAttribute('data-username') || 
                        option.querySelector('[data-username]')?.getAttribute('data-username');
        const name = option.textContent.trim();
        if (username && !membersMap.has(username)) {
          membersMap.set(username, { username, name: name || username });
        }
      });
      
      const members = Array.from(membersMap.values());
      console.log(`✅ Extracted ${members.length} members from page:`, members);
      
      return members;
      
    } catch (error) {
      console.error('❌ Error extracting members from page:', error);
      return [];
    }
  }

  // 从页面提取里程碑信息
  static async extractMilestonesFromPage() {
    try {
      const milestones = new Set();
      
      // 从issue卡片中提取里程碑信息
      const milestoneElements = document.querySelectorAll('[data-testid="milestone-title"], .milestone-title');
      milestoneElements.forEach(el => {
        const title = el.textContent.trim();
        if (title) {
          milestones.add({ id: title, title });
        }
      });
      
      return Array.from(milestones);
      
    } catch (error) {
      console.error('❌ Error extracting milestones from page:', error);
      return [];
    }
  }

  // 从页面提取标签信息
  static async extractLabelsFromPage() {
    try {
      const labels = new Set();
      
      // 从issue卡片中提取标签信息
      const labelElements = document.querySelectorAll('.label, [data-testid="label"]');
      labelElements.forEach(el => {
        const name = el.textContent.trim();
        const color = el.style.backgroundColor || el.getAttribute('data-color');
        if (name) {
          labels.add({ name, color });
        }
      });
      
      return Array.from(labels);
      
    } catch (error) {
      console.error('❌ Error extracting labels from page:', error);
      return [];
    }
  }

  // 获取搜索输入框
  static getSearchInput() {
    // 尝试多种选择器来找到搜索输入框
    const selectors = [
      '[data-testid="issue-board-filtered-search"] input',
      '.filtered-search-input-container input',
      '.filtered-search input',
      '.gl-filtered-search-input',
      'input[placeholder*="Search"]',
      'input[placeholder*="Filter"]'
    ];
    
    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input) {
        console.log(`✅ Found search input with selector: ${selector}`);
        return input;
      }
    }
    
    console.warn('❌ Search input not found');
    return null;
  }

  // 应用搜索过滤
  static applySearchFilter(searchInput, filterQuery) {
    try {
      console.log(`🔍 Applying search filter: "${filterQuery}"`);
      
      // 清空当前搜索内容
      searchInput.value = '';
      
      // 触发 input 事件清空之前的搜索
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // 如果有过滤查询，应用它
      if (filterQuery) {
        // 延迟一点时间确保清空操作完成
        setTimeout(() => {
          // 设置新的搜索值
          searchInput.value = filterQuery;
          
          // 触发多种事件来确保搜索生效
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // 模拟按 Enter 键提交搜索
          setTimeout(() => {
            searchInput.dispatchEvent(new KeyboardEvent('keydown', { 
              key: 'Enter', 
              keyCode: 13, 
              bubbles: true 
            }));
            searchInput.dispatchEvent(new KeyboardEvent('keyup', { 
              key: 'Enter', 
              keyCode: 13, 
              bubbles: true 
            }));
          }, 100);
        }, 200);
      }
      
      console.log(`✅ Search filter applied successfully`);
    } catch (error) {
      console.error('❌ Error applying search filter:', error);
    }
  }

  // 显示过滤反馈
  static showFilterFeedback(filterQuery) {
    // 查找或创建反馈元素
    let feedback = document.querySelector('.filter-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'filter-feedback';
      
      // 将反馈插入到搜索区域
      const searchSection = document.querySelector('.gitlab-board-plus-search-section');
      if (searchSection) {
        searchSection.appendChild(feedback);
      }
    }
    
    // 设置反馈内容
    if (filterQuery) {
      feedback.innerHTML = `
        <span class="feedback-icon">🔍</span>
        <span class="feedback-text">已应用过滤: <strong>${filterQuery}</strong></span>
        <button class="feedback-close" onclick="this.parentElement.style.display='none'">×</button>
      `;
      feedback.style.display = 'flex';
      
      // 3秒后自动隐藏
      setTimeout(() => {
        if (feedback) {
          feedback.style.display = 'none';
        }
      }, 3000);
    } else {
      feedback.innerHTML = `
        <span class="feedback-icon">✨</span>
        <span class="feedback-text">已清除所有过滤条件</span>
        <button class="feedback-close" onclick="this.parentElement.style.display='none'">×</button>
      `;
      feedback.style.display = 'flex';
      
      // 2秒后自动隐藏
      setTimeout(() => {
        if (feedback) {
          feedback.style.display = 'none';
        }
      }, 2000);
    }
  }

  // 检查是否逾期
  static isOverdue(card) {
    const dueDateElement = card.querySelector('.board-card-due-date');
    if (!dueDateElement) return false;
    
    const dueDate = new Date(dueDateElement.textContent);
    return dueDate < new Date();
  }

  // 清除过滤相关的URL参数
  static clearFilterParams(url) {
    // GitLab boards 页面常用的过滤参数
    const filterParams = [
      'assignee_username',
      'assignee_id', 
      'author_username',
      'author_id',
      'milestone_title',
      'label_name',
      'search',
      'state',
      'scope',
      'sort'
    ];
    
    filterParams.forEach(param => {
      url.searchParams.delete(param);
    });
  }

  // 提取项目 ID
  static extractProjectId() {
    const match = window.location.pathname.match(/^\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : null;
  }

  // 获取当前 Board ID
  static getCurrentBoardId() {
    const match = window.location.pathname.match(/\/boards\/(\d+)/);
    return match ? match[1] : null;
  }

  // 通过 GraphQL API 获取项目成员
  static async fetchProjectMembersFromAPI() {
    try {
      const projectId = this.extractProjectId();
      if (!projectId) {
        console.warn('❌ Could not extract project ID');
        return [];
      }

      const csrfToken = this.getCSRFToken();
      if (!csrfToken) {
        console.warn('❌ Could not get CSRF token');
        return [];
      }

      // 构建 GraphQL 请求
      const query = {
        operationName: "searchUsers",
        variables: {
          isProject: true,
          fullPath: projectId,
          search: ""
        },
        query: `query searchUsers($fullPath: ID!, $search: String, $isProject: Boolean = false) {
          group(fullPath: $fullPath) @skip(if: $isProject) {
            id
            groupMembers(
              search: $search
              relations: [DIRECT, INHERITED, SHARED_FROM_GROUPS]
            ) {
              nodes {
                id
                user {
                  ...User
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          project(fullPath: $fullPath) @include(if: $isProject) {
            id
            projectMembers(search: $search, relations: [DIRECT, INHERITED, INVITED_GROUPS]) {
              nodes {
                id
                user {
                  ...User
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
        }

        fragment User on User {
          id
          avatarUrl
          name
          username
          __typename
        }`
      };

      // 发送 GraphQL 请求
      const response = await fetch(`${window.location.origin}/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify([query])
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data[0]?.data?.project?.projectMembers?.nodes) {
        const members = data[0].data.project.projectMembers.nodes.map(node => ({
          id: node.user.id,
          username: node.user.username,
          name: node.user.name,
          avatarUrl: node.user.avatarUrl
        }));

        console.log(`✅ Fetched ${members.length} project members from API:`, members);
        return members;
      } else {
        console.warn('❌ No project members data found in API response');
        return [];
      }

    } catch (error) {
      console.error('❌ Error fetching project members from API:', error);
      // 如果 API 调用失败，回退到页面提取方法
      return this.extractMembersFromPage();
    }
  }

  // 获取 CSRF Token
  static getCSRFToken() {
    try {
      // 方法1: 从 meta 标签获取
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta) {
        const token = csrfMeta.getAttribute('content');
        console.log('✅ Found CSRF token from meta tag');
        return token;
      }

      // 方法2: 从页面的 gon 对象获取
      if (window.gon && window.gon.api_token) {
        console.log('✅ Found CSRF token from gon object');
        return window.gon.api_token;
      }

      // 方法3: 从现有的 AJAX 请求头中获取
      const ajaxSetup = window.jQuery && window.jQuery.ajaxSetup;
      if (ajaxSetup && ajaxSetup().headers && ajaxSetup().headers['X-CSRF-Token']) {
        console.log('✅ Found CSRF token from jQuery AJAX setup');
        return ajaxSetup().headers['X-CSRF-Token'];
      }

      console.warn('❌ Could not find CSRF token from any source');
      return null;
    } catch (error) {
      console.error('❌ Error getting CSRF token:', error);
      return null;
    }
  }
}

// 导出工具类
window.GitLabUtils = GitLabUtils; 