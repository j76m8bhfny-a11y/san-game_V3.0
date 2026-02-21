# 事件系统重构进度报告

**日期**: 2026-01-15  
**目标**: 将游戏事件系统升级到v3标准化格式，实现档案系统和System Gaze机制

---

## ✅ 已完成工作

### 1. 核心基础设施 (100%)

| 组件 | 状态 | 说明 |
|------|------|------|
| `eventValueStandard.ts` | ✅ | A/B/C/D标准化数值体系，阶级倍数 |
| `archiveModifier.ts` | ✅ | 档案奖励中间件，D选项惩罚减免 |
| `systemGaze.ts` | ✅ | 动态难度系统，80档强度曲线 |
| `eventLoader.ts` | ✅ | Vite动态加载，条件过滤，加权采样 |
| `actionExecutorAdapter.ts` | ✅ | 与现有系统集成适配器 |
| `globalProgressSlice.ts` | ✅ | 跨运行进度存储 (LocalStorage/Steam) |

### 2. UI组件 (100%)

| 组件 | 状态 | 功能 |
|------|------|------|
| `SystemGazeOverlay.tsx` | ✅ | 屏幕畸变、色差、扫描线视觉效果 |
| `ArchiveMilestoneModal.tsx` | ✅ | 里程碑解锁弹窗，暗网回响叙事 |

### 3. 事件迁移 (22%)

#### HOMELESS阶级 (27%)
- ✅ EVT_H01 ~ EVT_H15 (15个事件已迁移)
- ⏳ EVT_H16 ~ EVT_H67 (40个事件待迁移)
- 📋 计划新增: 0个 (原55个 → 目标60个)

#### 其他阶级 (0%)
- ⏳ WORKER: 0/60
- ⏳ MIDDLE: 0/60  
- ⏳ CAPITALIST: 0/60
- ⏳ COMMON: 0/30

**总计**: 15/240 (6.25%)

---

## 📁 文件结构

```
game/src/
├── logic/
│   ├── eventValueStandard.ts      # 标准化数值
│   ├── archiveModifier.ts          # 档案奖励系统
│   ├── systemGaze.ts               # System Gaze难度
│   ├── eventLoader.ts              # 事件加载器
│   └── actionExecutorAdapter.ts    # 集成适配器
├── store/
│   └── globalProgressSlice.ts      # 全局进度状态
├── components/
│   ├── SystemGazeOverlay.tsx       # 凝视视觉效果
│   └── ArchiveMilestoneModal.tsx   # 里程碑弹窗
├── assets/data/events/
│   ├── index.ts                    # 事件索引入口
│   └── homeless/
│       ├── EVT_H01_BENCH.json      # ✅ 已迁移
│       ├── ...                     # ✅ 15个事件
│       └── EVT_H15_LOCKED_TRASH.json
├── INTEGRATION_GUIDE.md            # 集成指南
└── PROGRESS_REPORT.md              # 本文件
```

---

## 🔧 标准化格式变化

### 数值对比

| 选项 | 旧格式 | 新格式 | 设计理念 |
|------|--------|--------|----------|
| A | 300/-3/+4 | 150/-12/+8(5) | 高风险高收益，穷人更惨 |
| B | 50/+2/+2 | 25/-3/+1 | 安全但消耗 |
| C | -20%/+8/-2 | -15%/+8/-10 | 洗白需要付出代价 |
| D | -40%/-8/-10 | -100/-18/-10 | 真相代价高昂 |

### 新字段

```typescript
// 元数据
$schema: "game-event-v3"
category: "HOMELESS" | "WORKER" | "MIDDLE" | "CAPITALIST" | "COMMON"
series: string
layer: { background, foreground }
historicalNote: string

// 选项
ideology: string
flavorText: string
archiveCommentary: string
glitchEffect: string

// 元数据
metadata: {
  author, version, migratedFrom,
  createdAt, updatedAt,
  references, relatedEvents
}
```

---

## 🎮 System Gaze机制

### 强度曲线

```
档案数    强度    视觉反馈              游戏影响
──────────────────────────────────────────────────────
0-20      0%      无                    无
20-40     0-33%   轻微暗角              轻微惩罚
40-60     33-67%  扫描线+暗角           中等惩罚
60-80     67-100% 色差+噪点             严重惩罚
80+       100%    全效果+数字雨         最大惩罚
```

### 阶级特定惩罚

- **HOMELESS**: 保险拒赔几率↑
- **WORKER**: Gig pay下限↓
- **MIDDLE**: 生活成本↑
- **CAPITALIST**: IRS审计几率↑

---

## 📊 档案系统

### 解锁条件

- D选项 + SAN ≥ 40 + 愿意承受代价

### 奖励曲线

```
每3个档案:  D选项惩罚减少 ~5%
10个档案:   解锁Worker阶级
25个档案:   解锁Middle阶级
40个档案:   解锁Capitalist + System Gaze专属事件
最大减免:   67% (约80档案)
```

---

## 📝 待办事项

### 高优先级

1. [ ] 完成HOMELESS事件迁移 (40个)
2. [ ] 创建STORE集成到现有代码库
3. [ ] 修改ActionExecutor使用新适配器

### 中优先级

4. [ ] 创建WORKER阶级60个事件
5. [ ] 创建MIDDLE阶级60个事件
6. [ ] 创建CAPITALIST阶级60个事件

### 低优先级

7. [ ] 创建COMMON通用30个事件
8. [ ] 创建System Gaze专属8个事件
9. [ ] 测试完整游戏循环
10. [ ] 平衡性调整

---

## 🎯 下一步建议

### 选项A: 快速验证 (推荐)

1. 完成STORE集成（5分钟）
2. 添加SystemGazeOverlay到App.tsx（2分钟）
3. 添加ArchiveMilestoneModal到App.tsx（2分钟）
4. 修改ActionExecutor调用适配器（10分钟）
5. 运行游戏测试15个已迁移事件

**预计时间**: 20分钟  
**结果**: 可验证完整系统是否正常工作

### 选项B: 继续迁移事件

继续迁移剩余的40个HOMELESS事件。

**预计时间**: 2-3小时  
**结果**: HOMELESS阶级完成

### 选项C: 创建新事件

开始创建WORKER阶级事件。

**预计时间**: 4-6小时  
**结果**: 解锁新职业

---

## 🐛 已知问题

暂无。

---

## 📈 统计

- **代码文件**: 8个新文件
- **已迁移事件**: 15个
- **待创建事件**: 225个
- **总目标**: 240个事件
- **完成度**: 6.25%
