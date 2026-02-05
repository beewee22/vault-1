import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    Search, Grid, Key, ShieldCheck, ChevronRight,
    Star, Copy, Eye, RefreshCw, Plus
} from "lucide-react";
import DetailView from "./DetailView";
import PolicyDetailView from "./PolicyDetailView";
import CreateSecretModal from "./CreateSecretModal";

function Dashboard({ url, token, activeTab, setActiveTab, favorites, recentlyUsed, toggleFavorite, onItemView }: {
    url: string;
    token: string;
    activeTab: string;
    setActiveTab: (t: string) => void;
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

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (e.state) {
                const { path, secret, policy } = e.state;
                setCurrentPath(path ?? "");
                setSelectedSecret(secret ?? null);
                setSelectedPolicy(policy ?? null);
            } else {
                setCurrentPath("");
                setSelectedSecret(null);
                setSelectedPolicy(null);
            }
        };

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

    const goBack = () => { window.history.back(); };
    const goForward = () => { window.history.forward(); };

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

    useEffect(() => {
        setCurrentPath("");
        setSelectedSecret(null);
        setSelectedPolicy(null);
        setSearchQuery("");
        setError("");
        window.history.replaceState({ path: "", secret: null, policy: null }, "");
    }, [activeTab]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search')?.focus();
            }

            const isBack =
                (e.metaKey && e.key === '[') ||
                (e.metaKey && e.key === 'ArrowLeft') ||
                (e.altKey && e.key === 'ArrowLeft') ||
                (e.key === "Backspace" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName));

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
                const res: any = await invoke("fetch_vault_secret", { url, token, path: "sys/mounts" });
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

                const res: any = await invoke("list_vault_secrets", { url, token, path: listPath });
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
            const errorMessage = err.toString();
            if (!currentPath && errorMessage.includes("403")) {
                setError("Permission denied: Your Vault policy does not include sys/mounts read access. Please ask your Vault administrator to add the following policy:\n\npath \"sys/mounts\" {\n  capabilities = [\"read\"]\n}");
            } else {
                setError("Failed to fetch: " + errorMessage);
            }
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
            await invoke("save_vault_secret", { url, token, path: savePath, data });
            fetchSecrets();
        } catch (err: any) {
            console.error("Error saving secret:", err);
            throw err;
        }
    };

    const handleItemClick = (item: any) => {
        setSearchQuery("");
        if (item.type === 'POLICY') {
            navigateTo(currentPath, null, item.name);
        } else if (item.type === 'FOLDER' || item.type === 'MOUNT') {
            const nextPath = item.path;
            if (activeTab !== "all") {
                setActiveTab("all");
                setTimeout(() => navigateTo(nextPath, null, null), 50);
            } else {
                navigateTo(nextPath, null, null);
            }
        } else {
            navigateTo(currentPath, item, null);
            onItemView(item);
        }
    };

    const navigateUp = () => { goUp(); };

    const getGlobalSearch = () => {
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

export default Dashboard;
