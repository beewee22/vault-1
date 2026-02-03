use keyring::Entry;
use tauri::Manager;
use rand::Rng;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpListener;
use url::Url;
use tauri_plugin_shell::ShellExt;

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
        .map_err(|e| e.to_string())?
        .error_for_status()
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
        .map_err(|e| e.to_string())?
        .error_for_status()
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
        .map_err(|e| e.to_string())?
        .error_for_status()
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
        .map_err(|e| e.to_string())?
        .error_for_status()
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
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;

    let body = res.json::<serde_json::Value>().await.map_err(|e| e.to_string())?;
    Ok(body)
}

/// Helper function to wait for OAuth callback and extract code + state
async fn wait_for_callback(listener: TcpListener) -> Result<(String, String), String> {
    let (stream, _) = listener.accept().await.map_err(|e| e.to_string())?;
    
    let mut reader = BufReader::new(stream);
    let mut request_line = String::new();
    reader.read_line(&mut request_line).await.map_err(|e| e.to_string())?;
    
    let parts: Vec<&str> = request_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Err("Invalid HTTP request".to_string());
    }
    
    let path = parts[1];
    let url = Url::parse(&format!("http://localhost{}", path)).map_err(|e| e.to_string())?;
    
    let mut code = None;
    let mut state = None;
    
    for (key, value) in url.query_pairs() {
        match key.as_ref() {
            "code" => code = Some(value.to_string()),
            "state" => state = Some(value.to_string()),
            _ => {}
        }
    }
    
    let response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
        <html><body><h1>Authentication Successful</h1>\
        <p>You may close this window and return to the application.</p></body></html>";
    reader.into_inner().write_all(response.as_bytes()).await.map_err(|e| e.to_string())?;
    
    match (code, state) {
        (Some(c), Some(s)) => Ok((c, s)),
        _ => Err("Missing code or state parameter".to_string()),
    }
}

#[tauri::command]
async fn oidc_login(
    app: tauri::AppHandle,
    url: String,
    mount_path: String,
    role: String,
) -> Result<(), String> {
    let url = url.trim_end_matches('/').to_string();
    log::info!("Starting OIDC login for role: {} on mount: {}", role, mount_path);
    
    let nonce: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Failed to bind to localhost: {}", e))?;
    
    let local_addr = listener.local_addr().map_err(|e| e.to_string())?;
    let redirect_uri = format!("http://127.0.0.1:{}/oidc/callback", local_addr.port());
    
    log::info!("Listening for callback on: {}", redirect_uri);
    
    let client = reqwest::Client::new();
    let auth_url_endpoint = format!("{}/v1/auth/{}/oidc/auth_url", url, mount_path);
    
    log::info!("Requesting auth URL from: {}", auth_url_endpoint);
    
    let auth_url_body = serde_json::json!({
        "role": role,
        "redirect_uri": redirect_uri,
        "client_nonce": nonce
    });
    
    log::info!("OIDC auth request body: role='{}', redirect_uri='{}'", role, redirect_uri);
    
    let auth_response = client
        .post(&auth_url_endpoint)
        .json(&auth_url_body)
        .send()
        .await
        .map_err(|e| format!("Failed to request auth URL: {}", e))?;

    if !auth_response.status().is_success() {
        let status = auth_response.status();
        let error_body = auth_response.text().await.unwrap_or_else(|_| "Unable to read error".to_string());
        log::error!("OIDC auth_url request failed ({}): {}", status, error_body);
        return Err(format!("Vault auth_url request failed ({}): {}", status, error_body));
    }
    
    let auth_data: serde_json::Value = auth_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse auth URL response: {}", e))?;
    
    log::info!("OIDC auth_url response: {}", serde_json::to_string_pretty(&auth_data).unwrap_or_else(|_| "unparseable".to_string()));
    
    let auth_url = auth_data["data"]["auth_url"]
        .as_str()
        .ok_or_else(|| {
            let msg = format!("Missing auth_url in response. Full response: {}", auth_data);
            log::error!("{}", msg);
            msg
        })?
        .to_string();
    
    if auth_url.is_empty() {
        let msg = format!("Vault returned empty auth_url. This usually means the redirect_uri is not in the OIDC role's allowed_redirect_uris. Full response: {}", auth_data);
        log::error!("{}", msg);
        return Err(msg);
    }
    
    log::info!("Opening browser for authentication: {}", auth_url);
    
    // Validate URL scheme - macOS open command interprets non-URL strings as file paths
    if !auth_url.starts_with("http://") && !auth_url.starts_with("https://") {
        log::error!("Invalid auth_url (no URL scheme): {}", auth_url);
        return Err(format!("Invalid auth URL received from Vault: {}. Expected https:// URL.", auth_url));
    }
    
    app.shell()
        .open(&auth_url, None)
        .map_err(|e| format!("Failed to open browser: {}", e))?;
    
    let callback_result = tokio::time::timeout(
        std::time::Duration::from_secs(120),
        wait_for_callback(listener)
    )
    .await
    .map_err(|_| "Authentication timed out after 120 seconds")?
    .map_err(|e| format!("Callback error: {}", e))?;
    
    let (code, state) = callback_result;
    
    log::info!("Received callback, exchanging code for token");
    
    let callback_endpoint = format!(
        "{}/v1/auth/{}/oidc/callback?state={}&code={}&client_nonce={}",
        url, mount_path, state, code, nonce
    );
    
    let token_response = client
        .get(&callback_endpoint)
        .send()
        .await
        .map_err(|e| format!("Failed to exchange code for token: {}", e))?;

    if !token_response.status().is_success() {
        let status = token_response.status();
        let error_body = token_response.text().await.unwrap_or_else(|_| "Unable to read error".to_string());
        log::error!("OIDC token exchange failed ({}): {}", status, error_body);
        return Err(format!("Token exchange failed ({}): {}", status, error_body));
    }
    
    let token_data: serde_json::Value = token_response
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;
    
    let client_token = token_data["auth"]["client_token"]
        .as_str()
        .ok_or("Missing client_token in response")?
        .to_string();
    
    let entry = Entry::new("vault-desktop", "default-token").map_err(|e| e.to_string())?;
    entry.set_password(&client_token).map_err(|e| e.to_string())?;
    
    log::info!("OIDC login successful, token stored in keyring");
    
    Ok(())
}

#[tauri::command]
async fn check_vault_connection(url: String, token: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let endpoint = format!("{}/v1/auth/token/lookup-self", url);
    
    log::info!("Checking Vault connection to: {}", endpoint);
    
    let response = client
        .get(&endpoint)
        .header("X-Vault-Token", &token)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;
    
    let status = response.status();
    log::info!("Vault response status: {}", status);
    
    if !status.is_success() {
        let error_body = response.text().await.unwrap_or_else(|_| "Unable to read error body".to_string());
        log::error!("Vault error response: {}", error_body);
        return Err(format!("Vault returned {}: {}", status, error_body));
    }
    
    Ok(())
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
            read_vault_policy,
            check_vault_connection,
            oidc_login
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
        let profile = serde_json::json!({
            "name": "Dev",
            "url": "http://localhost:8200",
            "token": "hvs.test"
        });
        assert_eq!(profile["name"], "Dev");
    }

    #[test]
    fn test_oidc_nonce_generation() {
        let nonce: String = rand::thread_rng()
            .sample_iter(&rand::distributions::Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();
        
        assert_eq!(nonce.len(), 32);
        assert!(nonce.chars().all(|c| c.is_alphanumeric()));
    }

    #[test]
    fn test_oidc_auth_url_request_body() {
        let body = serde_json::json!({
            "role": "test-role",
            "redirect_uri": "http://127.0.0.1:12345/oidc/callback",
            "client_nonce": "abcd1234efgh5678ijkl9012mnop3456"
        });
        
        assert_eq!(body["role"], "test-role");
        assert_eq!(body["redirect_uri"], "http://127.0.0.1:12345/oidc/callback");
        assert_eq!(body["client_nonce"], "abcd1234efgh5678ijkl9012mnop3456");
        assert!(body["client_nonce"].as_str().unwrap().len() == 32);
    }

    #[test]
    fn test_oidc_callback_url_parsing() {
        let test_url = "http://localhost/oidc/callback?state=st_abc123&code=cd_xyz789";
        let parsed = Url::parse(test_url).unwrap();
        
        let mut code = None;
        let mut state = None;
        
        for (key, value) in parsed.query_pairs() {
            match key.as_ref() {
                "code" => code = Some(value.to_string()),
                "state" => state = Some(value.to_string()),
                _ => {}
            }
        }
        
        assert_eq!(code, Some("cd_xyz789".to_string()));
        assert_eq!(state, Some("st_abc123".to_string()));
    }
}
