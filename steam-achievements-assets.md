# San: 人生模拟器 - 成就图标素材制作指南

## 📋 成就总览

共 **20 个成就**，分为 5 个类别：
- 🏚️ Homeless 线：4 个（生存挣扎）
- 👷 Worker 线：4 个（觉醒与剥削）
- 🏡 Middle 线：4 个（房贷与焦虑）
- 🏦 Capitalist 线：4 个（财富与讽刺）
- 🌟 通用线：4 个（跨阶层挑战）

---

## 🎨 统一视觉风格规范

### 基础规格
- **尺寸**：64x64 像素（Steam 建议）或 256x256（高清版本）
- **风格**：像素艺术 + 赛博朋克暗黑美学
- **调色板**：深色背景 + 霓虹高亮

### 颜色规范
```css
/* 背景色 */
--bg-dark: #0a1628;        /* 深海蓝黑 */
--bg-darker: #050a10;      /* 近纯黑 */

/* 阶层主题色 */
--homeless-brown: #654321; /* 贫民窟 - 脏棕 */
--worker-blue: #4682b4;    /* 工人 - 工装蓝 */
--middle-gray: #808080;    /* 中产 - 水泥灰 */
--capitalist-gold: #ffd700;/* 资本家 - 金钱金 */

/* 高亮色 */
--neon-red: #ff0040;       /* 危险/死亡 */
--neon-cyan: #00ffff;      /* 系统/科技 */
--neon-purple: #9400d3;    /* 凝视/神秘 */
--warning-yellow: #ffcc00; /* 警告/注意 */
```

### 设计元素
- 粗轮廓线（2-3 像素）
- 限制调色板（每图标 4-6 色）
- 发光效果（outer glow）
- 轻微噪点纹理

---

## 🖼️ AI 绘画提示词（直接使用）

### Tier 1: Homeless - 生存挣扎

#### 1. ACH_FIRST_BLOOD / 第一课
```
Pixel art icon, 64x64, cracked tombstone with small pixelated angel wings, neon red "GAME OVER" text glowing, dark navy blue background #0a1628 with pixel rain effect, gray stone texture with cracks, retro gaming death screen aesthetic, limited color palette 4 colors, thick black outline, Hotline Miami meets Undertale style --ar 1:1 --v 6
```

#### 2. ACH_SURVIVE_7D / 一周战士
```
Pixel art icon, 64x64, weathered calendar page with 7 days marked in blood red, held by skeletal hand, torn edges, city skyline silhouette in background, sepia and rust tones #8B4513, Darkest Dungeon campfire icon style, limited palette, gritty survival aesthetic --ar 1:1 --v 6
```

#### 3. ACH_HOMELESS_ESCAPE / 破茧成蝶
```
Pixel art icon, 64x64, moth emerging from broken cocoon made of cardboard and trash bags, one wing damaged but spread, ascending upward, dirty brown cocoon #654321, iridescent teal wings #00CED1, golden light rays from above, Hollow Knight transformation aesthetic, hope amid decay --ar 1:1 --v 6
```

#### 4. ACH_HOMELESS_BENCH / 长椅守护者
```
Pixel art icon, 64x64, lonely park bench under flickering street lamp, snow falling, empty coffee cup on ground, "NO SLEEPING" sign crossed out in red, cold blue night #1a237e, warm orange lamp glow #ff6f00, Kentucky Route Zero minimalism, desolate but defiant mood --ar 1:1 --v 6
```

---

### Tier 2: Worker - 觉醒与剥削

#### 5. ACH_WORKER_REBEL / 觉醒时刻
```
Pixel art icon, 64x64, raised fist holding wrench breaking chains, Soviet constructivist poster style, industrial factory with smokestacks background, worker silhouettes united, Soviet red #CC0000, industrial steel gray #4a5568, golden dawn light, revolutionary empowering mood, Papers Please aesthetic --ar 1:1 --v 6
```

#### 6. ACH_WORKER_OVERTIME / 九九六福报
```
Pixel art icon, 64x64, exhausted worker at conveyor belt, digital clock showing 996, coffee cups piled up, eyes with dark circles glowing red, fluorescent office white #f5f5f5, bloodshot red #ff0000, corporate dystopia, The Office meets Cyberpunk, dark humor exhaustion --ar 1:1 --v 6
```

#### 7. ACH_WORKER_WHISTLE / 吹哨人
```
Pixel art icon, 64x64, noir thriller style, whistle with sound waves emanating, secret documents flying, shadowy figure in background, "TOP SECRET" red stamp, noir black and white, spotlight yellow #ffd700, Metal Gear Solid codec style, dangerous truth mood --ar 1:1 --v 6
```

#### 8. ACH_WORKER_ESCAPE / 晋升中产
```
Pixel art icon, 64x64, diploma floating above corporate ladder, breaking through glass ceiling with cracks, suit and tie below, parchment beige #f5deb3, navy suit #000080, shattered glass cyan, Bioshock utopia/dystopia duality, ambiguous success mood --ar 1:1 --v 6
```

---

### Tier 3: Middle - 房贷与焦虑

#### 9. ACH_MIDDLE_MORTGAGE / 三十年房奴
```
Pixel art icon, 64x64, suburban house with golden handcuffs as door handles, "30 YEARS" sign, perfect lawn with dark shadows underneath, suburban beige #d2b48c, prison gold #ffd700, gilded cage aesthetic, American Beauty meets Edward Hopper, suburban anxiety --ar 1:1 --v 6
```

#### 10. ACH_MIDDLE_HOA / 草坪盖世太保
```
Pixel art icon, 64x64, ruler measuring grass height, magnifying glass over single yellow leaf, "VIOLATION" ticket, nosy neighbor peeking over fence, HOA beige #c2b280, warning yellow #ffcc00, The Truman Show meets Stepford Wives, petty tyranny surveillance comedy --ar 1:1 --v 6
```

#### 11. ACH_MIDDLE_CRISIS / 中年危机
```
Pixel art icon, 64x64, red sports car with question mark tailpipe, balding head with comb-over in rearview mirror, wedding ring on dashboard, open road leading to cliff, crisis red #dc143c, midlife gray #808080, Fear and Loathing meets American Beauty, desperate grasp at youth --ar 1:1 --v 6
```

#### 12. ACH_MIDDLE_ESCAPE / 跻身1%
```
Pixel art icon, 64x64, figure in suit climbing over wall made of suburban houses, dropping mortgage papers, reaching for golden skyscraper above, middle class blue #4682b4, capitalist gold #ffd700, Great Gatsby green light meets Wolf of Wall Street, ambitious ascent moral cost --ar 1:1 --v 6
```

---

### Tier 4: Capitalist - 财富与讽刺

#### 13. ACH_CAPITALIST_FIRST_MILLION / 第一桶金
```
Pixel art icon, 64x64, money bag with "$1M" in blood red, gold coins spilling out with skulls embossed, stock chart going up in background, blood money crimson #8b0000, gold #ffd700, corruption black, Monopoly man meets Dark Souls, wealth built on bones --ar 1:1 --v 6
```

#### 14. ACH_CAPITALIST_MONOPOLY / 大到不能倒
```
Pixel art icon, 64x64, Monopoly top hat piece crushing small houses and shops, government building in pocket, "BAILOUT" check, monopoly green #00ff00, government gray, crushed red #ff0000, Mr Robot E-Corp aesthetic, corporate dominance untouchable --ar 1:1 --v 6
```

#### 15. ACH_CAPITALIST_OFFSHORE / 离岸避税天堂游客
```
Pixel art icon, 64x64, palm tree on tropical island made of documents, money flowing into black hole, "PRIVATE" stamp, IRS agent drowning in surrounding water, tax haven teal #008080, money green, black hole black, Panama Papers meets The Beach, guilt-free greed --ar 1:1 --v 6
```

#### 16. ACH_CAPITALIST_HEART / 百分之一的心脏
```
Pixel art icon, 64x64, golden heart in glass case, poor figure lying down connected by tubes, "PREMIUM UPGRADE" label, life support machine with dollar signs, medical white, class gold #ffd700, exploitation red #8b0000, Repo Man meets Get Out, literal body exploitation --ar 1:1 --v 6
```

---

### Tier 5: 通用 - 跨阶层挑战

#### 17. ACH_ALL_CLASSES / 人生百态
```
Pixel art icon, 64x64, four figures in vertical stack: homeless with cardboard, worker with helmet, middle with suit, capitalist with top hat, circular arrows connecting them, rainbow gradient background representing class spectrum, Great Chain of Being modernized --ar 1:1 --v 6
```

#### 18. ACH_EVENT_COLLECTOR / 苦难百科全书
```
Pixel art icon, 64x64, leather book with "50/100" progress bar, floating event icons around it (bench, bill, hospital, jail), System Gaze purple eye watching from corner, book brown #8b4513, multicolor event icons, Binding of Isaac collection aesthetic --ar 1:1 --v 6
```

#### 19. ACH_IRONIC_ENDING / 系统的黑色幽默
```
Pixel art icon, 64x64, theater mask with comedy and tragedy merged, capitalist at top of ladder falling down, homeless at bottom catching his wallet, System Gaze laughing in background, theatrical gold #ffd700, irony cyan #00ffff, Black Mirror meets Waiting for Godot --ar 1:1 --v 6
```

#### 20. ACH_IMMORTAL / 百分之一的永生者
```
Pixel art icon, 64x64, hourglass with "365" in sand, four seasons changing around it in cycle, skeletal figure still standing, time gold #ffd700, seasonal colors, Dark Souls "You Died" screen inverted, endurance against time, Persistence of Memory --ar 1:1 --v 6
```

---

## 🛠️ 制作工具推荐

### AI 生成
- **Midjourney**: 最佳像素艺术风格
- **DALL-E 3**: 精准控制元素
- **Stable Diffusion**: 本地批量生成（推荐模型：Pixel Art XL）

### 像素编辑
- **Aseprite**: 专业像素艺术 ($20)
- **GraphicsGale**: 免费
- **Pixilart**: 在线免费
- **Photoshop**: 后期发光效果

### 后期处理
```bash
# 统一添加发光效果（ImageMagick）
convert input.png -background none -blur 0x2 -level 0x100% output_glow.png

# 调整大小
convert input.png -resize 64x64 output_64.png
convert input.png -resize 256x256 output_256.png
```

---

## 📦 文件命名规范

```
achievement/
├── first_blood.png           # 64x64 彩色
├── first_blood_gray.png      # 64x64 灰度（未解锁）
├── first_blood@2x.png        # 128x128 高清
├── survive_7d.png
├── survive_7d_gray.png
├── survive_7d@2x.png
...（共 20 组）
```

---

## ✨ 灰度版本制作

所有图标需要制作灰度版本（未解锁状态）：

```bash
# ImageMagick 批量转换
for img in *.png; do
    convert "$img" -colorspace Gray "${img%.png}_gray.png"
done
```

或手动调整：
- 饱和度降至 0%
- 对比度降低 30%
- 亮度降低 20%
- 添加轻微模糊

---

## 📝 Steamworks 导入检查清单

- [ ] 创建 20 个成就条目
- [ ] 上传彩色图标 (.png)
- [ ] 上传灰度图标 (.png)
- [ ] 填写英文显示名称
- [ ] 填写中文显示名称
- [ ] 填写英文描述
- [ ] 填写中文描述
- [ ] 设置 Hidden 状态（4 个隐藏成就）
- [ ] 保存并发布到测试环境

---

## 🔗 相关文件

- `steam-achievements-full.json` - 完整成就配置（供参考）
- `steam-achievements.json` - 简化版配置
- 本文件 - 素材制作指南
