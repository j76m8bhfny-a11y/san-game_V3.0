# 存档系统优化记录

## 优化内容

### 1. Tauri 迁移时机优化 ✅

**问题**: 迁移逻辑分散在 `getStorageAdapter` 和 `onRehydrateStorage` 两处

**优化**:
- 迁移逻辑统一在 `getStorageAdapter.getItem()` 中处理
- 添加 `MIGRATION_FLAG_KEY` 标记避免重复迁移
- 缓存迁移数据，避免重复读取文件
- 移除 `onRehydrateStorage` 中的冗余迁移逻辑

**效果**:
- 迁移只会在首次启动时执行一次
- 避免 hydration 后的重复迁移尝试
- 代码逻辑更清晰

### 2. 磁盘空间检测完善 ✅

**问题**: `check_disk_space` 函数返回占位数据

**优化**:
- 添加 `sysinfo = "0.30"` crate
- 实现真正的跨平台磁盘空间检测
- 自动找到存档目录所在的磁盘
- 添加 `save_dir` 字段返回存档路径

**API**:
```rust
DiskSpaceInfo {
    available_mb: u64,  // 可用空间 MB
    total_mb: u64,      // 总空间 MB
    is_low: bool,       // < 100MB 时 true
    save_dir: String,   // 存档目录路径
}
```

### 3. 避免不必要的 localStorage 写入 ✅

**问题**: Tauri 环境下仍会写入 localStorage

**优化**:
- v0→v1 迁移时检测 `isTauri()`，跳过 localStorage 写入
- `backupAndResetSave` 改为 async，支持文件存储备份
- setHasHydrated 失败时，Tauri 环境删除文件存档而非 localStorage

## 新增 API

### Rust 命令
- `check_disk_space` - 检查磁盘空间（已完善）

### TypeScript API
- `fileStorage.backup(slot, backupName)` - 备份存档
- `forceRemigrate()` - 强制重新迁移（调试）

## 文件变更

| 文件 | 变更 |
|------|------|
| `src/utils/fileStorage.ts` | 添加迁移标记、缓存机制、backup 方法 |
| `src/store/useGameStore.ts` | 优化迁移逻辑、支持异步备份 |
| `src-tauri/Cargo.toml` | 添加 sysinfo 依赖 |
| `src-tauri/src/save_file.rs` | 完善 check_disk_space 实现 |

## 测试建议

### 浏览器环境
```bash
cd game
npm run dev
# 检查 localStorage 正常读写
```

### Tauri 环境
```bash
cd game
npm run tauri dev
# 1. 首次启动：观察是否从 localStorage 迁移
# 2. 重启应用：观察是否跳过迁移
# 3. 检查存档文件：%APPDATA%/game/saves/save_0.json
```

### 磁盘空间检测
在 Tauri 开发者工具控制台执行：
```typescript
import { invoke } from '@tauri-apps/api/core';
await invoke('check_disk_space');
// 应该返回真实的磁盘空间信息
```
