# Vault-1 🔐

**1Password-like UI for HashiCorp Vault**

Vault-1 is a high-performance, secure, and user-friendly desktop client for HashiCorp Vault. It combines the robust security of Vault with the sleek, intuitive user experience inspired by 1Password.

Built using **Tauri**, **React**, and **Bun**, Vault-1 offers a native desktop experience that is lightweight, fast, and secure.

## ✨ Key Features

- **Sleek & Modern UI**: A premium interface featuring glassmorphism, smooth animations, and a focus on clarity.
- **Global Search (Cmd + K)**: Instantly find secrets, favorites, and policies with a unified global search.
- **Multi-Profile Support**: Easily switch between different Vault clusters (Development, Staging, Production).
- **Favorites System**: Star your most important secrets for quick access.
- **Recently Used**: Keep track of your most recently accessed keys.
- **Policy Management**: View and audit ACL policies directly from the client.
- **Auto-Lock**: Configurable security timer to automatically lock your vault during inactivity.
- **Dark/Light Mode**: Full theme support with semantic colors for high contrast and accessibility.

## 🛠 Tech Stack

- **Backend**: Rust (for secure API handling and OS integration).
- **Frontend**: React + TailwindCSS (for a modern, responsive UI).
- **Core Engine**: Tauri (for native performance and small binary size).
- **Runtime & Tools**: Bun (for ultra-fast builds and development).

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.
- [Rust](https://www.rust-lang.org/) and [Tauri dependencies](https://tauri.app/v2/guides/getting-started/prerequisites) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vault-1.git
   cd vault-1
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run in development mode:
   ```bash
   bun run tauri dev
   ```

## 🔒 Security

Vault-1 prioritizes your data's security:
- **Zero-Persistence**: Sensitive tokens are handled in memory and can be cleared using native OS keyring integrations.
- **E2E Security**: Direct communication with your Vault server over HTTPS.
- **Local Settings**: Profiles and preferences are stored locally and nunca sent to external servers.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

