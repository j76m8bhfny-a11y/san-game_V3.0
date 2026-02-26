use super::error::SteamResult;
use serde::{Deserialize, Serialize};
use steamworks::Client;

/// Steam 连接状态
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum SteamState {
    /// 未初始化
    Uninitialized,
    /// 正在初始化
    Initializing,
    /// 已连接并验证
    Connected,
    /// 连接失败
    Failed { reason: String },
}

/// Steam 客户端管理器
pub struct SteamManager {
    /// 当前连接状态
    state: SteamState,
    /// Steam 客户端实例
    client: Option<Client>,
    /// 是否已验证游戏所有权
    is_ownership_verified: bool,
    /// 当前玩家 Steam ID
    steam_id: Option<u64>,
    /// 当前玩家昵称
    player_name: Option<String>,
}

impl SteamManager {
    /// 创建新的 Steam 管理器
    pub fn new() -> Self {
        Self {
            state: SteamState::Uninitialized,
            client: None,
            is_ownership_verified: false,
            steam_id: None,
            player_name: None,
        }
    }

    /// 初始化 Steam 客户端
    /// 
    /// # 返回
    /// - 成功: Ok(())
    /// - 失败: Err(SteamError)
    pub fn initialize(&mut self) -> SteamResult<()> {
        if self.state == SteamState::Connected {
            return Ok(());
        }

        self.state = SteamState::Initializing;

        // 尝试初始化 Steam 客户端
        match Client::init() {
            Ok((client, _single)) => {
                // 验证游戏所有权
                if self.verify_ownership(&client) {
                    self.is_ownership_verified = true;
                    
                    // 获取玩家信息
                    let user = client.user();
                    let friends = client.friends();
                    self.steam_id = Some(user.steam_id().raw());
                    self.player_name = Some(friends.name());
                    
                    self.client = Some(client);
                    self.state = SteamState::Connected;
                    log::info!("Steam 初始化成功: {:?}", self.steam_id);
                    Ok(())
                } else {
                    self.state = SteamState::Failed {
                        reason: "游戏所有权验证失败".to_string(),
                    };
                    Err(super::SteamError::OwnershipCheckFailed)
                }
            }
            Err(e) => {
                let reason = format!("Steam 客户端初始化失败: {:?}", e);
                self.state = SteamState::Failed {
                    reason: reason.clone(),
                };
                Err(super::SteamError::InitFailed { message: reason })
            }
        }
    }

    /// 验证游戏所有权
    fn verify_ownership(&self, client: &Client) -> bool {
        let apps = client.apps();
        // 检查用户是否拥有当前游戏
        apps.is_subscribed()
    }

    /// 获取当前状态
    pub fn state(&self) -> SteamState {
        self.state.clone()
    }

    /// 检查是否已连接
    pub fn is_connected(&self) -> bool {
        matches!(self.state, SteamState::Connected)
    }

    /// 获取 Steam 客户端
    pub fn client(&self) -> Option<&Client> {
        self.client.as_ref()
    }

    /// 获取当前玩家 Steam ID
    pub fn steam_id(&self) -> Option<u64> {
        self.steam_id
    }

    /// 获取当前玩家昵称
    pub fn player_name(&self) -> Option<&str> {
        self.player_name.as_deref()
    }

    /// 运行 Steam 回调
    /// 需要在主循环中定期调用
    pub fn run_callbacks(&self) {
        if let Some(_client) = self.client.as_ref() {
            // steamworks-rs 的 SingleClient 会自动处理回调
            // 这里可以添加额外的回调处理逻辑
        }
    }

    /// 安全关闭 Steam 客户端
    pub fn shutdown(&mut self) {
        self.client = None;
        self.state = SteamState::Uninitialized;
        self.is_ownership_verified = false;
        self.steam_id = None;
        self.player_name = None;
        log::info!("Steam 客户端已关闭");
    }
}

impl Default for SteamManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Steam 初始化结果（用于前端）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SteamInitResult {
    pub success: bool,
    pub state: SteamState,
    pub steam_id: Option<u64>,
    pub player_name: Option<String>,
    pub error_message: Option<String>,
}

impl From<&SteamManager> for SteamInitResult {
    fn from(manager: &SteamManager) -> Self {
        let error_message = match &manager.state {
            SteamState::Failed { reason } => Some(reason.clone()),
            _ => None,
        };

        Self {
            success: manager.is_connected(),
            state: manager.state.clone(),
            steam_id: manager.steam_id,
            player_name: manager.player_name.clone(),
            error_message,
        }
    }
}
