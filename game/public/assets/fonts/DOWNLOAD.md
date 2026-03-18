# 字体下载指南

## 字体清单

### 1. ✅ Zpix (pixel.ttf) - 已存在
- **用途**: 主像素字体（中文）
- **文件**: `pixel.ttf` (18MB)
- **来源**: https://github.com/SolidZORO/zpix-pixel-font

### 2. ⬇️ Press Start 2P - 需下载
- **用途**: 英文像素字体
- **下载**: https://fonts.google.com/specimen/Press+Start+2P
- **保存为**: `PressStart2P.ttf`
- **GitHub**: https://github.com/googlefonts/Press-Start-2P

### 3. ⬇️ Permanent Marker - 需下载
- **用途**: 马克笔手写风格
- **下载**: https://fonts.google.com/specimen/Permanent+Marker
- **保存为**: `PermanentMarker.ttf`

### 4. ⬇️ Caveat - 需下载
- **用途**: 自然手写体
- **下载**: https://fonts.google.com/specimen/Caveat
- **保存为**: `Caveat.ttf`

## 快速下载方法

### 方法1: 直接点击下载 (推荐)
1. 打开 https://fonts.google.com
2. 搜索字体名称
3. 点击 "Get font" → "Download"
4. 解压后将 `.ttf` 文件复制到此目录
5. 按上方表格重命名文件

### 方法2: 使用 curl (命令行)
```bash
cd game/public/assets/fonts

# Press Start 2P
curl -L -o PressStart2P.ttf \
  "https://github.com/googlefonts/Press-Start-2P/raw/main/fonts/PressStart2P-Regular.ttf"

# Permanent Marker
curl -L -o PermanentMarker.ttf \
  "https://github.com/google/fonts/raw/main/ofl/permanentmarker/PermanentMarker-Regular.ttf"

# Caveat  
curl -L -o Caveat.ttf \
  "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
```

### 方法3: 使用 Python
```python
import urllib.request

fonts = [
    ('PressStart2P.ttf', 'https://github.com/googlefonts/Press-Start-2P/raw/main/fonts/PressStart2P-Regular.ttf'),
    ('PermanentMarker.ttf', 'https://github.com/google/fonts/raw/main/ofl/permanentmarker/PermanentMarker-Regular.ttf'),
    ('Caveat.ttf', 'https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf'),
]

for name, url in fonts:
    print(f'Downloading {name}...')
    urllib.request.urlretrieve(url, name)
    print(f'Saved {name}')
```

## 下载后验证

下载完成后，目录结构应该是：
```
fonts/
├── pixel.ttf              # 18MB (已有)
├── PressStart2P.ttf       # ~100KB
├── PermanentMarker.ttf    # ~50KB
└── Caveat.ttf             # ~400KB
```

## 切换为本地字体

下载完成后，修改 `src/index.css` 和 `index.html` 使用本地字体。
