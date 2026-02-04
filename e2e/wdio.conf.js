import os from "os";
import path from "path";
import { spawn, spawnSync } from "child_process";

let tauriDriver;

export const config = {
  runner: "local",
  host: "127.0.0.1",
  port: 4444,
  specs: ["./e2e/specs/**/*.e2e.js"],
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      "tauri:options": {
        application: path.resolve("src-tauri", "target", "debug", "app"),
      },
    },
  ],
  logLevel: "error",
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    timeout: 60000,
  },
  onPrepare: () => {
    const result = spawnSync(
      "bun",
      ["run", "tauri", "build", "--", "--debug", "--no-bundle"],
      { stdio: "inherit" }
    );
    if (result.status !== 0) {
      throw new Error("Failed to build Tauri app for E2E tests");
    }
  },
  beforeSession: () => {
    const driverPath = path.resolve(os.homedir(), ".cargo", "bin", "tauri-driver");
    tauriDriver = spawn(driverPath, [], { stdio: "inherit" });
  },
  afterSession: () => {
    tauriDriver?.kill();
  },
};
