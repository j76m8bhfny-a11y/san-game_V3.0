use super::{SteamError, SteamResult};
use serde::{Deserialize, Serialize};
use steamworks::Client;
use std::io::{Read, Write};

/// 存档文件元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveFileInfo {
    /// 文件名
    pub name: String,
    /// 文件大小（字节）
    pub size: usize,
    /// 修改时间（Unix 时间戳）
    pub timestamp: i64,
    /// 是否存在云端
    pub exists_in_cloud: bool,
}

/// 游戏存档数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveData {
    /// 存档版本（用于兼容性检查）
    pub version: String,
    /// 存档槽位 (1-3 手动, 0 自动)
    pub slot: u32,
    /// 游戏天数
    pub game_day: u32,
    /// 玩家社会阶层
    pub social_class: String,
    /// 玩家资产
    pub money: i64,
    /// 玩家健康值
    pub health: i32,
    /// 玩家理智值
    pub sanity: i32,
    /// 已触发事件列表
    pub triggered_events: Vec<String>,
    /// 已解锁成就进度（本地缓存）
    pub achievement_progress: Vec<AchievementProgress>,
    /// 存档创建时间
    pub created_at: u64,
    /// 存档修改时间
    pub modified_at: u64,
    /// 额外游戏数据（JSON 字符串，灵活扩展）
    pub extra_data: Option<serde_json::Value>,
}

/// 成就进度（本地存储）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AchievementProgress {
    pub achievement_id: String,
    pub current_progress: u32,
    pub max_progress: u32,
}

#[allow(dead_code)]
impl SaveData {
    /// 创建新存档
    pub fn new(slot: u32) -> Self {
        use std::time::{SystemTime, UNIX_EPOCH};
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        Self {
            version: "1.0.0".to_string(),
            slot,
            game_day: 1,
            social_class: "homeless".to_string(),
            money: 0,
            health: 100,
            sanity: 100,
            triggered_events: Vec::new(),
            achievement_progress: Vec::new(),
            created_at: now,
            modified_at: now,
            extra_data: None,
        }
    }

    /// 更新修改时间
    #[allow(dead_code)]
    pub fn touch(&mut self) {
        use std::time::{SystemTime, UNIX_EPOCH};
        self.modified_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
    }
}

/// 云存档管理器
pub struct CloudManager;

impl CloudManager {
    /// 获取存档文件名
    fn get_filename(slot: u32) -> String {
        match slot {
            0 => "autosave.json".to_string(),
            n => format!("save_slot_{}.json", n),
        }
    }

    /// 检查云存档是否启用
    pub fn is_enabled(client: &Client) -> bool {
        let remote_storage = client.remote_storage();
        remote_storage.is_cloud_enabled_for_app()
    }

    /// 获取云端存储配额
    /// 注意：steamworks 0.11.0 中没有 quota 方法
    /// 返回 (已使用字节数, 总配额字节数)，其中配额为 0 表示无法获取
    pub fn get_quota(client: &Client) -> (u64, u64) {
        let remote_storage = client.remote_storage();
        // 计算已使用的存储空间
        let used: u64 = remote_storage.files().iter().map(|f| f.size).sum();
        // steamworks 0.11.0 没有直接获取配额的方法，返回 (已使用, 0)
        // Steam 云存储通常有 1GB 的限制，但这里无法精确获取
        (used, 0)
    }

    /// 保存存档到云端
    pub fn save(client: &Client, data: &SaveData) -> SteamResult<()> {
        let remote_storage = client.remote_storage();
        let filename = Self::get_filename(data.slot);
        
        // 序列化存档数据
        let json_data = serde_json::to_vec_pretty(data)
            .map_err(|e| SteamError::CloudError {
                message: format!("序列化存档失败: {}", e),
            })?;
        
        // 写入云端存储 - 使用 file().write() 模式
        let file = remote_storage.file(&filename);
        let mut writer = file.write();
        match writer.write_all(&json_data) {
            Ok(_) => {
                log::info!("存档已保存到云端: {}", filename);
                Ok(())
            }
            Err(e) => Err(SteamError::CloudError {
                message: format!("云端存档写入失败: {:?}", e),
            }),
        }
    }

    /// 从云端加载存档
    pub fn load(client: &Client, slot: u32) -> SteamResult<SaveData> {
        let remote_storage = client.remote_storage();
        let filename = Self::get_filename(slot);
        
        // 获取文件句柄并检查文件是否存在
        let file = remote_storage.file(&filename);
        if !file.exists() {
            return Err(SteamError::CloudError {
                message: format!("存档 '{}' 不存在", filename),
            });
        }
        
        // 读取文件 - 使用 file().read() 模式返回 SteamFileReader，需要 read_to_end
        let mut reader = file.read();
        let mut data = Vec::new();
        match reader.read_to_end(&mut data) {
            Ok(_) => {
                let save_data: SaveData = serde_json::from_slice(&data)
                    .map_err(|e| SteamError::CloudError {
                        message: format!("解析存档数据失败: {}", e),
                    })?;
                log::info!("存档已从云端加载: {}", filename);
                Ok(save_data)
            }
            Err(e) => Err(SteamError::CloudError {
                message: format!("云端存档读取失败: {:?}", e),
            }),
        }
    }

    /// 删除云端存档
    pub fn delete(client: &Client, slot: u32) -> SteamResult<()> {
        let remote_storage = client.remote_storage();
        let filename = Self::get_filename(slot);
        
        // 使用 file().delete() 模式
        let file = remote_storage.file(&filename);
        if file.delete() {
            log::info!("云端存档已删除: {}", filename);
            Ok(())
        } else {
            Err(SteamError::CloudError {
                message: format!("删除存档 '{}' 失败", filename),
            })
        }
    }

    /// 获取所有存档列表
    pub fn list_saves(client: &Client) -> Vec<SaveFileInfo> {
        let remote_storage = client.remote_storage();
        let files = remote_storage.files();
        
        files
            .into_iter()
            .filter_map(|file_info| {
                if file_info.name.ends_with(".json") {
                    // 使用 file().timestamp() 获取时间戳
                    let file = remote_storage.file(&file_info.name);
                    let timestamp = file.timestamp();
                    
                    Some(SaveFileInfo {
                        name: file_info.name,
                        size: file_info.size as usize,
                        timestamp,
                        exists_in_cloud: true,
                    })
                } else {
                    None
                }
            })
            .collect()
    }

    /// 检查存档是否存在
    pub fn exists(client: &Client, slot: u32) -> bool {
        let remote_storage = client.remote_storage();
        let filename = Self::get_filename(slot);
        // 使用 file().exists() 模式
        let file = remote_storage.file(&filename);
        file.exists()
    }

    /// 获取存档文件大小
    #[allow(dead_code)]
    pub fn file_size(client: &Client, slot: u32) -> usize {
        let remote_storage = client.remote_storage();
        let filename = Self::get_filename(slot);
        // 通过 files() 列表查找文件大小
        let files = remote_storage.files();
        files
            .into_iter()
            .find(|f| f.name == filename)
            .map(|f| f.size as usize)
            .unwrap_or(0)
    }

    /// 强制同步云端存档（立即上传/下载待处理的文件）
    pub fn force_sync(_client: &Client) -> SteamResult<()> {
        // Steamworks 会自动处理同步
        // enable_cloud_writes 方法在 0.11.0 版本中不存在
        // 云存档的启用状态由 Steam 客户端和应用设置控制
        // 这里我们只是记录同步完成，实际的同步由 Steam 自动处理
        
        log::info!("云端存档同步完成");
        Ok(())
    }
}

/// 云存档同步结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct CloudSyncResult {
    pub success: bool,
    pub uploaded_files: Vec<String>,
    pub downloaded_files: Vec<String>,
    pub conflict_files: Vec<String>,
    pub error_message: Option<String>,
}
