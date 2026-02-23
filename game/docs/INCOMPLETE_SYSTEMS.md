# 《美式灵视》系统未完成情况清单

> 最后更新: 2024

---

## 🔴 严重未完成 (影响游戏体验)

### 1. 音频系统 (Audio System) - 0% 完成

**状态**: 完全缺失

```
public/assets/audio/ 目录为空
```

**需要制作的音频文件** (25个):

| 文件名 | 用途 | 优先级 |
|--------|------|--------|
| `bgm_title.mp3` | 标题界面BGM | 🔴 高 |
| `bgm_blue_pill.mp3` | 蓝药丸BGM | 🔴 高 |
| `bgm_cracks.mp3` | 裂痕BGM | 🔴 高 |
| `bgm_old_ruler.mp3` | 古神BGM | 🟡 中 |
| `sfx_click.mp3` | 点击音效 | 🔴 高 |
| `sfx_hover.mp3` | 悬停音效 | 🟡 中 |
| `sfx_cash.mp3` | 金钱音效 | 🔴 高 |
| `sfx_paper.mp3` | 纸张音效 | 🟡 中 |
| `sfx_glitch.mp3` | 故障音效 | 🔴 高 |
| `sfx_typing.mp3` | 打字音效 | 🟡 中 |
| `sfx_heartbeat.mp3` | 心跳音效 | 🟡 中 |
| `sfx_deny.mp3` | 拒绝音效 | 🟡 中 |
| `sfx_all_in.mp3` | 梭哈音效 | 🔴 高 |
| `sfx_ending_awakened.mp3` | ED-22真结局音效 | 🟢 低 |
| `sfx_ending_ur.mp3` | UR结局音效 | 🟢 低 |
| `sfx_ending_stance.mp3` | STANCE结局音效 | 🟢 低 |
| `sfx_ending_death.mp3` | 死亡结局音效 | 🟡 中 |
| `sfx_fabric_heavy.mp3` | 布料声 | 🟢 低 |
| `sfx_trash.mp3` | 垃圾声 | 🟢 低 |
| `sfx_snore.mp3` | 呼噜声 | 🟢 低 |
| `sfx_keys_jingle.mp3` | 钥匙声 | 🟢 低 |
| `sfx_neon_hum.mp3` | 霓虹灯声 | 🟢 低 |
| `sfx_print_receipt.mp3` | 打印声 | 🟢 低 |
| `sfx_pen_scratch.mp3` | 写字声 | 🟢 低 |
| `sfx_bird_chirp.mp3` | 鸟叫声 | 🟢 低 |

**建议**: 使用开源音效库 (如 freesound.org) 或 AI 生成工具

---

## 🟡 中度未完成 (有临时方案，需要替换)

### 2. 信仰系统视觉资源 - 30% 完成

**状态**: 使用 CSS 渐变和 Emoji 作为占位符

```typescript
// placeholderAssets.ts
export const placeholderBackgrounds = {
  downtown_lodge_exterior: `linear-gradient(135deg, #0a0a0a 0%, #1a1209 50%, #0f0a05 100%)`,
  // ... 纯色渐变占位
};

export const placeholderIcons = {
  handshake: '🤝',
  donation_bag: '🛍️',
  broken_statue: '🗿',
  // ... Emoji 占位
};
```

**需要替换的资源**:

| 资源类型 | 数量 | 位置 |
|----------|------|------|
| 教堂/神殿外观图 | 4张 | 4区域 × 外观 |
| 教堂/神殿内部图 | 4张 | 4区域 × 内部 |
| 宗教仪式图标 | 8个 | 4宗教 × 2种状态 |
| 特效纹理 | 4个 | 扫描线、尘埃等 |

**影响组件**:
- `SuburbsChurchExterior.tsx`
- `SuburbsChurchInterior.tsx`
- `RustBeltChurchExterior.tsx`
- `RustBeltChurchInterior.tsx`
- `SlumsShrineExterior.tsx`
- `SlumsShrineInterior.tsx`
- `DowntownLodgeExterior.tsx`
- `DowntownLodgeInterior.tsx`

---

### 3. 地图系统 - 50% 完成

**现状**:
```typescript
// MapDashboard.tsx
backgroundImage: "url('/assets/map_base_v1.jpg')", // TODO: 替换你的图片
backgroundImage: "url('https://www.transparenttextures.com/patterns/crinkled-paper.png')" // 临时纹理
```

**缺失**:
- 高清地图底图 (当前只有基础版本)
- 区域纹理 (使用外部临时链接)
- 地图标记图标

---

### 4. 场景图片资源 - 60% 完成

**已检查目录**: `public/assets/scenes/`

| 区域 | 状态 | 缺失文件 |
|------|------|----------|
| 贫民窟 | 🟡 部分 | 部分场景图使用占位 |
| 铁锈带 | 🟡 部分 | 工业场景需要补充 |
| 郊区 | 🟢 基本完整 | - |
| 核心区 | 🟡 部分 | 高科技场景 |

**代码中引用的缺失图片**:
```typescript
// 这些路径可能不存在对应文件
'/assets/scenes/player_back.png'
'/assets/scenes/default_bg.png'
'/assets/events/default_event.png'
```

---

### 5. 物品图标 - 70% 完成

**目录**: `public/assets/items/`

**缺失**:
- 新增的结局道具图标: `SURVIVAL_KIT`, `FAKE_PASSPORT`
- 部分食物图标
- 药物图标

---

## 🟢 轻度未完成 (细节优化)

### 6. 银行系统叙事文本 - 80% 完成

**现状**: 催收阶段文本硬编码

```typescript
// BankSystem.ts
result.logs.push("【暴力催收】讨债人打断了你的肋骨！");
result.logs.push("【强制执行】银行冻结并划扣资产");
result.logs.push("【司法介入】因长期恶意拖欠，你被逮捕了。");
```

**建议**: 提取到 `bank_events.json` 配置化

**工作量**: 1-2小时

---

### 7. 事件系统 - 85% 完成

**现状**: 50+事件已配置

**待补充**:
- 部分事件缺少背景图/前景图
- 一些事件的 `relatedEvents` 引用可能不存在
- 少数事件的 D 选项 Insight 锁未测试

---

### 8. 调试/开发残留

**需要清理的代码**:
```typescript
// DebugPanel.tsx
triggerEnding('ENDING_DEBUG_WIN')  // 调试用的结局ID

// MapDashboard.tsx
// TODO: 替换你的图片
```

---

## 📊 完成度汇总

| 系统 | 完成度 | 主要缺失 | 优先级 |
|------|--------|----------|--------|
| 音频系统 | 0% | 全部25个音效 | 🔴 高 |
| 信仰视觉 | 30% | 8张背景图+图标 | 🟡 中 |
| 地图系统 | 50% | 高清地图+纹理 | 🟡 中 |
| 场景图片 | 60% | 部分区域场景 | 🟡 中 |
| 物品图标 | 70% | 新增道具图标 | 🟢 低 |
| 银行叙事 | 80% | 文本配置化 | 🟢 低 |
| 事件系统 | 85% | 部分图片 | 🟢 低 |
| 结局系统 | 95% | 音效 | 🟡 中 |
| 银行系统 | 90% | 叙事文本 | 🟢 低 |
| 加密系统 | 80% | 音效 | 🟡 中 |
| 医疗系统 | 75% | 部分UI | 🟢 低 |

---

## 🎯 建议处理顺序

### 第一阶段 (核心体验) - 1-2周
1. **制作核心音效** (10个)
   - 4个BGM
   - 6个核心SFX (点击、金钱、故障、拒绝、心跳、梭哈)

### 第二阶段 (视觉完善) - 2-3周
2. **信仰系统图片**
   - 8张背景图
   - 可以用AI生成工具批量制作

3. **地图高清化**
   - 替换临时纹理
   - 优化地图底图

### 第三阶段 (Polish) - 按需
4. **剩余音效**
5. **银行叙事配置化**
6. **场景图片补充**

---

## 💡 资源获取建议

### 音效
- **免费**: freesound.org
- **AI生成**: ElevenLabs, Suno
- **购买**: Epidemic Sound, Artlist

### 图片
- **AI生成**: Midjourney, DALL-E, Stable Diffusion
- **风格建议**: 
  - 贫民窟: 肮脏、混乱、赛博朋克
  - 核心区: 高科技、冷色调、极简
  - 信仰场景: 神秘、仪式感、象征符号

### 图标
- **免费**: game-icons.net
- **购买**: itch.io 图标包

---

## 附录: 代码中的 TODO 标记

```
src/store/useAudioStore.ts:31        // TODO: 需要制作音频文件
src/store/slices/createVitalitySlice.ts:1058  // TODO: 状态系统清除
src/components/game/MapDashboard.tsx:53        // TODO: 替换你的图片
src/components/game/DebugPanel.tsx:134         // 调试代码
```
