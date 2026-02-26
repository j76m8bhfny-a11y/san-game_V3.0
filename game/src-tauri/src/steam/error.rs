use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Steam 操作结果
pub type SteamResult<T> = Result<T, SteamError>;

/// Steam 错误类型
#[derive(Debug, Error, Clone, Serialize, Deserialize)]
pub enum SteamError {
    #[error("Steam 客户端未运行")]
    ClientNotRunning,
    
    #[error("Steam 初始化失败: {message}")]
    InitFailed { message: String },
    
    #[error("游戏所有权验证失败")]
    OwnershipCheckFailed,
    
    #[error("成就系统错误: {message}")]
    AchievementError { message: String },
    
    #[error("云存档错误: {message}")]
    CloudError { message: String },
    
    #[error("Rich Presence 错误: {message}")]
    RichPresenceError { message: String },
    
    #[error("Steam 操作超时")]
    Timeout,
    
    #[error("未知错误: {message}")]
    Unknown { message: String },
}

impl From<anyhow::Error> for SteamError {
    fn from(err: anyhow::Error) -> Self {
        SteamError::Unknown {
            message: err.to_string(),
        }
    }
}

impl From<std::io::Error> for SteamError {
    fn from(err: std::io::Error) -> Self {
        SteamError::CloudError {
            message: format!("IO 错误: {}", err),
        }
    }
}
