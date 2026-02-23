# 图片素材管理指南

> 版本: 1.0 | 适用于《美式灵视》游戏

---

## 📁 目录结构

```
public/assets/
├── audio/          # 音频文件
├── events/         # 事件前景图
├── scenes/         # 场景背景图
├── items/          # 物品图标
├── textures/       # 纹理贴图
├── ui/             # UI元素
├── icons/          # 图标
└── fonts/          # 字体文件
```

---

## 🎨 一、信仰系统背景图（优先级：高）

当前使用 CSS 渐变占位，需要替换为实际图片。

### 1.1 Downtown 核心区 - 神秘暗金色调

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `downtown_lodge_exterior.jpg` | 1920x1080 | `public/assets/scenes/` | A mysterious dark gold and black Masonic lodge exterior at night, Art Deco architecture, dim golden lighting, foggy atmosphere, cinematic composition, cyberpunk noir style, photorealistic |
| `downtown_lodge_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Interior of an occult lodge, dark wood paneling, golden symbols on walls, candlelight, velvet curtains, mysterious altar, cyberpunk noir aesthetic, photorealistic |

### 1.2 Rust Belt 铁锈带 - 工业紫红调

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `rust_church_exterior.jpg` | 1920x1080 | `public/assets/scenes/` | An old industrial church in Rust Belt, purple and red neon lights, abandoned factory in background, grim atmosphere, stained glass with industrial motifs, cyberpunk noir, photorealistic |
| `rust_church_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Inside a workers' church, exposed brick walls, purple lighting, old industrial machinery as decoration, wooden pews, working-class religious atmosphere, cyberpunk noir style |

### 1.3 Slums 贫民窟 - 肮脏橙褐调

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `slums_shrine_exterior.jpg` | 1920x1080 | `public/assets/scenes/` | A makeshift shrine in urban slums, orange and brown tones, corrugated metal walls, religious graffiti, candles and offerings, dystopian atmosphere, cyberpunk noir, photorealistic |
| `slums_shrine_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Interior of a slum shrine, dim orange lighting, broken statue, rats scurrying, mystical symbols on dirty walls, post-apocalyptic religious atmosphere, gritty realism |

### 1.4 Suburbs 郊区 - 现代蓝白调

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `suburbs_church_exterior.jpg` | 1920x1080 | `public/assets/scenes/` | Modern suburban megachurch exterior, clean blue and white aesthetic, glass facade, pristine lawn, bright daylight, superficial perfection, slightly unsettling cleanliness, photorealistic |
| `suburbs_church_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Inside a modern suburban church, blue and white color scheme, LED screens, comfortable seating, Starbucks coffee corner, corporate religious atmosphere, sterile lighting, photorealistic |

---

## 🗺️ 二、地图系统（优先级：高）

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `map_base_v2.jpg` | 1920x1080 | `public/assets/` | Top-down view of a dystopian American city divided into four zones: Slums (dirty orange), Rust Belt (purple industrial), Suburbs (clean blue), Downtown (gold and glass), hand-drawn map style, vintage paper texture, game map aesthetic |
| `map_slums_detail.jpg` | 800x600 | `public/assets/scenes/` | Detailed map of slum district, narrow alleys, tent cities, overcrowded housing, hand-drawn style |
| `map_rust_detail.jpg` | 800x600 | `public/assets/scenes/` | Detailed map of industrial rust belt, factories, warehouses, abandoned plants, hand-drawn style |
| `map_suburbs_detail.jpg` | 800x600 | `public/assets/scenes/` | Detailed map of suburban sprawl, residential blocks, shopping centers, highways, hand-drawn style |
| `map_downtown_detail.jpg` | 800x600 | `public/assets/scenes/` | Detailed map of downtown financial district, skyscrapers, corporate towers, banks, hand-drawn style |

---

## 🎭 三、事件图片（优先级：中）

事件图片分为 `background`（背景场景）和 `foreground`（前景人物/物品）。

### 3.1 通用场景背景（可复用）

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `bg_dark_alley.jpg` | 1920x1080 | `public/assets/scenes/` | Dark urban alley at night, cyberpunk noir, neon reflections, foggy atmosphere |
| `bg_park_day.jpg` | 1920x1080 | `public/assets/scenes/` | City park in daytime, benches, trees, urban background |
| `bg_street_night.jpg` | 1920x1080 | `public/assets/scenes/` | City street at night, streetlights, passing cars, urban atmosphere |
| `bg_industrial_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Factory interior, industrial machinery, harsh lighting |
| `bg_office_cubicle.jpg` | 1920x1080 | `public/assets/scenes/` | Corporate office with cubicles, fluorescent lighting, beige walls |
| `bg_hospital_corridor.jpg` | 1920x1080 | `public/assets/scenes/` | Hospital corridor, sterile white, fluorescent lights, medical atmosphere |
| `bg_bank_interior.jpg` | 1920x1080 | `public/assets/scenes/` | Bank interior, marble floors, counters, professional atmosphere |
| `bg_supermarket.jpg` | 1920x1080 | `public/assets/scenes/` | Supermarket interior, bright lights, aisles, checkout counters |
| `bg_fastfood_kitchen.jpg` | 1920x1080 | `public/assets/scenes/` | Fast food kitchen, greasy, hot, chaotic, industrial cooking equipment |
| `bg_construction_site.jpg` | 1920x1080 | `public/assets/scenes/` | Construction site, hard hats, scaffolding, dust and machinery |

### 3.2 事件前景图（按需生成）

由于事件数量庞大（200+），建议按需生成。以下是高频使用的前景物类型：

| 类型 | 示例文件名 | AI提示词模板 |
|------|-----------|-------------|
| 人物情绪 | `evt_crying_worker.png` | Close-up of a crying worker, tears, emotional distress, photorealistic portrait |
| 法律文件 | `evt_court_summons.png` | Legal document, court summons, official stamp, dramatic lighting |
| 医疗账单 | `evt_medical_bill.png` | Hospital bill with shockingly high amount, red numbers, medical paperwork |
| 催收人员 | `evt_debt_collector.png` | Intimidating debt collector at door, threatening posture, dark atmosphere |
| 失业通知 | `evt_pink_slip.png` | Termination letter, pink slip, corporate stationery |
| 破损物品 | `evt_broken_car.png` | Broken-down car, smoke, mechanical failure, street scene |
| 成瘾物品 | `evt_pill_bottles.png` | Prescription pill bottles, opioid crisis imagery, medical addiction |
| 食物相关 | `evt_expired_food.png` | Expired food, mold, food insecurity, poverty |

---

## 🎒 四、物品图标（优先级：中）

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `icon_food_expired.png` | 128x128 | `public/assets/items/` | Pixel art or stylized icon of expired Doritos bag, junk food, game item icon |
| `icon_medical_tape.png` | 128x128 | `public/assets/items/` | Duct tape medical kit icon, makeshift healthcare, pixel art style |
| `icon_survival_kit.png` | 128x128 | `public/assets/items/` | Preppers survival kit icon, canned food, radio, flashlight |
| `icon_fake_passport.png` | 128x128 | `public/assets/items/` | Fake passport icon, forged documents, escape theme |
| `icon_painkillers.png` | 128x128 | `public/assets/items/` | Pill bottle icon, opioid epidemic reference |
| `icon_car_junk.png` | 128x128 | `public/assets/items/` | Rusty old car icon, broken down vehicle |
| `icon_car_luxury.png` | 128x128 | `public/assets/items/` | Luxury car icon, status symbol |

---

## 🖼️ 五、纹理贴图（优先级：低）

已有部分，如需增强：

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `noise.svg` | 256x256 | `public/assets/textures/` | Seamless noise texture, film grain, vintage |
| `paper_texture.png` | 1024x1024 | `public/assets/textures/` | Old paper texture, stained, vintage document |
| `crinkled_paper.png` | 1024x1024 | `public/assets/textures/` | Wrinkled paper texture, map background |
| `scanlines.svg` | 100x4 | `public/assets/textures/` | CRT scanline pattern, retro TV effect |

---

## 🎯 六、UI元素（优先级：中）

| 文件名 | 尺寸 | 放置位置 | AI提示词 |
|--------|------|----------|----------|
| `pixel_phone_frame.png` | 400x800 | `public/assets/ui/` | Retro pixel art phone frame, smartphone UI border, game interface |
| `button_texture.png` | 200x64 | `public/assets/ui/` | Button texture, industrial metal, game UI element |
| `panel_dark.png` | 400x300 | `public/assets/ui/` | Dark panel background, cyberpunk UI element |

---

## 📋 生成优先级总结

### 必须生成（游戏体验必需）
1. 信仰系统8张背景图（exterior/interior × 4区域）
2. 地图底图改进版
3. 核心事件背景图（10张通用场景）

### 建议生成（提升体验）
4. 高频事件前景图（50张左右）
5. 物品图标（20个左右）
6. UI元素

### 可选生成
7. 剩余事件图片
8. 额外纹理

---

## 🛠️ 技术规格

### 图片格式
- **背景图**: JPG (质量90%), PNG (需要透明时)
- **图标/UI**: PNG (透明背景)
- **纹理**: SVG (矢量), PNG (位图)

### 命名规范
- 使用小写字母
- 单词间用下划线 `_` 连接
- 背景图前缀: `bg_`
- 事件图前缀: `evt_`
- 图标前缀: `icon_`

### 文件大小建议
- 背景图: < 500KB
- 图标: < 50KB
- 纹理: < 100KB

---

## 🎨 艺术风格指南

### 整体风格
- **赛博朋克 noir**: 霓虹灯 + 黑色电影美学
- **反乌托邦现实主义**: 基于现实的夸张
- **阶级视觉区分**:
  - 贫民窟: 橙褐色，肮脏，混乱
  - 铁锈带: 紫红色，工业，颓废
  - 郊区: 蓝白色，干净，虚假完美
  - 核心区: 暗金色，高科技，冷峻

### 色彩参考
| 区域 | 主色调 | 辅助色 | 氛围 |
|------|--------|--------|------|
| Slums | #D2691E (巧克力色) | #8B4513 (马鞍棕) | 肮脏、绝望 |
| Rust Belt | #800080 (紫色) | #DC143C (深红) | 工业、危险 |
| Suburbs | #F0F8FF (爱丽丝蓝) | #E6E6FA (淡紫) | 虚假、 sterile |
| Downtown | #FFD700 (金色) | #1C1C1C (近黑) | 奢华、冷漠 |

---

## ✅ 检查清单

生成图片后检查：
- [ ] 文件名正确，放置到对应目录
- [ ] 尺寸符合要求
- [ ] 文件大小合理
- [ ] 风格统一
- [ ] 游戏内显示正常
