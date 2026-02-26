//! Steamworks SDK 集成模块
//! 
//! 提供以下功能：
//! - 基础启动与所有权验证
//! - 成就系统 (Achievements)
//! - Steam 云存档 (Steam Cloud)
//! - 丰富的动态状态 (Rich Presence)

mod client;
mod achievements;
mod cloud;
mod rich_presence;
mod error;
pub mod commands;

pub use client::{SteamManager, SteamState, SteamInitResult};
pub use achievements::{AchievementManager, Achievement};
pub use cloud::{CloudManager, SaveData, SaveFileInfo};
pub use rich_presence::{RichPresenceManager, GameState, RichPresenceData};
pub use error::{SteamError, SteamResult};

use once_cell::sync::Lazy;
use std::sync::Mutex;

/// 全局 Steam 管理器实例
static STEAM_MANAGER: Lazy<Mutex<SteamManager>> = Lazy::new(|| {
    Mutex::new(SteamManager::new())
});

/// 获取全局 Steam 管理器实例
pub fn steam_manager() -> &'static Mutex<SteamManager> {
    &STEAM_MANAGER
}

/// Steam App ID
/// 注意：发布前需要替换为实际的 Steam App ID
/// 开发测试可使用 480 ( Spacewar )
pub const APP_ID: u32 = 480;
