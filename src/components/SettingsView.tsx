import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import AddProfileModal from "./AddProfileModal";

function SettingsView({ profiles, activeId, onSelect, onAdd, onRemove, autoLock, setAutoLock, theme, setTheme }: any) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    return (
        <div className="flex-1 overflow-auto p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAddModalOpen && <AddProfileModal onClose={() => setIsAddModalOpen(false)} onSave={onAdd} />}
            <div className="w-full">
                <h1 className="text-3xl font-bold text-main mb-2">Settings</h1>
                <p className="text-dim mb-12">Manage your Vault profiles and security preferences</p>

                <div className="space-y-12">
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

export default SettingsView;
