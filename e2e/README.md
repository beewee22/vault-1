# Tauri E2E Tests

This folder contains WebDriver-based tests that exercise the real Tauri desktop app using `tauri-driver`.

## Requirements

- Rust toolchain
- `tauri-driver` installed:
  ```bash
  cargo install tauri-driver --locked
  ```

### Platform Support

- **Linux**: supported (requires `webkit2gtk-driver` + `xvfb`)
- **Windows**: supported (requires Edge WebDriver)
- **macOS**: **not supported** for Tauri WebDriver (no WKWebView driver)

## Run Locally

```bash
bun run test:tauri
```

This will:
1. Build the Tauri app in debug mode
2. Start `tauri-driver`
3. Run WebDriverIO tests

## Linux CI Example Dependencies

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev webkit2gtk-driver xvfb
```

## Windows CI Example

```powershell
cargo install --git https://github.com/chippers/msedgedriver-tool
msedgedriver-tool.exe
```
