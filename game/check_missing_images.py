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

print(f"MD中的图片数量: {len(md_images)}")

# 读取所有JSON中的image字段
json_images = set()
events_without_image = []
events_dir = 'src/assets/data/events'

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
        image = data.get('image', '')
        
        if image:
            # 提取图片名
            img_name = image.split('/')[-1].replace('.png', '')
            json_images.add(img_name)
            
            # 检查是否在MD中
            if img_name not in md_images:
                events_without_image.append((event_id, img_name))
        else:
            events_without_image.append((event_id, "无image字段"))

print(f"JSON中使用的图片数量: {len(json_images)}")
print(f"MD中有但JSON未使用的图片: {len(md_images - json_images)}")
print(f"JSON需要但MD中没有的图片: {len(json_images - md_images)}")
print()

if events_without_image:
    print("=== 缺失图片提示词的事件 ===")
    print(f"共 {len(events_without_image)} 个:\n")
    for event_id, img_name in sorted(events_without_image)[:30]:  # 只显示前30个
        print(f"  {event_id} -> {img_name}.png")
    
    if len(events_without_image) > 30:
        print(f"  ... 还有 {len(events_without_image) - 30} 个")
