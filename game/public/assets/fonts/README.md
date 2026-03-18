# 游戏字体说明

## 字体清单

| 文件名 | 字体名称 | 用途 | 大小 |
|--------|----------|------|------|
| `pixel.ttf` | Zpix (最全中文像素字体) | 主字体，所有UI文本 | ~18MB |
| `PressStart2P.ttf` | Press Start 2P | 英文像素字体，标题 | ~1MB |
| `PermanentMarker.ttf` | Permanent Marker | 马克笔风格，住房UI | ~1MB |
| `Caveat.ttf` | Caveat | 手写风格，便签/签名 | ~1MB |

## 下载字体

### 方法1: 使用脚本 (推荐)

```bash
cd game/public/assets/fonts
bash download-fonts.sh
```

### 方法2: 手动下载

如果脚本下载失败，请手动下载以下字体文件到此目录：

1. **Press Start 2P** 
   - 下载: https://fonts.google.com/specimen/Press+Start+2P
   - 重命名为: `PressStart2P.ttf`

2. **Permanent Marker**
   - 下载: https://fonts.google.com/specimen/Permanent+Marker
   - 重命名为: `PermanentMarker.ttf`

3. **Caveat**
   - 下载: https://fonts.google.com/specimen/Caveat
   - 重命名为: `Caveat.ttf`

### 方法3: 使用 GitHub 直链

如果网络允许，可以直接使用以下链接：

```bash
cd game/public/assets/fonts

# Press Start 2P
curl -O https://github.com/googlefonts/Press-Start-2P/raw/main/fonts/PressStart2P-Regular.ttf

# Permanent Marker  
curl -O "https://github.com/google/fonts/raw/main/ofl/permanentmarker/PermanentMarker-Regular.ttf"

# Caveat
curl -O "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
```

## 字体配置

字体配置位于 `src/index.css`，已修改为全部使用本地字体：

```css
@font-face {
  font-family: 'PixelFont';
  src: url('/assets/fonts/pixel.ttf') format('truetype');
}

@font-face {
  font-family: 'Press Start 2P';
  src: url('/assets/fonts/PressStart2P.ttf') format('truetype');
}
/* ... */
```

## 字体回退栈

如果本地字体加载失败，系统会按以下顺序回退：

```
PixelFont → Press Start 2P → WenQuanYi → Unifont → Courier New → SimSun/Songti SC → monospace
```

## 注意事项

- Zpix (`pixel.ttf`) 是中文像素字体，体积较大 (~18MB)，但效果最好
- 所有字体文件建议保留，确保游戏在不同系统上显示一致
- 如需减小体积，可以考虑使用 WOFF2 格式压缩字体
