"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

function VerifyStatusContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");

  const isSuccess = state === "success";

  return (
    <Card className="w-full max-w-sm border-border bg-card shadow-xl overflow-hidden text-center">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSuccess ? "Email Verified!" : "Verification Failed"}
        </CardTitle>
        <CardDescription>
          {isSuccess
            ? "Your account is ready to use."
            : "This link has expired or is invalid."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {isSuccess
            ? "Thank you for verifying your email address. You can now sign in to access your workspace."
            : "If you just registered, you can request a new verification email from the login page."}
        </p>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        {isSuccess ? (
          <Button className="w-full" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyStatusPage() {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />}>
      <VerifyStatusContent />
    </Suspense>
  );
}
