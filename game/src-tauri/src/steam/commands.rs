//! Tauri 命令 - Steam 功能暴露给前端

use super::{
    steam_manager, AchievementManager, CloudManager, GameState, RichPresenceManager,
    RichPresenceData, SaveData, SteamInitResult, SteamState,
};
use tauri::command;

// ==================== 基础命令 ====================

/// 初始化 Steam 客户端
#[command]
pub async fn steam_initialize() -> Result<SteamInitResult, String> {
    let mut manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    match manager.initialize() {
        Ok(_) => {
            let result = SteamInitResult::from(&*manager);
            Ok(result)
        }
        Err(e) => {
            let result = SteamInitResult::from(&*manager);
            Ok(result) // 仍然返回结果，让前端知道具体错误
        }
    }
}

/// 获取当前 Steam 状态
#[command]
pub async fn steam_get_state() -> Result<SteamState, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    Ok(manager.state())
}

/// 检查 Steam 是否已连接
#[command]
pub async fn steam_is_connected() -> Result<bool, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    Ok(manager.is_connected())
}

/// 获取当前玩家信息
#[command]
pub async fn steam_get_player_info() -> Result<Option<(u64, String)>, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let (Some(id), Some(name)) = (manager.steam_id(), manager.player_name()) {
        Ok(Some((id, name.to_string())))
    } else {
        Ok(None)
    }
}

/// 关闭 Steam 客户端
#[command]
pub async fn steam_shutdown() -> Result<(), String> {
    let mut manager = steam_manager().lock().map_err(|e| e.to_string())?;
    manager.shutdown();
    Ok(())
}

// ==================== 成就命令 ====================

/// 获取所有成就列表
#[command]
pub async fn steam_get_achievements() -> Result<Vec<super::Achievement>, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        let achievements = AchievementManager::get_achievements(client);
        Ok(achievements)
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 解锁成就
#[command]
pub async fn steam_unlock_achievement(achievement_id: String) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        AchievementManager::unlock(client, &achievement_id)
            .map_err(|e| e.to_string())
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 检查成就是否已解锁
#[command]
pub async fn steam_is_achievement_unlocked(achievement_id: String) -> Result<bool, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(AchievementManager::is_unlocked(client, &achievement_id))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 获取已解锁成就数量
#[command]
pub async fn steam_get_achievement_progress() -> Result<(u32, u32), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(AchievementManager::get_unlocked_count(client))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

// ==================== 云存档命令 ====================

/// 检查云存档是否启用
#[command]
pub async fn steam_cloud_is_enabled() -> Result<bool, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(CloudManager::is_enabled(client))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 获取云端存储配额
#[command]
pub async fn steam_cloud_get_quota() -> Result<(u64, u64), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(CloudManager::get_quota(client))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 保存存档到云端
#[command]
pub async fn steam_cloud_save(data: SaveData) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        CloudManager::save(client, &data)
            .map_err(|e| e.to_string())
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 从云端加载存档
#[command]
pub async fn steam_cloud_load(slot: u32) -> Result<SaveData, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        CloudManager::load(client, slot)
            .map_err(|e| e.to_string())
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 删除云端存档
#[command]
pub async fn steam_cloud_delete(slot: u32) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        CloudManager::delete(client, slot)
            .map_err(|e| e.to_string())
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 获取所有存档列表
#[command]
pub async fn steam_cloud_list_saves() -> Result<Vec<super::SaveFileInfo>, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(CloudManager::list_saves(client))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 检查存档是否存在
#[command]
pub async fn steam_cloud_exists(slot: u32) -> Result<bool, String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        Ok(CloudManager::exists(client, slot))
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

/// 强制同步云端存档
#[command]
pub async fn steam_cloud_force_sync() -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        CloudManager::force_sync(client)
            .map_err(|e| e.to_string())
    } else {
        Err("Steam 客户端未连接".to_string())
    }
}

// ==================== Rich Presence 命令 ====================

/// 更新 Rich Presence
#[command]
pub async fn steam_rich_presence_update(data: RichPresenceData) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        RichPresenceManager::update(client, &data)
            .map_err(|e| e.to_string())
    } else {
        // Rich Presence 不是关键功能，未连接时不报错
        Ok(())
    }
}

/// 清除 Rich Presence
#[command]
pub async fn steam_rich_presence_clear() -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        RichPresenceManager::clear(client)
            .map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

/// 更新游戏状态（简化版）
#[command]
pub async fn steam_rich_presence_set_game(
    state: GameState,
    game_day: u32,
    social_class: String,
) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        RichPresenceManager::set_game_state(client, state, game_day, &social_class)
            .map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

/// 更新事件状态
#[command]
pub async fn steam_rich_presence_set_event(
    event_name: String,
    game_day: u32,
    social_class: String,
) -> Result<(), String> {
    let manager = steam_manager().lock().map_err(|e| e.to_string())?;
    
    if let Some(client) = manager.client() {
        RichPresenceManager::set_event_state(client, &event_name, game_day, &social_class)
            .map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}
