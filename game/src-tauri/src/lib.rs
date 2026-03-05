// Steam 模块
mod steam;
// 文件存档模块
mod save_file;

use steam::commands::*;
use save_file::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Steam 基础命令
            steam_initialize,
            steam_get_state,
            steam_is_connected,
            steam_get_player_info,
            steam_shutdown,
            // Steam 成就命令
            steam_get_achievements,
            steam_unlock_achievement,
            steam_is_achievement_unlocked,
            steam_get_achievement_progress,
            // Steam 云存档命令
            steam_cloud_is_enabled,
            steam_cloud_get_quota,
            steam_cloud_save,
            steam_cloud_load,
            steam_cloud_delete,
            steam_cloud_list_saves,
            steam_cloud_exists,
            steam_cloud_force_sync,
            // Steam Rich Presence 命令
            steam_rich_presence_update,
            steam_rich_presence_clear,
            steam_rich_presence_set_game,
            steam_rich_presence_set_event,
            // 文件存档命令
            save_to_file,
            load_from_file,
            delete_save_file,
            list_save_files,
            check_save_exists,
            get_save_directory,
            backup_save,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
