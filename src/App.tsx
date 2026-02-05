import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import {
    Lock, Server, Key, ShieldCheck, ChevronRight,
    Search, Grid, Clock, Star, Settings, LogOut,
    Eye, Copy, MoreHorizontal, ExternalLink, RefreshCw,
    Plus, X, Trash2, Check, Shield, EyeOff
} from "lucide-react";
import { migrateProfiles, AUTH_METHODS, type VaultProfile, type AuthMethod } from "./types";
import Sidebar from "./components/Sidebar";
import LockScreen from "./components/LockScreen";
import DetailView from "./components/DetailView";
import PolicyDetailView from "./components/PolicyDetailView";
import CreateSecretModal from "./components/CreateSecretModal";
import AddProfileModal from "./components/AddProfileModal";
import SettingsView from "./components/SettingsView";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoginAddProfileOpen, setIsLoginAddProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem("vault_theme") || "dark");

    useEffect(() => {
        localStorage.setItem("vault_theme", theme);
        if (theme === "light") {
            document.documentElement.classList.add("light");
        } else {
            document.documentElement.classList.remove("light");
        }
    }, [theme]);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [autoLockTimeout, setAutoLockTimeout] = useState(() => {
        const saved = localStorage.getItem("vault_autolock");
        return saved ? Number(saved) : 15;
    });

    useEffect(() => {
        localStorage.setItem("vault_autolock", autoLockTimeout.toString());
    }, [autoLockTimeout]);

    // Auto-Lock Effect
    useEffect(() => {
        if (!isLoggedIn || isLocked || autoLockTimeout === 0) return;

        const interval = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > autoLockTimeout * 60 * 1000) {
                setIsLocked(true);
            }
        }, 30000); // Check every 30s

        return () => clearInterval(interval);
    }, [isLoggedIn, isLocked, autoLockTimeout, lastActivity]);

    // Global Activity Listener
    useEffect(() => {
        const handleActivity = () => setLastActivity(Date.now());
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('mousemove', handleActivity);
        return () => {
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('mousemove', handleActivity);
        };
    }, []);

    const [profiles, setProfiles] = useState<any[]>(() => {
        const saved = localStorage.getItem("vault_profiles");
        const parsed = saved ? JSON.parse(saved) : [{ id: 'default', name: 'Default', url: 'https://vault.dev-mng-testbed.mng.musinsa.io', token: '' }];
        return migrateProfiles(parsed);
    });
    const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0].id);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const [vaultUrl, setVaultUrl] = useState(activeProfile.url);
    const [token, setToken] = useState(activeProfile.token);

    useEffect(() => {
        localStorage.setItem("vault_profiles", JSON.stringify(profiles));
    }, [profiles]);

    // Load profile-specific data on profile switch
    useEffect(() => {
        setVaultUrl(activeProfile.url);
        setToken(activeProfile.token);
        
        // Load profile-scoped favorites and recently used
        const favKey = `vault_favorites_${activeProfileId}`;
        const recentKey = `vault_recent_${activeProfileId}`;
        
        const savedFavs = localStorage.getItem(favKey);
        const savedRecent = localStorage.getItem(recentKey);
        
        setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
        setRecentlyUsed(savedRecent ? JSON.parse(savedRecent) : []);
    }, [activeProfileId]);

    // Migration: Move global data to first profile
    useEffect(() => {
        const globalFavs = localStorage.getItem("vault_favorites");
        const globalRecent = localStorage.getItem("vault_recent");
        
        if (globalFavs && profiles.length > 0) {
            const firstProfileId = profiles[0].id;
            const scopedKey = `vault_favorites_${firstProfileId}`;
            
            if (!localStorage.getItem(scopedKey)) {
                localStorage.setItem(scopedKey, globalFavs);
                localStorage.removeItem("vault_favorites");
            }
        }
        
        if (globalRecent && profiles.length > 0) {
            const firstProfileId = profiles[0].id;
            const scopedKey = `vault_recent_${firstProfileId}`;
            
            if (!localStorage.getItem(scopedKey)) {
                localStorage.setItem(scopedKey, globalRecent);
                localStorage.removeItem("vault_recent");
            }
        }
    }, [profiles]);

    const [error, setError] = useState("");
    const [favorites, setFavorites] = useState<any[]>([]);
    const [recentlyUsed, setRecentlyUsed] = useState<any[]>([]);

    useEffect(() => {
        if (activeProfileId) {
            localStorage.setItem(`vault_favorites_${activeProfileId}`, JSON.stringify(favorites));
        }
    }, [favorites, activeProfileId]);

    useEffect(() => {
        if (activeProfileId) {
            localStorage.setItem(`vault_recent_${activeProfileId}`, JSON.stringify(recentlyUsed));
        }
    }, [recentlyUsed, activeProfileId]);

    const addToRecent = (secret: any) => {
        setRecentlyUsed(prev => {
            const filtered = prev.filter(s => s.path !== secret.path);
            return [{ ...secret, lastUsed: new Date().toISOString() }, ...filtered].slice(0, 10);
        });
    };

    const saveProfile = (profile: Omit<VaultProfile, "id">) => {
        const newProfile: VaultProfile = { 
            id: Date.now().toString(), 
            ...profile 
        };
        setProfiles(prev => [...prev, newProfile]);
        setActiveProfileId(newProfile.id);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setToken("");
        // Optional: clear token from keyring would require a Rust command
        // invoke("clear_vault_token");
    };

    const toggleFavorite = (secret: any) => {
        setFavorites(prev => {
            const exists = prev.find(f => f.path === secret.path);
            if (exists) {
                return prev.filter(f => f.path !== secret.path);
            } else {
                return [...prev, { ...secret, isFavorite: true }];
            }
        });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");

        try {
            await invoke("check_vault_connection", { url: vaultUrl, token });

            await invoke("save_vault_token", { token });
            await new Promise(r => setTimeout(r, 800));
            setIsLoggedIn(true);
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Connection failed: " + err.toString());
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleOidcLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");

        try {
            const receivedToken = await invoke<string>("oidc_login", {
                url: vaultUrl,
                mountPath: activeProfile.oidcMountPath || "oidc",
                role: activeProfile.oidcRole || "",
            });

            setToken(receivedToken);
            await invoke("save_vault_token", { token: receivedToken });
            await new Promise(r => setTimeout(r, 800));
            setIsLoggedIn(true);
        } catch (err: any) {
            console.error("OIDC login error:", err);
            const errorMessage = err.toString();

            if (errorMessage.includes("timed out")) {
                setError("Authentication timed out after 120 seconds. Please try again.");
            } else if (errorMessage.includes("auth_url")) {
                setError(`OIDC auth method not found at '${activeProfile.oidcMountPath || "oidc"}'. Check your profile configuration.`);
            } else if (errorMessage.includes("callback") || errorMessage.includes("redirect_uri")) {
                setError("OIDC callback failed. Your Vault role may not allow localhost callbacks.");
            } else if (errorMessage.includes("Failed to request") || errorMessage.includes("Network")) {
                setError("Network error: Could not reach Vault server.");
            } else {
                setError("OIDC login failed: " + errorMessage);
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (isLoggedIn) {
        return (
            <>
                <div className={`flex h-screen w-full overflow-hidden text-main selection:bg-brand/30 transition-all duration-300 ${isLocked ? 'blur-md pointer-events-none scale-[0.98]' : ''}`}>
                    {/* Sidebar Overlay for Mobile */}
                    {isSidebarOpen && (
                        <div
                            data-testid="sidebar-overlay"
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    <div className={`fixed inset-y-0 left-0 z-[70] md:relative md:z-auto ${isSidebarOpen ? 'w-64' : 'w-0'} md:w-72 transition-all duration-300 overflow-hidden border-r border-white/5 shrink-0`}>
                        <Sidebar
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onLogout={handleLogout}
                            onClose={() => setIsSidebarOpen(false)}
                            onLock={() => setIsLocked(true)}
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-w-0 relative">
                        <div className="h-14 md:hidden border-b border-white/5 flex items-center px-4 bg-black/20">
                            <button
                                aria-label="Menu"
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 text-mute hover:text-main"
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <span className="ml-2 font-bold text-sm tracking-tight text-main">Vault-1</span>
                        </div>
                        {activeTab === "settings" ? (
                            <SettingsView
                                profiles={profiles}
                                activeId={activeProfileId}
                                onSelect={setActiveProfileId}
                                onAdd={saveProfile}
                                onRemove={(id: string) => setProfiles(profiles.filter(p => p.id !== id))}
                                autoLock={autoLockTimeout}
                                setAutoLock={setAutoLockTimeout}
                                theme={theme}
                                setTheme={setTheme}
                            />
                        ) : (
                            <Dashboard
                                url={vaultUrl}
                                token={token}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                favorites={favorites}
                                recentlyUsed={recentlyUsed}
                                toggleFavorite={toggleFavorite}
                                onItemView={addToRecent}
                            />
                        )}
                    </div>
                </div>
                {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
            </>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[440px] glass rounded-[32px] p-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center mb-8">
                    <Lock className="w-10 h-10 text-brand" strokeWidth={1.5} />
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Unlock Your Vault</h1>
                    <p className="text-dim text-sm">Securely access your secrets and sensitive data.</p>
                </div>

                <form onSubmit={activeProfile.authMethod === "oidc" ? handleOidcLogin : handleLogin} className="w-full space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-xs font-semibold text-mute uppercase tracking-widest ml-1 mb-2 block flex justify-between items-center">
                                <span>Vault Profile</span>
                                <button
                                    type="button"
                                    onClick={() => setIsLoginAddProfileOpen(true)}
                                    className="text-[10px] text-brand hover:brightness-125 transition-all lowercase"
                                >
                                    + Add New
                                </button>
                            </label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute/50" />
                                <select
                                    value={activeProfileId}
                                    onChange={(e) => setActiveProfileId(e.target.value)}
                                    className="select-premium pl-12 appearance-none"
                                >
                                    {profiles.map(p => (
                                        <option key={p.id} value={p.id} className="bg-surface text-main">{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-xs font-semibold text-mute uppercase tracking-widest ml-1 mb-2 block">
                                Vault Server
                            </label>
                            <div className="relative">
                                <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute/50" />
                                <input
                                    type="text"
                                    value={vaultUrl}
                                    onChange={(e) => setVaultUrl(e.target.value)}
                                    className="input-premium pl-12"
                                    readOnly={activeProfile.authMethod === "oidc"}
                                />
                            </div>
                        </div>

                        {activeProfile.authMethod === "oidc" && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="font-medium">OIDC via {activeProfile.oidcMountPath || "oidc"}</span>
                                </div>
                            </div>
                        )}

                        {activeProfile.authMethod === "token" && (
                            <div className="relative">
                                <label className="text-xs font-semibold text-mute uppercase tracking-widest ml-1 mb-2 block">
                                    Access Token
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mute/50" />
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="hvs.xxxxxxxxxxxx"
                                        className="input-premium pl-12"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="btn-premium w-full flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoggingIn ? (
                            activeProfile.authMethod === "oidc" ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="text-xs text-mute">Waiting for browser authentication...</span>
                                </div>
                            ) : (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )
                        ) : (
                            activeProfile.authMethod === "oidc" ? (
                                <>Sign in with OIDC <ChevronRight className="w-4 h-4" /></>
                            ) : (
                                <>Unlock Vault <ChevronRight className="w-4 h-4" /></>
                            )
                        )}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-2 text-mute text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Encrypted connection with end-to-end security</span>
                </div>

            </div>
            {isLoginAddProfileOpen && (
                <AddProfileModal
                    onClose={() => setIsLoginAddProfileOpen(false)}
                    onSave={saveProfile}
                />
            )}
        </div>
    );
}

export default App;
