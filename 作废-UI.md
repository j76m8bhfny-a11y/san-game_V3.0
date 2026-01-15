
# 🎨 UI 设计母盘 (The Final UI Design Master)

**版本**: Ver 6.0 (PC98 / Lo-Fi Edition)
**核心隐喻**: **Retro Retina (复古视网膜)** —— 玩家不是在看监控，而是在回溯一段被低保真（Lo-Fi）化的第一人称记忆。

---

### 1. 核心 UI 架构图 (Master UI Flowchart)

采用 Z-Index 层叠布局，从底层的像素画布到顶层的系统调试层。

```mermaid
graph TD
    %% 层级定义
    subgraph Layer0_Canvas [L0: 底层画布]
        Bg[Canvas: 抖动渲染 & 色盘置换]
    end

    subgraph Layer1_Scene [L1: 场景叙事层]
        Scene[03a. 动态视差场景 LayeredScene]
        Player[玩家背影 Over-Shoulder]
        TextBox[03b. 底部对话框 MessageWindow]
        HUD[02. 迷你状态栏 MiniHUD]
        Title[01. 标题画面]
        End[09. 结局画面]
    end

    subgraph Layer2_Modal [L2: 功能窗口层]
        Shop[04. 商店 (DOS命令行风格)]
        Archive[05. 黑匣子 (拍立得照片墙)]
        Daily[08. 每日结算 (夜间模式)]
        Pause[06. 系统菜单]
    end

    subgraph Layer3_Overlay [L3: 突脸层]
        Bill[07. 账单传票 BillOverlay]
    end

    subgraph Layer4_Feedback [L4: 反馈层]
        Toast[10. 像素飘字 Feedback]
    end

    subgraph Layer5_Atmosphere [L5: 模拟信号层]
        Signal[Lo-Fi 噪点 & 信号干扰]
        SanFilter[SAN 值视觉劣化]
    end
    
    subgraph Layer6_Tooltip [L6: 提示层]
        Tooltip[鼠标跟随 Debug 浮窗]
    end

    %% 视觉流
    Bg --> Scene
    Scene --> Player
    Player --> TextBox
    TextBox --> HUD
    HUD --> Shop
    Shop --> Bill
    Bill --> Toast
    Toast --> Signal
    Signal --> Tooltip

```

---

### 2. 全量 UI 页面清单 (Total: 10 Components)

| 层级 | 组件名 | 功能描述 | 视觉风格 |
| --- | --- | --- | --- |
| **L6** | **TooltipLayer** | 解释物品/机制 | 系统 Debug 浮窗，绿色代码字，半透明黑底 |
| **L5** | **GlobalAtmosphere** | **Retro Retina**：负责像素抖动、色彩失真、模拟信号干扰 | 随 SAN 值降低，画面出现色块错位、雪花噪点 |
| **L4** | **FeedbackLayer** | 数值变动反馈 | 粗像素字体，高对比度，像街机游戏的得分弹窗 |
| **L3** | **BillOverlay** | 强制打断 | 红色加粗像素字，巨大的“印章”打击动效 |
| **L2** | **ShopModal** | 购买/出售 | **DOS 命令行风格**。纯黑底色，绿色/琥珀色字符 |
| **L2** | **DailySettlement** | 夜间结算 | 深蓝底色，宁静但压抑的像素图表 |
| **L1** | **MessageWindow** | 核心交互与文本 | 屏幕底部 1/3，黑底白框，打字机效果，选项高亮反色 |
| **L1** | **LayeredScene** | **核心视差组件** | PC98 风格插画，三层分离（背景/事件/玩家） |
| **L1** | **MiniHUD** | 状态显示 (HP/SAN/$) | 顶部悬浮的极简像素图标 |
| **L0** | **TitleScreen** | 启动画面 | 16色 像素艺术，故障风格 Logo |

---

### 3. 全页面 UI 示意图 (Visual Wireframes)

#### [02+03] 主游戏界面 (Main Game View)

**设计风格**：90年代日式 AVG (如《Snatcher》)，强调**第一人称在场感**。

```text
(全屏 16:9 比例)
+-------------------------------------------------------------+
|  [HUD] ♥ HP:80  👁 SAN:45  $ 1,200             [Day 12]     | <-- MiniHUD (悬浮顶部)
+-------------------------------------------------------------+
|                                                             |
|   [ Layer 1: 背景 - 美国中产社区的大 House ]                |
|   (动画: 极慢速水平平移 Pan-Left)                           |
|                                                             |
|           [ Layer 3: 事件焦点 - 动态呼吸 ]                  |
|           (内容: 主妇正在把衣服塞进巨大的烘干机)            |
|           (状态: SAN低时，她的脸部像素出现 glitch)          |
|           (位置: 画面中景，偏右)                            |
|                                                             |
|   [ Layer 2: 玩家背影 - 独立呼吸 ]                          |
|   (内容: 穿着连帽衫的左肩和后脑勺)                          |
|   (位置: 固定左下角 bottom:0, left:0)                       |
|   (状态: HP低时身体佝偻)                                    |
|                                                             |
+-------------------------------------------------------------+
| [ Message Window ] (占底部 30% 高度)                        |
| +---------------------------------------------------------+ |
| | > 系统: 你看着她浪费了 5 度电来烘干两件衬衫。           | |
| |   这台机器的轰鸣声让你想起了工厂的流水线。              | |
| |                                                         | |
| |   [1. 嘲讽她]     [2. 偷走衣服]                         | |
| |   [3. 离开]       [4. 🔴 革命宣传 (Red > 5)]            | |
| +---------------------------------------------------------+ |
|                                                    ▼ (Next) |
+-------------------------------------------------------------+

```

#### [04] 商店 (Shop - DOS Style)

```text
+-------------------------------------------------------------+
| C:\> MARKET_PLACE.EXE                                  [X]  |
+-------------------------------------------------------------+
| > DETECTED_CLASS: WORKER                                    |
| > LISTING ITEMS...                                          |
|                                                             |
| [1] 1美元炸鸡...........$1.00   [HP+15 / SAN-5]             |
| [2] 抗抑郁药............$50.00  [SAN RESET]                 |
| [3] VPN_节点............$20.00  [UNLOCK_TRUTH]              |
|                                                             |
| > ENTER SELECTION [1-3]: _                                  |
|                                                             |
| [ ACCESS_DARK_WEB (LOCKED) ]                                |
+-------------------------------------------------------------+

```

---

### 4. 视觉增强包代码 (Visual Enhancement Pack)

#### A. 三层视差场景组件 (`src/components/ui/LayeredScene.tsx`)

实现“呼吸感”的核心代码。

```tsx
import React from 'react';
import { motion } from 'framer-motion';

// 定义三层视差结构
export const LayeredScene: React.FC<{ 
  bgImage: string; 
  eventImage: string; 
  playerImage: string; 
  isGlitch: boolean 
}> = ({ bgImage, eventImage, playerImage, isGlitch }) => {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden border-b-4 border-neutral-800">
      
      {/* Layer 1: 背景 (缓慢推拉) */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Layer 3: 事件主体 (呼吸) */}
      <motion.div 
        className={`absolute right-1/4 bottom-10 w-64 h-64 bg-contain bg-no-repeat ${isGlitch ? 'brightness-150 contrast-125' : ''}`}
        style={{ backgroundImage: `url(${eventImage})` }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Layer 2: 玩家背影 (独立的呼吸节奏，增加真实感) */}
      <motion.div 
        className="absolute left-0 bottom-0 w-48 h-48 bg-contain bg-no-repeat origin-bottom-left"
        style={{ backgroundImage: `url(${playerImage})` }}
        animate={{ y: [0, -3, 0], scale: [1, 1.01, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} // 节奏不同步
      />
      
      {/* 像素网点遮罩 (Dithering Overlay) */}
      <div className="absolute inset-0 bg-[url('/assets/dither-pattern.png')] opacity-20 pointer-events-none mix-blend-overlay" />
    </div>
  );
};

```

#### B. 全局氛围层 (`src/components/ui/GlobalAtmosphere.tsx`)

实现“模拟信号干扰”与“SAN值劣化”。

```tsx
import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const GlobalAtmosphere: React.FC = () => {
  const { san } = useGameStore((state) => ({ san: state.san }));
  
  // SAN < 30: 极度异化 (色彩偏移 + 强噪点)
  const isMadness = san <= 30;
  // SAN < 70: 轻度干扰 (偶尔扫描线)
  const isUnstable = san <= 70;

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
      {/* 1. 基础 CRT 扫描线 (永远存在，但在低 SAN 时更明显) */}
      <div className={`absolute inset-0 bg-[length:100%_4px] bg-gradient-to-b from-transparent to-black/10 ${isMadness ? 'opacity-40' : 'opacity-10'}`} />
      
      {/* 2. 边缘暗角 (PC98 屏幕曲率感) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,10,20,0.8)_100%)]" />

      {/* 3. 色彩失真 (RGB Shift) - 仅在疯狂状态出现 */}
      {isMadness && (
        <div className="absolute inset-0 animate-pulse mix-blend-color-dodge opacity-20 bg-purple-900" />
      )}
      
      {/* 4. 信号噪点 */}
      {(isUnstable) && (
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-grain" />
      )}
    </div>
  );
};

```

#### C. 信息提示系统 (`src/components/ui/TooltipLayer.tsx`)

**[工程修正版]** 包含边界检测，防止提示框溢出屏幕。

```tsx
import React from 'react';
import { useTooltipStore } from '@/store/useTooltipStore';
import { motion, AnimatePresence } from 'framer-motion';

export const TooltipLayer: React.FC = () => {
  const { content, position } = useTooltipStore();
  if (!content) return null;

  // 边界检测：防止溢出屏幕右侧和底部
  const isRight = position.x > window.innerWidth - 220;
  const isBottom = position.y > window.innerHeight - 150;
  
  const finalX = isRight ? position.x - 230 : position.x + 15;
  const finalY = isBottom ? position.y - 100 : position.y + 15;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0 }}
          style={{ left: finalX, top: finalY }}
          // 样式：系统底层 Debug 风格
          className="absolute bg-black/95 border border-green-500/50 text-green-400 p-3 rounded-sm shadow-[4px_4px_0px_rgba(0,0,0,1)] max-w-[220px]"
        >
          <div className="flex items-center gap-2 mb-2 border-b border-green-500/30 pb-1">
            <div className="w-2 h-2 bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Sys_Info</span>
          </div>
          <div className="text-xs font-mono leading-relaxed text-gray-300">{content}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

```

#### D. 高性能文本组件 (`src/components/ui/SanityText.tsx`)

**[性能优化版]** 仅对部分字符应用特效，避免 DOM 节点过多导致卡顿。

```tsx
import React, { useMemo } from 'react';

export const SanityText: React.FC<{ text: string; san: number }> = ({ text, san }) => {
  const isGlitchy = san <= 50;
  
  const content = useMemo(() => {
    if (!isGlitchy) return text;

    return text.split('').map((char, i) => {
      // 优化：仅 15% 的字符应用故障特效
      if (i % 7 !== 0 && i % 5 !== 0) return char;

      return (
        <span key={i} className="inline-block animate-pulse text-red-500" style={{ opacity: Math.random() * 0.5 + 0.5 }}>
          {char}
        </span>
      );
    });
  }, [text, isGlitchy]);

  return <span className={isGlitchy ? 'font-mono tracking-widest' : 'font-sans'}>{content}</span>;
};

```

---

### 5. App.tsx 集成逻辑

```tsx
import { LayeredScene } from '@/components/ui/LayeredScene';
import { GlobalAtmosphere } from '@/components/ui/GlobalAtmosphere';
import { TooltipLayer } from '@/components/ui/TooltipLayer';

export default function App() {
  const { currentEvent, san, showShop } = useGameStore();

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] text-gray-200 font-pixel overflow-hidden selection:bg-green-700 selection:text-white">
      
      {/* L6: 提示层 */}
      <TooltipLayer />

      {/* L5: 全局氛围 (复古滤镜) */}
      <GlobalAtmosphere />
      
      {/* L4: 反馈层 */}
      <FeedbackLayer />

      {/* L2: 模态窗口 (商店/结算) */}
      {showShop && <ShopModal />}

      {/* L1: 主游戏场景 */}
      <main className={`transition-all duration-300 ${showShop ? 'blur-sm brightness-50' : ''}`}>
        
        <MiniHUD />
        
        {/* 核心视差组件 */}
        <LayeredScene 
          bgImage={currentEvent.bg}
          eventImage={currentEvent.img}
          playerImage="/assets/player_back.png"
          isGlitch={san < 30}
        />

        {/* 底部对话框 */}
        <MessageWindow 
          text={currentEvent.description}
          options={currentEvent.options}
        />

      </main>
    </div>
  );
}

```
