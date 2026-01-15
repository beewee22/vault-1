import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    Lock, Server, Key, ShieldCheck, ChevronRight,
    Search, Grid, Clock, Star, Settings, LogOut,
    Eye, Copy, MoreHorizontal, ExternalLink, RefreshCw,
    Plus, X, Trash2, Check, Shield
} from "lucide-react";

// --- Components ---

function Sidebar({ activeTab, setActiveTab, onLogout, onClose, onLock }: { activeTab: string, setActiveTab: (t: string) => void, onLogout?: () => void, onClose?: () => void, onLock?: () => void }) {
    const menuItems = [
        { id: "all", icon: Grid, label: "All Items" },
        { id: "recent", icon: Clock, label: "Recently Used" },
        { id: "favorites", icon: Star, label: "Favorites" },
        { id: "policies", icon: ShieldCheck, label: "Policies" },
        { id: "settings", icon: Settings, label: "Settings" },
    ];

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        if (onClose && window.innerWidth < 768) onClose();
    };

    return (
        <div className="w-64 md:w-72 border-r border-white/5 flex flex-col h-full bg-[#0f0f0f] md:bg-black/20 backdrop-blur-md shrink-0">
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center">
                        <Lock className="w-4 h-4 text-brand" />
                    </div>
                    <span className="font-bold tracking-tight text-main">Vault-1</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 md:hidden text-mute hover:text-main">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="px-3 space-y-1 flex-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === item.id
                            ? "bg-brand/10 text-brand fill-brand/10"
                            : "text-mute hover:bg-white/5 hover:text-dim"
                            }`}
                    >
                        <item.icon className="w-5 h-5" strokeWidth={activeTab === item.id ? 2 : 1.5} />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-white/5 space-y-1">
                <button
                    onClick={onLock}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-mute hover:bg-white/5 hover:text-dim transition-all font-medium"
                >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Lock Vault</span>
                </button>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500/60 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
}

function DetailView({ secret, onBack, url, token, isFavorite, onToggleFavorite, onItemView }: {
    secret: any,
    onBack: () => void,
    url: string,
    token: string,
    isFavorite: boolean,
    onToggleFavorite: (s: any) => void,
    onItemView?: (s: any) => void
}) {
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = async (key: string, value: any) => {
        const textToCopy = typeof value === 'string' ? value : JSON.stringify(value);
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const fetchSecretData = async () => {
        setLoading(true);
        try {
            let dataPath = secret.path;
            if (secret.path.startsWith("secret/")) {
                dataPath = secret.path.replace("secret/", "secret/data/");
            }

            const res: any = await invoke("fetch_vault_secret", {
                url,
                token,
                path: dataPath,
            });

            const data = res.data?.data || {};
            const fieldItems = Object.keys(data).map(key => ({
                key,
                value: data[key],
                label: key.charAt(0).toUpperCase() + key.slice(1),
                secret: true
            }));
            setFields(fieldItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSecretData();
        onItemView?.(secret);
    }, [secret.path]);

    const toggleValue = (key: string) => {
        setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex-1 flex flex-col bg-surface/10 h-full overflow-auto">
            <div className="h-16 border-b border-main flex items-center px-4 md:px-8 gap-4 bg-black/5 shrink-0">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-mute hover:text-main transition-all">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="text-sm font-semibold text-main">Secret Details</h2>
            </div>

            <div className="flex-1 p-4 md:p-12 w-full">
                <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand/10 border border-brand/20 rounded-[20px] md:rounded-[24px] flex items-center justify-center shadow-2xl shadow-brand/10 shrink-0">
                        <Key className="w-8 h-8 md:w-10 md:h-10 text-brand" strokeWidth={1.5} />
                    </div>
                    <div className="pt-1 md:pt-2 flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-main mb-2 truncate">{secret.name}</h1>
                            <button
                                onClick={() => onToggleFavorite(secret)}
                                className={`p-2 rounded-xl transition-all duration-300 ${isFavorite ? 'bg-brand/20 text-brand' : 'bg-surface border border-main text-mute hover:text-main'}`}
                            >
                                <Star className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 2 : 1.5} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="text-xs text-mute bg-black/10 px-2 py-1 rounded tracking-wider">{secret.path}</code>
                            <span className="text-[10px] text-brand border border-brand/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{secret.type}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="glass rounded-[32px] overflow-hidden border-white/5">
                        <div className="p-2 space-y-1">
                            {fields.length > 0 ? fields.map((f) => (
                                <div key={f.key} className="group flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all duration-300">
                                    <div className="space-y-1 flex-1">
                                        <span className="text-[10px] uppercase tracking-widest text-mute font-bold block ml-1">{f.label}</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono text-sm tracking-tight ${showValues[f.key] || !f.secret ? "text-main" : "text-mute/20"}`}>
                                                {(showValues[f.key] || !f.secret) ? (typeof f.value === 'string' ? f.value : JSON.stringify(f.value)) : "••••••••••••••••"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap- object-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        {f.secret && (
                                            <button
                                                onClick={() => toggleValue(f.key)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCopy(f.key, f.value)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors"
                                        >
                                            {copiedKey === f.key ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-mute text-sm italic">No data found in this secret.</div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex items-center justify-between px-6 py-4 glass rounded-2xl border-white/5">
                    <div className="flex items-center gap-3 text-mute text-xs">
                        <Clock className="w-4 h-4" />
                        <span>Connected to {url}</span>
                    </div>
                    <button className="flex items-center gap-2 text-mute text-xs hover:text-main transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View in Vault UI</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function PolicyDetailView({ name, onBack, url, token }: { name: string, onBack: () => void, url: string, token: string }) {
    const [hcl, setHcl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res: any = await invoke("read_vault_policy", { url, token, name });
                // Vault returns policy HCL in 'rules' field
                setHcl(res.rules || res.policy || "");
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [name]);

    return (
        <div className="flex-1 flex flex-col bg-surface/10 h-full overflow-hidden">
            <div className="h-16 border-b border-main flex items-center px-4 md:px-8 justify-between bg-black/5 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-mute hover:text-main transition-all">
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <h2 className="text-sm font-semibold text-main">Policy Details</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-main uppercase tracking-widest">{name}</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="w-full">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-[24px] flex items-center justify-center shadow-2xl shadow-brand/10">
                            <ShieldCheck className="w-10 h-10 text-brand" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-main mb-2">{name}</h1>
                            <p className="text-dim text-sm">Access Control List (ACL) Rules</p>
                        </div>
                    </div>

                    <div className="glass rounded-2xl overflow-hidden border border-main bg-surface/50">
                        <div className="px-6 py-4 border-b border-main bg-black/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-mute uppercase tracking-tighter">HCL Configuration</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(hcl)}
                                className="text-[10px] text-brand border border-brand/20 px-2 py-1 rounded-lg hover:bg-brand/10 transition-colors"
                            >
                                Copy Rule
                            </button>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-3/4" />
                                    <div className="h-4 bg-white/5 rounded w-1/2" />
                                    <div className="h-4 bg-white/5 rounded w-5/6" />
                                </div>
                            ) : (
                                <pre className="text-sm text-dim font-mono leading-relaxed whitespace-pre-wrap">
                                    {hcl || "# No rules defined for this policy."}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CreateSecretModal({ onClose, onSave, currentPath }: { onClose: () => void, onSave: (name: string, data: any) => Promise<void>, currentPath: string }) {
    const [name, setName] = useState("");
    const [fields, setFields] = useState([{ key: "", value: "" }]);
    const [isSaving, setIsSaving] = useState(false);

    const addField = () => setFields([...fields, { key: "", value: "" }]);
    const removeField = (index: number) => setFields(fields.filter((_, i) => i !== index));
    const updateField = (index: number, kOrV: 'key' | 'value', val: string) => {
        const newFields = [...fields];
        newFields[index][kOrV] = val;
        setFields(newFields);
    };

    const handleSave = async () => {
        if (!name) return;
        setIsSaving(true);
        const data = fields.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {} as any);
        await onSave(name, data);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg glass rounded-[32px] overflow-hidden border-white/10 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">New Secret</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-8 space-y-6 overflow-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Path & Name</label>
                        <div className="flex items-center gap-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                            <span className="text-mute text-sm">{currentPath}</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-secret"
                                className="bg-transparent border-none outline-none text-white text-sm flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Data Fields</label>
                        {fields.map((f, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    placeholder="Key"
                                    value={f.key}
                                    onChange={(e) => updateField(i, 'key', e.target.value)}
                                    className="bg-black/20 p-3 rounded-xl border border-white/5 text-sm flex-1 outline-none focus:border-brand/40 transition-colors"
                                />
                                <input
                                    placeholder="Value"
                                    value={f.value}
                                    onChange={(e) => updateField(i, 'value', e.target.value)}
                                    className="bg-black/20 p-3 rounded-xl border border-white/5 text-sm flex-1 outline-none focus:border-brand/40 transition-colors"
                                />
                                {fields.length > 1 && (
                                    <button onClick={() => removeField(i)} className="p-3 hover:bg-red-400/10 text-red-400/60 rounded-xl transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addField} className="w-full p-3 border border-dashed border-main rounded-xl text-mute text-sm hover:border-brand/30 hover:text-dim transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Field
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={!name || isSaving}
                        className="flex-1 btn-premium py-3 text-sm flex items-center justify-center gap-2"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Secret"}
                    </button>
                </div>
            </div>
        </div>
    );
}
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-full max-w-sm p-12 glass rounded-[40px] border-white/10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce transition-all">
                    <Lock className="w-10 h-10 text-brand" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Vault Locked</h1>
                <p className="text-mute text-sm mb-12">Session is encrypted and protected</p>
                <button
                    onClick={onUnlock}
                    className="btn-premium w-full py-4 text-base font-bold flex items-center justify-center gap-3 shadow-xl"
                >
                    <Key className="w-5 h-5" /> Unlock Vault
                </button>
            </div>
        </div>
    );
}

function AddProfileModal({ onClose, onSave }: { onClose: () => void, onSave: (name: string, url: string, token: string) => void }) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("http://0.0.0.0:8200");
    const [token, setToken] = useState("");

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md glass rounded-[32px] overflow-hidden border-main flex flex-col animate-in zoom-in duration-300">
                <div className="p-6 border-b border-main flex items-center justify-between text-main">
                    <h2 className="text-xl font-bold">Add Vault Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-mute hover:text-main"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Profile Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Production"
                            className="input-premium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Vault URL</label>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="http://127.0.0.1:8200"
                            className="input-premium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Access Token</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="hvs.xxxxxxxx"
                            className="input-premium"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (name && url && token) {
                                onSave(name, url, token);
                                onClose();
                            }
                        }}
                        disabled={!name || !url || !token}
                        className="btn-premium w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4"
                    >
                        <Plus className="w-4 h-4" /> Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

function SettingsView({ profiles, activeId, onSelect, onAdd, onRemove, autoLock, setAutoLock, theme, setTheme }: any) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    return (
        <div className="flex-1 overflow-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAddModalOpen && <AddProfileModal onClose={() => setIsAddModalOpen(false)} onSave={onAdd} />}
            <div className="w-full">
                <h1 className="text-3xl font-bold text-main mb-2">Settings</h1>
                <p className="text-dim mb-12">Manage your Vault profiles and security preferences</p>

                <div className="space-y-12">
                    {/* Profiles Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-main">Vault Profiles</h2>
                            <button onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold text-brand hover:text-brand/80 transition-colors flex items-center gap-1.5 uppercase tracking-wider">
                                <Plus className="w-3.5 h-3.5" /> Add New Profile
                            </button>
                        </div>
                        <div className="grid gap-3">
                            {profiles.map((p: any) => (
                                <div key={p.id} className={`glass p-4 rounded-2xl flex items-center justify-between border transition-all ${activeId === p.id ? 'border-brand/40 bg-brand/5 shadow-brand/10 shadow-lg' : 'border-main hover:border-brand/30'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeId === p.id ? 'bg-brand/20 text-brand' : 'bg-surface/50 border border-main text-mute'}`}>
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-main">{p.name}</h3>
                                            <p className="text-xs text-mute font-mono">{p.url}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeId !== p.id && (
                                            <button onClick={() => onSelect(p.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/5 text-mute hover:bg-black/10 hover:text-main transition-all">
                                                Switch
                                            </button>
                                        )}
                                        {profiles.length > 1 && (
                                            <button onClick={() => onRemove(p.id)} className="p-2 rounded-lg text-mute hover:text-red-400 hover:bg-red-400/10 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Security Section */}
                    <section>
                        <h2 className="text-lg font-bold text-main mb-6">Security Settings</h2>
                        <div className="glass p-6 rounded-[32px] border-main space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-main">Auto-Lock Timer</h3>
                                    <p className="text-xs text-mute">Lock app automatically after inactivity</p>
                                </div>
                                <select
                                    value={autoLock}
                                    onChange={(e) => setAutoLock(Number(e.target.value))}
                                    className="select-premium text-sm py-2 px-4"
                                >
                                    <option value={0}>Never</option>
                                    <option value={5}>5 Minutes</option>
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={60}>1 Hour</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between border-t border-main pt-8">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-main">Appearance</h3>
                                    <p className="text-xs text-mute">System theme synchronization</p>
                                </div>
                                <div className="flex bg-surface/50 border border-main p-1 rounded-xl">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'dark' ? 'bg-brand/20 text-brand shadow-lg' : 'text-mute hover:text-main'}`}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'light' ? 'bg-brand/20 text-brand shadow-lg' : 'text-mute hover:text-main'}`}
                                    >
                                        Light
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-20 pt-8 border-t border-main flex flex-col md:flex-row items-center justify-between gap-4 text-mute text-[10px] font-bold uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-brand" />
                            <span>Vault-1 v0.1.0</span>
                        </div>
                        <span>Secure Connection Active</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-brand transition-colors">Documentation</a>
                        <a href="#" className="hover:text-brand transition-colors">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Dashboard({ url, token, activeTab, favorites, recentlyUsed, toggleFavorite, onItemView }: {
    url: string;
    token: string;
    activeTab: string;
    favorites: any[];
    recentlyUsed: any[];
    toggleFavorite: (s: any) => void;
    onItemView: (s: any) => void;
}) {
    const [selectedSecret, setSelectedSecret] = useState<any>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
    const [secrets, setSecrets] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPath, setCurrentPath] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Navigation Sync with Web History API
    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state) {
                const { path, secret, policy } = e.state;
                setCurrentPath(path ?? "");
                setSelectedSecret(secret ?? null);
                setSelectedPolicy(policy ?? null);
            } else {
                // Initial state
                setCurrentPath("");
                setSelectedSecret(null);
                setSelectedPolicy(null);
            }
        };

        // Initialize history state on mount or tab change
        if (!window.history.state) {
            window.history.replaceState({ path: "", secret: null, policy: null }, "");
        }

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigateTo = (path: string, secret: any, policy: string | null) => {
        setCurrentPath(path);
        setSelectedSecret(secret);
        setSelectedPolicy(policy);
        window.history.pushState({ path, secret, policy }, "");
    };

    const goBack = () => {
        window.history.back();
    };

    const goForward = () => {
        window.history.forward();
    };

    const goUp = () => {
        if (selectedSecret || selectedPolicy) {
            goBack();
        } else if (currentPath) {
            const parts = currentPath.split("/").filter(Boolean);
            if (parts.length <= 1) {
                navigateTo("", null, null);
            } else {
                parts.pop();
                navigateTo(parts.join("/") + "/", null, null);
            }
        }
    };

    // Reset view when tab changes (also clear history to avoid cross-tab navigation mess)
    useEffect(() => {
        setCurrentPath("");
        setSelectedSecret(null);
        setSelectedPolicy(null);
        setSearchQuery("");
        setError("");
        // Replace current history when switching tabs
        window.history.replaceState({ path: "", secret: null, policy: null }, "");
    }, [activeTab]);

    // Keyboard & Mouse Navigation Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Global Search (Cmd+K)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search')?.focus();
            }

            // Back Navigation logic: Cmd+[ OR Cmd+Left OR Alt+Left OR Backspace
            const isBack =
                (e.metaKey && e.key === '[') ||
                (e.metaKey && e.key === 'ArrowLeft') ||
                (e.altKey && e.key === 'ArrowLeft') ||
                (e.key === "Backspace" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName));

            // Forward Navigation logic: Cmd+] OR Cmd+Right OR Alt+Right
            const isForward =
                (e.metaKey && e.key === ']') ||
                (e.metaKey && e.key === 'ArrowRight') ||
                (e.altKey && e.key === 'ArrowRight');

            if (isBack) {
                e.preventDefault();
                goBack();
            } else if (isForward) {
                e.preventDefault();
                goForward();
            }
        };

        const handleMouseInteraction = (e: MouseEvent) => {
            // Button 3 is Back, Button 4 is Forward
            if (e.button === 3) {
                e.preventDefault();
                goBack();
            } else if (e.button === 4) {
                e.preventDefault();
                goForward();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleMouseInteraction);
        window.addEventListener('auxclick', handleMouseInteraction);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseInteraction);
            window.removeEventListener('auxclick', handleMouseInteraction);
        };
    }, []);

    const fetchSecrets = async () => {
        setLoading(true);
        setError("");
        try {
            if (!currentPath) {
                const res: any = await invoke("fetch_vault_secret", {
                    url,
                    token,
                    path: "sys/mounts",
                });

                const mounts = res.data || {};
                const secretItems = Object.keys(mounts)
                    .filter(key => mounts[key].type === "kv" || mounts[key].type === "kv-v2")
                    .map((key, index) => ({
                        id: index + 1,
                        name: key.replace("/", ""),
                        path: key,
                        type: "MOUNT",
                        updated: "Active",
                        description: mounts[key].description || "Secret Engine"
                    }));
                setSecrets(secretItems);
            } else {
                let listPath = currentPath;
                if (currentPath.startsWith("secret/")) {
                    listPath = currentPath.replace("secret/", "secret/metadata/");
                }
                if (!listPath.endsWith("/")) listPath += "/";

                const res: any = await invoke("list_vault_secrets", {
                    url,
                    token,
                    path: listPath,
                });

                const keys = res.data?.keys || [];
                const secretItems = keys.map((key: string, index: number) => ({
                    id: index + 1,
                    name: key.replace("/", ""),
                    path: currentPath + key,
                    type: key.endsWith("/") ? "FOLDER" : "SECRET",
                    updated: "Recently",
                }));
                setSecrets(secretItems);
            }
        } catch (err: any) {
            setError("Failed to fetch: " + err.toString());
        } finally {
            setLoading(false);
        }
    };

    const fetchPolicies = async () => {
        setLoading(true);
        setError("");
        try {
            const res: any = await invoke("list_vault_policies", { url, token });
            const policyNames = res.data?.keys || res.policies || [];
            const policyItems = policyNames.map((name: string, index: number) => ({
                id: index + 1,
                name,
                type: "POLICY",
                updated: "Active"
            }));
            setPolicies(policyItems);
        } catch (err: any) {
            setError("Failed to fetch policies: " + err.toString());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "policies") {
            fetchPolicies();
        } else {
            fetchSecrets();
        }
    }, [currentPath, activeTab]);

    const handleSaveSecret = async (name: string, data: any) => {
        try {
            let savePath = currentPath + name;
            if (currentPath.startsWith("secret/")) {
                savePath = currentPath.replace("secret/", "secret/data/") + name;
            }
            await invoke("save_vault_secret", {
                url,
                token,
                path: savePath,
                data
            });
            fetchSecrets();
        } catch (err: any) {
            alert("Error saving: " + err.toString());
        }
    };

    const handleItemClick = (item: any) => {
        if (item.type === 'POLICY') {
            navigateTo(currentPath, null, item.name);
        } else if (item.type === 'FOLDER' || item.type === 'MOUNT') {
            const nextPath = item.path; // Already the full path
            navigateTo(nextPath, null, null);
        } else {
            navigateTo(currentPath, item, null);
            onItemView(item);
        }
    };

    const navigateUp = () => {
        goUp();
    };

    const getGlobalSearch = () => {
        // Merge current secrets, favorites, and recently used for a "global" feel
        const combined = [...secrets, ...favorites, ...recentlyUsed];
        const unique = Array.from(new Map(combined.map(item => [item.path || item.name, item])).values());
        return unique.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.path && s.path.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    const filteredSecrets = searchQuery
        ? getGlobalSearch()
        : activeTab === "favorites" ? favorites
            : activeTab === "recent" ? recentlyUsed
                : activeTab === "policies" ? policies
                    : secrets;

    if (selectedSecret) {
        const isFav = favorites.some(f => f.path === selectedSecret.path);
        return (
            <DetailView
                secret={selectedSecret}
                onBack={() => goBack()}
                url={url}
                token={token}
                isFavorite={isFav}
                onToggleFavorite={toggleFavorite}
                onItemView={onItemView}
            />
        );
    }

    if (selectedPolicy) {
        return (
            <PolicyDetailView
                name={selectedPolicy}
                onBack={() => goBack()}
                url={url}
                token={token}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-surface/10 h-full overflow-hidden">
            <div className="h-14 md:h-16 border-b border-main flex items-center px-4 md:px-8 gap-4 bg-black/5">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-mute" />
                <input
                    id="global-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all items (Cmd + K)"
                    className="bg-transparent border-none outline-none text-main w-full text-xs md:text-sm placeholder:text-mute"
                />
                <button onClick={() => activeTab === "policies" ? fetchPolicies() : fetchSecrets()} className="p-2 hover:bg-white/5 rounded-full text-mute hover:text-main transition-all">
                    <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-bold text-main">
                                {searchQuery ? "Search Results" : (
                                    activeTab === "all" ? (
                                        currentPath ? (
                                            <div className="flex items-center gap-2">
                                                <button onClick={navigateUp} className="hover:text-brand transition-colors text-mute">Root</button>
                                                <ChevronRight className="w-4 h-4 text-mute" />
                                                <span className="truncate max-w-[200px] md:max-w-none text-main">{currentPath}</span>
                                            </div>
                                        ) : "All Mounts"
                                    ) : activeTab === "recent" ? "Recently Used" :
                                        activeTab === "favorites" ? "Favorites" : "Policy Management"
                                )}
                            </h2>
                            {error ? (
                                <p className="text-red-400 text-sm">{error}</p>
                            ) : (
                                <p className="text-mute text-sm">{filteredSecrets.length} items found</p>
                            )}
                        </div>
                        {currentPath && (
                            <button onClick={() => setIsCreateModalOpen(true)} className="btn-premium py-2 text-sm flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Create New
                            </button>
                        )}
                    </div>

                    {(loading && activeTab === "all") ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-2 md:gap-3">
                            {activeTab === "all" || activeTab === "favorites" || activeTab === "recent" || activeTab === "policies" ? (
                                filteredSecrets.length > 0 ? (
                                    filteredSecrets.map((s) => (
                                        <div
                                            key={s.id || s.path || s.name}
                                            onClick={() => handleItemClick(s)}
                                            className="group glass p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer glass-shadow"
                                        >
                                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-surface/50 border border-main flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0">
                                                    {s.type === 'FOLDER' || s.type === 'MOUNT' ? (
                                                        <Grid className="w-4 h-4 md:w-5 md:h-5 text-mute group-hover:text-brand" />
                                                    ) : s.type === 'POLICY' ? (
                                                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-mute group-hover:text-brand" />
                                                    ) : (
                                                        <Key className="w-4 h-4 md:w-5 md:h-5 text-mute group-hover:text-brand" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm md:text-base font-semibold text-main truncate">{s.name}</h3>
                                                    {s.path && (
                                                        <code className="text-[9px] md:text-[11px] text-mute bg-black/10 px-1 md:px-1.5 py-0.5 rounded uppercase tracking-wider truncate block md:inline-block max-w-[150px] md:max-w-none">{s.path}</code>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 md:gap-6">
                                                <div className="text-right hidden sm:block">
                                                    <span className="block text-xs font-semibold text-brand/80">{s.type}</span>
                                                    <span className="block text-[10px] text-mute uppercase tracking-tighter">{s.updated}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {s.type !== 'POLICY' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFavorite(s);
                                                                }}
                                                                className={`p-2 rounded-lg transition-colors ${favorites.some(f => f.path === s.path) ? 'text-brand bg-brand/10' : 'text-mute hover:bg-white/10'}`}
                                                            >
                                                                <Star className="w-4 h-4" fill={favorites.some(f => f.path === s.path) ? "currentColor" : "none"} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(s.path);
                                                                }}
                                                                className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main"
                                                                title="Copy Path"
                                                            >
                                                                <Copy className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {s.type === 'SECRET' && (
                                                        <button className="p-2 hover:bg-white/10 rounded-lg text-white/40">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-mute">
                                        {activeTab === "favorites" ? "No favorites added yet." :
                                            activeTab === "recent" ? "No recently used items yet." :
                                                activeTab === "policies" ? "No policies found." :
                                                    "No secrets found in this path."}
                                    </div>
                                )
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateSecretModal
                    currentPath={currentPath}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSave={handleSaveSecret}
                />
            )}
        </div>
    );
}

// --- Main App ---

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
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

    // Navigation History
    const [navHistory, setNavHistory] = useState<{ path: string, secret: any, policy: string | null }[]>([]);
    const [navPointer, setNavPointer] = useState(-1);
    const [profiles, setProfiles] = useState<any[]>(() => {
        const saved = localStorage.getItem("vault_profiles");
        return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Default', url: 'http://0.0.0.0:8200', token: '' }];
    });
    const [activeProfileId, setActiveProfileId] = useState<string>(profiles[0].id);

    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const [vaultUrl, setVaultUrl] = useState(activeProfile.url);
    const [token, setToken] = useState(activeProfile.token);

    useEffect(() => {
        localStorage.setItem("vault_profiles", JSON.stringify(profiles));
    }, [profiles]);

    useEffect(() => {
        setVaultUrl(activeProfile.url);
        setToken(activeProfile.token);
    }, [activeProfileId]);

    const [error, setError] = useState("");
    const [favorites, setFavorites] = useState<any[]>(() => {
        const saved = localStorage.getItem("vault_favorites");
        return saved ? JSON.parse(saved) : [];
    });
    const [recentlyUsed, setRecentlyUsed] = useState<any[]>(() => {
        const saved = localStorage.getItem("vault_recent");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("vault_favorites", JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem("vault_recent", JSON.stringify(recentlyUsed));
    }, [recentlyUsed]);

    const addToRecent = (secret: any) => {
        setRecentlyUsed(prev => {
            const filtered = prev.filter(s => s.path !== secret.path);
            return [{ ...secret, lastUsed: new Date().toISOString() }, ...filtered].slice(0, 10);
        });
    };

    const saveProfile = (name: string, url: string, token: string) => {
        const newProfile = { id: Date.now().toString(), name, url, token };
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
            await invoke("save_vault_token", { token });
            await new Promise(r => setTimeout(r, 800));
            setIsLoggedIn(true);
        } catch (err: any) {
            setError(err.toString());
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

                <form onSubmit={handleLogin} className="w-full space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <label className="text-xs font-semibold text-mute uppercase tracking-widest ml-1 mb-2 block flex justify-between items-center">
                                <span>Vault Profile</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const name = prompt("Profile Name?");
                                        if (name) saveProfile(name, vaultUrl, token);
                                    }}
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
                                />
                            </div>
                        </div>

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
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="btn-premium w-full flex items-center justify-center gap-2 mt-4"
                    >
                        {isLoggingIn ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Unlock Vault <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-2 text-mute text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Encrypted connection with end-to-end security</span>
                </div>
            </div>
        </div>
    );
}

export default App;
