#!/usr/bin/env python3
"""
修正 ASSETS_IMAGE_GUIDE_PC98.md 的路径并添加中文描述
"""

import re

# 读取文件
with open('docs/ASSETS_IMAGE_GUIDE_PC98.md', 'r') as f:
    content = f.read()

# 1. 在表格中添加"中文描述"列
# 原始格式: | 文件名 | 尺寸 | 路径 | 提示词 |
# 新格式: | 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |

# 更新表头
content = content.replace(
    '| 文件名 | 尺寸 | 路径 | 提示词 |',
    '| 文件名 | 尺寸 | 路径 | 中文描述 | 提示词 |'
)

# 更新分隔符
content = content.replace(
    '|--------|------|------|--------|',
    '|--------|------|------|----------|--------|'
)

# 2. 定义中文描述映射
chinese_desc = {
    # 监狱系统
    'prison_cell_complete.png': '监狱牢房完整场景',
    'prison_bars_single.png': '监狱铁栅栏',
    'prison_bed_metal.png': '监狱金属床',
    'prison_toilet_stainless.png': '不锈钢监狱马桶',
    'prison_bench_wooden.png': '木制监狱长椅',
    'prison_door_heavy.png': '重型监狱门',
    'prison_uniform_orange.png': '橙色囚服',
    'prison_handcuffs_metal.png': '金属手铐',
    'prison_chain_ball.png': '铁球脚镣',
    'prison_document_release.png': '释放文件',
    
    # 信仰系统 - Downtown
    'faith_downtown_lodge_exterior.png': '共济会外观',
    'faith_downtown_lodge_interior.png': '共济会内部',
    'faith_downtown_altar.png': '祭坛',
    'faith_downtown_throne.png': '王座',
    
    # 信仰系统 - Rust
    'faith_rust_church_exterior.png': '工业教堂外观',
    'faith_rust_church_interior.png': '工业教堂内部',
    'faith_rust_cross_steel.png': '钢梁十字架',
    'faith_rust_pew_wooden.png': '木制长椅',
    
    # 信仰系统 - Slums
    'faith_slums_shrine_exterior.png': '贫民窟神龛外观',
    'faith_slums_shrine_interior.png': '贫民窟神龛内部',
    'faith_slums_statue_broken.png': '破损雕像',
    'faith_slums_offering_table.png': '祭品桌',
    
    # 信仰系统 - Suburbs
    'faith_suburbs_church_exterior.png': '郊区大教会外观',
    'faith_suburbs_church_interior.png': '郊区大教会内部',
    'faith_suburbs_seat_comfortable.png': '舒适座椅',
    'faith_suburbs_screen_led.png': 'LED屏幕',
    
    # 信仰道具
    'faith_item_bible.png': '圣经',
    'faith_item_candle.png': '蜡烛',
    'faith_item_cross_gold.png': '金色十字架',
    'faith_item_robe_priest.png': '神父长袍',
    
    # 银行系统
    'bank_interior_complete.png': '银行内部完整场景',
    'bank_vault_door.png': '金库门',
    'bank_teller_counter.png': '柜员柜台',
    'bank_chair_office.png': '办公椅',
    'bank_desk_wooden.png': '木制办公桌',
    'bank_item_money_stack.png': '现金堆',
    'bank_item_credit_card.png': '信用卡',
    'bank_item_checkbook.png': '支票簿',
    'bank_item_coin_stack.png': '金币堆',
    'bank_item_document_loan.png': '贷款文件',
    'bank_item_calculator.png': '计算器',
    
    # 住房系统 - Slums
    'housing_slums_tent.png': '帐篷',
    'housing_slums_cardboard_box.png': '纸板箱',
    'housing_slums_car_abandoned.png': '废弃汽车',
    'housing_slums_shack.png': '木屋',
    
    # 住房系统 - Rust
    'housing_rust_trailer.png': '拖车房屋',
    'housing_rust_apartment_old.png': '老旧公寓',
    'housing_rust_boarding_house.png': '寄宿公寓',
    
    # 住房系统 - Suburbs
    'housing_suburbs_house_small.png': '小别墅',
    'housing_suburbs_house_large.png': '大别墅',
    'housing_suburbs_townhouse.png': '联排别墅',
    
    # 住房系统 - Downtown
    'housing_downtown_loft.png': '阁楼公寓',
    'housing_downtown_condo.png': '豪华公寓',
    'housing_downtown_penthouse.png': '顶层公寓',
    
    # 家具
    'furniture_bed_single.png': '单人床',
    'furniture_bed_double.png': '双人床',
    'furniture_couch_worn.png': '破旧沙发',
    'furniture_couch_leather.png': '皮沙发',
    'furniture_table_wooden.png': '木桌',
    'furniture_chair_plastic.png': '塑料椅',
    'furniture_lamp_floor.png': '落地灯',
    'furniture_refrigerator.png': '冰箱',
    'furniture_tv_old.png': '老式电视',
    
    # 工作场景
    'job_office_cubicle.png': '办公室隔间',
    'job_factory_floor.png': '工厂车间',
    'job_warehouse_interior.png': '仓库内部',
    'job_restaurant_kitchen.png': '餐厅厨房',
    'job_construction_site.png': '建筑工地',
    
    # 工作道具
    'job_item_hard_hat.png': '安全帽',
    'job_item_toolbox.png': '工具箱',
    'job_item_laptop.png': '笔记本电脑',
    'job_item_briefcase.png': '公文包',
    'job_item_uniform_fastfood.png': '快餐制服',
    'job_item_apron.png': '围裙',
    'job_item_name_badge.png': '工牌',
    
    # 医疗场景
    'medical_hospital_room.png': '病房',
    'medical_clinic_waiting.png': '诊所候诊室',
    'medical_pharmacy_counter.png': '药房柜台',
    'medical_emergency_room.png': '急诊室',
    
    # 医疗道具
    'medical_item_hospital_gown.png': '病号服',
    'medical_item_wheelchair.png': '轮椅',
    'medical_item_crutches.png': '拐杖',
    'medical_item_bandages.png': '绷带',
    'medical_item_pill_bottle.png': '药瓶',
    'medical_item_iv_bag.png': '输液袋',
    'medical_item_stethoscope.png': '听诊器',
    'medical_item_medical_bill.png': '医疗账单',
    
    # 车辆
    'vehicle_junk_car.png': '废旧汽车',
    'vehicle_sedan_old.png': '旧轿车',
    'vehicle_pickup_truck.png': '皮卡车',
    'vehicle_luxury_car.png': '豪华轿车',
    'vehicle_delivery_van.png': '厢式货车',
    'vehicle_sports_car.png': '跑车',
    'vehicle_item_keys.png': '车钥匙',
    'vehicle_item_tire.png': '轮胎',
    'vehicle_item_gas_can.png': '油桶',
    'vehicle_item_parking_ticket.png': '停车罚单',
    
    # 事件背景
    'event_bg_alley_dark.png': '黑暗小巷',
    'event_bg_street_night.png': '夜晚街道',
    'event_bg_park_day.png': '白天公园',
    'event_bg_office_interior.png': '办公室内部',
    'event_bg_courtroom.png': '法庭',
    
    # 事件道具
    'event_item_eviction_notice.png': '驱逐通知',
    'event_item_paycheck_stub.png': '工资单',
    'event_item_arrest_warrant.png': '逮捕令',
    'event_item_lottery_ticket.png': '彩票',
    'event_item_begging_cup.png': '乞讨杯',
    'event_item_dumpster.png': '垃圾箱',
    
    # 地图
    'map_base_complete.png': '地图基础',
    'map_icon_slums.png': '贫民窟图标',
    'map_icon_rust.png': '铁锈带图标',
    'map_icon_suburbs.png': '郊区图标',
    'map_icon_downtown.png': '市中心图标',
    'map_player_marker.png': '玩家标记',
    
    # UI
    'ui_frame_phone.png': '手机框架',
    'ui_panel_dark.png': '暗色面板',
    'ui_button_rectangular.png': '矩形按钮',
    'ui_button_round.png': '圆形按钮',
    'ui_progress_bar_horizontal.png': '水平进度条',
    'ui_icon_hp.png': '生命值图标',
    'ui_icon_insight.png': '洞察图标',
    'ui_icon_money.png': '金钱图标',
    'ui_icon_credit.png': '信用图标',
    
    # 纹理
    'texture_scanlines.png': '扫描线纹理',
    'texture_noise.png': '噪点纹理',
    'texture_vignette.png': '暗角纹理',
}

# 3. 修正路径映射
path_fixes = {
    # 银行系统 - 修正路径
    '`assets/scenes/bank/`': '`assets/bank/`',
    '`assets/items/bank/`': '`assets/bank/`',
}

# 4. 更新监狱系统标记（预留）
content = content.replace(
    '## 🏛️ 一、监狱系统 (Prison System)',
    '## 🏛️ 一、监狱系统 (Prison System) [预留/未实现] ⚠️'
)

# 5. 更新信仰系统标记（使用CSS渐变）
content = content.replace(
    '## 🕊️ 二、信仰系统 (Faith System)',
    '## 🕊️ 二、信仰系统 (Faith System) [当前使用CSS渐变占位] 🎨'
)

# 6. 更新银行系统标记（已实现）
content = content.replace(
    '## 🏦 三、银行/金融系统 (Bank System)',
    '## 🏦 三、银行/金融系统 (Bank System) [已实现] ✅'
)

# 7. 更新住房系统标记
def add_status_markers(content):
    sections = [
        ('## 🏠 四、住房系统 (Housing System)', '[预留/未实现] ⚠️'),
        ('## 🪑 五、家具系统 (Furniture)', '[预留/未实现] ⚠️'),
        ('## 💼 六、工作/职业系统 (Job System)', '[预留/未实现] ⚠️'),
        ('## 🏥 七、医疗系统 (Medical System)', '[预留/未实现] ⚠️'),
        ('## 🚗 八、车辆系统 (Vehicle System)', '[预留/未实现] ⚠️'),
        ('## 🎲 十、通用事件背景 (Event Backgrounds)', '[预留/未实现] ⚠️'),
        ('## 🗺️ 九、地图系统 (Map System)', '[预留/未实现] ⚠️'),
        ('## 🖥️ 十一、UI元素 (User Interface)', '[部分实现] ⚡'),
        ('## 🎨 十二、纹理效果 (Textures)', '[部分实现] ⚡'),
    ]
    
    for section, status in sections:
        content = content.replace(section, f'{section} {status}')
    
    return content

content = add_status_markers(content)

# 8. 处理表格行 - 添加中文描述
lines = content.split('\n')
new_lines = []

for line in lines:
    # 匹配表格行，包含 .png
    if '| `' in line and '.png' in line and 'PC-98 style' in line:
        # 提取文件名
        match = re.search(r'\`([^`]+\.png)\`', line)
        if match:
            filename = match.group(1)
            desc = chinese_desc.get(filename, '')
            
            # 在路径和提示词之间插入中文描述
            # 原始: | `file.png` | 640x480 | `path/` | PC-98 style... |
            # 新:   | `file.png` | 640x480 | `path/` | 描述 | PC-98 style... |
            parts = line.split('|')
            if len(parts) >= 5:
                # parts[0] = '' (空)
                # parts[1] = `file.png`
                # parts[2] = 尺寸
                # parts[3] = `path/`
                # parts[4] = 提示词
                # 在 parts[3] 和 parts[4] 之间插入描述
                new_parts = parts[:4] + [f' {desc} '] + parts[4:]
                line = '|'.join(new_parts)
    
    new_lines.append(line)

content = '\n'.join(new_lines)

# 9. 修正路径
for old_path, new_path in path_fixes.items():
    content = content.replace(old_path, new_path)

# 10. 在文档开头添加说明
notice = """# PC-98 风格素材管理指南

> 版本: 2.0 | PC-98 Retro Adventure Game Style | 独立元素抠图版

⚠️ **路径说明**: 本文档中的路径已修正为与代码实际使用一致
- ✅ = 已实现系统
- ⚡ = 部分实现
- 🎨 = 当前使用CSS/Emoji占位
- ⚠️ = 预留/未实现

---

"""

# 移除旧的开头，添加新的
content = re.sub(r'^# PC-98 风格素材管理指南.*?(?=##)', notice, content, flags=re.DOTALL)

# 保存
with open('docs/ASSETS_IMAGE_GUIDE_PC98.md', 'w') as f:
    f.write(content)

print("✅ 已更新 ASSETS_IMAGE_GUIDE_PC98.md")
print("\n主要变更:")
print("1. 添加中文描述列")
print("2. 修正银行系统路径: assets/scenes/bank/ → assets/bank/")
print("3. 添加系统实现状态标记")
print("4. 添加路径说明")
