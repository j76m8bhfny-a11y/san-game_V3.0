# PC-98 风格素材管理指南

> 版本: 2.0 | PC-98 Retro Adventure Game Style | 独立元素抠图版

---

## 🎨 艺术风格规范

### 核心风格关键词
```
PC-98 style, retro adventure game, pixel art, 1990s anime style, 
16-bit color palette, dithering patterns, scanline effect,
isolated on transparent background, full object view, no background elements
```

### 技术规格
| 属性 | 规格 |
|------|------|
| **分辨率** | 640x480 (标准) / 320x240 (小物件) |
| **色彩深度** | 16-bit (65536色)，模拟256色限制 |
| **透明背景** | 必须，使用 alpha channel |
| **像素密度** | 清晰可见的像素颗粒感 |
| **描边** | 2-3像素深色描边 |
| **阴影** | 简单的投影阴影，便于分层 |

---

## 🏛️ 一、监狱系统 (Prison System)

### 1.1 监狱场景元素

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `prison_cell_complete.png` | 640x480 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, prison cell interior, complete full view, iron bars, concrete walls, metal bed frame, toilet, isolated on transparent background, no background elements, 16-bit color palette, dithering patterns |
| `prison_bars_single.png` | 320x480 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, prison iron bars, complete single set of bars, vertical metal rods, rust texture, isolated on transparent background, no background elements, 16-bit color, scanline effect |
| `prison_bed_metal.png` | 200x120 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, metal prison bed frame, complete single bed, thin mattress, isolated on transparent background, no background elements, side view, 16-bit color palette |
| `prison_toilet_stainless.png` | 80x120 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, stainless steel prison toilet, complete object, combination sink-toilet unit, isolated on transparent background, no background elements, 16-bit color |
| `prison_bench_wooden.png` | 200x100 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wooden prison bench, complete full view, backless, worn wood texture, isolated on transparent background, no background elements, 16-bit color |
| `prison_door_heavy.png` | 160x320 | `assets/scenes/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, heavy metal prison door, complete full view, riveted steel, small window with bars, isolated on transparent background, no background elements, 16-bit color, dithering |

### 1.2 监狱道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `prison_uniform_orange.png` | 120x160 | `assets/items/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, orange prison jumpsuit, complete folded uniform, isolated on transparent background, no background elements, 16-bit color palette |
| `prison_handcuffs_metal.png` | 80x60 | `assets/items/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, metal handcuffs, complete object, closed position, silver metal, isolated on transparent background, no background elements, 16-bit color |
| `prison_chain_ball.png` | 100x100 | `assets/items/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, ball and chain, complete object, iron ball with chain, isolated on transparent background, no background elements, 16-bit color |
| `prison_document_release.png` | 120x160 | `assets/items/prison/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, release papers, single document, official form with stamp, isolated on transparent background, no background elements, 16-bit color |

---

## 🕊️ 二、信仰系统 (Faith System)

### 2.1 信仰建筑（按区域）

#### Downtown - 共济会风格
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `faith_downtown_lodge_exterior.png` | 640x480 | `assets/scenes/faith/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, Masonic temple exterior, complete full building view, art deco architecture, dark gold and black, columns, pyramid roof with eye symbol, isolated on transparent background, no background elements, 16-bit color palette, dithering patterns |
| `faith_downtown_lodge_interior.png` | 640x480 | `assets/scenes/faith/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, Masonic temple interior, complete room view, checkerboard floor, throne chair, candles, heavy curtains, dark gold decor, isolated on transparent background, no background elements, 16-bit color |
| `faith_downtown_altar.png` | 200x160 | `assets/scenes/faith/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, Masonic altar, complete object, black marble, gold symbols, candles on sides, isolated on transparent background, no background elements, 16-bit color |
| `faith_downtown_throne.png` | 160x200 | `assets/scenes/faith/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, ornate throne chair, complete single chair, red velvet, gold frame, high back, isolated on transparent background, no background elements, 16-bit color palette |

#### Rust Belt - 工业教堂
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `faith_rust_church_exterior.png` | 640x480 | `assets/scenes/faith/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, industrial church exterior, complete full building view, brick walls, purple and red neon crosses, factory chimney background, isolated on transparent background, no background elements, 16-bit color palette, dithering patterns |
| `faith_rust_church_interior.png` | 640x480 | `assets/scenes/faith/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, industrial church interior, complete room view, exposed brick, purple lighting, wooden pews, steel beam cross, isolated on transparent background, no background elements, 16-bit color |
| `faith_rust_cross_steel.png` | 120x200 | `assets/scenes/faith/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, steel beam cross, complete object, welded I-beams, industrial look, rust texture, isolated on transparent background, no background elements, 16-bit color |
| `faith_rust_pew_wooden.png` | 200x100 | `assets/scenes/faith/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wooden church pew, complete single bench, worn wood, simple design, isolated on transparent background, no background elements, 16-bit color |

#### Slums - 贫民窟神龛
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `faith_slums_shrine_exterior.png` | 640x480 | `assets/scenes/faith/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, makeshift slum shrine, complete full structure view, corrugated metal walls, religious graffiti, candles, offerings, orange and brown tones, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `faith_slums_shrine_interior.png` | 640x480 | `assets/scenes/faith/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, slum shrine interior, complete room view, broken statue, mystical symbols on dirty walls, dim orange lighting, isolated on transparent background, no background elements, 16-bit color |
| `faith_slums_statue_broken.png` | 120x200 | `assets/scenes/faith/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, broken religious statue, complete object, cracked plaster, missing arm, isolated on transparent background, no background elements, 16-bit color |
| `faith_slums_offering_table.png` | 160x100 | `assets/scenes/faith/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, makeshift offering table, complete object, wooden crate, candles, incense, isolated on transparent background, no background elements, 16-bit color |

#### Suburbs - 现代 megachurch
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `faith_suburbs_church_exterior.png` | 640x480 | `assets/scenes/faith/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, modern suburban megachurch exterior, complete full building view, glass facade, blue and white, pristine, parking lot, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `faith_suburbs_church_interior.png` | 640x480 | `assets/scenes/faith/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, modern church interior, complete room view, blue and white color scheme, LED screens, comfortable seating, Starbucks corner, isolated on transparent background, no background elements, 16-bit color |
| `faith_suburbs_seat_comfortable.png` | 120x100 | `assets/scenes/faith/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, comfortable church seat, complete single chair, padded, blue fabric, modern design, isolated on transparent background, no background elements, 16-bit color |
| `faith_suburbs_screen_led.png` | 200x120 | `assets/scenes/faith/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, LED screen, complete object, large flat display, blue glow, isolated on transparent background, no background elements, 16-bit color |

### 2.2 信仰道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `faith_item_bible.png` | 80x100 | `assets/items/faith/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, holy bible, complete single book, black leather cover, gold cross, closed, isolated on transparent background, no background elements, 16-bit color |
| `faith_item_candle.png` | 40x80 | `assets/items/faith/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, lit candle, complete object, wax dripping, orange flame, isolated on transparent background, no background elements, 16-bit color |
| `faith_item_cross_gold.png` | 60x100 | `assets/items/faith/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, gold cross, complete object, ornate design, hanging ornament, isolated on transparent background, no background elements, 16-bit color |
| `faith_item_robe_priest.png` | 120x160 | `assets/items/faith/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, priest robe, complete folded garment, black fabric, white collar, isolated on transparent background, no background elements, 16-bit color |

---

## 🏦 三、银行/金融系统 (Bank System)

### 3.1 银行场景

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `bank_interior_complete.png` | 640x480 | `assets/scenes/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, bank interior, complete room view, marble floor, teller counters, security glass, vault door, isolated on transparent background, no background elements, 16-bit color palette, dithering patterns |
| `bank_vault_door.png` | 200x240 | `assets/scenes/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, bank vault door, complete object, massive circular steel door, combination lock, isolated on transparent background, no background elements, 16-bit color |
| `bank_teller_counter.png` | 320x120 | `assets/scenes/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, bank teller counter, complete object, marble top, security glass partition, isolated on transparent background, no background elements, 16-bit color |
| `bank_chair_office.png` | 100x120 | `assets/scenes/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, office chair, complete single chair, leather, bank style, isolated on transparent background, no background elements, 16-bit color |
| `bank_desk_wooden.png` | 240x120 | `assets/scenes/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wooden bank desk, complete object, dark mahogany, executive style, isolated on transparent background, no background elements, 16-bit color |

### 3.2 金融道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `bank_item_money_stack.png` | 100x80 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, stack of cash, complete object, bound with paper band, green bills, isolated on transparent background, no background elements, 16-bit color |
| `bank_item_credit_card.png` | 60x40 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, credit card, complete single card, plastic, magnetic stripe, isolated on transparent background, no background elements, 16-bit color |
| `bank_item_checkbook.png` | 80x100 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, checkbook, complete object, leather cover, checks inside, isolated on transparent background, no background elements, 16-bit color |
| `bank_item_coin_stack.png` | 60x80 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, stack of gold coins, complete object, shiny, isolated on transparent background, no background elements, 16-bit color |
| `bank_item_document_loan.png` | 100x140 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, loan document, single paper, contract with fine print, isolated on transparent background, no background elements, 16-bit color |
| `bank_item_calculator.png` | 80x100 | `assets/items/bank/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, vintage calculator, complete object, LCD screen, buttons, isolated on transparent background, no background elements, 16-bit color |

---

## 🏠 四、住房系统 (Housing System)

### 4.1 按区域的住房建筑

#### Slums 贫民窟
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `housing_slums_tent.png` | 240x200 | `assets/scenes/housing/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, homeless tent, complete full structure, canvas fabric, patched, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `housing_slums_cardboard_box.png` | 160x120 | `assets/scenes/housing/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, cardboard shelter, complete structure, boxes taped together, isolated on transparent background, no background elements, 16-bit color |
| `housing_slums_car_abandoned.png` | 240x160 | `assets/scenes/housing/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, abandoned car, complete vehicle, rusted, broken windows, isolated on transparent background, no background elements, 16-bit color |
| `housing_slums_shack.png` | 280x200 | `assets/scenes/housing/slums/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wooden shack, complete full building, corrugated metal roof, plywood walls, isolated on transparent background, no background elements, 16-bit color |

#### Rust Belt 铁锈带
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `housing_rust_trailer.png` | 320x200 | `assets/scenes/housing/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, mobile home trailer, complete full structure, aluminum siding, wheels, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `housing_rust_apartment_old.png` | 400x320 | `assets/scenes/housing/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, old apartment building, complete full building, brick, fire escape, isolated on transparent background, no background elements, 16-bit color |
| `housing_rust_boarding_house.png` | 360x280 | `assets/scenes/housing/rust/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, boarding house, complete full building, Victorian style, faded paint, isolated on transparent background, no background elements, 16-bit color |

#### Suburbs 郊区
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `housing_suburbs_house_small.png` | 360x280 | `assets/scenes/housing/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburban house, complete full building, two-story, white picket fence, garage, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `housing_suburbs_house_large.png` | 440x320 | `assets/scenes/housing/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, large suburban house, complete full building, colonial style, manicured lawn, isolated on transparent background, no background elements, 16-bit color |
| `housing_suburbs_townhouse.png` | 320x280 | `assets/scenes/housing/suburbs/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, townhouse, complete full building, connected units, modern, isolated on transparent background, no background elements, 16-bit color |

#### Downtown 核心区
| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `housing_downtown_loft.png` | 480x360 | `assets/scenes/housing/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, downtown loft apartment, complete interior view, exposed brick, large windows, high ceiling, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `housing_downtown_condo.png` | 400x320 | `assets/scenes/housing/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, luxury condo, complete full building, glass tower, penthouse, isolated on transparent background, no background elements, 16-bit color |
| `housing_downtown_penthouse.png` | 640x480 | `assets/scenes/housing/downtown/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, penthouse interior, complete room view, panoramic windows, luxury furniture, city view, isolated on transparent background, no background elements, 16-bit color |

### 4.2 家具道具（通用）

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `furniture_bed_single.png` | 160x200 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, single bed, complete object, metal frame, thin mattress, isolated on transparent background, no background elements, 16-bit color |
| `furniture_bed_double.png` | 200x200 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, double bed, complete object, wooden frame, comfortable mattress, isolated on transparent background, no background elements, 16-bit color |
| `furniture_couch_worn.png` | 200x120 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, worn couch, complete object, fabric, patched, springs showing, isolated on transparent background, no background elements, 16-bit color |
| `furniture_couch_leather.png` | 240x120 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, leather couch, complete object, black leather, modern, isolated on transparent background, no background elements, 16-bit color |
| `furniture_table_wooden.png` | 160x120 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wooden table, complete object, rectangular, four legs, isolated on transparent background, no background elements, 16-bit color |
| `furniture_chair_plastic.png` | 80x120 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, plastic chair, complete object, white, simple design, isolated on transparent background, no background elements, 16-bit color |
| `furniture_lamp_floor.png` | 60x160 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, floor lamp, complete object, standing lamp, lampshade, isolated on transparent background, no background elements, 16-bit color |
| `furniture_refrigerator.png` | 120x200 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, refrigerator, complete object, top freezer, white, isolated on transparent background, no background elements, 16-bit color |
| `furniture_tv_old.png` | 120x100 | `assets/items/furniture/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, old CRT television, complete object, bulky, antenna, isolated on transparent background, no background elements, 16-bit color |

---

## 💼 五、工作系统 (Job System)

### 5.1 工作场所

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `job_office_cubicle.png` | 640x480 | `assets/scenes/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, office cubicle farm, complete room view, beige partitions, fluorescent lights, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `job_factory_floor.png` | 640x480 | `assets/scenes/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, factory floor, complete room view, assembly line, machinery, isolated on transparent background, no background elements, 16-bit color |
| `job_warehouse_interior.png` | 640x480 | `assets/scenes/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, warehouse interior, complete room view, shelves, forklift, loading dock, isolated on transparent background, no background elements, 16-bit color |
| `job_restaurant_kitchen.png` | 640x480 | `assets/scenes/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, restaurant kitchen, complete room view, stainless steel, grills, pots, isolated on transparent background, no background elements, 16-bit color |
| `job_construction_site.png` | 640x480 | `assets/scenes/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, construction site, complete scene, scaffolding, hard hats, equipment, isolated on transparent background, no background elements, 16-bit color |

### 5.2 工作道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `job_item_hard_hat.png` | 80x60 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, construction hard hat, complete object, yellow, isolated on transparent background, no background elements, 16-bit color |
| `job_item_toolbox.png` | 100x80 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, red toolbox, complete object, metal, handle, isolated on transparent background, no background elements, 16-bit color |
| `job_item_laptop.png` | 100x80 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, laptop computer, complete object, vintage 90s style, open, isolated on transparent background, no background elements, 16-bit color |
| `job_item_briefcase.png` | 80x60 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, briefcase, complete object, leather, handle, isolated on transparent background, no background elements, 16-bit color |
| `job_item_uniform_fastfood.png` | 100x120 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, fast food uniform, complete folded uniform, polo shirt, visor, isolated on transparent background, no background elements, 16-bit color |
| `job_item_apron.png` | 80x100 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, work apron, complete object, white, pockets, isolated on transparent background, no background elements, 16-bit color |
| `job_item_name_badge.png` | 40x60 | `assets/items/job/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, employee name badge, complete object, plastic clip, blank name, isolated on transparent background, no background elements, 16-bit color |

---

## 🏥 六、医疗系统 (Medical System)

### 6.1 医疗场所

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `medical_hospital_room.png` | 640x480 | `assets/scenes/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, hospital room, complete room view, hospital bed, medical equipment, IV stand, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `medical_clinic_waiting.png` | 640x480 | `assets/scenes/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, clinic waiting room, complete room view, plastic chairs, reception desk, isolated on transparent background, no background elements, 16-bit color |
| `medical_pharmacy_counter.png` | 480x320 | `assets/scenes/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, pharmacy counter, complete scene, shelves of medicine, register, isolated on transparent background, no background elements, 16-bit color |
| `medical_emergency_room.png` | 640x480 | `assets/scenes/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, emergency room, complete room view, gurney, monitors, trauma equipment, isolated on transparent background, no background elements, 16-bit color |

### 6.2 医疗道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `medical_item_hospital_gown.png` | 100x120 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, hospital gown, complete folded garment, blue, pattern, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_wheelchair.png` | 120x160 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, wheelchair, complete object, metal frame, wheels, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_crutches.png` | 60x160 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, pair of crutches, complete objects, aluminum, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_bandages.png` | 60x80 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, bandage roll, complete object, white, medical tape, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_pill_bottle.png` | 40x80 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, prescription pill bottle, complete object, orange, white cap, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_iv_bag.png` | 60x100 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, IV bag, complete object, clear liquid, tube, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_stethoscope.png` | 80x60 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, stethoscope, complete object, black tubing, silver chest piece, isolated on transparent background, no background elements, 16-bit color |
| `medical_item_medical_bill.png` | 80x120 | `assets/items/medical/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, medical bill statement, single paper, outrageous amount, isolated on transparent background, no background elements, 16-bit color |

---

## 🚗 七、车辆系统 (Vehicle System)

### 7.1 车辆（完整独立视图）

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `vehicle_junk_car.png` | 320x160 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, rusted junk car, complete full vehicle, side view, broken windows, flat tires, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `vehicle_sedan_old.png` | 320x160 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, old sedan car, complete full vehicle, side view, worn paint, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_pickup_truck.png` | 340x180 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, pickup truck, complete full vehicle, side view, rusted, cargo bed, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_luxury_car.png` | 320x140 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, luxury sedan, complete full vehicle, side view, black, shiny, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_delivery_van.png` | 360x200 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, delivery van, complete full vehicle, side view, white, company logo space, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_sports_car.png` | 300x120 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, sports car, complete full vehicle, side view, red, sleek, isolated on transparent background, no background elements, 16-bit color |

### 7.2 车辆零件/道具

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `vehicle_item_keys.png` | 40x60 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, car keys, complete object, key ring, remote, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_item_tire.png` | 80x80 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, car tire, complete single tire, rubber, tread, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_item_gas_can.png` | 60x100 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, gasoline can, complete object, red plastic, spout, isolated on transparent background, no background elements, 16-bit color |
| `vehicle_item_parking_ticket.png` | 40x60 | `assets/items/vehicles/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, parking ticket, single paper, yellow envelope, isolated on transparent background, no background elements, 16-bit color |

---

## 🎭 八、事件系统 (Event System)

### 8.1 事件场景背景

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `event_bg_alley_dark.png` | 640x480 | `assets/scenes/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, dark alley background, complete scene, brick walls, trash, neon signs, isolated on transparent background, no background elements, 16-bit color palette, dithering patterns |
| `event_bg_street_night.png` | 640x480 | `assets/scenes/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, city street at night, complete scene, streetlights, wet pavement, isolated on transparent background, no background elements, 16-bit color |
| `event_bg_park_day.png` | 640x480 | `assets/scenes/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, city park daytime, complete scene, benches, trees, path, isolated on transparent background, no background elements, 16-bit color |
| `event_bg_office_interior.png` | 640x480 | `assets/scenes/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, corporate office, complete room view, cubicles, copy machine, isolated on transparent background, no background elements, 16-bit color |
| `event_bg_courtroom.png` | 640x480 | `assets/scenes/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, courtroom, complete room view, judge bench, jury box, isolated on transparent background, no background elements, 16-bit color |

### 8.2 事件道具（关键叙事物品）

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `event_item_eviction_notice.png` | 80x120 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, eviction notice, single paper, official stamp, red text, isolated on transparent background, no background elements, 16-bit color |
| `event_item_paycheck_stub.png` | 80x60 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, paycheck stub, single paper, disappointing amount, isolated on transparent background, no background elements, 16-bit color |
| `event_item_arrest_warrant.png` | 80x120 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, arrest warrant, single paper, official seal, isolated on transparent background, no background elements, 16-bit color |
| `event_item_lottery_ticket.png` | 60x100 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, scratch-off lottery ticket, complete object, silver scratch area, isolated on transparent background, no background elements, 16-bit color |
| `event_item_begging_cup.png` | 60x80 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, coffee cup for begging, complete object, cardboard, coins inside, isolated on transparent background, no background elements, 16-bit color |
| `event_item_dumpster.png` | 160x140 | `assets/items/events/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, metal dumpster, complete object, green, lid open, isolated on transparent background, no background elements, 16-bit color |

---

## 🗺️ 九、地图系统 (Map System)

### 9.1 地图元素

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `map_base_complete.png` | 800x600 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, city map overview, complete map view, four distinct zones, hand-drawn style, vintage paper texture, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `map_icon_slums.png` | 80x80 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, slums zone icon, complete symbol, orange color, tent and shanty shape, isolated on transparent background, no background elements, 16-bit color |
| `map_icon_rust.png` | 80x80 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, rust belt zone icon, complete symbol, purple color, factory and gear shape, isolated on transparent background, no background elements, 16-bit color |
| `map_icon_suburbs.png` | 80x80 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, suburbs zone icon, complete symbol, blue color, house and tree shape, isolated on transparent background, no background elements, 16-bit color |
| `map_icon_downtown.png` | 80x80 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, downtown zone icon, complete symbol, gold color, skyscraper shape, isolated on transparent background, no background elements, 16-bit color |
| `map_player_marker.png` | 40x40 | `assets/scenes/map/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, player position marker, complete icon, red arrow, pulsing effect, isolated on transparent background, no background elements, 16-bit color |

---

## 📱 十、UI系统 (UI System)

### 10.1 UI框架元素

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `ui_frame_phone.png` | 400x800 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, smartphone frame, complete device, bezel, screen area transparent, isolated on transparent background, no background elements, 16-bit color palette, dithering |
| `ui_panel_dark.png` | 400x300 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, dark UI panel, complete rectangle, cyberpunk border, isolated on transparent background, no background elements, 16-bit color |
| `ui_button_rectangular.png` | 200x64 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, rectangular button, complete object, industrial metal look, isolated on transparent background, no background elements, 16-bit color |
| `ui_button_round.png` | 80x80 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, round button, complete object, industrial style, isolated on transparent background, no background elements, 16-bit color |
| `ui_progress_bar_horizontal.png` | 200x40 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, horizontal progress bar, complete object, frame and fill area, isolated on transparent background, no background elements, 16-bit color |
| `ui_icon_hp.png` | 40x40 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, heart icon, complete symbol, red, pixelated, isolated on transparent background, no background elements, 16-bit color |
| `ui_icon_insight.png` | 40x40 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, eye icon, complete symbol, blue, pixelated, isolated on transparent background, no background elements, 16-bit color |
| `ui_icon_money.png` | 40x40 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, dollar sign icon, complete symbol, green, pixelated, isolated on transparent background, no background elements, 16-bit color |
| `ui_icon_credit.png` | 40x40 | `assets/ui/` | PC-98 style, retro adventure game, pixel art, 1990s anime style, credit card icon, complete symbol, gold, pixelated, isolated on transparent background, no background elements, 16-bit color |

### 10.2 特效纹理

| 文件名 | 尺寸 | 路径 | 提示词 |
|--------|------|------|--------|
| `texture_scanlines.png` | 640x480 | `assets/textures/` | PC-98 style, retro adventure game, pixel art, scanline overlay pattern, horizontal lines, CRT effect, isolated on transparent background, no background elements, monochrome |
| `texture_noise.png` | 256x256 | `assets/textures/` | PC-98 style, retro adventure game, pixel art, film grain noise texture, dithering pattern, isolated on transparent background, no background elements, monochrome |
| `texture_vignette.png` | 640x480 | `assets/textures/` | PC-98 style, retro adventure game, pixel art, vignette overlay, dark corners, isolated on transparent background, no background elements, gradient |

---

## 📋 快速参考：提示词模板

### 场景/建筑模板
```
PC-98 style, retro adventure game, pixel art, 1990s anime style, 
[OBJECT_NAME], complete full [view_type], [description], 
isolated on transparent background, no background elements, 
16-bit color palette, dithering patterns
```

### 道具/物品模板
```
PC-98 style, retro adventure game, pixel art, 1990s anime style, 
[ITEM_NAME], complete object, [description], 
isolated on transparent background, no background elements, 
16-bit color
```

### 图标/UI模板
```
PC-98 style, retro adventure game, pixel art, 1990s anime style, 
[ICON_NAME], complete symbol, [color], pixelated, 
isolated on transparent background, no background elements, 
16-bit color
```

---

## ✅ 使用检查清单

生成图片后检查：
- [ ] 背景完全透明（alpha channel）
- [ ] 物体完整显示，不裁切
- [ ] 有明显的2-3像素深色描边
- [ ] 像素颗粒感清晰可见
- [ ] 色彩符合16-bit限制风格
- [ ] 有简单的投影阴影便于分层
- [ ] 文件格式为 PNG
- [ ] 分辨率符合规格

---

*文档版本: 2.0*
*风格: PC-98 Retro Adventure*
*适用: 独立元素抠图工作流*
