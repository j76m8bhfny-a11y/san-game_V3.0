#!/usr/bin/env python3
import json
import os
import re

# 读取MD中的所有图片名
md_images = set()
with open('docs/ASSETS_EVENTS_PC98.md', 'r') as f:
    content = f.read()
    matches = re.findall(r'`(evt_[a-z_0-9]+\.png)`', content)
    for m in matches:
        md_images.add(m.replace('.png', ''))

# 读取所有JSON中的image字段
events_dir = 'src/assets/data/events'
missing_events = []

for root, dirs, files in os.walk(events_dir):
    for file in files:
        if not file.endswith('.json') or file == 'index.ts':
            continue
        
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            try:
                data = json.load(f)
            except:
                continue
        
        event_id = data.get('id', file.replace('.json', ''))
        title = data.get('title', '')
        text = data.get('text', '')[:100]  # 前100字
        image = data.get('image', '')
        
        if image:
            img_name = image.split('/')[-1].replace('.png', '')
            if img_name not in md_images:
                missing_events.append({
                    'id': event_id,
                    'title': title,
                    'text': text,
                    'image': img_name
                })

# 生成补充提示词
base_prompt = "PC-98 style, retro adventure game scene, pixel art, 1990s anime style, wide angle establishing shot, full scene composition, "

print("=== 需要补充的事件图片提示词 ===\n")
print(f"共 {len(missing_events)} 个事件缺失提示词:\n")

for evt in sorted(missing_events, key=lambda x: x['id']):
    print(f"| `{evt['image']}.png` | 640x480 | {evt['title']} | {base_prompt}[场景描述: {evt['text']}...], complete scene view, panoramic scene view, no signs, no text, no labels, no placards, absolutely no written words or letters, 16-bit color |")
    print()

print("\n=== 按分类统计 ===")
by_category = {}
for evt in missing_events:
    cat = 'OTHER'
    if evt['id'].startswith('EVT_H'):
        cat = 'HOMELESS'
    elif evt['id'].startswith('EVT_WORKER'):
        cat = 'WORKER'
    elif evt['id'].startswith('EVT_MIDDLE'):
        cat = 'MIDDLE'
    elif evt['id'].startswith('EVT_CAPITALIST'):
        cat = 'CAPITALIST'
    elif evt['id'].startswith('EVT_C'):
        cat = 'COMMON'
    
    by_category[cat] = by_category.get(cat, 0) + 1

for cat, count in sorted(by_category.items()):
    print(f"  {cat}: {count} 个")
