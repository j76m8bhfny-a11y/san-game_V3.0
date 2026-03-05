import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// 引入全局样式 (包含了你的像素字体和 Tailwind)
import "./index.css";

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