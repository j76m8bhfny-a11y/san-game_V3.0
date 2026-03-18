#!/bin/bash
# ========================================
# 游戏字体下载脚本
# 运行此脚本下载所有需要的字体到本地
# ========================================

set -e

FONT_DIR="$(dirname "$0")"
cd "$FONT_DIR"

echo "========================================"
echo "  游戏字体下载工具"
echo "========================================"
echo ""

# 检查 curl 是否可用
if ! command -v curl &> /dev/null; then
    echo "❌ 错误: 需要安装 curl"
    echo "   macOS: brew install curl"
    echo "   Linux: sudo apt-get install curl"
    exit 1
fi

# 字体列表
declare -a FONTS=(
    "PressStart2P.ttf|https://github.com/googlefonts/Press-Start-2P/raw/main/fonts/PressStart2P-Regular.ttf"
    "PermanentMarker.ttf|https://github.com/google/fonts/raw/main/ofl/permanentmarker/PermanentMarker-Regular.ttf"
    "Caveat.ttf|https://github.com/google/fonts/raw/main/ofl/caveat/Caveat%5Bwght%5D.ttf"
)

echo "📁 字体目录: $FONT_DIR"
echo ""

# 下载每个字体
for font_info in "${FONTS[@]}"; do
    IFS='|' read -r filename url <<< "$font_info"
    
    if [ -f "$filename" ]; then
        echo "✅ $filename 已存在，跳过"
        continue
    fi
    
    echo "⬇️  正在下载 $filename..."
    if curl -sL --max-time 60 -o "$filename" "$url"; then
        # 检查文件是否下载成功（非空且是字体文件）
        if [ -s "$filename" ] && file "$filename" | grep -q "font\|TrueType"; then
            echo "✅ $filename 下载成功"
        else
            echo "⚠️  $filename 可能下载不完整"
            rm -f "$filename"
        fi
    else
        echo "❌ $filename 下载失败"
        rm -f "$filename"
    fi
    echo ""
done

echo "========================================"
echo "  下载完成！"
echo "========================================"
echo ""
echo "当前字体文件:"
ls -lh *.ttf 2>/dev/null || echo "  (无字体文件)"
echo ""
echo "如需重新下载，请删除对应文件后重新运行此脚本"
