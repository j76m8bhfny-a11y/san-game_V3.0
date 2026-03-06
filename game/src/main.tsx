import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// 引入全局样式 (包含了你的像素字体和 Tailwind)
import "./index.css";

// ✅ 全局未捕获 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 未处理的 Promise 错误:', event.reason);
  // 防止错误上报服务重复记录
  event.preventDefault();
  
  // 生产环境可以接入错误上报服务（如 Sentry）
  // if (import.meta.env.PROD) {
  //   reportError(event.reason, 'unhandledrejection');
  // }
});

// ✅ 全局 JS 错误捕获
window.addEventListener('error', (event) => {
  console.error('🔴 全局 JS 错误:', event.error);
  event.preventDefault();
});

// ✅ 注册Service Worker（PWA离线支持）
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] 注册成功:', registration.scope);
        
        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] 发现新版本，刷新页面以更新');
                // 可以在这里显示更新提示
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('[SW] 注册失败:', error);
      });
  });
}

// 字体加载检测
const checkFontLoaded = () => {
  return document.fonts.load('1em "PixelFont"')
    .then(() => {
      console.log('✅ PixelFont (Zpix) loaded successfully');
      document.documentElement.classList.add('fonts-loaded');
      document.documentElement.classList.remove('fonts-loading');
      document.documentElement.setAttribute('data-font-loaded', 'true');
    })
    .catch(() => {
      console.warn('⚠️ PixelFont failed to load, using fallback');
      document.documentElement.classList.add('fonts-loaded');
      document.documentElement.classList.remove('fonts-loading');
    });
};

// 初始状态：添加加载中类
document.documentElement.classList.add('fonts-loading');

// 等待字体加载
Promise.race([
  checkFontLoaded(),
  new Promise(resolve => setTimeout(resolve, 3000)) // 最多等待3秒
]).then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});