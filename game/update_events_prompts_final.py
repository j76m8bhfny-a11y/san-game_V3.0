#!/usr/bin/env python3
"""
批量更新ASSETS_EVENTS_PC98.md中的提示词
"""

import re

# 读取现有文档
with open('docs/ASSETS_EVENTS_PC98.md', 'r') as f:
    content = f.read()

# 定义新的场景描述（关键事件）
new_scenes = {
    # 关键事件的新提示词
    'evt_snap_guide.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Ohio Walmart employee break room, African American female worker in blue vest sitting at plastic table filling out SNAP benefits application on phone, microwave with discounted frozen dinner rotating, "How to Apply for SNAP" poster on bulletin board, Wall Street Journal on table showing "Walmart Profits Hit $150B", CRT television showing CEO interview about "job creation", vending machine with cheap snacks visible, fluorescent tube lighting, industrial ceiling tiles, diverse Americans of various ethnicities, authentic American urban setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_vulture_suit.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Indiana manufacturing plant locker room, workers silently gathered around posted "Plant Closure Notice" and severance package details, cardboard boxes being packed with equipment, tow trucks in parking lot removing company trucks, veteran worker of 20 years sitting on bench holding family photograph, winter morning light through dirty windows, diverse Americans of various ethnicities, authentic American rust belt setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_money_speech.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Washington DC K Street upscale steakhouse private booth, lobbyist and congressman sitting side by side in leather banquette, amendment draft spread on table, folded Super PAC donor list beside it, waiter entering causing both to pause conversation, lobbyist slipping business card into draft folder, US Capitol dome visible through window, evening ambiance, diverse Americans of various ethnicities, authentic American political setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_insulin_vial.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Minnesota CVS pharmacy insulin refrigerator section, middle-aged mother holding prescription and phone calculator, price tag showing increase from $300 to $330, pharmacist on phone with insurance discussing "prior authorization", shopping basket with child's lunchbox, her own glucose meter showing dangerously high reading, fluorescent pharmacy lighting, diverse Americans of various ethnicities, authentic American healthcare setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_bench_spikes.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), San Francisco public park winter morning, homeless person sitting on bench with metal anti-sleeping dividers installed on armrests, fog rolling in from bay, discarded coffee cup on ground, pigeon pecking nearby, commuter with briefcase passing by without eye contact, cold gray morning light, Victorian houses in distance, diverse Americans of various ethnicities, authentic American urban setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_pee_bottle.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Amazon fulfillment center warehouse bathroom line, worker holding plastic bottle, shift supervisor monitoring from nearby, conveyor belts visible in background, time clock on wall showing break time remaining, "Productivity Metrics" board visible, industrial warehouse fluorescent lighting, diverse Americans of various ethnicities, authentic American workplace setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_hoa_fine.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Arizona suburban driveway, homeowner reading HOA violation notice for lawn height violation, grass measuring exactly 3.1 inches against 3-inch rule, measuring tape on ground, neighbors watching from window with concern, desert landscaping and palm trees, identical houses in row, blistering afternoon sun, diverse Americans of various ethnicities, authentic American suburban setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
    
    'evt_heat_wave.png': '''PC-98 style, retro adventure game scene, pixel art, 1990s anime style, 16-bit color palette, dithering patterns, scanline effect, 3:2 aspect ratio (960x640), Phoenix Arizona bus stop 115 degrees Fahrenheit day, unhoused person seeking minimal shade from small shelter, heat shimmer rising from pavement, empty water bottles scattered, air conditioning visible in nearby buildings but not at bus stop, climate change reality, desert city environment, diverse Americans of various ethnicities, authentic American urban setting, wide angle establishing shot, full scene composition, complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters''',
}

# 替换提示词的函数
def replace_prompt(content, img_name, new_prompt):
    """替换特定图片的提示词"""
    # 匹配模式: | `img.png` | ... | 旧提示词 |
    pattern = rf"(\| `{re.escape(img_name)}` \| \d+x\d+ \| [^|]+ \| )(.*?)( \|)"
    
    def replacer(match):
        return match.group(1) + new_prompt + match.group(3)
    
    return re.sub(pattern, replacer, content, flags=re.DOTALL)

# 更新内容
updated_count = 0
for img_name, new_prompt in new_scenes.items():
    if img_name in content:
        content = replace_prompt(content, img_name, new_prompt)
        updated_count += 1
        print(f"✓ 已更新: {img_name}")

# 保存
with open('docs/ASSETS_EVENTS_PC98.md', 'w') as f:
    f.write(content)

print(f"\n共更新 {updated_count} 个关键事件提示词")
print("其他事件的提示词将在后续批次中更新")
