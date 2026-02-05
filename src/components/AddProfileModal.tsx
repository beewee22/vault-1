import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Plus, ShieldCheck } from "lucide-react";
import { AUTH_METHODS, type VaultProfile, type AuthMethod } from "../types";

function AddProfileModal({ onClose, onSave }: { onClose: () => void, onSave: (profile: Omit<VaultProfile, "id">) => void }) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("http://0.0.0.0:8200");
    const [authMethod, setAuthMethod] = useState<AuthMethod>("token");
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState("");

    const selectedMethod = AUTH_METHODS.find(m => m.id === authMethod)!;

    const updateFieldValue = (key: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [key]: value }));
    };

    const getFieldValue = (key: string): string => {
        if (fieldValues[key] !== undefined) return fieldValues[key];
        const field = selectedMethod.fields.find(f => f.key === key);
        return field?.defaultValue || "";
    };

    const isFormValid = () => {
        if (!name || !url) return false;
        const requiredFields = selectedMethod.fields.filter(f => f.required);
        return requiredFields.every(field => getFieldValue(field.key).trim() !== "");
    };

    const handleSaveProfile = async () => {
        if (!isFormValid()) return;
        setIsValidating(true);
        setError("");

        try {
            if (authMethod === "token") {
                const token = getFieldValue("token");
                await invoke("check_vault_connection", { url, token });
                onSave({
                    name,
                    url,
                    token,
                    authMethod: "token"
                });
            } else if (authMethod === "oidc") {
                const mountPath = getFieldValue("mount_path");
                const role = getFieldValue("role");
                onSave({
                    name,
                    url,
                    token: "",
                    authMethod: "oidc",
                    oidcMountPath: mountPath,
                    oidcRole: role || undefined
                });
            }
            onClose();
        } catch (err: any) {
            setError("Connection failed: " + err.toString());
        } finally {
            setIsValidating(false);
        }
    };

    const handleAuthMethodChange = (newMethod: AuthMethod) => {
        setAuthMethod(newMethod);
        setFieldValues({});
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md glass rounded-[32px] overflow-hidden border-main flex flex-col animate-in zoom-in duration-300">
                <div className="p-6 border-b border-main flex items-center justify-between text-main">
                    <h2 className="text-xl font-bold">Add Vault Profile</h2>
                    <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-white/10 rounded-full transition-colors text-mute hover:text-main"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Authentication Method</label>
                        <select
                            value={authMethod}
                            onChange={(e) => handleAuthMethodChange(e.target.value as AuthMethod)}
                            className="input-premium"
                        >
                            {AUTH_METHODS.map(method => (
                                <option key={method.id} value={method.id}>{method.label}</option>
                            ))}
                        </select>
                    </div>

                    {authMethod === "oidc" && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs">
                            OIDC authentication will happen at login.
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Profile Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Production"
                            className="input-premium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Vault URL</label>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="http://127.0.0.1:8200"
                            className="input-premium"
                        />
                    </div>

                    {selectedMethod.fields.map(field => (
                        <div key={field.key} className="space-y-2">
                            <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">
                                {field.label}
                                {!field.required && <span className="text-mute/60 ml-1">(Optional)</span>}
                            </label>
                            <input
                                type={field.type}
                                value={getFieldValue(field.key)}
                                onChange={(e) => updateFieldValue(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="input-premium"
                            />
                        </div>
                    ))}

                    <button
                        onClick={handleSaveProfile}
                        disabled={!isFormValid() || isValidating}
                        className="btn-premium w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-2"
                    >
                        {isValidating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Save Profile</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddProfileModal;
