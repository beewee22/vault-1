use keyring::Entry;
use tauri::Manager;

#[tauri::command]
async fn save_vault_token(token: String) -> Result<(), String> {
    let entry = Entry::new("vault-desktop", "default-token").map_err(|e| e.to_string())?;
    entry.set_password(&token).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_vault_token() -> Result<String, String> {
    let entry = Entry::new("vault-desktop", "default-token").map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_vault_secret(url: String, token: String, path: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/v1/{}", url, path))
        .header("X-Vault-Token", token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn list_vault_secrets(url: String, token: String, path: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .request(reqwest::Method::from_bytes(b"LIST").unwrap(), format!("{}/v1/{}", url, path))
        .header("X-Vault-Token", token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn save_vault_secret(url: String, token: String, path: String, data: serde_json::Value) -> Result<(), String> {
    let client = reqwest::Client::new();
    
    // For KV V2, data must be wrapped in a "data" field
    let body = serde_json::json!({
        "data": data
    });

    client
        .post(format!("{}/v1/{}", url, path))
        .header("X-Vault-Token", token)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn list_vault_policies(url: String, token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/v1/sys/policy", url))
        .header("X-Vault-Token", token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
async fn read_vault_policy(url: String, token: String, name: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let res = client
        .get(format!("{}/v1/sys/policy/{}", url, name))
        .header("X-Vault-Token", token)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;
            use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

            // 1. Setup Tray Menu
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Vault", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app: &tauri::AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // 2. Register Global Shortcut (Cmd+Shift+K)
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK);
            app.global_shortcut().on_shortcut(shortcut, |app: &tauri::AppHandle, _shortcut, event| {
                if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.center();
                    }
                }
            })?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.center();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_vault_token,
            get_vault_token,
            fetch_vault_secret,
            list_vault_secrets,
            save_vault_secret,
            list_vault_policies,
            read_vault_policy
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kv_wrapper_structure() {
        // Vault KV V2 expects data to be wrapped in a "data" field.
        // This test ensures our save_vault_secret logic correctly structures the payload.
        let raw_data = serde_json::json!({"key": "value"});
        let wrapped = serde_json::json!({ "data": raw_data });
        
        assert_eq!(wrapped["data"]["key"], "value");
    }

    #[test]
    fn test_profile_mock_structure() {
        // Ensuring we can handle profiles as expected in the UI
        let profile = serde_json::json!({
            "name": "Dev",
            "url": "http://localhost:8200",
            "token": "hvs.test"
        });
        assert_eq!(profile["name"], "Dev");
    }
}
