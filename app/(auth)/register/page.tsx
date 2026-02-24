import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/FormInput";

export const metadata: Metadata = {
    title: "Register — Browser IDE",
    description: "Create your Browser IDE account",
};

export default function RegisterPage() {
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
                        >
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                <CardDescription>
                    Join our community of developers and start building
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormInput
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    required
                />
                <FormInput
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                    required
                />
                <FormInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    required
                />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full">
                    Create Account
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button variant="link" size="sm" className="px-0 h-auto font-semibold" asChild>
                        <Link href="/login">Sign in</Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
