import {
    Lock, Grid, Clock, Star, Settings, LogOut, X, ShieldCheck
} from "lucide-react";

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

export default Sidebar;
