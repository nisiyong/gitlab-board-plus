// GitLab Board Plus - 内容脚本入口
console.log('🚀 GitLab Board Plus content script entry loaded');

// 动态加载所有模块
async function loadModules() {
  try {
    // 按依赖顺序加载模块
    const modules = [
      'utils.js',           // 工具函数，其他模块会依赖
      'filters-manager.js', // 过滤管理器
      'board-enhancer.js',  // Board增强器
      'content-main.js'     // 主入口文件，会初始化整个应用
    ];
    
    for (const module of modules) {
      await loadScript(chrome.runtime.getURL(`src/content/${module}`));
      console.log(`✅ Loaded module: ${module}`);
    }
    
    console.log('🎉 All modules loaded successfully');
  } catch (error) {
    console.error('❌ Error loading modules:', error);
  }
}

// 加载脚本的辅助函数
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 开始加载模块
loadModules();