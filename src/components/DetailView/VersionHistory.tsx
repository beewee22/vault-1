interface VersionHistoryProps {
    versions: any[];
    currentVersion: number;
    onSelectVersion: (version: number) => void;
}

function VersionHistory({ versions, currentVersion, onSelectVersion }: VersionHistoryProps) {
    return null;
}

export default VersionHistory;
