import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface Field {
    key: string;
    value: any;
    label: string;
    secret: boolean;
}

interface FieldsDisplayProps {
    fields: Field[];
    showValues: Record<string, boolean>;
    onToggleShow: (key: string) => void;
    onCopy: (key: string, value: any) => void;
    copiedKey: string | null;
}

function FieldsDisplay({ fields, showValues, onToggleShow, onCopy, copiedKey }: FieldsDisplayProps) {
    if (fields.length === 0) {
        return (
            <div className="p-8 text-center text-mute text-sm italic">
                No data found in this secret.
            </div>
        );
    }

    return (
        <>
            {fields.map((f) => (
                <div key={f.key} className="group flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all duration-300">
                    <div className="space-y-1 flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-mute font-bold block ml-1">{f.label}</span>
                        <div className="flex items-center gap-3">
                            <span className={`font-mono text-sm tracking-tight ${showValues[f.key] || !f.secret ? "text-main" : "text-mute/20"}`}>
                                {(showValues[f.key] || !f.secret) ? (typeof f.value === 'string' ? f.value : JSON.stringify(f.value)) : "••••••••••••••••"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {f.secret && (
                            <button
                                onClick={() => onToggleShow(f.key)}
                                className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors"
                            >
                                {showValues[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                        <button
                            onClick={() => onCopy(f.key, f.value)}
                            className="p-2 hover:bg-white/10 rounded-lg text-mute hover:text-main transition-colors"
                        >
                            {copiedKey === f.key ? <Check className="w-4 h-4 text-brand" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}

export default FieldsDisplay;
