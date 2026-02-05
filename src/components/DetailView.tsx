import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import {
    Key, ChevronRight, Star, Clock, Eye, EyeOff, Copy, Check, ExternalLink
} from "lucide-react";

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

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {f.secret && (
                                            <button
                                                onClick={() => toggleValue(f.key)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors"
                                            >
                                                {showValues[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    <button
                        onClick={() => open(url)}
                        className="flex items-center gap-2 text-mute text-xs hover:text-main transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View in Vault UI</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DetailView;
