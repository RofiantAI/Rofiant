// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Deserialize)]
struct WorkspaceFile {
    path: String,
    content: String,
}

// Writes a "Save workspace to folder" export: `dest` is a directory the user
// picked via the native folder dialog, `files` come from the sandbox's file
// API. Rejects any path that isn't confined to `dest` (absolute paths, `..`)
// so a malformed entry can't write outside the folder the user chose.
#[tauri::command]
fn save_workspace_files(dest: String, files: Vec<WorkspaceFile>) -> Result<(), String> {
    let root = std::path::Path::new(&dest);
    for file in files {
        if file.path.is_empty()
            || std::path::Path::new(&file.path).is_absolute()
            || file.path.split('/').any(|part| part == "..")
        {
            return Err(format!("Refusing to write outside destination: {}", file.path));
        }
        let target = root.join(&file.path);
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        std::fs::write(&target, file.content).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, save_workspace_files])
        .setup(|_app| {
            // WebKitGTK denies every getUserMedia call unless something answers
            // its permission-request signal, so mic access (voice input) is
            // silently blocked without this.
            #[cfg(target_os = "linux")]
            {
                use tauri::Manager;
                use webkit2gtk::{PermissionRequestExt, WebViewExt, glib::ObjectExt};

                let webview = _app.get_webview_window("main").unwrap();
                webview.with_webview(|webview| {
                    webview.inner().connect_permission_request(|_, request| {
                        if request.is::<webkit2gtk::UserMediaPermissionRequest>() {
                            request.allow();
                            true
                        } else {
                            false
                        }
                    });
                })?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
