import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeOff, X } from "lucide-react";
import { toDataPath } from "../../utils/vault-path";

interface VersionDiffProps {
    comparingVersions: [number, number];
    url: string;
    token: string;
    secret: any;
    onClose: () => void;
}

type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffRow {
    key: string;
    leftValue: any;
    rightValue: any;
    status: DiffStatus;
}

function VersionDiff({ comparingVersions, url, token, secret, onClose }: VersionDiffProps) {
    const [leftVersion, rightVersion] = comparingVersions;
    const [leftData, setLeftData] = useState<Record<string, any>>({});
    const [rightData, setRightData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [diffRows, setDiffRows] = useState<DiffRow[]>([]);

    useEffect(() => {
        const fetchVersions = async () => {
            setLoading(true);
            try {
                let dataPath = secret.path;
                if (secret.path.startsWith("secret/")) {
                    dataPath = toDataPath(secret.path);
                }

                const [leftRes, rightRes]: any[] = await Promise.all([
                    invoke("fetch_vault_secret", { url, token, path: dataPath, version: leftVersion }),
                    invoke("fetch_vault_secret", { url, token, path: dataPath, version: rightVersion })
                ]);

                const left = leftRes.data?.data || {};
                const right = rightRes.data?.data || {};

                setLeftData(left);
                setRightData(right);

                const leftKeys = Object.keys(left);
                const rightKeys = Object.keys(right);
                const allKeys = [...new Set([...leftKeys, ...rightKeys])].sort();

                const rows: DiffRow[] = allKeys.map(key => {
                    const hasLeft = key in left;
                    const hasRight = key in right;

                    let status: DiffStatus;
                    if (!hasLeft && hasRight) {
                        status = 'added';
                    } else if (hasLeft && !hasRight) {
                        status = 'removed';
                    } else if (left[key] !== right[key]) {
                        status = 'changed';
                    } else {
                        status = 'unchanged';
                    }

                    return {
                        key,
                        leftValue: left[key],
                        rightValue: right[key],
                        status
                    };
                });

                setDiffRows(rows);
            } catch (err) {
                console.error("Failed to fetch versions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, [comparingVersions, url, token, secret.path]);

    const toggleValue = (key: string) => {
        setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const formatValue = (value: any): string => {
        if (value === undefined || value === null) return '';
        return typeof value === 'string' ? value : JSON.stringify(value);
    };

    const renderValue = (key: string, value: any, show: boolean) => {
        if (value === undefined || value === null) {
            return <span className="text-mute/40 italic text-xs">—</span>;
        }
        const formatted = formatValue(value);
        return (
            <span className={`font-mono text-sm tracking-tight ${show ? "text-main" : "text-mute/20"}`}>
                {show ? formatted : "••••••••••••••••"}
            </span>
        );
    };

    const getRowBgClass = (status: DiffStatus, side: 'left' | 'right'): string => {
        switch (status) {
            case 'added':
                return side === 'right' ? 'bg-green-500/10' : '';
            case 'removed':
                return side === 'left' ? 'bg-red-500/10' : '';
            case 'changed':
                return 'bg-amber-500/10';
            case 'unchanged':
                return 'opacity-60';
            default:
                return '';
        }
    };

    const hasDifferences = diffRows.some(row => row.status !== 'unchanged');

    if (loading) {
        return (
            <div data-testid="version-diff" className="glass rounded-[32px] overflow-hidden border-white/5 p-12">
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div data-testid="version-diff" className="glass rounded-[32px] overflow-hidden border-white/5">
            <div className="px-6 py-4 bg-brand/10 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand">
                    Comparing Version {leftVersion} vs Version {rightVersion}
                </h3>
                <button
                    data-testid="diff-close"
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg text-brand hover:text-brand/80 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {!hasDifferences ? (
                <div className="p-8 text-center text-mute text-sm italic">
                    No differences found between these versions.
                </div>
            ) : (
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div data-testid="diff-left" className="pb-3 border-b border-white/5">
                            <h4 className="text-xs uppercase tracking-widest text-mute font-bold">
                                Version {leftVersion}
                            </h4>
                        </div>

                        <div data-testid="diff-right" className="pb-3 border-b border-white/5">
                            <h4 className="text-xs uppercase tracking-widest text-mute font-bold">
                                Version {rightVersion}
                            </h4>
                        </div>

                        {diffRows.map((row) => {
                            const show = showValues[row.key] || false;
                            const hasLeft = row.leftValue !== undefined && row.leftValue !== null;
                            const hasRight = row.rightValue !== undefined && row.rightValue !== null;

                            return (
                                <>
                                    <div
                                        key={`${row.key}-left`}
                                        className={`group p-4 rounded-2xl transition-all duration-300 ${getRowBgClass(row.status, 'left')}`}
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-widest text-mute font-bold block ml-1">
                                                {row.key}
                                            </span>
                                            <div className="flex items-center justify-between gap-3">
                                                {renderValue(row.key, row.leftValue, show)}
                                                {hasLeft && (
                                                    <button
                                                        onClick={() => toggleValue(row.key)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        key={`${row.key}-right`}
                                        className={`group p-4 rounded-2xl transition-all duration-300 ${getRowBgClass(row.status, 'right')}`}
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-widest text-mute font-bold block ml-1">
                                                {row.key}
                                            </span>
                                            <div className="flex items-center justify-between gap-3">
                                                {renderValue(row.key, row.rightValue, show)}
                                                {hasRight && (
                                                    <button
                                                        onClick={() => toggleValue(row.key)}
                                                        className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default VersionDiff;
