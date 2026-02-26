use super::{SteamError, SteamResult};
use serde::{Deserialize, Serialize};
use steamworks::Client;

/// 游戏状态枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameState {
    /// 主菜单
    MainMenu,
    /// 游戏中 - 贫民窟
    PlayingSlums,
    /// 游戏中 - 工人区
    PlayingWorker,
    /// 游戏中 - 中产郊区
    PlayingMiddle,
    /// 游戏中 - 商业区
    PlayingCapitalist,
    /// 事件选择中
    InEvent,
    /// 暂停菜单
    Paused,
    /// 游戏结束
    GameOver,
}

impl GameState {
    /// 获取状态显示文本
    pub fn display_name(&self) -> &'static str {
        match self {
            GameState::MainMenu => "在主菜单",
            GameState::PlayingSlums => "在贫民窟挣扎求存",
            GameState::PlayingWorker => "在工人区努力打拼",
            GameState::PlayingMiddle => "在郊区还房贷",
            GameState::PlayingCapitalist => "在商业区收割财富",
            GameState::InEvent => "面临人生抉择",
            GameState::Paused => "游戏暂停中",
            GameState::GameOver => "人生落幕",
        }
    }

    /// 获取状态图标键（需要在 Steamworks 后台配置）
    pub fn icon_key(&self) -> &'static str {
        match self {
            GameState::MainMenu => "menu",
            GameState::PlayingSlums => "slums",
            GameState::PlayingWorker => "worker",
            GameState::PlayingMiddle => "middle",
            GameState::PlayingCapitalist => "capitalist",
            GameState::InEvent => "event",
            GameState::Paused => "paused",
            GameState::GameOver => "gameover",
        }
    }
}

/// Rich Presence 数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RichPresenceData {
    /// 当前游戏状态
    pub state: GameState,
    /// 游戏天数
    pub game_day: u32,
    /// 社会阶层
    pub social_class: String,
    /// 当前事件名称（如果处于事件中）
    pub current_event: Option<String>,
    /// 玩家资产
    pub money: Option<i64>,
    /// 是否可加入（预留多人模式）
    pub joinable: bool,
}

impl Default for RichPresenceData {
    fn default() -> Self {
        Self {
            state: GameState::MainMenu,
            game_day: 0,
            social_class: "homeless".to_string(),
            current_event: None,
            money: None,
            joinable: false,
        }
    }
}

/// Rich Presence 管理器
pub struct RichPresenceManager;

impl RichPresenceManager {
    /// 更新 Rich Presence
    pub fn update(client: &Client, data: &RichPresenceData) -> SteamResult<()> {
        let friends = client.friends();
        
        // 设置状态
        friends.set_rich_presence("steam_display", Some(data.state.display_name()));
        
        // 设置游戏状态键（用于 Steam 好友列表显示）
        friends.set_rich_presence("game_state", Some(data.state.icon_key()));
        
        // 设置游戏天数
        if data.game_day > 0 {
            friends.set_rich_presence("game_day", Some(&data.game_day.to_string()));
        } else {
            friends.set_rich_presence("game_day", None);
        }
        
        // 设置社会阶层
        friends.set_rich_presence("social_class", Some(&data.social_class));
        
        // 设置当前事件
        if let Some(ref event) = data.current_event {
            friends.set_rich_presence("current_event", Some(event));
        } else {
            friends.set_rich_presence("current_event", None);
        }
        
        // 设置资产（格式化显示）
        if let Some(money) = data.money {
            let money_str = format_money(money);
            friends.set_rich_presence("money", Some(&money_str));
        } else {
            friends.set_rich_presence("money", None);
        }
        
        // 设置是否可加入
        if data.joinable {
            friends.set_rich_presence("steam_player_group", Some("san_game_session"));
            friends.set_rich_presence("steam_player_group_size", Some("1"));
        } else {
            friends.set_rich_presence("steam_player_group", None);
            friends.set_rich_presence("steam_player_group_size", None);
        }
        
        log::debug!("Rich Presence 已更新: {:?}", data.state);
        Ok(())
    }

    /// 清除 Rich Presence
    pub fn clear(client: &Client) -> SteamResult<()> {
        let friends = client.friends();
        friends.clear_rich_presence();
        log::debug!("Rich Presence 已清除");
        Ok(())
    }

    /// 更新游戏状态（简化版）
    pub fn set_game_state(
        client: &Client,
        state: GameState,
        game_day: u32,
        social_class: &str,
    ) -> SteamResult<()> {
        let data = RichPresenceData {
            state,
            game_day,
            social_class: social_class.to_string(),
            current_event: None,
            money: None,
            joinable: false,
        };
        Self::update(client, &data)
    }

    /// 更新事件状态
    pub fn set_event_state(
        client: &Client,
        event_name: &str,
        game_day: u32,
        social_class: &str,
    ) -> SteamResult<()> {
        let data = RichPresenceData {
            state: GameState::InEvent,
            game_day,
            social_class: social_class.to_string(),
            current_event: Some(event_name.to_string()),
            money: None,
            joinable: false,
        };
        Self::update(client, &data)
    }
}

/// 格式化金钱显示
fn format_money(money: i64) -> String {
    if money >= 1_000_000 {
        format!("${:.1}M", money as f64 / 1_000_000.0)
    } else if money >= 1000 {
        format!("${:.1}K", money as f64 / 1000.0)
    } else {
        format!("${}", money)
    }
}

/// Rich Presence 本地化配置（需要在 Steamworks 后台设置）
///
/// 在 Steamworks 后台 -> 你的 App -> Rich Presence 中配置：
///
/// ```json
/// {
///   "loc_english": {
///     "tokens": {
///       "#game_state": {
///         "mainmenu": "在主菜单",
///         "slums": "在贫民窟挣扎求存",
///         "worker": "在工人区努力打拼",
///         "middle": "在郊区还房贷",
///         "capitalist": "在商业区收割财富",
///         "event": "面临人生抉择",
///         "paused": "游戏暂停中",
///         "gameover": "人生落幕"
///       },
///       "#display": {
///         "Playing": "{game_state} - 第 #game_day# 天"
///       }
///     }
///   }
/// }
/// ```
#[allow(dead_code)]
pub const RICH_PRESENCE_CONFIG: &str = r#"
Rich Presence 配置需要在 Steamworks 后台设置：
1. 登录 Steamworks 开发者后台
2. 找到你的 App
3. 进入 "Rich Presence" 页面
4. 上传配置文件
"#;
