import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronRight, Shield, ShieldCheck } from "lucide-react";

function PolicyDetailView({ name, onBack, url, token }: { name: string, onBack: () => void, url: string, token: string }) {
    const [hcl, setHcl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const res: any = await invoke("read_vault_policy", { url, token, name });
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

export default PolicyDetailView;
