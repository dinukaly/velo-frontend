const COOLDOWN_KEY_PREFIX = "verificationCooldownUntil:";
const PASSWORD_RESET_COOLDOWN_KEY_PREFIX = "passwordResetCooldownUntil:";
const COOLDOWN_MS = 2 * 60 * 1000;

function getStorageKey(email: string) {
    return COOLDOWN_KEY_PREFIX + email.toLowerCase();
}

function getPasswordResetStorageKey(email: string) {
    return PASSWORD_RESET_COOLDOWN_KEY_PREFIX + email.toLowerCase();
}

export function startVerificationCooldown(email: string) {
    if (typeof window === "undefined") {
        return;
    }

    const cooldownUntil = Date.now() + COOLDOWN_MS;
    window.sessionStorage.setItem(getStorageKey(email), cooldownUntil.toString());
}

export function getVerificationCooldownRemaining(email: string) {
    if (typeof window === "undefined") {
        return 0;
    }

    const rawValue = window.sessionStorage.getItem(getStorageKey(email));
    if (!rawValue) {
        return 0;
    }

    const cooldownUntil = Number(rawValue);
    if (!Number.isFinite(cooldownUntil)) {
        window.sessionStorage.removeItem(getStorageKey(email));
        return 0;
    }

    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs <= 0) {
        window.sessionStorage.removeItem(getStorageKey(email));
        return 0;
    }

    return Math.ceil(remainingMs / 1000);
}

export function startPasswordResetCooldown(email: string) {
    if (typeof window === "undefined") {
        return;
    }

    const cooldownUntil = Date.now() + COOLDOWN_MS;
    window.sessionStorage.setItem(getPasswordResetStorageKey(email), cooldownUntil.toString());
}

export function getPasswordResetCooldownRemaining(email: string) {
    if (typeof window === "undefined") {
        return 0;
    }

    const rawValue = window.sessionStorage.getItem(getPasswordResetStorageKey(email));
    if (!rawValue) {
        return 0;
    }

    const cooldownUntil = Number(rawValue);
    if (!Number.isFinite(cooldownUntil)) {
        window.sessionStorage.removeItem(getPasswordResetStorageKey(email));
        return 0;
    }

    const remainingMs = cooldownUntil - Date.now();
    if (remainingMs <= 0) {
        window.sessionStorage.removeItem(getPasswordResetStorageKey(email));
        return 0;
    }

    return Math.ceil(remainingMs / 1000);
}

export function formatCooldown(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes <= 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
