import React from "react";
import ReactDOM from "react-dom/client";
import { LazyMotion, domAnimation } from "framer-motion";
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

// ========================================
// 视觉/渲染质量调试工具
// ========================================
// Window.debug 类型在 debugTools.ts 中定义

// 挂载视觉检查工具到 window.debug（在 debugTools 初始化后执行）
const tools = {
  // 检查像素渲染设置
  checkPixelRendering: () => {
    const issues = [];
    const html = document.documentElement;
    const htmlStyle = window.getComputedStyle(html);
    
    const fontSmoothing = (htmlStyle as any).webkitFontSmoothing;
    if (fontSmoothing !== 'none') {
      issues.push({
        element: 'html',
        issue: '抗锯齿未禁用',
        current: fontSmoothing,
        expected: 'none'
      });
    }
    
    // 检查图片渲染
    document.querySelectorAll<HTMLImageElement>('img[src*=".png"]').forEach(img => {
      const style = window.getComputedStyle(img);
      if (!style.imageRendering.includes('pixelated') && !style.imageRendering.includes('crisp-edges')) {
        issues.push({
          element: img.src?.slice(-30) || 'unknown',
          issue: '像素艺术未禁用双线性插值',
          fix: '添加 class="render-pixelated"'
        });
      }
    });
    
    return issues.length === 0 ? '✅ 像素渲染检查通过' : issues;
  },
  
  // 检查Zpix字体
  checkZpixFont: async () => {
    const results: any = {
      fontName: 'PixelFont',
      loaded: false,
      loadTime: 0,
      fallbackActive: false,
      issues: []
    };
    
    const start = performance.now();
    
    try {
      await document.fonts.load('16px PixelFont');
      results.loadTime = performance.now() - start;
      results.loaded = document.fonts.check('16px PixelFont');
      
      if (!results.loaded) {
        results.issues.push({ type: 'FONT_NOT_LOADED', severity: 'critical' });
      }
    } catch (e: any) {
      results.issues.push({ type: 'FONT_LOAD_ERROR', error: e.message });
    }
    
    // 检查实际渲染字体
    const testEl = document.createElement('span');
    testEl.style.fontFamily = 'PixelFont, monospace';
    testEl.style.fontSize = '16px';
    testEl.textContent = '测试';
    document.body.appendChild(testEl);
    
    const computedFont = window.getComputedStyle(testEl).fontFamily;
    document.body.removeChild(testEl);
    
    if (!computedFont.includes('PixelFont')) {
      results.fallbackActive = true;
      results.issues.push({
        type: 'FALLBACK_FONT_ACTIVE',
        rendered: computedFont,
        impact: '像素风格丢失'
      });
    }
    
    return results;
  },
  
  // 检查Tailwind像素合规
  checkTailwindCompliance: () => {
    const forbiddenPatterns = [
      { pattern: /rounded-(full|lg|xl|2xl|3xl)/, reason: '像素风格禁止大圆角', suggest: '使用rounded-none或rounded-sm' },
      { pattern: /shadow-(lg|xl|2xl|inner)/, reason: '像素风格禁止大阴影', suggest: '使用shadow-none或shadow-pixel' },
      { pattern: /backdrop-blur/, reason: '像素风格禁止模糊效果', suggest: '使用backdrop-solid' },
      { pattern: /bg-gradient/, reason: '谨慎使用渐变', suggest: '使用纯色' },
    ];
    
    const issues: any[] = [];
    
    document.querySelectorAll('*').forEach(el => {
      const className = el.className;
      if (typeof className !== 'string') return;
      
      forbiddenPatterns.forEach(({ pattern, reason, suggest }) => {
        if (pattern.test(className)) {
          issues.push({
            element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + 
                     (el.className ? '.' + el.className.split(' ')[0] : ''),
            classViolation: className.match(pattern)?.[0],
            reason,
            suggest
          });
        }
      });
    });
    
    return {
      status: issues.length === 0 ? 'PASS' : 'VIOLATIONS_FOUND',
      violations: issues.slice(0, 20),
      totalViolations: issues.length
    };
  },
  
  // 检查系统缩放
  checkSystemScaling: () => {
    const dpr = window.devicePixelRatio;
    const isStandardScale = [1, 1.25, 1.5, 1.75, 2].some(
      s => Math.abs(dpr - s) < 0.05
    );
    
    return {
      dpr,
      isStandardScale,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      recommendation: isStandardScale 
        ? '正常' 
        : '非标准缩放比例，建议使用整数倍缩放以获得最佳像素效果'
    };
  },
  
  // 综合检查
  runVisualAudit: async () => {
    console.group('🔍 视觉/渲染质量完整检查');
    
    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      dpr: window.devicePixelRatio,
      
      checks: {
        pixelRendering: (window as any).debug?.checkPixelRendering?.(),
        zpixFont: await (window as any).debug?.checkZpixFont?.(),
        tailwindCompliance: (window as any).debug?.checkTailwindCompliance?.(),
        systemScaling: (window as any).debug?.checkSystemScaling?.()
      }
    };
    
    console.log('检查报告:', report);
    console.groupEnd();
    
    return report;
  }
};

// 合并到 window.debug（在 debugTools 之后执行）
if (window.debug) {
  Object.assign(window.debug, tools);
} else {
  (window as any).debug = tools;
}

// 等待字体加载
Promise.race([
  checkFontLoaded(),
  new Promise(resolve => setTimeout(resolve, 3000)) // 最多等待3秒
]).then(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <LazyMotion features={domAnimation} strict>
        <App />
      </LazyMotion>
    </React.StrictMode>
  );
  
  // 开发环境自动运行检查
  if (import.meta.env.DEV) {
    console.log('💡 提示: 在控制台运行 window.debug.runVisualAudit() 进行视觉质量检查');
  }
});