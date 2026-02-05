import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronUp, Clock, RotateCcw, GitCompare } from "lucide-react";
import { toMetadataPath, toUndeletePath } from "../../utils/vault-path";
import { toastActions } from "../../stores/toast";

interface VersionHistoryProps {
    secret: any;
    mountType: string;
    currentVersion: number;
    url: string;
    token: string;
    onViewVersion: (version: number | null) => void;
    onCompare: (versions: [number, number]) => void;
}

interface VersionMetadata {
    created_time: string;
    deletion_time: string;
    destroyed: boolean;
}

function formatTimestamp(isoString: string): string {
    if (!isoString) return "Unknown";
    
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function VersionHistory({ secret, mountType, currentVersion, url, token, onViewVersion, onCompare }: VersionHistoryProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [versions, setVersions] = useState<Record<string, VersionMetadata>>({});
    const [loading, setLoading] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState<Set<number>>(new Set());
    const [undeletingVersion, setUndeletingVersion] = useState<number | null>(null);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const metadataPath = toMetadataPath(secret.path);
            const res: any = await invoke("fetch_vault_metadata", {
                url,
                token,
                path: metadataPath,
            });
            
            const versionsData = res.data?.versions || {};
            setVersions(versionsData);
        } catch (err) {
            console.error("Failed to fetch version metadata:", err);
            toastActions.error("Failed to load version history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isExpanded && mountType === "kv-v2") {
            fetchMetadata();
        }
    }, [isExpanded, mountType]);

    const handleUndelete = async (versionNum: number) => {
        setUndeletingVersion(versionNum);
        try {
            const undeletePath = toUndeletePath(secret.path);
            await invoke("undelete_vault_secret", {
                url,
                token,
                path: undeletePath,
                versions: [versionNum],
            });
            
            toastActions.success(`Version ${versionNum} undeleted successfully`);
            await fetchMetadata();
        } catch (err) {
            console.error("Failed to undelete version:", err);
            toastActions.error(`Failed to undelete version ${versionNum}`);
        } finally {
            setUndeletingVersion(null);
        }
    };

    const toggleVersionSelection = (versionNum: number) => {
        const newSelection = new Set(selectedVersions);
        if (newSelection.has(versionNum)) {
            newSelection.delete(versionNum);
        } else {
            if (newSelection.size >= 2) {
                toastActions.warning("You can only select 2 versions to compare");
                return;
            }
            newSelection.add(versionNum);
        }
        setSelectedVersions(newSelection);
    };

    const handleCompare = () => {
        if (selectedVersions.size !== 2) {
            toastActions.warning("Please select exactly 2 versions to compare");
            return;
        }
        const versionsArray = Array.from(selectedVersions).sort((a, b) => a - b);
        onCompare([versionsArray[0], versionsArray[1]]);
        setSelectedVersions(new Set());
    };

    if (mountType !== "kv-v2") {
        return null;
    }

    const versionNumbers = Object.keys(versions)
        .map(Number)
        .sort((a, b) => b - a);

    const versionCount = versionNumbers.length;

    return (
        <div data-testid="version-history" className="mt-8 glass rounded-2xl overflow-hidden border-white/5">
            <button
                data-testid="version-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand" />
                    <span className="text-sm font-semibold text-main">
                        Version History {versionCount > 0 && `(${versionCount} versions)`}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-mute" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-mute" />
                )}
            </button>

            {isExpanded && (
                <div className="border-t border-white/5">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        </div>
                    ) : versionCount === 0 ? (
                        <div className="p-6 text-center text-mute text-sm italic">
                            No version history available
                        </div>
                    ) : (
                        <>
                            <div className="max-h-96 overflow-y-auto">
                                {versionNumbers.map((versionNum) => {
                                    const versionData = versions[versionNum];
                                    const isCurrent = versionNum === currentVersion;
                                    const isDeleted = versionData.deletion_time !== "";
                                    const isDestroyed = versionData.destroyed === true;
                                    const isSelected = selectedVersions.has(versionNum);

                                    return (
                                        <div
                                            key={versionNum}
                                            data-testid={`version-item-${versionNum}`}
                                            className={`px-6 py-4 border-b border-white/5 last:border-b-0 transition-colors ${
                                                isDestroyed 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : 'hover:bg-white/5 cursor-pointer'
                                            } ${isSelected ? 'bg-brand/10' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {!isDestroyed && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleVersionSelection(versionNum)}
                                                            className="w-4 h-4 rounded border-main bg-black/20 text-brand focus:ring-brand focus:ring-offset-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    )}
                                                    
                                                    <div
                                                        onClick={() => !isDestroyed && onViewVersion(versionNum)}
                                                        className="flex-1"
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                                isDestroyed 
                                                                    ? 'bg-red-500/20 text-red-400 line-through' 
                                                                    : 'bg-brand/20 text-brand'
                                                            }`}>
                                                                v{versionNum}
                                                            </span>
                                                            
                                                            {isCurrent && !isDeleted && !isDestroyed && (
                                                                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">
                                                                    Current
                                                                </span>
                                                            )}
                                                            
                                                            {isDeleted && !isDestroyed && (
                                                                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                                                                    Deleted
                                                                </span>
                                                            )}
                                                            
                                                            {isDestroyed && (
                                                                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                                                                    Destroyed
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="text-xs text-mute">
                                                            Created: {formatTimestamp(versionData.created_time)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isDeleted && !isDestroyed && (
                                                    <button
                                                        data-testid="undelete-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUndelete(versionNum);
                                                        }}
                                                        disabled={undeletingVersion === versionNum}
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium disabled:opacity-50"
                                                    >
                                                        {undeletingVersion === versionNum ? (
                                                            <div className="w-3 h-3 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <RotateCcw className="w-3 h-3" />
                                                                Undelete
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedVersions.size > 0 && (
                                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-mute">
                                        {selectedVersions.size === 1 
                                            ? "Select 1 more version to compare" 
                                            : `${selectedVersions.size} versions selected`}
                                    </span>
                                    <button
                                        data-testid="compare-btn"
                                        onClick={handleCompare}
                                        disabled={selectedVersions.size !== 2}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/80 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <GitCompare className="w-4 h-4" />
                                        Compare Versions
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default VersionHistory;
