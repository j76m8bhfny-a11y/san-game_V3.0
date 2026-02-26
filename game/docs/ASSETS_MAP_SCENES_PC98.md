# 地图场景素材指南 - PC-98风格

> 版本: 1.0 | 四个地图区域场景素材 | 与代码实际使用一致

⚠️ **本文档路径与代码完全匹配** - 所有素材路径均从代码中提取

---

## 🎨 艺术风格规范

```
PC-98 style, retro adventure game, pixel art, 1990s anime style, 
16-bit color palette, dithering patterns, scanline effect,
full scene composition, American urban setting
```

### 技术规格
| 属性 | 背景图 | 图标/道具 |
|------|--------|----------|
| **分辨率** | 1920x1080 或 110vw全宽 | 200x200 ~ 400x400 |
| **格式** | `.jpg` (不透明) | `.png` (透明背景) |
| **色彩** | 16-bit调色板，dithering | 16-bit调色板 |

---

## 🏭 一、Rust Belt (铁锈带)

> 色调：工业紫红调，阴郁天空，废弃工厂背景

### 1.1 背景图层

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `sky_overcast.jpg` | 全屏 | `assets/scenes/rust/` | 阴云天空 | PC-98 style, retro adventure game, pixel art, 1990s anime style, overcast industrial sky, gray and purple tones, smog atmosphere, gloomy clouds, 16-bit color, dithering |
| `street_base.jpg` | 全屏 | `assets/scenes/rust/` | 街道基础 | PC-98 style, retro adventure game, pixel art, 1990s anime style, rust belt street scene, cracked asphalt, abandoned factory in background, industrial decay, purple and gray tones, 16-bit color |

### 1.2 可交互对象 (obj_)

#### 银行
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_bank_check.png` | 300x250 | `assets/scenes/rust/` | 银行（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, check cashing store, neon sign "CHECKS CASHED", barred windows, rust belt style, purple lighting, 16-bit color |
| `obj_bank_check_lit.png` | 300x250 | `assets/scenes/rust/` | 银行（高亮） | 同上，霓虹灯亮起，发光效果 |

#### 商店
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_shop_gas.png` | 350x300 | `assets/scenes/rust/` | 加油站商店（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, gas station convenience store, broken pumps, flickering neon, rust belt industrial area, purple and gray, 16-bit color |
| `obj_shop_gas_lit.png` | 350x300 | `assets/scenes/rust/` | 加油站商店（高亮） | 同上，霓虹灯亮起 |

#### 医院
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_hospital_care.png` | 320x280 | `assets/scenes/rust/` | 社区诊所（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, urgent care clinic, industrial area medical center, red cross symbol, purple lighting, 16-bit color |
| `obj_hospital_care_lit.png` | 320x280 | `assets/scenes/rust/` | 社区诊所（高亮） | 同上，灯光亮起 |

#### 住房
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_housing_motel.png` | 400x300 | `assets/scenes/rust/` | 汽车旅馆（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, cheap roadside motel, neon vacancy sign, rust belt decay, purple and gray tones, 16-bit color |
| `obj_housing_motel_lit.png` | 400x300 | `assets/scenes/rust/` | 汽车旅馆（高亮） | 同上，霓虹灯亮起 |

#### 保险
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_insurance_table.png` | 250x200 | `assets/scenes/rust/` | 保险摊位（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, makeshift insurance booth, folding table with papers, rust belt industrial setting, 16-bit color |
| `obj_insurance_table_lit.png` | 250x200 | `assets/scenes/rust/` | 保险摊位（高亮） | 同上，灯光效果 |

#### 工作
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_job_gate.png` | 300x350 | `assets/scenes/rust/` | 工厂大门（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, factory employment gate, chain link fence, industrial hiring entrance, rust and purple tones, 16-bit color |
| `obj_job_gate_lit.png` | 300x350 | `assets/scenes/rust/` | 工厂大门（高亮） | 同上，灯光亮起 |

#### 车辆
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_vehicle_dealership.png` | 380x280 | `assets/scenes/rust/` | 二手车行（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, used car lot, rusted vehicles, cheap dealership, bunting flags, rust belt style, 16-bit color |
| `obj_vehicle_dealership_hover.png` | 380x280 | `assets/scenes/rust/` | 二手车行（悬停） | 同上，高亮效果 |

### 1.3 装饰道具 (prop_)

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `prop_broken_truck.png` | 450x300 | `assets/scenes/rust/` | 破损卡车（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, abandoned rusted truck, flat tires, broken windows, industrial street, 16-bit color |
| `prop_broken_truck_smoke.png` | 450x300 | `assets/scenes/rust/` | 破损卡车（冒烟） | 同上，引擎盖冒烟效果 |
| `prop_strike_sign.png` | 200x250 | `assets/scenes/rust/` | 罢工标语（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, workers strike sign, union picket, handwritten protest message, 16-bit color |
| `prop_strike_sign_fallen.png` | 200x250 | `assets/scenes/rust/` | 罢工标语（倒下） | 同上，标语倒在地上 |
| `prop_stray_dog.png` | 150x120 | `assets/scenes/rust/` | 流浪狗 | PC-98 style, retro adventure game, pixel art, 1990s anime style, thin stray dog, scruffy fur, industrial street, sad eyes, 16-bit color |
| `prop_coffee_cup.png` | 80x80 | `assets/scenes/rust/` | 咖啡杯 | PC-98 style, retro adventure game, pixel art, 1990s anime style, disposable coffee cup, steam rising, litter on street, 16-bit color |

---

## 🌃 二、Downtown (市中心)

> 色调：夜晚深蓝金色调，摩天大楼，繁华都市

### 2.1 背景图层

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `sky_night.jpg` | 全屏 | `assets/scenes/downtown/` | 夜晚天空 | PC-98 style, retro adventure game, pixel art, 1990s anime style, downtown night sky, deep blue and gold, city lights glow, skyscrapers silhouette, 16-bit color |
| `street_base.jpg` | 全屏 | `assets/scenes/downtown/` | 街道基础 | PC-98 style, retro adventure game, pixel art, 1990s anime style, downtown city street, skyscrapers, neon signs, wet pavement reflections, luxury and power, dark blue and gold, 16-bit color |

### 2.2 可交互对象 (obj_)

#### 银行
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_bank_vault.png` | 350x400 | `assets/scenes/downtown/` | 私人金库（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, private bank vault entrance, massive steel door, gold and marble, elite financial, dark blue lighting, 16-bit color |
| `obj_bank_vault_open.png` | 350x400 | `assets/scenes/downtown/` | 私人金库（开启） | 同上，金库门打开 |

#### 商店
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_shop_club.png` | 320x300 | `assets/scenes/downtown/` | 私人会所（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, exclusive members club, velvet ropes, golden doors, luxury retail, downtown elite, dark blue and gold, 16-bit color |
| `obj_shop_club_lit.png` | 320x300 | `assets/scenes/downtown/` | 私人会所（高亮） | 同上，灯光亮起 |

#### 医院
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_hospital_lab.png` | 340x320 | `assets/scenes/downtown/` | 基因实验室（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, high-tech medical lab, genetic therapy center, glass walls, futuristic equipment, downtown luxury, 16-bit color |
| `obj_hospital_lab_lit.png` | 340x320 | `assets/scenes/downtown/` | 基因实验室（高亮） | 同上，灯光亮起 |

#### 住房
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_housing_penthouse.png` | 450x380 | `assets/scenes/downtown/` | 顶层公寓（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, luxury penthouse entrance, glass elevator, gold fixtures, downtown high-rise living, 16-bit color |
| `obj_housing_penthouse_lit.png` | 450x380 | `assets/scenes/downtown/` | 顶层公寓（高亮） | 同上，灯光亮起 |

#### 保险
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_insurance_briefcase.png` | 200x180 | `assets/scenes/downtown/` | 保险公文包 | PC-98 style, retro adventure game, pixel art, 1990s anime style, leather briefcase with insurance documents, gold clasps, downtown business district, 16-bit color |

#### 工作
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_job_hq.png` | 400x350 | `assets/scenes/downtown/` | 企业总部（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, corporate headquarters entrance, revolving doors, glass facade, downtown skyscraper, dark blue and gold, 16-bit color |
| `obj_job_hq_lit.png` | 400x350 | `assets/scenes/downtown/` | 企业总部（高亮） | 同上，灯光亮起 |

#### 车辆
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_vehicle_showroom.png` | 420x320 | `assets/scenes/downtown/` | 豪车展厅（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, luxury car dealership showroom, sports cars, glass walls, downtown high-end, 16-bit color |
| `obj_vehicle_showroom_hover.png` | 420x320 | `assets/scenes/downtown/` | 豪车展厅（悬停） | 同上，高亮效果 |

### 2.3 装饰道具 (prop_)

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `prop_bull.png` | 300x250 | `assets/scenes/downtown/` | 华尔街铜牛 | PC-98 style, retro adventure game, pixel art, 1990s anime style, charging bull statue, bronze, financial district symbol, downtown wall street, 16-bit color |

---

## 🏚️ 三、Slums (贫民窟)

> 色调：黄昏橙褐调，破败街区，混乱危险

### 3.1 背景图层

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `sky_dusk.jpg` | 全屏 | `assets/scenes/slums/` | 黄昏天空 | PC-98 style, retro adventure game, pixel art, 1990s anime style, urban dusk sky, orange and purple, smog and pollution, dying light, 16-bit color |
| `slums_street_base_panorama.jpg` | 全景 | `assets/scenes/slums/` | 街道全景 | PC-98 style, retro adventure game, pixel art, 1990s anime style, slums street panorama, shanties, graffiti, broken pavement, garbage, orange and brown decay, 16-bit color |

### 3.2 可交互对象 (obj_)

#### 银行
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_bank_loan.png` | 280x240 | `assets/scenes/slums/` | 高利贷（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, predatory loan storefront, neon sign "LOANS", barred windows, slums corner, 16-bit color |
| `obj_bank_loan_neon.png` | 280x240 | `assets/scenes/slums/` | 高利贷（霓虹） | 同上，霓虹灯亮起 |

#### 信仰
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_faith_shrine.png` | 300x280 | `assets/scenes/slums/` | 街头神龛（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, makeshift street shrine, candles, offerings, corrugated metal, religious graffiti, slums, 16-bit color |
| `obj_faith_shrine_lit.png` | 300x280 | `assets/scenes/slums/` | 街头神龛（高亮） | 同上，烛光亮起 |

#### 商店
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_shop_car.png` | 350x280 | `assets/scenes/slums/` | 后备箱商店（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, car trunk shop, street vendor, selling goods from car, slums informal economy, 16-bit color |
| `obj_shop_car_open.png` | 350x280 | `assets/scenes/slums/` | 后备箱商店（开启） | 同上，后备箱打开 |

#### 医院
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_hospital_door.png` | 250x320 | `assets/scenes/slums/` | 诊所后门（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, back alley clinic door, unmarked, sketchy medical, slums, metal door, 16-bit color |
| `obj_hospital_door_glow.png` | 250x320 | `assets/scenes/slums/` | 诊所后门（发光） | 同上，门缝透出光线 |

#### 住房
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_home_tent.png` | 280x220 | `assets/scenes/slums/` | 帐篷住所（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, homeless encampment tent, cardboard, tarp, slums sidewalk, 16-bit color |
| `obj_home_tent_open.png` | 280x220 | `assets/scenes/slums/` | 帐篷住所（敞开） | 同上，帐篷入口敞开 |

#### 保险
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_insurance_bench.png` | 220x180 | `assets/scenes/slums/` | 保险长椅（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, park bench with insurance salesman, papers scattered, slums park, 16-bit color |
| `obj_insurance_bench_hover.png` | 220x180 | `assets/scenes/slums/` | 保险长椅（悬停） | 同上，高亮效果 |

#### 工作
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_job_pole.png` | 200x350 | `assets/scenes/slums/` | 招工电线杆（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, utility pole with job flyers, day laborer meeting spot, slums corner, 16-bit color |
| `obj_job_pole_hover.png` | 200x350 | `assets/scenes/slums/` | 招工电线杆（悬停） | 同上，高亮效果 |

#### 车辆
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_vehicle_chopshop.png` | 380x280 | `assets/scenes/slums/` | 拆车厂（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, illegal chop shop, car parts scattered, welding equipment, slums industrial, 16-bit color |
| `obj_vehicle_chopshop_hover.png` | 380x280 | `assets/scenes/slums/` | 拆车厂（悬停） | 同上，高亮效果 |

### 3.3 装饰道具 (prop_)

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `prop_barrel.png` | 120x150 | `assets/scenes/slums/` | 油桶（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, metal barrel, trash burning, slums alley, 16-bit color |
| `prop_barrel_fire.png` | 120x150 | `assets/scenes/slums/` | 油桶（燃烧） | 同上，火焰燃烧 |
| `prop_gang.png` | 200x250 | `assets/scenes/slums/` | 帮派成员（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, gang members standing, hoodies, graffiti wall, slums corner, 16-bit color |
| `prop_gang_threat.png` | 200x250 | `assets/scenes/slums/` | 帮派成员（威胁） | 同上，攻击性姿态 |
| `prop_junkie.png` | 150x200 | `assets/scenes/slums/` | 吸毒者（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, drug user slumped, alleyway, slums desperation, 16-bit color |
| `prop_junkie_active.png` | 150x200 | `assets/scenes/slums/` | 吸毒者（兴奋） | 同上，兴奋状态 |

---

## 🏡 四、Suburbs (郊区)

> 色调：晴朗蓝白调，整洁街道，中产阶级安宁

### 4.1 背景图层

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `sky_sunny.jpg` | 全屏 | `assets/scenes/suburbs/` | 晴朗天空 | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban sunny sky, bright blue, fluffy white clouds, peaceful day, 16-bit color |
| `street_base.jpg` | 全屏 | `assets/scenes/suburbs/` | 街道基础 | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban neighborhood street, manicured lawns, picket fences, SUVs parked, blue and white tranquility, 16-bit color |

### 4.2 可交互对象 (obj_)

#### 银行
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_bank_branch.png` | 380x300 | `assets/scenes/suburbs/` | 社区银行（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban bank branch, friendly facade, ATM, blue and white, welcoming, 16-bit color |
| `obj_bank_branch_lit.png` | 380x300 | `assets/scenes/suburbs/` | 社区银行（高亮） | 同上，灯光亮起 |

#### 商店
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_shop_market.png` | 360x280 | `assets/scenes/suburbs/` | 有机超市（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, organic grocery market, Whole Foods style, green signage, suburban shopping, 16-bit color |
| `obj_shop_market_lit.png` | 360x280 | `assets/scenes/suburbs/` | 有机超市（高亮） | 同上，灯光亮起 |

#### 医院
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_hospital_pharmacy.png` | 320x280 | `assets/scenes/suburbs/` | 药房诊所（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban urgent care pharmacy, clean and modern, family medical, blue and white, 16-bit color |
| `obj_hospital_pharmacy_lit.png` | 320x280 | `assets/scenes/suburbs/` | 药房诊所（高亮） | 同上，灯光亮起 |

#### 住房
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_housing_house.png` | 450x350 | `assets/scenes/suburbs/` | 郊区别墅（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban family house, two-story, garage, manicured lawn, American dream, blue sky, 16-bit color |
| `obj_housing_house_open.png` | 450x350 | `assets/scenes/suburbs/` | 郊区别墅（敞开） | 同上，车库门打开 |

#### 保险
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_insurance_sign.png` | 200x250 | `assets/scenes/suburbs/` | 保险广告牌（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, State Farm style insurance sign, suburban strip mall, friendly agent image, 16-bit color |
| `obj_insurance_sign_hover.png` | 200x250 | `assets/scenes/suburbs/` | 保险广告牌（悬停） | 同上，高亮效果 |

#### 工作
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_job_office.png` | 380x320 | `assets/scenes/suburbs/` | 写字楼（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban office park, professional building, parking lot, corporate jobs, blue and white, 16-bit color |
| `obj_job_office_lit.png` | 380x320 | `assets/scenes/suburbs/` | 写字楼（高亮） | 同上，灯光亮起 |

#### 车辆
| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `obj_vehicle_dealership.png` | 400x300 | `assets/scenes/suburbs/` | 4S店（默认） | PC-98 style, retro adventure game, pixel art, 1990s anime style, new car dealership, American brand, balloon decorations, suburban auto row, 16-bit color |
| `obj_vehicle_dealership_hover.png` | 400x300 | `assets/scenes/suburbs/` | 4S店（悬停） | 同上，高亮效果 |

### 4.3 装饰道具 (prop_)

| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |
|--------|------|------|----------|--------|
| `prop_flyer_pile.png` | 150x120 | `assets/scenes/suburbs/` | 传单堆 | PC-98 style, retro adventure game, pixel art, 1990s anime style, pile of HOA newsletters and junk mail, suburban mailbox, 16-bit color |
| `prop_hoa_sign.png` | 180x200 | `assets/scenes/suburbs/` | 业委会告示 | PC-98 style, retro adventure game, pixel art, 1990s anime style, HOA warning sign, lawn height violation, suburban conformity, 16-bit color |
| `prop_packages.png` | 200x150 | `assets/scenes/suburbs/` | 快递包裹 | PC-98 style, retro adventure game, pixel art, 1990s anime style, Amazon packages on porch, suburban delivery, consumerism, 16-bit color |

---

## 📋 快速参考

### 命名规范
- `obj_{功能}_{具体名称}.png` - 可交互对象（建筑、设施）
- `prop_{名称}.png` - 装饰性道具
- `{name}_lit.png` - 高亮/亮起状态
- `{name}_hover.png` - 鼠标悬停状态
- `{name}_open.png` - 打开/开启状态

### 功能分类
| 前缀 | 功能 |
|------|------|
| `obj_bank_*` | 银行/金融 |
| `obj_shop_*` | 商店 |
| `obj_hospital_*` | 医院/医疗 |
| `obj_housing_*` / `obj_home_*` | 住房 |
| `obj_insurance_*` | 保险 |
| `obj_job_*` | 工作/就业 |
| `obj_vehicle_*` | 车辆 |
| `obj_faith_*` | 信仰（仅Slums） |

---

*文档版本: 1.0*
*与代码完全同步*
