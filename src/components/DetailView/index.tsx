import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import {
    Key, ChevronRight, Star, Clock, Eye, EyeOff, Copy, Check, ExternalLink, Pencil
} from "lucide-react";
import { toDataPath } from "../../utils/vault-path";
import FieldsDisplay from "./FieldsDisplay";
import FieldsEditor from "./FieldsEditor";

interface DetailViewProps {
    secret: any;
    onBack: () => void;
    url: string;
    token: string;
    isFavorite: boolean;
    onToggleFavorite: (s: any) => void;
    onItemView?: (s: any) => void;
    mountType: "kv" | "kv-v2" | string;
}

function DetailView({ secret, onBack, url, token, isFavorite, onToggleFavorite, onItemView, mountType }: DetailViewProps) {
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<number>(0);

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
                dataPath = toDataPath(secret.path);
            }

            const res: any = await invoke("fetch_vault_secret", {
                url,
                token,
                path: dataPath,
            });

            const data = res.data?.data || {};
            const metadata = res.data?.metadata || {};
            const version = metadata.version || 0;
            setCurrentVersion(version);

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
        setIsEditing(false);
    }, [secret.path]);

    const toggleValue = (key: string) => {
        setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveEdit = async () => {
        setIsEditing(false);
        await fetchSecretData();
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const isKvV2 = mountType === "kv-v2";

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
                            <div className="flex items-center gap-2">
                                {isKvV2 && !loading && (
                                    <button
                                        data-testid="edit-toggle"
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`p-2 rounded-xl transition-all duration-300 ${isEditing ? 'bg-brand/20 text-brand' : 'bg-surface border border-main text-mute hover:text-main'}`}
                                        title={isEditing ? "Cancel editing" : "Edit secret"}
                                    >
                                        <Pencil className="w-6 h-6" strokeWidth={1.5} />
                                    </button>
                                )}
                                <button
                                    onClick={() => onToggleFavorite(secret)}
                                    className={`p-2 rounded-xl transition-all duration-300 ${isFavorite ? 'bg-brand/20 text-brand' : 'bg-surface border border-main text-mute hover:text-main'}`}
                                >
                                    <Star className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 2 : 1.5} />
                                </button>
                            </div>
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
                        <div className="p-6 space-y-1">
                            {isEditing ? (
                                <FieldsEditor
                                    fields={fields}
                                    currentVersion={currentVersion}
                                    url={url}
                                    token={token}
                                    secretPath={secret.path}
                                    onSave={handleSaveEdit}
                                    onCancel={handleCancelEdit}
                                />
                            ) : (
                                <FieldsDisplay
                                    fields={fields}
                                    showValues={showValues}
                                    onToggleShow={toggleValue}
                                    onCopy={handleCopy}
                                    copiedKey={copiedKey}
                                />
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
