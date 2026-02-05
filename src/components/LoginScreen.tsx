import { Lock, Key, ShieldCheck, Server, ChevronRight } from "lucide-react";
import AddProfileModal from "./AddProfileModal";
import type { VaultProfile } from "../types";

function LoginScreen({ profiles, activeProfile, activeProfileId, setActiveProfileId, vaultUrl, setVaultUrl, token, setToken, isLoggingIn, error, onLogin, onOidcLogin, onSaveProfile, isLoginAddProfileOpen, setIsLoginAddProfileOpen }: {
    profiles: VaultProfile[];
    activeProfile: VaultProfile;
    activeProfileId: string;
    setActiveProfileId: (id: string) => void;
    vaultUrl: string;
    setVaultUrl: (url: string) => void;
    token: string;
    setToken: (token: string) => void;
    isLoggingIn: boolean;
    error: string;
    onLogin: (e: React.FormEvent) => void;
    onOidcLogin: (e: React.FormEvent) => void;
    onSaveProfile: (profile: Omit<VaultProfile, "id">) => void;
    isLoginAddProfileOpen: boolean;
    setIsLoginAddProfileOpen: (open: boolean) => void;
}) {
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

                {error && (
                    <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={activeProfile.authMethod === "oidc" ? onOidcLogin : onLogin} className="w-full space-y-6">
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
                    onSave={onSaveProfile}
                />
            )}
        </div>
    );
}

export default LoginScreen;
