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

export default function RegisterPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        // Mocked: simulates account creation then auto-logs-in the user
        setTimeout(() => {
            login("mock-jwt-token-register");
            router.push("/dashboard");
        }, 1000);
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
                    Create an account
                </CardTitle>
                <CardDescription>
                    Join our community of developers and start building
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <FormInput
                        label="Full Name"
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                    />
                    <FormInput
                        label="Email"
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                    />
                    <FormInput
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account…
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button
                            variant="link"
                            size="sm"
                            type="button"
                            className="px-0 h-auto font-semibold"
                            asChild
                        >
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}
