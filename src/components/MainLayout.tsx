import { Grid } from "lucide-react";
import Sidebar from "./Sidebar";
import LockScreen from "./LockScreen";
import SettingsView from "./SettingsView";
import Dashboard from "./Dashboard";
import { ToastContainer } from "./Toast";

function MainLayout({ uiSnap, profileSnap, authSnap, vaultSnap, uiActions, profileActions, vaultActions, handleLogout }: any) {
    return (
        <>
            <div className={`flex h-screen w-full overflow-hidden text-main selection:bg-brand/30 transition-all duration-300 ${uiSnap.isLocked ? 'blur-md pointer-events-none scale-[0.98]' : ''}`}>
                {uiSnap.isSidebarOpen && (
                    <div
                        data-testid="sidebar-overlay"
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                        onClick={() => uiActions.closeSidebar()}
                    />
                )}

                <div className={`fixed inset-y-0 left-0 z-[70] md:relative md:z-auto ${uiSnap.isSidebarOpen ? 'w-64' : 'w-0'} md:w-72 transition-all duration-300 overflow-hidden border-r border-white/5 shrink-0`}>
                    <Sidebar
                        activeTab={uiSnap.activeTab}
                        setActiveTab={uiActions.setTab}
                        onLogout={handleLogout}
                        onClose={() => uiActions.closeSidebar()}
                        onLock={() => uiActions.lock()}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0 relative">
                    <div className="h-14 md:hidden border-b border-white/5 flex items-center px-4 bg-black/20">
                        <button
                            aria-label="Menu"
                            onClick={() => uiActions.openSidebar()}
                            className="p-2 -ml-2 text-mute hover:text-main"
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <span className="ml-2 font-bold text-sm tracking-tight text-main">Vault-1</span>
                    </div>
                    {uiSnap.activeTab === "settings" ? (
                        <SettingsView
                            profiles={profileSnap.profiles}
                            activeId={profileSnap.activeProfileId}
                            onSelect={profileActions.setActiveProfile}
                            onAdd={profileActions.addProfile}
                            onRemove={profileActions.removeProfile}
                            autoLock={uiSnap.autoLockTimeout}
                            setAutoLock={uiActions.setAutoLockTimeout}
                            theme={uiSnap.theme}
                            setTheme={uiActions.setTheme}
                        />
                    ) : (
                        <Dashboard
                            url={authSnap.vaultUrl}
                            token={authSnap.token}
                            activeTab={uiSnap.activeTab}
                            setActiveTab={uiActions.setTab}
                            favorites={vaultSnap.favorites}
                            recentlyUsed={vaultSnap.recentlyUsed}
                            toggleFavorite={vaultActions.toggleFavorite}
                            onItemView={vaultActions.addToRecent}
                        />
                    )}
                </div>
            </div>
            {uiSnap.isLocked && <LockScreen onUnlock={() => uiActions.unlock()} />}
            <ToastContainer />
        </>
    );
}

export default MainLayout;
