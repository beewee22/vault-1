import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toDataPath } from "../../utils/vault-path";
import { toastActions } from "../../stores/toast";

interface FieldsEditorProps {
    fields: any[];
    currentVersion: number;
    url: string;
    token: string;
    secretPath: string;
    onSave: () => void;
    onCancel: () => void;
}

interface EditableField {
    key: string;
    value: string;
    isNew: boolean;
}

function FieldsEditor({ fields, currentVersion, url, token, secretPath, onSave, onCancel }: FieldsEditorProps) {
    const [editableFields, setEditableFields] = useState<EditableField[]>(
        fields.map(f => ({
            key: f.key,
            value: typeof f.value === 'string' ? f.value : JSON.stringify(f.value),
            isNew: false
        }))
    );
    const [isSaving, setIsSaving] = useState(false);

    const addField = () => {
        setEditableFields([...editableFields, { key: "", value: "", isNew: true }]);
    };

    const removeField = (index: number) => {
        const field = editableFields[index];
        if (field.key || field.value) {
            if (!confirm(`Remove field "${field.key || '(empty)'}"?`)) {
                return;
            }
        }
        setEditableFields(editableFields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, fieldName: 'key' | 'value', val: string) => {
        const updated = [...editableFields];
        updated[index][fieldName] = val;
        setEditableFields(updated);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = editableFields.reduce((acc, field) => {
                if (field.key) {
                    acc[field.key] = field.value;
                }
                return acc;
            }, {} as Record<string, string>);

            const dataPath = toDataPath(secretPath);
            const result: any = await invoke("save_vault_secret", {
                url,
                token,
                path: dataPath,
                data,
                cas: currentVersion
            });

            toastActions.success("Secret updated successfully");
            onSave();
        } catch (error: any) {
            const errorMsg = error.toString();
            if (errorMsg.includes("400") || errorMsg.includes("check-and-set")) {
                toastActions.error("Secret was modified elsewhere. Refresh and try again.");
            } else {
                toastActions.error("Failed to save: " + errorMsg);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const hasMultiline = (value: string) => value.includes('\n');

    return (
        <div data-testid="field-editor" className="space-y-4">
            {editableFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                        <input
                            type="text"
                            placeholder="Key"
                            value={field.key}
                            onChange={(e) => updateField(index, 'key', e.target.value)}
                            disabled={!field.isNew}
                            className={`w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm outline-none focus:border-brand/40 transition-colors ${!field.isNew ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {hasMultiline(field.value) ? (
                            <textarea
                                placeholder="Value"
                                value={field.value}
                                onChange={(e) => updateField(index, 'value', e.target.value)}
                                rows={4}
                                className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm outline-none focus:border-brand/40 transition-colors font-mono resize-y"
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder="Value"
                                value={field.value}
                                onChange={(e) => updateField(index, 'value', e.target.value)}
                                className="w-full bg-black/20 p-3 rounded-xl border border-white/5 text-sm outline-none focus:border-brand/40 transition-colors font-mono"
                            />
                        )}
                    </div>
                    <button
                        onClick={() => removeField(index)}
                        className="p-3 hover:bg-red-400/10 text-red-400/60 rounded-xl transition-colors mt-0"
                        title="Remove field"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}

            <button
                onClick={addField}
                className="w-full p-3 border border-dashed border-main rounded-xl text-mute text-sm hover:border-brand/30 hover:text-dim transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Field
            </button>

            <div className="flex gap-3 pt-4">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                    disabled={isSaving}
                >
                    Cancel
                </button>
                <button
                    data-testid="save-edit"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 btn-premium py-3 text-sm flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default FieldsEditor;
