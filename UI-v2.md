

# 📑 美式灵视 UI 设计母盘 (Ver 7.0 Material Edition)

> **版本信息**：Ver 7.0 (Material / Digital Archaeology)
> **设计核心**：**“数字考古” (Digital Archaeology)**
> **核心隐喻**：玩家是通过一台老旧的军用终端，在翻阅真实的、物理存在的历史切片。每一个界面都对应特定的物质介质：皱巴巴的热敏纸、Web 1.0 的粗糙网页、微缩胶片的颗粒感。

---

### 1. 核心 UI 架构图 (Master UI Flowchart)

采用严格的 Z-Index 层级管理，模拟“物理堆叠”的感觉。

```mermaid
graph TD
    subgraph L0_Canvas [L0: 底层画布 z-0]
        Bg[Canvas: 动态视差场景 LayeredScene]
    end

    subgraph L1_HUD [L1: 主控台 z-10]
        HUD_Top[顶部状态栏 MiniHUD]
        HUD_Bot[底部终端 MessageWindow]
    end

    subgraph L2_Windows [L2: 功能介质 z-20]
        Shop[商店: Web 1.0 浏览器窗口]
        Archive[黑匣子: 微缩胶片阅读器]
        Ending[结局: 拍立得/报纸]
        Pause[系统菜单: DOS 弹窗]
    end

    subgraph L3_Overlay [L3: 材质覆盖层 z-30]
        Bill[账单: 热敏打印纸 (Receipt)]
    end

    subgraph L4_Feedback [L4: 反馈层 z-40]
        Toast[像素飘字 Feedback]
    end

    subgraph L5_Global [L5: 屏幕滤镜 z-50]
        Atmosphere[CRT 扫描线 & 噪点]
        Tooltip[L6: 鼠标提示 Tooltip]
    end

    Bg --> L1_HUD
    L1_HUD --> L2_Windows
    L1_HUD --> L3_Overlay
    L3_Overlay --> L4_Feedback
    L4_Feedback --> L5_Global

```

---

### 2. 全量 UI 组件清单 (Component Manifest)

| 层级 | 组件名 | Z-Index | 视觉隐喻 (Metaphor) | 关键交互 |
| --- | --- | --- | --- | --- |
| **L6** | **TooltipLayer** | 60 | **Debug 浮窗**：半透明黑底，绿色代码字，系统底层数据的即视感。 | 跟随鼠标，解释专有名词。 |
| **L5** | **GlobalAtmosphere** | 50 | **旧显示器玻璃**：扫描线、暗角、低 SAN 时的色彩信号失真。 | 穿透点击，全屏覆盖。 |
| **L4** | **FeedbackLayer** | 40 | **街机得分**：粗像素字体，高对比度，伴随“跳动”动画。 | 数值变动时触发。 |
| **L3** | **BillOverlay** | 30 | **热敏收银纸**：边缘锯齿状撕裂，皱巴巴的纸张纹理，红色印章。 | 突脸弹出，必须处理才能继续。 |
| **L2** | **ShopModal** | 20 | **Web 1.0 (Win98)**：灰色立体边框，蓝色链接，甚至有 `<marquee>` 滚动条。 | 窗口化操作，模拟老式网购。 |
| **L2** | **BlackBox** | 20 | **微缩胶片**：青冷色背光，噪点极高，黑白高反差照片。 | 点击查看详情，伴随机械音效。 |
| **L1** | **MessageWindow** | 10 | **终端控制台**：深色点阵纹理背景，像素边框，打字机效果。 | 底部常驻，核心操作区。 |
| **L1** | **MiniHUD** | 10 | **LCD 液晶屏**：顶部悬浮，显示 HP/SAN/金钱。 | 简洁数字跳动。 |
| **L1** | **LayeredScene** | 0 | **记忆回溯**：PC98 风格插画，三层视差 (背景/事件/玩家)。 | 呼吸动画，随 SAN 值崩坏。 |
| **L0** | **AppContainer** | - | **外壳**：负责整体背景色和字体定义。 | - |

---

### 3. 视觉与交互规范 (Visual Specifications)

#### [L1] 主游戏界面 (LayeredScene + HUD)

* **场景层**：
* **视差逻辑**：背景层极慢速平移，事件层（如警察）有独立的呼吸动画，前景层（玩家背影）位于左下角，有独立的呼吸节奏。
* **SAN值影响**：低 SAN 时，事件层贴图替换为 Glitch 版本，色盘从暖色突变为病态紫/荧光绿。


* **控制台 (HUD)**：
* **材质**：背景使用 `#020410` (接近黑的蓝) + `2px` 间距的点阵纹理叠加。
* **按钮**：
* *Normal*: 透明底，青色像素边框，Hover 时反色。
* *Awakened (D选项)*: 红色字体，边框带有故障抖动，文案可能是乱码。





#### [L2] 商店 (The Shop)

* **外框**：标准的 Windows 95/98 灰色窗口，深蓝色标题栏。
* **内容**：这也是“异化”的一部分。在一个黑暗恐怖的游戏里，突然弹出一个明亮、恶俗、充满消费主义陷阱的早期电商网页。
* **商品**：图片必须是低分辨率、甚至带白底的实物照片（烂牙、汉堡、药瓶），形成强烈的违和感。

#### [L3] 账单 (The Bill)

* **形状**：不是矩形。通过 CSS `clip-path` 裁剪出上下边缘的锯齿状（模拟撕纸）。
* **纹理**：叠加一张 `paper-texture` (皱纸/噪点) 图片，颜色偏黄 `#f0f0e0`。
* **文字**：使用类似“小票打印机”的断墨字体。
* **印章**：绝对定位的红色圆环，带有 "UNPAID" 字样，且有 CSS `rotate` 随机角度。

---

### 4. 核心组件代码实现 (Core Implementation)

以下代码可直接复制到 `src/components/ui/` 目录下。

#### A. 视差场景组件 (`LayeredScene.tsx`)

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface LayeredSceneProps {
  bgImage: string;      // 环境背景图 URL
  eventImage: string;   // 事件主体图 URL
  playerImage: string;  // 玩家背影图 URL
  isGlitch: boolean;    // 是否处于低 SAN 状态
}

export const LayeredScene: React.FC<LayeredSceneProps> = ({ bgImage, eventImage, playerImage, isGlitch }) => {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden border-b-4 border-neutral-800 bg-black">
      
      {/* Layer 1: 背景 (缓慢推拉，营造电影感) */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})`, filter: isGlitch ? 'hue-rotate(90deg) contrast(1.2)' : 'none' }}
        animate={{ scale: [1, 1.05, 1], x: [0, -10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* 像素网点遮罩 (Dithering) - PC98 质感核心 */}
      <div className="absolute inset-0 bg-[url('/assets/textures/dither-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay" />

      {/* Layer 3: 事件主体 (呼吸动画 + 故障效果) */}
      <motion.div 
        className={`absolute right-[15%] bottom-[10%] w-64 h-64 bg-contain bg-no-repeat bg-center ${isGlitch ? 'mix-blend-hard-light' : ''}`}
        style={{ backgroundImage: `url(${eventImage})` }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 低 SAN 时的额外故障层 */}
        {isGlitch && (
          <div className="absolute inset-0 bg-inherit animate-pulse opacity-50 translate-x-1" style={{ filter: 'blur(2px)' }} />
        )}
      </motion.div>

      {/* Layer 2: 玩家背影 (独立的呼吸节奏，建立在场感) */}
      <motion.div 
        className="absolute left-0 bottom-[-20px] w-56 h-56 bg-contain bg-no-repeat bg-bottom origin-bottom-left"
        style={{ backgroundImage: `url(${playerImage})` }}
        animate={{ y: [0, -3, 0], scale: [1, 1.01, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} 
      />
      
    </div>
  );
};

```

#### B. 终端控制台组件 (`MessageWindow.tsx`)

```tsx
import React from 'react';

interface Option {
  id: string;
  label: string;
  type: 'normal' | 'locked' | 'awakened';
  onClick: () => void;
}

export const MessageWindow: React.FC<{ text: string; options: Option[] }> = ({ text, options }) => {
  return (
    <div className="absolute bottom-0 w-full h-[40vh] z-10 p-2 md:p-4">
      {/* 容器背景: 点阵纹理 + 边框 */}
      <div className="w-full h-full bg-[#020410]/95 border-t-2 border-x-2 border-cyan-800/80 flex flex-col p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] relative overflow-hidden rounded-t-lg">
        
        {/* CSS Dot Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#4fd1c5 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        
        {/* 1. 文本区 (打字机效果) */}
        <div className="flex-1 font-pixel text-cyan-50 text-base md:text-lg leading-relaxed mb-4 overflow-y-auto custom-scrollbar">
          <span className="text-cyan-600 mr-2 font-bold">&gt;</span>
          {text}
          <span className="animate-blink inline-block w-2 h-4 bg-cyan-500 ml-1 align-middle"/>
        </div>

        {/* 2. 按钮网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((opt, idx) => {
             // 动态样式逻辑
             let btnStyle = "border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black"; // Normal
             if (opt.type === 'locked') btnStyle = "border-gray-700 text-gray-600 cursor-not-allowed border-dashed";
             if (opt.type === 'awakened') btnStyle = "border-red-600 text-red-500 hover:bg-red-900 hover:text-red-100 animate-pulse font-bold";

             return (
              <button 
                key={opt.id} 
                onClick={opt.onClick} 
                disabled={opt.type === 'locked'} 
                className={`relative w-full border-2 p-3 text-left font-pixel text-sm transition-all duration-100 group overflow-hidden ${btnStyle}`}
              >
                <span className="relative z-10 flex justify-between items-center">
                  <span>{idx + 1}. {opt.label}</span>
                  {opt.type === 'normal' && <span className="opacity-0 group-hover:opacity-100">&lt;&lt;</span>}
                </span>
                {/* 扫光特效 */}
                {opt.type === 'normal' && <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:animate-shine" />}
              </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};

```

#### C. 热敏纸账单组件 (`BillOverlay.tsx`)

```tsx
import React from 'react';

export const BillOverlay: React.FC<{ billData: any, onPay: () => void }> = ({ billData, onPay }) => {
  return (
    <div className="fixed inset-0 z-[30] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* 纸张实体 */}
      <div 
        className="relative bg-[#f0f0e0] text-neutral-900 w-[300px] md:w-[340px] shadow-2xl rotate-[-1deg] animate-bill-entry"
        style={{ 
          // 核心：锯齿状撕裂边缘 Clip-path
          clipPath: 'polygon(0% 0%, 5% 2%, 10% 0%, 15% 2%, 20% 0%, 25% 2%, 30% 0%, 35% 2%, 40% 0%, 45% 2%, 50% 0%, 55% 2%, 60% 0%, 65% 2%, 70% 0%, 75% 2%, 80% 0%, 85% 2%, 90% 0%, 95% 2%, 100% 0%, 100% 98%, 95% 100%, 90% 98%, 85% 100%, 80% 98%, 75% 100%, 70% 98%, 65% 100%, 60% 98%, 55% 100%, 50% 98%, 45% 100%, 40% 98%, 35% 100%, 30% 98%, 25% 100%, 20% 98%, 15% 100%, 10% 98%, 5% 100%, 0% 98%)',
        }}
      >
        {/* 纸张纹理层 */}
        <div className="absolute inset-0 bg-[url('/assets/textures/paper-texture.png')] opacity-40 pointer-events-none mix-blend-multiply" />
        
        <div className="p-8 flex flex-col gap-4 font-mono text-sm relative z-10">
          <h2 className="text-center text-xl font-black border-b-2 border-dashed border-gray-400 pb-4 tracking-tighter">
            *** NOTICE OF DEBT ***
          </h2>
          
          <div className="flex justify-between font-bold text-gray-700">
            <span>DATE:</span><span>1999-12-31</span>
          </div>
          <div className="flex justify-between font-bold text-gray-700">
            <span>TYPE:</span><span>OVERDUE</span>
          </div>
          
          <div className="my-2 p-2 border border-gray-800 bg-white/50 text-center font-bold">
            ITEM: {billData.title}
          </div>

          <div className="my-2 py-2 border-y-2 border-dashed border-gray-400 text-right text-3xl font-black tracking-tighter">
            -${billData.amount}
          </div>

          <p className="text-xs text-gray-600 italic text-center leading-tight">
            "{billData.flavorText}"
          </p>

          <button 
            onClick={onPay}
            className="mt-4 w-full bg-red-800 text-white font-bold py-3 hover:bg-red-900 transition-colors uppercase border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
          >
            [ ACKNOWLEDGE & PAY ]
          </button>
        </div>

        {/* 红色印章 (装饰) */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-[6px] border-red-600/40 rounded-full flex items-center justify-center rotate-[-12deg] pointer-events-none mix-blend-multiply">
          <span className="text-red-600/40 font-black text-3xl uppercase tracking-widest">URGENT</span>
        </div>
      </div>
    </div>
  );
};

```

#### D. Web 1.0 商店窗口组件 (`ShopModal.tsx`)

```tsx
import React from 'react';

export const ShopModal: React.FC<{ items: any[], onClose: () => void, onBuy: (id: string) => void }> = ({ items, onClose, onBuy }) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-grayscale">
      {/* Windows 98 风格窗口框 */}
      <div className="w-full max-w-5xl bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-2xl h-[85vh] flex flex-col font-sans">
        
        {/* 标题栏 */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center font-bold select-none">
          <div className="flex items-center gap-2">
            <img src="/assets/icons/ie_icon.png" className="w-4 h-4" alt="icon"/>
            <span>Netscape Navigator - [Dark_Market]</span>
          </div>
          <button onClick={onClose} className="bg-[#c0c0c0] text-black w-5 h-5 flex items-center justify-center border border-white border-b-black border-r-black text-sm font-bold active:border-t-black active:border-l-black">X</button>
        </div>

        {/* 菜单栏 (装饰) */}
        <div className="bg-[#c0c0c0] border-b border-gray-400 px-2 py-1 text-xs flex gap-4 text-black">
          <span className="underline">F</span>ile <span className="underline">E</span>dit <span className="underline">V</span>iew <span className="underline">G</span>o <span className="underline">H</span>elp
        </div>

        {/* 浏览器内容区 (白色背景) */}
        <div className="flex-1 bg-white overflow-y-auto p-4 custom-scrollbar">
          
          {/* 粗糙的头部设计 */}
          <div className="text-center mb-8 border-b-4 border-blue-800 pb-4">
            <h1 className="text-4xl text-blue-800 font-serif italic font-bold tracking-tight">WELCOME TO THE SHOP</h1>
            <div className="mt-2 bg-yellow-200 text-red-600 border border-red-600 p-1 font-mono text-sm">
              🚨 SPECIAL OFFER: SELL YOUR KIDNEY TODAY FOR $500! CLICK HERE! 🚨
            </div>
          </div>

          {/* 商品网格 (Grid) - 模拟 Table 布局 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border-2 border-blue-600 p-2 text-center bg-[#ffffcc] hover:bg-[#ffffaa] transition-colors">
                {/* 图片框 */}
                <div className="w-full h-24 border border-black mb-2 bg-white flex items-center justify-center overflow-hidden">
                   <img src={item.image} className="object-cover h-full w-full grayscale contrast-125" alt={item.name} />
                </div>
                
                <div className="font-bold text-blue-700 underline cursor-pointer text-sm mb-1">{item.name}</div>
                <div className="text-red-600 font-bold text-lg font-serif">${item.price}</div>
                <div className="text-[10px] text-black mt-1 leading-tight">{item.effect}</div>
                
                <button 
                  onClick={() => onBuy(item.id)}
                  className="mt-3 w-full bg-[#e0e0e0] border-2 border-white border-b-black border-r-black px-2 py-1 text-xs active:border-t-black active:border-l-black active:bg-[#cccccc]"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500">
            Copyright © 1999 American Insight Corp. All rights reserved. <br/>
            Best viewed with Internet Explorer 4.0 at 800x600 resolution.
          </div>
        </div>
      </div>
    </div>
  );
}

```

#### E. 全局氛围层 (`GlobalAtmosphere.tsx`)

```tsx
import React from 'react';

export const GlobalAtmosphere: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
      {/* 1. 基础 CRT 扫描线 (Scanlines) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />
      
      {/* 2. 屏幕边缘暗角 (Vignette) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.8)_100%)]" />

      {/* 3. 动态噪点 (Noise) - 模拟胶片颗粒/信号杂讯 */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('/assets/textures/noise.svg')] animate-grain" />
      
      {/* 4. 屏幕反光 (Screen Glare) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-[2rem] opacity-30" />
    </div>
  );
};

```

---

### 5. 必要的资产清单 (Asset Requirements)

为了代码能正常运行，请确保 `public/assets/` 目录下有以下素材：

* **Textures (纹理)**:
* `/textures/paper-texture.png`: 皱巴巴的纸张纹理（灰度图）。
* `/textures/dither-pattern.png`: 4x4 像素的网点图（用于 HUD 背景）。
* `/textures/noise.svg`: 标准 SVG 噪点。


* **Placeholders (占位图)**:
* `/player_back.png`: 玩家背影（带帽衫，透明背景）。
* `/icons/ie_icon.png`: IE 浏览器图标。



---
