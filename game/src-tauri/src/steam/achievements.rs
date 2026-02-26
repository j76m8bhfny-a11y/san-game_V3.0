use super::{SteamError, SteamResult};
use serde::{Deserialize, Serialize};
use steamworks::Client;

/// 成就定义
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    /// 成就唯一ID（必须与 Steamworks 后台配置一致）
    pub id: String,
    /// 成就名称（显示用）
    pub name: String,
    /// 成就描述
    pub description: String,
    /// 是否已解锁
    pub unlocked: bool,
    /// 解锁时间（Unix 时间戳）
    pub unlock_time: Option<u64>,
    /// 是否是进度型成就
    pub is_progressive: bool,
    /// 当前进度（如果是进度型）
    pub current_progress: u32,
    /// 最大进度（如果是进度型）
    pub max_progress: u32,
}

#[allow(dead_code)]
impl Achievement {
    /// 创建新成就
    pub fn new(id: &str, name: &str, description: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            unlocked: false,
            unlock_time: None,
            is_progressive: false,
            current_progress: 0,
            max_progress: 0,
        }
    }

    /// 创建进度型成就
    #[allow(dead_code)]
    pub fn new_progressive(
        id: &str,
        name: &str,
        description: &str,
        max_progress: u32,
    ) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            unlocked: false,
            unlock_time: None,
            is_progressive: true,
            current_progress: 0,
            max_progress,
        }
    }
}

/// 成就管理器
pub struct AchievementManager;

impl AchievementManager {
    /// 获取所有成就列表（包含解锁状态）
    pub fn get_achievements<M>(client: &Client<M>) -> Vec<Achievement> {
        let user_stats = client.user_stats();
        let achievement_names = user_stats.get_achievement_names();
        
        let names = match achievement_names {
            Some(names) => names,
            None => return Vec::new(),
        };
        
        names
            .into_iter()
            .filter_map(|name| {
                let achievement = user_stats.achievement(&name);
                
                // 获取成就显示名称
                let display_name = achievement
                    .get_achievement_display_attribute("name")
                    .unwrap_or(&name)
                    .to_string();
                
                // 获取成就描述
                let description = achievement
                    .get_achievement_display_attribute("desc")
                    .unwrap_or("")
                    .to_string();
                
                // 获取解锁状态 - 返回 Result<bool, ()>
                let unlocked = achievement.get().unwrap_or(false);
                
                // Note: steamworks 0.11.0 没有直接获取解锁时间的 API
                // 如果需要解锁时间，需要通过其他方式实现
                let unlock_time = None;
                
                Some(Achievement {
                    id: name,
                    name: display_name,
                    description,
                    unlocked,
                    unlock_time: if unlocked { unlock_time } else { None },
                    is_progressive: false,
                    current_progress: 0,
                    max_progress: 0,
                })
            })
            .collect()
    }

    /// 解锁成就
    pub fn unlock<M>(client: &Client<M>, achievement_id: &str) -> SteamResult<()> {
        let user_stats = client.user_stats();
        let achievement = user_stats.achievement(achievement_id);
        
        // 验证成就是否存在：尝试获取名称
        if achievement.get_achievement_display_attribute("name").is_err() {
            return Err(SteamError::AchievementError {
                message: format!("成就 '{}' 不存在", achievement_id),
            });
        }
        
        if let Err(e) = achievement.set() {
            return Err(SteamError::AchievementError {
                message: format!("解锁成就失败: {:?}", e),
            });
        }
        
        // 立即上传成就数据到 Steam
        if let Err(e) = user_stats.store_stats() {
            return Err(SteamError::AchievementError {
                message: format!("存储成就数据失败: {:?}", e),
            });
        }
        
        log::info!("成就解锁: {}", achievement_id);
        Ok(())
    }

    /// 检查成就是否已解锁
    pub fn is_unlocked<M>(client: &Client<M>, achievement_id: &str) -> bool {
        let user_stats = client.user_stats();
        let achievement = user_stats.achievement(achievement_id);
        
        achievement.get().unwrap_or(false)
    }

    /// 清除所有成就（调试用）
    /// ⚠️ 仅用于开发测试，发布版本应该移除
    #[allow(dead_code)]
    pub fn clear_all<M>(client: &Client<M>) -> SteamResult<()> {
        let user_stats = client.user_stats();
        
        if let Err(e) = user_stats.reset_all_stats(true) {
            return Err(SteamError::AchievementError {
                message: format!("清除成就失败: {:?}", e),
            });
        }
        
        log::info!("所有成就已清除");
        Ok(())
    }

    /// 获取已解锁成就数量
    pub fn get_unlocked_count<M>(client: &Client<M>) -> (u32, u32) {
        let achievements = Self::get_achievements(client);
        let total = achievements.len() as u32;
        let unlocked = achievements.iter().filter(|a| a.unlocked).count() as u32;
        (unlocked, total)
    }
}

/// 成就更新事件（用于前端通知）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AchievementUnlockEvent {
    pub achievement_id: String,
    pub achievement_name: String,
    pub achievement_description: String,
    pub unlock_time: u64,
}
