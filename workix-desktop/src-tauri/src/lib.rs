// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

#[tauri::command]
fn get_app_version() -> String {
    "0.1.0".to_string()
}

#[tauri::command]
fn get_app_info() -> ApiResponse<serde_json::Value> {
    ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "name": "Workix Desktop",
            "version": "0.1.0",
            "description": "EPC Service Management Platform",
            "platform": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
        })),
        error: None,
    }
}

#[tauri::command]
async fn call_backend_api(
    endpoint: String,
    method: String,
    body: Option<serde_json::Value>,
) -> ApiResponse<serde_json::Value> {
    let base_url = "http://localhost:5000/api";
    let url = format!("{}/{}", base_url, endpoint);

    let client = reqwest::Client::new();
    
    let request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        _ => {
            return ApiResponse {
                success: false,
                data: None,
                error: Some("Invalid HTTP method".to_string()),
            }
        }
    };

    match request
        .json(&body.unwrap_or(serde_json::json!({})))
        .send()
        .await
    {
        Ok(response) => match response.json::<serde_json::Value>().await {
            Ok(data) => ApiResponse {
                success: true,
                data: Some(data),
                error: None,
            },
            Err(e) => ApiResponse {
                success: false,
                data: None,
                error: Some(format!("Failed to parse response: {}", e)),
            },
        },
        Err(e) => ApiResponse {
            success: false,
            data: None,
            error: Some(format!("API call failed: {}", e)),
        },
    }
}

#[tauri::command]
fn log_message(level: String, message: String) {
    match level.to_lowercase().as_str() {
        "error" => eprintln!("[ERROR] {}", message),
        "warn" => println!("[WARN] {}", message),
        "info" => println!("[INFO] {}", message),
        _ => println!("[DEBUG] {}", message),
    }
}

#[tauri::command]
fn get_system_info() -> ApiResponse<serde_json::Value> {
    ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "os": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
            "family": std::env::consts::FAMILY,
        })),
        error: None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_app_info,
            call_backend_api,
            log_message,
            get_system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
