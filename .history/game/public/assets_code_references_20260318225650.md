# 代码中明确引用的图片素材清单

## 说明
本清单基于对代码文件的搜索，列出了游戏代码中明确引用的所有图片素材，包括文件路径和引用位置。

## 素材列表

### 1. UI 相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| pixel_phone_frame.png | /assets/ui/ | src/components/game/MessageWindow.tsx:436 | ✅ 存在 |
| pixel_phone_frame.png | /assets/ui/ | src/components/game/Crypto/CryptoNewsPopup.tsx:172 | ✅ 存在 |

### 2. 事件相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| default_event.png | /assets/events/ | src/components/game/MessageWindow.tsx:703 | ✅ 存在 |
| event_placeholder.png | /assets/scenes/ | src/components/game/MessageWindow.tsx:782 | ✅ 存在 |

### 3. 场景相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| player_back.png | /assets/scenes/ | src/components/game/MessageWindow.tsx:37 | ✅ 存在 |
| player_back.png | /assets/scenes/ | src/components/game/TitleScreen.tsx:201 | ✅ 存在 |
| player_back.png | /assets/scenes/ | src/components/game/Crypto/CryptoNewsPopup.tsx:224 | ✅ 存在 |
| prop_bull_charging.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:72 | ✅ 存在 |
| prop_bull.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:72 | ✅ 存在 |
| prop_luxury_car_lights.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:109 | ✅ 存在 |
| prop_luxury_car.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:109 | ✅ 存在 |
| prop_hologram_stock_active.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:146 | ✅ 存在 |
| prop_hologram_stock.png | /assets/scenes/downtown/ | src/components/game/scenes/DowntownScene.tsx:146 | ✅ 存在 |

### 4. 住房相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| prop_hoa_sign.png | /assets/housing/ | src/components/game/housing/components/SuburbsExterior.tsx:46 | ✅ 存在 |
| ui_cardboard_sign.png | /assets/housing/ | src/components/game/housing/components/SlumsExterior.tsx:55 | ✅ 存在 |
| ui_clipboard.png | /assets/housing/ | src/components/game/housing/components/RustBeltExterior.tsx:60 | ✅ 存在 |
| ui_bill_stack.png | /assets/housing/ | src/components/game/housing/components/SuburbsInterior.tsx:53 | ✅ 存在 |
| ui_sofa.png | /assets/housing/ | src/components/game/housing/components/SuburbsInterior.tsx:82 | ✅ 存在 |
| ui_sleeping_bag.png | /assets/housing/ | src/components/game/housing/components/SlumsInterior.tsx:70 | ✅ 存在 |
| ui_whiskey.png | /assets/housing/ | src/components/game/housing/components/DowntownInterior.tsx:50 | ✅ 存在 |
| ui_tv_set.png | /assets/housing/ | src/components/game/housing/components/RustBeltInterior.tsx:51 | ✅ 存在 |
| ui_messy_bed.png | /assets/housing/ | src/components/game/housing/components/RustBeltInterior.tsx:89 | ✅ 存在 |
| ui_fingerprint.png | /assets/housing/ | src/components/game/housing/components/DowntownExterior.tsx:81 | ✅ 存在 |

### 5. 医疗相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| ui_body_scan.png | /assets/medical/ | src/components/game/medical/components/DowntownClinicInterior.tsx:40 | ✅ 存在 |
| ui_graffiti_cross.png | /assets/medical/ | src/components/game/medical/components/SlumsClinicExterior.tsx:46 | ✅ 存在 |

### 6. 银行相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| ui_money_hand.png | /assets/bank/ | src/components/game/bank/components/RustBeltBankInterior.tsx:182 | ✅ 存在 |
| ui_money_roll.png | /assets/bank/ | src/components/game/bank/components/SlumsBankInterior.tsx:99 | ✅ 存在 |
| ui_money_stack.png | /assets/bank/ | src/components/game/bank/components/SlumsBankInterior.tsx:106 | ✅ 存在 |

### 7. 特效相关
| 素材图片名称 | 路径 | 引用位置 | 状态 |
|------------|------|---------|------|
| blood_stain_1.png | /assets/fx/ | src/components/game/medical/components/SlumsClinicInterior.tsx:43 | ❌ 缺失 |
| blood_stain_2.png | /assets/fx/ | src/components/game/medical/components/SlumsClinicInterior.tsx:44 | ❌ 缺失 |

## 缺失素材列表

| 素材图片名称 | 应该放置的文件夹位置 | 引用位置 |
|------------|-------------------|---------|
| blood_stain_1.png | public/assets/fx/ | src/components/game/medical/components/SlumsClinicInterior.tsx:43 |
| blood_stain_2.png | public/assets/fx/ | src/components/game/medical/components/SlumsClinicInterior.tsx:44 |

## 总结

1. **已存在的素材**：大部分代码中引用的素材都已存在于项目中，包括UI元素、场景元素、住房相关素材等。

2. **缺失的素材**：只有2个特效相关的素材缺失：
   - blood_stain_1.png
   - blood_stain_2.png

3. **建议**：
   - 补充缺失的特效素材
   - 确保所有引用的素材都有适当的备份和容错处理
   - 考虑为所有素材添加统一的错误处理机制，确保游戏在素材缺失时仍能正常运行

## 技术说明

- **搜索范围**：src/components 目录下的所有文件
- **搜索模式**：`src.*\.(png|jpg|jpeg|gif|svg)`
- **检查方法**：通过代码搜索找到引用，然后与实际文件系统中的素材进行比对
- **状态判断**：基于文件系统中是否存在对应的文件