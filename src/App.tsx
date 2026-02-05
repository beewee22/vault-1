import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { invoke } from "@tauri-apps/api/core";
import LoginScreen from "./components/LoginScreen";
import MainLayout from "./components/MainLayout";
import { authStore, authActions, profileStore, profileActions, uiStore, uiActions, vaultStore, vaultActions } from "./stores";


function App() {
    const authSnap = useSnapshot(authStore);
    const profileSnap = useSnapshot(profileStore);
    const uiSnap = useSnapshot(uiStore);
    const vaultSnap = useSnapshot(vaultStore);
    const activeProfile = profileSnap.activeProfile;

    useEffect(() => {
        const handleActivity = () => uiActions.updateActivity();
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('mousemove', handleActivity);
        return () => {
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('mousemove', handleActivity);
        };
    }, []);

    useEffect(() => {
        if (!authSnap.isLoggedIn || uiSnap.isLocked || uiSnap.autoLockTimeout === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            if (now - uiSnap.lastActivity > uiSnap.autoLockTimeout * 60 * 1000) {
                uiActions.lock();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [authSnap.isLoggedIn, uiSnap.isLocked, uiSnap.autoLockTimeout, uiSnap.lastActivity]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        authActions.setLoggingIn(true);
        authActions.setError("");
        try {
            await invoke("check_vault_connection", { url: authSnap.vaultUrl, token: authSnap.token });
            await invoke("save_vault_token", { token: authSnap.token });
            await new Promise(r => setTimeout(r, 800));
            authActions.login(authSnap.token, authSnap.vaultUrl);
        } catch (err: any) {
            authActions.setError("Connection failed: " + err.toString());
        } finally {
            authActions.setLoggingIn(false);
        }
    };

    const handleOidcLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        authActions.setLoggingIn(true);
        authActions.setError("");
        try {
            const token = await invoke<string>("oidc_login", {
                url: authSnap.vaultUrl,
                mountPath: activeProfile.oidcMountPath || "oidc",
                role: activeProfile.oidcRole || "",
            });
            authActions.setToken(token);
            await invoke("save_vault_token", { token });
            await new Promise(r => setTimeout(r, 800));
            authActions.login(token, authSnap.vaultUrl);
        } catch (err: any) {
            const msg = err.toString();
            if (msg.includes("timed out")) authActions.setError("Authentication timed out after 120 seconds. Please try again.");
            else if (msg.includes("auth_url")) authActions.setError(`OIDC auth method not found at '${activeProfile.oidcMountPath || "oidc"}'. Check your profile configuration.`);
            else if (msg.includes("callback") || msg.includes("redirect_uri")) authActions.setError("OIDC callback failed. Your Vault role may not allow localhost callbacks.");
            else if (msg.includes("Failed to request") || msg.includes("Network")) authActions.setError("Network error: Could not reach Vault server.");
            else authActions.setError("OIDC login failed: " + msg);
        } finally {
            authActions.setLoggingIn(false);
        }
    };

    const handleLogout = () => {
        authActions.logout();
    };

    if (authSnap.isLoggedIn) {
        return <MainLayout uiSnap={uiSnap} profileSnap={profileSnap} authSnap={authSnap} vaultSnap={vaultSnap} uiActions={uiActions} profileActions={profileActions} vaultActions={vaultActions} handleLogout={handleLogout} />;
    }

    return (
        <LoginScreen
            profiles={profileSnap.profiles as any}
            activeProfile={activeProfile}
            activeProfileId={profileSnap.activeProfileId}
            setActiveProfileId={profileActions.setActiveProfile}
            vaultUrl={authSnap.vaultUrl}
            setVaultUrl={authActions.setVaultUrl}
            token={authSnap.token}
            setToken={authActions.setToken}
            isLoggingIn={authSnap.isLoggingIn}
            error={authSnap.error}
            onLogin={handleLogin}
            onOidcLogin={handleOidcLogin}
            onSaveProfile={profileActions.addProfile}
            isLoginAddProfileOpen={uiSnap.isLoginAddProfileOpen}
            setIsLoginAddProfileOpen={uiActions.setLoginAddProfileOpen}
        />
    );
}

export default App;
