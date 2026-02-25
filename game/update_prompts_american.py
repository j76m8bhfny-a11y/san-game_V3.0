#!/usr/bin/env python3
"""
更新事件图片提示词，添加美国场景和美国人物特征
"""

import re

# 读取文件
with open('docs/ASSETS_EVENTS_PC98.md', 'r') as f:
    content = f.read()

# 美国人种特征词库（用于随机多样化）
ethnic_descriptions = [
    "diverse Americans including African American and White",
    "Americans of various ethnicities",
    "diverse group of Americans",
    "multi-ethnic Americans",
    "Americans of different racial backgrounds",
    "African American and Latino Americans",
    "working class Americans of diverse backgrounds",
]

# 美国场景特征
american_settings = [
    "American urban environment",
    "American city street",
    "typical American setting",
    "American metropolitan area",
    "urban America",
    "American inner city",
]

# 更新风格规范部分
old_style = """### 核心风格关键词
```
PC-98 style, retro adventure game background, pixel art, 1990s anime style,
16-bit color palette, dithering patterns, scanline effect,
complete full view, no truncation, no signs, no labels, no text, no placards, no indicators, no signboards, no nameplates, absolutely no written words or letters
```"""

new_style = """### 核心风格关键词
```
PC-98 style, retro adventure game background, pixel art, 1990s anime style,
16-bit color palette, dithering patterns, scanline effect,
American setting, diverse Americans of various ethnicities (African American, Latino, White, Asian American),
complete full view, no truncation, no signs, no labels, no text, no placards, no indicators, no signboards, no nameplates, absolutely no written words or letters
```

### 人物特征规范
- **人种多样性**: 必须体现美国多元化人种（非裔、拉丁裔、白人、亚裔美国人等）
- **场景特征**: 必须是美国城市/郊区环境，具有美国建筑、标识风格（但不显示具体文字）
- **文化细节**: 美国特有的基础设施、服装风格、城市景观"""

content = content.replace(old_style, new_style)

# 定义替换函数，在提示词中添加美国特征
def add_american_context(prompt_text):
    """在提示词中添加美国场景和人种特征"""
    
    # 如果已经是完整提示词（包含PC-98 style）
    if "PC-98 style" in prompt_text and "American" not in prompt_text:
        # 在"PC-98 style"后添加美国人种和场景描述
        prompt_text = prompt_text.replace(
            "PC-98 style,",
            "PC-98 style, diverse Americans of various ethnicities in American urban setting,"
        )
    
    return prompt_text

# 匹配提示词列的表格行
# 格式: | `filename.png` | 640x480 | 描述 | 提示词 |

lines = content.split('\n')
new_lines = []

for line in lines:
    # 检查是否是表格行且包含提示词
    if line.startswith('| `evt_') and 'PC-98 style' in line:
        # 分割表格列
        parts = line.split('|')
        if len(parts) >= 5:
            # 获取提示词部分（第5列）
            prompt = parts[4].strip()
            
            # 添加美国特征
            if "diverse Americans" not in prompt and "Americans" not in prompt:
                prompt = add_american_context(prompt)
                
                # 重新组装行
                parts[4] = ' ' + prompt + ' '
                line = '|'.join(parts)
    
    new_lines.append(line)

content = '\n'.join(new_lines)

# 保存更新后的文件
with open('docs/ASSETS_EVENTS_PC98.md', 'w') as f:
    f.write(content)

print("✅ 已更新所有提示词，添加美国场景和美国人种多样性特征")
print("\n主要变更:")
print("- 在核心风格关键词中添加: diverse Americans of various ethnicities")
print("- 所有事件提示词现在强调美国城市环境和多元化美国人")
print("- 添加了人物特征规范说明")
