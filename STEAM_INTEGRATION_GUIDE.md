# Steam SDK 集成指南

## 项目结构

```
game/src-tauri/src/steam/          # Rust 后端 Steam 模块
├── mod.rs                         # 模块入口
├── error.rs                       # 错误类型定义
├── client.rs                      # Steam 客户端管理
├── achievements.rs                # 成就系统
├── cloud.rs                       # 云存档系统
├── rich_presence.rs              # Rich Presence
└── commands.rs                    # Tauri 命令暴露

game/src/types/steam/              # TypeScript 类型定义
└── index.ts                       # Steam 相关类型

game/src/store/steam/              # Zustand Store
└── useSteamStore.ts              # Steam 状态管理

game/src/hooks/steam/              # React Hooks
├── useSteamInit.ts               # Steam 初始化
├── useAchievementUnlock.ts       # 成就解锁通知
├── useCloudSave.ts               # 云存档操作
└── useRichPresence.ts            # Rich Presence

game/src/components/steam/         # UI 组件
├── SteamInitializer.tsx          # 初始化状态
├── AchievementNotification.tsx   # 成就解锁通知
├── AchievementPanel.tsx          # 成就列表面板
├── CloudSavePanel.tsx            # 云存档面板
├── SteamStatusIndicator.tsx      # 状态指示器
└── index.ts                      # 组件入口
```

## 使用说明

### 1. 在应用入口初始化 Steam

```tsx
// App.tsx
import { SteamInitializer, AchievementNotification } from './components/steam';

function App() {
  return (
    <SteamInitializer
      showLoadingScreen={true}
      onInitialized={(result) => console.log('Steam 初始化成功', result)}
      onFailed={(error) => console.error('Steam 初始化失败', error)}
    >
      {/* 你的应用内容 */}
      <Game />
      
      {/* 成就解锁通知 */}
      <AchievementNotification />
    </SteamInitializer>
  );
}
```

### 2. 在游戏界面显示 Steam 状态

```tsx
// 游戏主界面
import { SteamStatusIndicator } from './components/steam';
import { useSteamStore } from './store/steam/useSteamStore';
import { useRichPresence } from './hooks/steam';

function Game() {
  // 自动更新 Rich Presence
  const { updateGameState, setMainMenu, setGameOver } = useRichPresence({
    enabled: true,
  });

  // 游戏状态变化时更新 Rich Presence
  useEffect(() => {
    updateGameState(gameDay, socialClass, isInEvent, currentEvent?.name);
  }, [gameDay, socialClass, isInEvent, currentEvent]);

  // 检查并解锁成就
  const checkAchievements = useSteamStore((state) => state.checkAndUnlockAchievements);
  
  useEffect(() => {
    checkAchievements({
      gameDay,
      socialClass,
      hasDied,
      triggeredEvents,
      money,
      isInEvent,
      eventId: currentEvent?.id,
    });
  }, [gameDay, socialClass, hasDied, triggeredEvents, money]);

  return (
    <div>
      {/* Steam 状态指示器 */}
      <SteamStatusIndicator
        currentGameState={{
          gameDay,
          socialClass,
          money,
          health,
          sanity,
          triggeredEvents,
        }}
        onLoadSave={(slot) => {
          // 加载存档后的处理
          loadGameFromCloud(slot);
        }}
      />
      
      {/* 游戏内容 */}
      {/* ... */}
    </div>
  );
}
```

### 3. 手动操作成就

```tsx
import { useSteamStore } from './store/steam/useSteamStore';

function SomeComponent() {
  const unlockAchievement = useSteamStore((state) => state.unlockAchievement);
  const isAchievementUnlocked = useSteamStore((state) => state.isAchievementUnlocked);

  const handleUnlock = async () => {
    await unlockAchievement('ACH_FIRST_BLOOD');
  };

  const checkStatus = async () => {
    const unlocked = await isAchievementUnlocked('ACH_FIRST_BLOOD');
    console.log('已解锁:', unlocked);
  };
}
```

### 4. 手动操作云存档

```tsx
import { useCloudSave } from './hooks/steam';

function SaveMenu() {
  const { save, load, deleteSave, sync, isSaving, isLoading } = useCloudSave({
    enableAutoSave: true,
    autoSaveInterval: 5 * 60 * 1000, // 5 分钟
  });

  const handleSave = async () => {
    await save(1, {
      game_day: 15,
      social_class: 'worker',
      money: 5000,
      health: 80,
      sanity: 90,
      triggered_events: ['EVT_H01_BENCH'],
      achievement_progress: [],
    });
  };

  const handleLoad = async () => {
    const data = await load(1);
    if (data) {
      // 恢复游戏状态
      restoreGameState(data);
    }
  };
}
```

## Steamworks 后台配置

### 1. 创建应用

1. 登录 [Steamworks](https://partner.steamgames.com/)
2. 创建新应用或选择已有应用
3. 记录 App ID

### 2. 配置成就

进入 `App Admin -> Achievements`，添加以下成就：

| API Name | Display Name | Description | Hidden |
|----------|--------------|-------------|--------|
| ACH_FIRST_BLOOD | 第一课 | 在游戏中经历第一次死亡 | No |
| ACH_SURVIVE_7D | 一周战士 | 在街头生存 7 天 | No |
| ACH_SURVIVE_30D | 月度生存者 | 在街头生存 30 天 | No |
| ACH_HOMELESS_ESCAPE | 破茧成蝶 | 成功脱离 homeless 阶层 | No |
| ACH_WORKER_REBEL | 觉醒时刻 | 作为 worker 触发工会事件 | No |
| ACH_MIDDLE_MORTGAGE | 房奴人生 | 背负 30 年房贷 | No |
| ACH_CAPITALIST_FIRST_MILLION | 第一桶金 | 累计资产突破 100 万 | No |
| ACH_IRONIC_ENDING | 黑色幽默 | 触发讽刺性结局 | No |
| ACH_EVENT_COLLECTOR | 百科全书 | 体验过所有 100+ 事件 | No |
| ACH_ALL_CLASSES | 人生百态 | 体验过所有社会阶层 | No |

### 3. 配置 Rich Presence

进入 `App Admin -> Rich Presence`，上传本地化配置文件：

```json
{
  "loc_english": {
    "tokens": {
      "#game_state": {
        "menu": "在主菜单",
        "slums": "在贫民窟挣扎求存",
        "worker": "在工人区努力打拼",
        "middle": "在郊区还房贷",
        "capitalist": "在商业区收割财富",
        "event": "面临人生抉择",
        "paused": "游戏暂停中",
        "gameover": "人生落幕"
      },
      "#display": {
        "Playing": "{game_state} - 第 #game_day# 天"
      }
    }
  },
  "loc_schinese": {
    "tokens": {
      "#game_state": {
        "menu": "在主菜单",
        "slums": "在贫民窟挣扎求存",
        "worker": "在工人区努力打拼",
        "middle": "在郊区还房贷",
        "capitalist": "在商业区收割财富",
        "event": "面临人生抉择",
        "paused": "游戏暂停中",
        "gameover": "人生落幕"
      },
      "#display": {
        "Playing": "{game_state} - 第 #game_day# 天"
      }
    }
  }
}
```

### 4. 启用 Steam Cloud

进入 `App Admin -> Steam Cloud`，启用以下设置：

- Enable Steam Cloud: **✓**
- Byte quota per user: **100 MB**
- Number of files allowed per user: **10**

### 5. 配置启动选项

进入 `Installation -> General Installation`，添加启动选项：

```
--steam
```

## 开发测试

### 使用 Spacewar (App ID 480) 测试

项目默认使用 `480` 作为测试 App ID（Steamworks SDK 自带的测试应用）。

1. 确保 Steam 客户端正在运行
2. 启动游戏，Steam 会自动连接
3. 成就和云存档会显示在 Spacewar 下（仅用于测试）

### 发布前修改

发布前需要修改以下文件：

1. `game/src-tauri/src/steam/mod.rs`:
```rust
// 改为你的实际 App ID
pub const APP_ID: u32 = 你的_APP_ID;
```

2. `game/src-tauri/steam_appid.txt`:
```
你的_APP_ID
```

3. `game/src-tauri/tauri.conf.json`:
```json
"identifier": "com.yourcompany.yourgame"
```

## 打包发布

### Windows

```bash
cd game
npm run tauri build -- --target x86_64-pc-windows-msvc
```

确保 `steam_api64.dll` 在输出目录中。

### macOS

```bash
cd game
npm run tauri build -- --target aarch64-apple-darwin
```

### Linux

```bash
cd game
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## 常见问题

### Q: Steam 初始化失败？
- 确保 Steam 客户端正在运行
- 检查 `steam_appid.txt` 是否存在且内容正确
- 检查防火墙设置

### Q: 成就无法解锁？
- 确保成就 ID 与 Steamworks 后台配置完全一致
- 检查是否调用了 `store_stats()` 上传数据
- 发布后成就才能正常显示在 Steam 上

### Q: 云存档同步失败？
- 确保 Steam Cloud 已在后台启用
- 检查存储配额是否已满
- 检查网络连接

### Q: Rich Presence 不显示？
- 检查 Rich Presence 配置文件是否正确上传
- Steam 好友列表更新可能有延迟
- 确保状态键名与配置匹配

## 参考文档

- [Steamworks SDK Documentation](https://partner.steamgames.com/doc/home)
- [steamworks-rs Crate](https://docs.rs/steamworks/)
- [Tauri v2 Documentation](https://tauri.app/)
