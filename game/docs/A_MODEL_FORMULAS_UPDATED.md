# A. 系统级生存模型（修正版）

> 基于审查结果修正后的数学模型
> 版本：v2.0（修正版）
> 日期：2026-02-18

---

## 一、模型核心变更（审查后）

### 三项关键修正

| 原设计 | 审查问题 | 修正后 |
|-------|---------|--------|
| $S$ = 存活概率 → Roll点判定生死 | 满血可能暴毙，挫败感强 | $S$ = 环境健康指数 → 控制生命流失速率 |
| $E_{history}$ = 历史事件回溯累加 | 开发量大，存档膨胀 | StatusEffect Buff机制（带倒计时） |
| $penalty$ = 统一惩罚 | 流浪汉和资本家同一标准不合理 | $penalty_{real}$ = $penalty_{base}$ / $ClassResistance$ |

---

## 二、完整模型公式

### 第一层：基础维度（确定性基线）

$$D = 0.7 \times \frac{\sum_{i}(source_{i} \times weight_{i})}{\sum weight_{i}} + 0.3 \times C_{D} + \delta_{homeless}$$

**五个维度**：
- $D$ (physicalDefense)：物理防御
- $M$ (mentalStability)：精神稳定
- $N$ (nutritionSupply)：营养供给
- $H$ (medicalSupport)：医疗支持
- $E$ (economicSecurity)：经济安全

**参数说明**：
- $source_i$：各来源值（如 housing.defenseLevel × 5）
- $weight_i$：来源权重
- $C_D$：阶级基础分
- $\delta_{homeless}$：无家可归惩罚（如无住所，物理-10，精神-20）

---

### 第二层：环境健康指数 $S$

$$S = \sigma\left(\sum_{dim} w_{dim} \times dim\right) = \frac{1}{1 + e^{-k(\sum w_{dim} \cdot dim - x_0)}}$$

**参数**（代码中的实际值）：
- $k$ (steepness) = 0.08
- $x_0$ (midpoint) = 50
- $w_{dim}$：维度权重 [0.3, 0.25, 0.2, 0.15, 0.1]

**$S$的取值含义**：
| $S$ 范围 | 健康等级 | 每回合HP变化 | 每回合SAN变化 |
|---------|---------|-------------|--------------|
| $S \geq 0.8$ | 极佳 | +1 | +1 |
| $0.6 \leq S < 0.8$ | 良好 | 0 | 0 |
| $0.4 \leq S < 0.6$ | 一般 | -1 | 0 |
| $0.2 \leq S < 0.4$ | 危险 | -2 | -1 |
| $S < 0.2$ | 致命 | -5 | -3 |

**注**：$S$不再直接决定生死，而是控制生命流失速率

---

### 第三层：Vitality Decay Rate（新增）

$$\Delta HP_{turn} = f(S) = \begin{cases} 
+1 & S \geq 0.8 \\
0 & 0.6 \leq S < 0.8 \\
-1 & 0.4 \leq S < 0.6 \\
-2 & 0.2 \leq S < 0.4 \\
-5 & S < 0.2
\end{cases}$$

$$\Delta SAN_{turn} = g(S) = \begin{cases} 
+1 & S \geq 0.8 \\
0 & 0.6 \leq S < 0.8 \\
0 & 0.4 \leq S < 0.6 \\
-1 & 0.2 \leq S < 0.4 \\
-3 & S < 0.2
\end{cases}$$

**代码实现**：
```typescript
// 在 advanceTurn 中调用
const decay = calculateVitalityDecay(survivalRate);
modifyStats({ 
  hp: currentHp + decay.hpDecay, 
  san: currentSan + decay.sanDecay 
});
```

---

### 第四层：StatusEffect Buff机制（替代历史回溯）

**原设计（已废弃）**：
$$E_{history} = \sum_{t=0}^{T} \beta^t \cdot impact(event_{-t})$$

**新设计（Buff机制）**：
事件触发时，直接附加StatusEffect：

```
StatusEffect = {
  id: string,           // 唯一标识
  name: string,         // 显示名称
  duration: number,     // 持续回合数
  perTurnEffects: {     // 每回合效果
    hp?: number,
    san?: number,
    gold?: number
  },
  onExpire?: {          // 结束时效果
    hp?: number,
    san?: number
  }
}
```

**数学等效性**：
| 原设计（指数衰减） | 新设计（线性+补偿） |
|------------------|-------------------|
| 第1天: -10 | 第1天: -2 |
| 第2天: -8 | 第2天: -2 |
| 第3天: -6.4 | 第3天: -2 |
| 第4天: -5.12 | 第4天: -2 |
| 第5天: -4.1 | 第5天: -2 + 结束+5 |
| **总计: -33.6** | **总计: -5** |

**调整方案**：增加初始冲击值，使总效果近似

---

### 第五层：复合风险（乘法效应 + 阶级抗性）

$$R_{compound} = 1 - \prod_{risk \in Risks} \left(1 - \frac{penalty_{base}}{ClassResistance}\right)$$

**阶级抗性表**（新增参数）：

| 阶级 | ClassResistance | 说明 |
|-----|-----------------|------|
| HOMELESS | 0.3 | 抗性差，小风险也是大威胁 |
| WORKER | 0.6 | 中等抗性 |
| MIDDLE | 1.0 | 标准（基准值） |
| CAPITALIST | 2.0 | 抗性强，大风险变小威胁 |

**示例计算**：
风险"生病"，$penalty_{base}$ = 0.10 (10%)

| 阶级 | 计算 | 实际惩罚 |
|-----|------|---------|
| HOMELESS | 0.10 / 0.3 | 33.3% |
| WORKER | 0.10 / 0.6 | 16.7% |
| MIDDLE | 0.10 / 1.0 | 10% |
| CAPITALIST | 0.10 / 2.0 | 5% |

**复合效应示例**：
HOMELESS同时面临：生病(-33%) + 失业(-20%) + 没车(-10%)
$$R_{compound} = 1 - (1-0.33)(1-0.20)(1-0.10) = 1 - 0.67 \times 0.8 \times 0.9 = 51.7\%$$

**注**：惩罚值以额外Decay Rate的形式体现

---

### 第六层：随机扰动

$$\epsilon \sim U(-0.05, 0.05) \text{（固定±5%）}$$

应用于每回合的Decay计算中，增加不确定性。

---

### 第七层：死亡判定（回归代码逻辑）

**判定条件**（与现有代码一致）：
```
if (HP <= 0) → 触发死亡结局
if (SAN <= 0) → 触发疯狂结局
```

**不存在"概率暴毙"**，玩家始终能通过血条看到生存状态。

---

## 三、模型特性总结

| 特性 | 实现方式 | 效果 |
|-----|---------|------|
| **边际递减** | Sigmoid曲线 | 高属性时提升效果变小 |
| **短板效应** | 五维加权，最低维度拉低$S$ | 单一维度极低会显著降低生存质量 |
| **时间压力** | 每回合Decay | $S$低时生命值持续流失，产生紧迫感 |
| **祸不单行** | 乘法风险 | 多重负面状态叠加惩罚 |
| **阶级鸿沟** | ClassResistance | 同一风险对不同阶级影响差异巨大 |
| **可见性** | 血条实时变化 | 玩家能直观感受环境变化 |

---

## 四、与旧模型对比

| 维度 | 旧模型（v1.0） | 新模型（v2.0） |
|-----|---------------|---------------|
| 生死判定 | $S$ = 概率，Roll点判定 | $S$ = 健康指数，控制Decay速率 |
| 历史影响 | 指数衰减累加 | StatusEffect Buff（带duration） |
| 风险惩罚 | 统一惩罚 | 惩罚 / ClassResistance |
| 玩家体验 | 可能暴毙 | 血条预警，有缓冲时间 |
| 开发成本 | 高（需历史队列） | 低（复用Buff系统） |

---

## 五、关键公式速查

### 核心计算链

```
物品/住所/工作属性 
    → 五维分数 [D, M, N, H, E]
    → 综合评分 = Σ(w·dim)
    → S = Sigmoid(综合评分)
    → DecayRate = f(S)
    → HP/SAN 每回合变化
    → 死亡判定 (HP/SAN <= 0)
```

### 关键阈值

| 指标 | 阈值 | 含义 |
|-----|------|------|
| $S$ | 0.2 | 致命线，HP快速流失(-5/回合) |
| $S$ | 0.4 | 危险线，HP缓慢流失(-2/回合) |
| $S$ | 0.6 | 安全线，HP维持不变 |
| $S$ | 0.8 | 优月线，HP恢复(+1/回合) |
| HP | 0 | 死亡 |
| SAN | 0 | 疯狂 |

---

**文档版本**：v2.0（修正版）  
**基于审查**：数值专家2026-02-18审查意见  
**适用代码版本**：survivalCalculator.ts + StatusEffect系统
