"use client";

import { useEffect, useState } from "react";
import {
    getPasswordResetCooldownRemaining,
    startPasswordResetCooldown,
} from "@/lib/verificationCooldown";

export function usePasswordResetCooldown(email: string | null) {
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (!email) {
            setRemainingSeconds(0);
            return;
        }

        const syncCooldown = () => {
            setRemainingSeconds(getPasswordResetCooldownRemaining(email));
        };

        syncCooldown();
        const intervalId = window.setInterval(syncCooldown, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [email]);

    const beginCooldown = () => {
        if (!email) {
            return;
        }

        startPasswordResetCooldown(email);
        setRemainingSeconds(getPasswordResetCooldownRemaining(email));
    };

    return {
        remainingSeconds,
        canRequestReset: remainingSeconds === 0,
        beginCooldown,
    };
}
