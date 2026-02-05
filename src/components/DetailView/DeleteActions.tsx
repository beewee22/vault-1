interface DeleteActionsProps {
    secretPath: string;
    onDelete: (versions: number[]) => void;
    onDestroy: (versions: number[]) => void;
    onUndelete: (versions: number[]) => void;
}

function DeleteActions({ secretPath, onDelete, onDestroy, onUndelete }: DeleteActionsProps) {
    return null;
}

export default DeleteActions;
