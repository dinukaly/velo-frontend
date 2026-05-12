"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FormInput } from "@/components/FormInput";
import { useAuthStore } from "@/store/authStore";
import { loginUser, resendVerification } from "@/services/authService";
import { useVerificationCooldown } from "@/hooks/useVerificationCooldown";
import { formatCooldown } from "@/lib/verificationCooldown";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const { remainingSeconds, canResend, beginCooldown } = useVerificationCooldown(unverifiedEmail);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const password = (form.elements.namedItem("password") as HTMLInputElement).value;

        try {
            const user = await loginUser({ email, password });
            login(user);
            toast.success("Welcome back!");
            router.push("/dashboard");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string; data?: { code?: string; email?: string } } } };
            const responseData = axiosErr?.response?.data;
            const errorMsg = responseData?.message ?? "Invalid credentials. Please try again.";
            
            if (responseData?.data?.code === "EMAIL_NOT_VERIFIED" && responseData.data.email) {
                setUnverifiedEmail(responseData.data.email);
                setError(null); // Clear generic error
            } else {
                setUnverifiedEmail(null);
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResend() {
        if (!unverifiedEmail) return;
        if (!canResend) {
            toast.info(`Please wait ${formatCooldown(remainingSeconds)} before requesting another email.`);
            return;
        }

        setIsResending(true);
        try {
            await resendVerification(unverifiedEmail);
            beginCooldown();
            toast.success("Verification email resent. Please check your inbox.");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            toast.error(axiosErr?.response?.data?.message ?? "Failed to resend email. Please try again later.");
        } finally {
            setIsResending(false);
        }
    }

    return (
        <Card className="w-full max-w-sm border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="space-y-1 text-center pb-6">
                <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                        >
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                    Welcome back
                </CardTitle>
                <CardDescription>
                    Enter your credentials to access your workspace
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <FormInput
                        label="Email"
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                    />
                    <div className="space-y-1">
                        <FormInput
                            label="Password"
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                        />
                        <div className="flex justify-end">
                            <Button
                                variant="link"
                                size="sm"
                                type="button"
                                className="px-0 h-auto text-xs text-muted-foreground hover:text-primary"
                                asChild
                            >
                                <Link href="#">Forgot password?</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Unverified Error message */}
                    {unverifiedEmail && (
                        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm">
                            <p className="text-amber-500 mb-2 font-medium">Please verify your email address.</p>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/20"
                                onClick={handleResend}
                                disabled={isResending || !canResend}
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Sending...
                                    </>
                                ) : !canResend ? (
                                    `Resend available in ${formatCooldown(remainingSeconds)}`
                                ) : (
                                    "Resend Verification Email"
                                )}
                            </Button>
                            {!canResend && (
                                <p className="mt-2 text-xs text-amber-500/90">
                                    Please wait {formatCooldown(remainingSeconds)} before requesting another verification email.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Generic Error message */}
                    {error && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {error}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in…
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="px-0 h-auto font-semibold"
                            asChild
                        >
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
