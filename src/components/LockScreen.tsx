import { Lock, Key } from "lucide-react";

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

export default LockScreen;
