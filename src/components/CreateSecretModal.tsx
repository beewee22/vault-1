import { useState } from "react";
import { X, Trash2, Plus } from "lucide-react";
import { toastActions } from "../stores/toast";

function CreateSecretModal({ onClose, onSave, currentPath }: { onClose: () => void, onSave: (name: string, data: any) => Promise<void>, currentPath: string }) {
    const [name, setName] = useState("");
    const [fields, setFields] = useState([{ key: "", value: "" }]);
    const [isSaving, setIsSaving] = useState(false);

    const addField = () => setFields([...fields, { key: "", value: "" }]);
    const removeField = (index: number) => setFields(fields.filter((_, i) => i !== index));
    const updateField = (index: number, kOrV: 'key' | 'value', val: string) => {
        const newFields = [...fields];
        newFields[index][kOrV] = val;
        setFields(newFields);
    };

    const handleSave = async () => {
        if (!name) return;
        setIsSaving(true);
        const data = fields.reduce((acc, curr) => {
            if (curr.key) acc[curr.key] = curr.value;
            return acc;
        }, {} as any);
        try {
            await onSave(name, data);
            onClose();
        } catch (error: any) {
            toastActions.error("Failed to save: " + error.toString());
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg glass rounded-[32px] overflow-hidden border-white/10 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">New Secret</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-8 space-y-6 overflow-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Path & Name</label>
                        <div className="flex items-center gap-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                            <span className="text-mute text-sm">{currentPath}</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="my-secret"
                                className="bg-transparent border-none outline-none text-white text-sm flex-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-mute uppercase tracking-widest ml-1">Data Fields</label>
                        {fields.map((f, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    placeholder="Key"
                                    value={f.key}
                                    onChange={(e) => updateField(i, 'key', e.target.value)}
                                    className="bg-black/20 p-3 rounded-xl border border-white/5 text-sm flex-1 outline-none focus:border-brand/40 transition-colors"
                                />
                                <input
                                    placeholder="Value"
                                    value={f.value}
                                    onChange={(e) => updateField(i, 'value', e.target.value)}
                                    className="bg-black/20 p-3 rounded-xl border border-white/5 text-sm flex-1 outline-none focus:border-brand/40 transition-colors"
                                />
                                {fields.length > 1 && (
                                    <button onClick={() => removeField(i)} className="p-3 hover:bg-red-400/10 text-red-400/60 rounded-xl transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={addField} className="w-full p-3 border border-dashed border-main rounded-xl text-mute text-sm hover:border-brand/30 hover:text-dim transition-all flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Field
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={!name || isSaving}
                        className="flex-1 btn-premium py-3 text-sm flex items-center justify-center gap-2"
                    >
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Secret"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateSecretModal;
