//! 文件存档系统
//! 用于 Tauri 桌面应用，替代 localStorage，无大小限制

use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

use crate::steam::SaveFileInfo;

/// 获取存档目录
/// Windows: %APPDATA%\[app_id]\saves\
/// macOS: ~/Library/Application Support/[app_id]/saves/
/// Linux: ~/.config/[app_id]/saves/
fn get_save_dir(app: &AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;
    let path = app
        .path()
        .app_data_dir()
        .map_err(|_| "无法获取应用数据目录")?;
    
    let save_dir = path.join("saves");
    fs::create_dir_all(&save_dir).map_err(|e| format!("创建存档目录失败: {}", e))?;
    
    Ok(save_dir)
}

/// 获取存档文件路径
fn get_save_path(app: &AppHandle, slot: u32) -> Result<PathBuf, String> {
    let save_dir = get_save_dir(app)?;
    Ok(save_dir.join(format!("save_{}.json", slot)))
}

/// 保存存档到文件
/// 
/// # Arguments
/// * `app` - Tauri 应用句柄
/// * `slot` - 存档槽位 (0 = 自动存档, 1-3 = 手动存档)
/// * `data` - JSON 格式的存档数据字符串
#[tauri::command]
pub fn save_to_file(app: AppHandle, slot: u32, data: String) -> Result<(), String> {
    let path = get_save_path(&app, slot)?;
    
    // 写入文件（原子操作：先写入临时文件，再重命名）
    let temp_path = path.with_extension("tmp");
    fs::write(&temp_path, data).map_err(|e| format!("写入存档失败: {}", e))?;
    fs::rename(&temp_path, &path).map_err(|e| format!("重命名存档文件失败: {}", e))?;
    
    log::info!("存档已保存到: {:?}", path);
    Ok(())
}

/// 从文件加载存档
/// 
/// # Arguments
/// * `app` - Tauri 应用句柄
/// * `slot` - 存档槽位
/// 
/// # Returns
/// 存档数据的 JSON 字符串
#[tauri::command]
pub fn load_from_file(app: AppHandle, slot: u32) -> Result<String, String> {
    let path = get_save_path(&app, slot)?;
    
    if !path.exists() {
        return Err("存档不存在".to_string());
    }
    
    fs::read_to_string(&path).map_err(|e| format!("读取存档失败: {}", e))
}

/// 删除存档文件
#[tauri::command]
pub fn delete_save_file(app: AppHandle, slot: u32) -> Result<(), String> {
    let path = get_save_path(&app, slot)?;
    
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("删除存档失败: {}", e))?;
        log::info!("存档已删除: {:?}", path);
    }
    
    Ok(())
}

/// 获取所有存档列表
#[tauri::command]
pub fn list_save_files(app: AppHandle) -> Result<Vec<SaveFileInfo>, String> {
    let save_dir = get_save_dir(&app)?;
    let mut saves = Vec::new();
    
    let entries = match fs::read_dir(&save_dir) {
        Ok(entries) => entries,
        Err(_) => return Ok(saves), // 目录不存在或为空，返回空列表
    };
    
    for entry in entries.flatten() {
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        
        if !metadata.is_file() {
            continue;
        }
        
        let name = entry.file_name().to_string_lossy().to_string();
        
        // 只处理 .json 文件
        if !name.ends_with(".json") {
            continue;
        }
        
        let timestamp = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        
        saves.push(SaveFileInfo {
            name,
            size: metadata.len() as usize,
            timestamp,
            exists_in_cloud: false,
        });
    }
    
    // 按时间戳排序（最新的在前）
    saves.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    Ok(saves)
}

/// 检查存档是否存在
#[tauri::command]
pub fn check_save_exists(app: AppHandle, slot: u32) -> Result<bool, String> {
    let path = get_save_path(&app, slot)?;
    Ok(path.exists())
}

/// 获取存档目录路径（用于调试）
#[tauri::command]
pub fn get_save_directory(app: AppHandle) -> Result<String, String> {
    let path = get_save_dir(&app)?;
    Ok(path.to_string_lossy().to_string())
}

/// 磁盘空间信息
#[derive(serde::Serialize)]
pub struct DiskSpaceInfo {
    /// 可用空间 (MB)
    pub available_mb: u64,
    /// 总空间 (MB)
    pub total_mb: u64,
    /// 是否空间不足 (< 100MB)
    pub is_low: bool,
    /// 存档目录路径
    pub save_dir: String,
}

/// 检查磁盘空间
/// 使用 sysinfo 库实现跨平台磁盘空间检测
#[tauri::command]
pub fn check_disk_space(app: AppHandle) -> Result<DiskSpaceInfo, String> {
    use sysinfo::{Disk, Disks};
    
    let save_dir = get_save_dir(&app)?;
    
    // 获取所有磁盘信息
    let disks = Disks::new_with_refreshed_list();
    
    // 找到存档目录所在的磁盘
    let save_dir_str = save_dir.to_string_lossy().to_string();
    let mut target_disk: Option<&Disk> = None;
    
    for disk in disks.list() {
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        if save_dir_str.starts_with(&mount_point) {
            // 选择挂载点最长的（最精确的匹配）
            if target_disk.map(|d| d.mount_point().to_string_lossy().len() < mount_point.len()).unwrap_or(true) {
                target_disk = Some(disk);
            }
        }
    }
    
    if let Some(disk) = target_disk {
        let available = disk.available_space();
        let total = disk.total_space();
        
        // 转换为 MB
        let available_mb = available / 1024 / 1024;
        let total_mb = total / 1024 / 1024;
        
        // 低于 100MB 认为是空间不足
        let is_low = available_mb < 100;
        
        if is_low {
            log::warn!("磁盘空间不足: 可用 {} MB", available_mb);
        }
        
        Ok(DiskSpaceInfo {
            available_mb,
            total_mb,
            is_low,
            save_dir: save_dir_str,
        })
    } else {
        // 如果找不到匹配的磁盘，返回未知状态
        log::warn!("无法确定存档目录所在磁盘的空间信息");
        Ok(DiskSpaceInfo {
            available_mb: 0,
            total_mb: 0,
            is_low: false,
            save_dir: save_dir_str,
        })
    }
}

/// 备份存档
#[tauri::command]
pub fn backup_save(app: AppHandle, slot: u32, backup_name: String) -> Result<(), String> {
    let save_dir = get_save_dir(&app)?;
    let source = get_save_path(&app, slot)?;
    
    if !source.exists() {
        return Err("源存档不存在".to_string());
    }
    
    let backup_path = save_dir.join(format!("backup_{}_{}.json", backup_name, slot));
    fs::copy(&source, &backup_path).map_err(|e| format!("备份失败: {}", e))?;
    
    log::info!("存档已备份到: {:?}", backup_path);
    Ok(())
}
