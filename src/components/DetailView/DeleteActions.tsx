import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Trash2, AlertTriangle } from "lucide-react";
import { toDeletePath, toDestroyPath, toMetadataPath } from "../../utils/vault-path";
import { toastActions } from "../../stores/toast";

interface DeleteActionsProps {
    secret: any;
    currentVersion: number;
    url: string;
    token: string;
    mountType: "kv" | "kv-v2" | string;
    isEditing: boolean;
    onDelete: () => void;
    onDestroy: () => void;
}

function DeleteActions({ secret, currentVersion, url, token, mountType, isEditing, onDelete, onDestroy }: DeleteActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDestroyDialog, setShowDestroyDialog] = useState(false);
    const [destroyConfirmText, setDestroyConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDestroying, setIsDestroying] = useState(false);

    // Only show for KV v2 mounts and when not editing
    if (mountType !== "kv-v2" || isEditing) {
        return null;
    }

    const handleSoftDelete = async () => {
        setIsDeleting(true);
        try {
            const deletePath = toDeletePath(secret.path);
            await invoke("delete_vault_secret", {
                url,
                token,
                path: deletePath,
                versions: [currentVersion]
            });
            toastActions.success("Secret deleted");
            setShowDeleteDialog(false);
            onDelete();
        } catch (err: any) {
            toastActions.error(`Failed to delete: ${err.toString()}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDestroy = async () => {
        setIsDestroying(true);
        try {
            // Fetch metadata to get all versions
            const metadataPath = toMetadataPath(secret.path);
            const metadataRes: any = await invoke("fetch_vault_secret", {
                url,
                token,
                path: metadataPath
            });

            const versions = metadataRes.data?.versions || {};
            const allVersions = Object.keys(versions).map(v => parseInt(v));

            if (allVersions.length === 0) {
                toastActions.error("No versions found to destroy");
                return;
            }

            const destroyPath = toDestroyPath(secret.path);
            await invoke("destroy_vault_secret", {
                url,
                token,
                path: destroyPath,
                versions: allVersions
            });

            toastActions.success("All versions destroyed");
            setShowDestroyDialog(false);
            setDestroyConfirmText("");
            onDestroy();
        } catch (err: any) {
            toastActions.error(`Failed to destroy: ${err.toString()}`);
        } finally {
            setIsDestroying(false);
        }
    };

    const isDestroyConfirmValid = destroyConfirmText === secret.name;

    return (
        <>
            <div className="mt-8 flex gap-3">
                <button
                    data-testid="delete-secret"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    Delete
                </button>
                <button
                    data-testid="destroy-secret"
                    onClick={() => setShowDestroyDialog(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium"
                >
                    <AlertTriangle className="w-4 h-4" />
                    Destroy All Versions
                </button>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md glass rounded-[32px] overflow-hidden border-white/10">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-amber-400">Delete Secret</h2>
                        </div>

                        <div className="p-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-main text-sm">
                                        This will soft-delete version <span className="font-bold text-brand">{currentVersion}</span> of this secret.
                                    </p>
                                    <p className="text-mute text-xs">
                                        It can be recovered via version history using the undelete operation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                data-testid="delete-confirm"
                                onClick={handleSoftDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Destroy Confirmation Dialog */}
            {showDestroyDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md glass rounded-[32px] overflow-hidden border-white/10">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-red-400">Destroy All Versions</h2>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-main text-sm font-semibold">
                                        This will permanently destroy ALL versions of this secret.
                                    </p>
                                    <p className="text-mute text-xs">
                                        This action is irreversible and cannot be undone. All version history will be lost.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">
                                    Type the secret name to confirm
                                </label>
                                <input
                                    data-testid="destroy-confirm-input"
                                    type="text"
                                    value={destroyConfirmText}
                                    onChange={(e) => setDestroyConfirmText(e.target.value)}
                                    placeholder={secret.name}
                                    className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm outline-none focus:border-red-400/40 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDestroyDialog(false);
                                    setDestroyConfirmText("");
                                }}
                                disabled={isDestroying}
                                className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                data-testid="destroy-confirm"
                                onClick={handleDestroy}
                                disabled={!isDestroyConfirmValid || isDestroying}
                                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDestroying ? (
                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                    "Destroy Forever"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DeleteActions;
