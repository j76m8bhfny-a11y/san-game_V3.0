# 工作系统 (Job System) 素材制作指南

> 版本: 1.0 | 四区域独立设计 | 与代码实际使用路径一致

---

## 📁 文件夹结构

```
game/public/assets/job/
├── slums/
│   ├── wood_bg.jpg          # 受潮木纹背景 (1920x1080)
│   ├── paper.png            # 撕裂笔记本纸 (400x500)
│   └── tape.png             # 透明胶带装饰 (200x60)
├── rust/
│   ├── metal_bg.jpg         # 金属网格背景 (1920x1080)
│   ├── punch_card.png       # 打卡纸 (500x300)
│   └── button_red.png       # 机械按钮 (可选, 120x80)
├── suburbs/
│   ├── glass_bg.jpg         # 磨砂玻璃背景 (1920x1080)
│   └── card_clean.png       # 干净卡片 (500x350)
└── downtown/
    ├── leather_bg.jpg       # 皮革背景 (1920x1080)
    ├── stationery.png       # 高级信纸 (500x400)
    └── wax_seal.png         # 火漆印章 (可选, 100x100)
```

---

## 🎨 AI 绘画提示词

### Slums（贫民窟）

#### wood_bg.jpg (1920x1080)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
weathered wooden telephone pole texture, vertical wood grain,
rotten wood, brown and gray tones, water stains, seamless pattern,
16-bit color palette, dithering patterns --ar 16:9 --v 6
```

#### paper.png (400x500, 透明背景)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
torn piece of cheap lined notebook paper, yellowed paper,
coffee stains, ripped edges, crumpled texture,
isolated on transparent background,
16-bit color --ar 4:5 --v 6
```

#### tape.png (200x60, 透明背景)
```
PC-98 style, pixel art, masking tape texture,
wrinkled transparent tape, slightly yellowed,
isolated on transparent background,
16-bit color --ar 10:3 --v 6
```

---

### Rust Belt（工厂区）

#### metal_bg.jpg (1920x1080)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
rusty metal diamond plate texture, industrial steel floor,
oil stains, scratched metal, dark grey and orange rust,
seamless pattern, 16-bit color, dithering --ar 16:9 --v 6
```

#### punch_card.png (500x300, 透明背景)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
vintage time punch card, stiff manila cardboard texture,
grid lines, holes on left side, oil smudge, worn edges,
isolated on transparent background, 16-bit color --ar 5:3 --v 6
```

---

### Suburbs（郊区）

#### glass_bg.jpg (1920x1080)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
frosted glass texture, blurred office background behind,
white and light blue tones, clean and sterile, soft gradient,
subtle noise texture, 16-bit color --ar 16:9 --v 6
```

#### card_clean.png (500x350, 透明背景)
```
PC-98 style, pixel art, clean white card,
rounded corners, subtle shadow, minimalist design,
professional business card aesthetic,
isolated on transparent background, 16-bit color --ar 10:7 --v 6
```

---

### Downtown（核心区）

#### leather_bg.jpg (1920x1080)
```
PC-98 style, retro adventure game, pixel art, 1990s anime style,
dark brown luxury leather texture, full grain leather,
expensive texture, dimly lit, subtle sheen and creases,
deep brown and gold tones, seamless pattern,
16-bit color --ar 16:9 --v 6
```

#### stationery.png (500x400, 透明背景)
```
PC-98 style, pixel art, expensive cream stationery paper,
high quality texture, elegant watermark, deckled edges,
slightly aged, executive letterhead aesthetic,
isolated on transparent background, 16-bit color --ar 5:4 --v 6
```

#### wax_seal.png (100x100, 透明背景, 可选)
```
PC-98 style, pixel art, red wax seal,
circular, stamped texture with decorative pattern,
realistic shadow, wax drips,
isolated on transparent background, 16-bit color --ar 1:1 --v 6
```

---

## ✅ 制作检查清单

生成图片后检查：
- [ ] 背景图片 (wood_bg, metal_bg, glass_bg, leather_bg) 为 JPG 格式，不透明
- [ ] 卡片图片 (paper, punch_card, card_clean, stationery) 为 PNG 格式，透明背景
- [ ] 分辨率符合规格
- [ ] PC-98 风格：16-bit 色彩，dithering 纹理
- [ ] 文件放入正确文件夹

---

## 🔧 代码修改总结

已修改的文件：
1. `game/src/config/jobUIConfig.ts` - 添加 SUBURBS 主题，移除 GLOBAL
2. `game/src/components/game/JobBoardModal.tsx` - 四区域独立背景、Header、布局
3. `game/src/components/game/Jobs/JobPaper.tsx` - 四区域独立卡片样式

---

*文档版本: 1.0*
*最后更新: 2024*
