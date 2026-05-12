"use client";

import { useEffect, useState } from "react";
import {
    getVerificationCooldownRemaining,
    startVerificationCooldown,
} from "@/lib/verificationCooldown";

export function useVerificationCooldown(email: string | null) {
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    useEffect(() => {
        if (!email) {
            setRemainingSeconds(0);
            return;
        }

        const syncCooldown = () => {
            setRemainingSeconds(getVerificationCooldownRemaining(email));
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

        startVerificationCooldown(email);
        setRemainingSeconds(getVerificationCooldownRemaining(email));
    };

    return {
        remainingSeconds,
        canResend: remainingSeconds === 0,
        beginCooldown,
    };
}
