// 修复HTML文件的脚本
const fs = require('fs');

const htmlContent = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>IEclub - 跨学科交流平台</title><meta name="description" content="IEClub是一个专注于创新创业的智能匹配社区平台"><meta name="keywords" content="创新创业,供需匹配,智能推荐,社区交流"><link rel="icon" href="/favicon.ico"><script defer="defer" src="/js/runtime.497af8cb.js"></script><script defer="defer" src="/js/react.05de08ce.js"></script><script defer="defer" src="/js/taro-core-319595b3.72254724.js"></script><script defer="defer" src="/js/taro-core-7a5d1f5f.df3ab50c.js"></script><script defer="defer" src="/js/taro-core-c28397b0.100800a6.js"></script><script defer="defer" src="/js/taro-core-f1efd973.833b17ff.js"></script><script defer="defer" src="/js/taro-core-b95524d6.b5a1ea9f.js"></script><script defer="defer" src="/js/taro-core-9bf9508d.85539477.js"></script><script defer="defer" src="/js/taro-core-50dd44f6.abb953f1.js"></script><script defer="defer" src="/js/taro-core-9db987d8.6801d36f.js"></script><script defer="defer" src="/js/vendors-cdd60c62.4b17c297.js"></script><script defer="defer" src="/js/vendors-d2eb5610.0062e255.js"></script><script defer="defer" src="/js/vendors-efdee510.bfb83612.js"></script><script defer="defer" src="/js/vendors-576564bd.ac7df780.js"></script><script defer="defer" src="/js/vendors-54b7325c.3b7e6ebd.js"></script><script defer="defer" src="/js/vendors-c958bf25.cf197ebc.js"></script><script defer="defer" src="/js/vendors-38822fa6.b18cceff.js"></script><script defer="defer" src="/js/vendors-91c40cd8.116e6f18.js"></script><script defer="defer" src="/js/vendors-5a94f17d.de96070b.js"></script><script defer="defer" src="/js/vendors-1632a00e.c4263caf.js"></script><script defer="defer" src="/js/vendors-8b0ce7ab.45d14543.js"></script><script defer="defer" src="/js/vendors-496eacfb.32720db8.js"></script><script defer="defer" src="/js/vendors-53f2243b.44a57b12.js"></script><script defer="defer" src="/js/vendors-ee28a12e.b939305d.js"></script><script defer="defer" src="/js/vendors-cbcbeb49.85a890e6.js"></script><script defer="defer" src="/js/vendors-ba1f3909.839d0d67.js"></script><script defer="defer" src="/js/vendors-6f5a8aef.31a19f5c.js"></script><script defer="defer" src="/js/vendors-e2cfc2eb.3d6c2cb6.js"></script><script defer="defer" src="/js/vendors-b4670495.c382b730.js"></script><script defer="defer" src="/js/vendors-0ce31e99.91dd5d27.js"></script><script defer="defer" src="/js/vendors-d6f79a98.afaa268d.js"></script><script defer="defer" src="/js/vendors-641b5ac7.68c83570.js"></script><script defer="defer" src="/js/vendors-f8bdc448.42f270ae.js"></script><script defer="defer" src="/js/vendors-b8f562c7.1d4e15c7.js"></script><script defer="defer" src="/js/vendors-c7ad54ce.08366707.js"></script><script defer="defer" src="/js/vendors-c8c1c456.764147f0.js"></script><script defer="dear" src="/js/vendors-65a02140.d9161b70.js"></script><script defer="defer" src="/js/vendors-66f4352d.c10c5822.js"></script><script defer="defer" src="/js/vendors-618b4776.98a5a496.js"></script><script defer="defer" src="/js/vendors-2e31d74a.d065437c.js"></script><script defer="defer" src="/js/vendors-866ab763.fbf7c7b6.js"></script><script defer="defer" src="/js/vendors-9bcc98e7.9674aa97.js"></script><script defer="defer" src="/js/app.2d4201cf.js"></script><link href="/css/styles.css" rel="stylesheet"></head><body><div id="app"></div><div id="loading" style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 14px; color: #999;">加载中...</div><script>
// 修复Taro H5路由问题
(function() {
  console.log('🔧 开始修复Taro路由...');
  
  // 等待所有脚本加载完成
  function waitForTaro() {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      function check() {
        attempts++;
        
        // 检查Taro是否已加载
        if (window.Taro || window.__taroAppConfig) {
          console.log('✅ Taro已加载，尝试初始化路由...');
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ Taro加载超时，尝试强制初始化...');
          resolve();
          return;
        }
        
        setTimeout(check, 100);
      }
      
      check();
    });
  }
  
  // 强制加载页面组件
  function forceLoadPage() {
    const currentPath = window.location.pathname;
    console.log('🔗 当前路径:', currentPath);
    
    // 根据路径加载对应的chunk
    const pageChunks = {
      '/': '/js/9339.b1505981.chunk.js',
      '/pages/square/index': '/js/9339.b1505981.chunk.js',
      '/pages/community/index': '/js/3521.17f6674f.chunk.js',
      '/pages/publish/index': '/js/8287.e3eafc2d.chunk.js',
      '/pages/activities/index': '/js/7061.99d12ee8.chunk.js',
      '/pages/profile/index': '/js/3265.cf9c4a4a.chunk.js'
    };
    
    const chunkPath = pageChunks[currentPath] || pageChunks['/'];
    
    if (chunkPath) {
      console.log('📦 加载页面chunk:', chunkPath);
      const script = document.createElement('script');
      script.src = chunkPath;
      script.onload = () => {
        console.log('✅ 页面chunk加载成功');
        // 尝试触发路由更新
        setTimeout(() => {
          if (window.history) {
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, 100);
      };
      script.onerror = () => {
        console.error('❌ 页面chunk加载失败');
      };
      document.head.appendChild(script);
    }
  }
  
  // 应用加载后隐藏 loading
  window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM加载完成');
    
    waitForTaro().then(() => {
      // 延迟加载页面组件
      setTimeout(() => {
        forceLoadPage();
      }, 500);
      
      // 隐藏loading
      setTimeout(function() {
        var loading = document.getElementById('loading');
        if (loading) {
          loading.style.display = 'none';
          console.log('🎯 Loading已隐藏');
        }
      }, 1000);
    });
  });

  // 确保 React 18 渲染容器存在
  if (!document.getElementById('app')) {
    var appDiv = document.createElement('div');
    appDiv.id = 'app';
    appDiv.style.width = '100%';
    appDiv.style.height = '100%';
    document.body.appendChild(appDiv);
    console.log('Created #app container for React 18');
  }
})();
</script></body></html>`;

console.log(htmlContent);
