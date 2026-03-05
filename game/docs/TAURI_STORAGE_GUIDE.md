# Tauri 桌面应用存储方案指南

> 针对封装成 EXE 后的存储方案，替代浏览器 localStorage。

---

## 方案对比

| 方案 | 优点 | 缺点 | 推荐场景 |
|------|------|------|----------|
| **Tauri fs API** | 直接文件控制，无大小限制 | 需要手动处理序列化 | 大存档、二进制数据 |
| **tauri-plugin-store** | 类似 localStorage API，自动持久化 | 需要额外插件 | 快速迁移现有代码 |
| **IndexedDB (via Tauri)** | 结构化数据，支持查询 | 较复杂 | 大量结构化数据 |
| **SQLite (via Tauri)** | 关系型数据库，支持复杂查询 | 需要学习成本 | 复杂数据关系 |

---

## 推荐方案：Tauri fs API + JSON

### 为什么选这个？

1. **无存储限制** - 硬盘有多大，存档就能多大
2. **透明可控** - 文件在哪你知道，方便调试和备份
3. **无需插件** - Tauri 内置支持
4. **云存档友好** - 文件形式便于同步到 Steam 云

### 实现代码

#### 1. Rust 端 - 添加文件操作命令

```rust
// src-tauri/src/save.rs
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// 获取存档目录
fn get_save_dir(app: &AppHandle) -> PathBuf {
    let mut path = app.path_resolver().app_data_dir().unwrap();
    path.push("saves");
    fs::create_dir_all(&path).ok();
    path
}

/// 保存存档到文件
#[tauri::command]
pub fn save_to_file(app: AppHandle, slot: u32, data: String) -> Result<(), String> {
    let mut path = get_save_dir(&app);
    path.push(format!("save_{}.json", slot));
    
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(())
}

/// 从文件加载存档
#[tauri::command]
pub fn load_from_file(app: AppHandle, slot: u32) -> Result<String, String> {
    let mut path = get_save_dir(&app);
    path.push(format!("save_{}.json", slot));
    
    if !path.exists() {
        return Err("存档不存在".to_string());
    }
    
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// 删除存档文件
#[tauri::command]
pub fn delete_save_file(app: AppHandle, slot: u32) -> Result<(), String> {
    let mut path = get_save_dir(&app);
    path.push(format!("save_{}.json", slot));
    
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// 获取所有存档列表
#[tauri::command]
pub fn list_save_files(app: AppHandle) -> Result<Vec<SaveFileInfo>, String> {
    let save_dir = get_save_dir(&app);
    let mut saves = vec![];
    
    if let Ok(entries) = fs::read_dir(&save_dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    let timestamp = modified
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs() as i64;
                    
                    saves.push(SaveFileInfo {
                        name: entry.file_name().to_string_lossy().to_string(),
                        size: metadata.len() as usize,
                        timestamp,
                        exists_in_cloud: false,
                    });
                }
            }
        }
    }
    
    Ok(saves)
}
```

#### 2. 前端 - 封装存储 API

```typescript
// src/utils/fileStorage.ts
import { invoke } from '@tauri-apps/api/core';

export interface FileStorageAPI {
  save: (slot: number, data: unknown) => Promise<void>;
  load: <T>(slot: number) => Promise<T | null>;
  delete: (slot: number) => Promise<void>;
  list: () => Promise<SaveFileInfo[]>;
  exists: (slot: number) => Promise<boolean>;
}

export const fileStorage: FileStorageAPI = {
  async save(slot: number, data: unknown): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    await invoke('save_to_file', { slot, data: jsonString });
  },

  async load<T>(slot: number): Promise<T | null> {
    try {
      const jsonString = await invoke<string>('load_from_file', { slot });
      return JSON.parse(jsonString) as T;
    } catch (error) {
      if (error === '存档不存在') {
        return null;
      }
      throw error;
    }
  },

  async delete(slot: number): Promise<void> {
    await invoke('delete_save_file', { slot });
  },

  async list(): Promise<SaveFileInfo[]> {
    return await invoke('list_save_files');
  },

  async exists(slot: number): Promise<boolean> {
    try {
      await invoke('load_from_file', { slot });
      return true;
    } catch {
      return false;
    }
  }
};
```

#### 3. 修改 Zustand Persist 使用文件存储

```typescript
// src/store/useGameStore.ts
import { fileStorage } from '@/utils/fileStorage';

// 检测是否在 Tauri 环境
const isTauri = typeof window !== 'undefined' && 
                (window as any).__TAURI__ !== undefined;

export const useGameStore = create<StoreState>()(
  loggerImpl(
    persist(
      (...a) => ({ /* ... slices ... */ }),
      {
        name: 'pixel-life-storage',
        
        // ✅ 根据环境选择存储方式
        storage: isTauri 
          ? createJSONStorage(() => ({
              getItem: async (name: string) => {
                // 从文件加载（slot 0 作为主存档）
                const data = await fileStorage.load(0);
                return data ? JSON.stringify(data) : null;
              },
              setItem: async (name: string, value: string) => {
                // 保存到文件
                await fileStorage.save(0, JSON.parse(value));
              },
              removeItem: async (name: string) => {
                await fileStorage.delete(0);
              },
            }))
          : createJSONStorage(() => localStorage), // 浏览器回退
        
        // ... 其他配置
      }
    )
  )
);
```

---

## 存档位置

### Windows
```
%APPDATA%\[你的应用名称]\saves\save_0.json
```

### macOS
```
~/Library/Application Support/[你的应用名称]/saves/save_0.json
```

### Linux
```
~/.config/[你的应用名称]/saves/save_0.json
```

---

## 与 Steam 云存档集成

```rust
// 保存时同时写入本地文件和 Steam 云
#[tauri::command]
pub async fn save_game(
    app: AppHandle,
    steam_client: State<'_, SteamClient>,
    slot: u32,
    data: String,
) -> Result<(), String> {
    // 1. 保存到本地文件
    save_to_file(app, slot, data.clone())?;
    
    // 2. 同步到 Steam 云
    if steam_client.is_cloud_enabled() {
        CloudManager::save(&steam_client, &parse_save_data(&data)?)?;
    }
    
    Ok(())
}
```

---

## 迁移方案（从 localStorage）

```typescript
// 首次启动时检测并迁移
export async function migrateFromLocalStorage(): Promise<void> {
  if (!isTauri) return;
  
  const localData = localStorage.getItem('pixel-life-storage');
  if (!localData) return;
  
  // 检查文件存档是否已存在
  const exists = await fileStorage.exists(0);
  if (exists) {
    console.log('文件存档已存在，跳过迁移');
    localStorage.removeItem('pixel-life-storage'); // 清理旧数据
    return;
  }
  
  // 迁移到文件
  console.log('正在从 localStorage 迁移存档...');
  await fileStorage.save(0, JSON.parse(localData));
  localStorage.removeItem('pixel-life-storage');
  console.log('迁移完成');
}
```

---

## 存储空间检查

```rust
#[tauri::command]
pub fn check_disk_space(app: AppHandle) -> Result<DiskSpaceInfo, String> {
    let save_dir = get_save_dir(&app);
    
    // 获取磁盘使用情况
    let available = fs2::available_space(&save_dir)
        .map_err(|e| e.to_string())?;
    
    let total = fs2::total_space(&save_dir.parent().unwrap())
        .map_err(|e| e.to_string())?;
    
    Ok(DiskSpaceInfo {
        available_mb: (available / 1024 / 1024) as u64,
        total_mb: (total / 1024 / 1024) as u64,
        is_low: available < 100 * 1024 * 1024, // < 100MB 警告
    })
}
```

---

## 总结

| 场景 | 建议 |
|------|------|
| 开发/调试 | 保持 localStorage，便于浏览器调试 |
| 生产环境 (EXE) | 使用 Tauri fs API，无大小限制 |
| Steam 版本 | 本地文件 + Steam 云同步双保险 |
| 存档备份 | 文件形式便于玩家手动备份 |

**不需要再担心 5MB 限制！**
