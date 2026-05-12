"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
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
import { requestPasswordReset } from "@/services/authService";
import { usePasswordResetCooldown } from "@/hooks/usePasswordResetCooldown";
import {
  formatCooldown,
  startPasswordResetCooldown,
} from "@/lib/verificationCooldown";
import { toast } from "sonner";

const STORAGE_KEY = "pendingPasswordResetEmail";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { remainingSeconds, canRequestReset, beginCooldown } =
    usePasswordResetCooldown(submittedEmail);

  useEffect(() => {
    const storedEmail = window.sessionStorage.getItem(STORAGE_KEY);
    if (storedEmail) {
      setEmail(storedEmail);
      setSubmittedEmail(storedEmail);
    }
  }, []);

  async function sendResetRequest(targetEmail: string) {
    await requestPasswordReset({ email: targetEmail });
    window.sessionStorage.setItem(STORAGE_KEY, targetEmail);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await sendResetRequest(email);
      startPasswordResetCooldown(email);
      setSubmittedEmail(email);
      toast.success("If an account exists, a reset link is on the way.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        axiosErr?.response?.data?.message ??
        "We could not send the reset email right now. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!submittedEmail) return;
    if (!canRequestReset) {
      toast.info(
        `Please wait ${formatCooldown(remainingSeconds)} before requesting another reset email.`
      );
      return;
    }

    setIsResending(true);
    try {
      await sendResetRequest(submittedEmail);
      beginCooldown();
      toast.success("If an account exists, a fresh reset link is on the way.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(
        axiosErr?.response?.data?.message ??
          "We could not send another reset email right now."
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleUseDifferentEmail() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSubmittedEmail(null);
    setError(null);
  }

  if (submittedEmail) {
    return (
      <Card className="w-full max-w-sm border-border bg-card shadow-xl overflow-hidden text-center">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Mail className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Check your email
          </CardTitle>
          <CardDescription>
            If an account exists for
            <br />
            <span className="font-semibold text-foreground mt-1 inline-block">
              {submittedEmail}
            </span>
            <br />
            we have sent a password reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open the link in that email to choose a new password. If you do not
            see it, check your spam folder.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || !canRequestReset}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : !canRequestReset ? (
              `Resend available in ${formatCooldown(remainingSeconds)}`
            ) : (
              "Resend reset email"
            )}
          </Button>
          <Button
            variant="link"
            size="sm"
            type="button"
            className="w-full text-muted-foreground"
            onClick={handleUseDifferentEmail}
          >
            Use a different email
          </Button>
          <Button variant="link" size="sm" asChild className="w-full text-muted-foreground">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-border bg-card shadow-xl overflow-hidden">
      <CardHeader className="space-y-1 text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Mail className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription>
          Enter the email you use for Velo and we&apos;ll send you a reset link.
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
                Sending reset link...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
          <Button variant="link" size="sm" asChild className="w-full text-muted-foreground">
            <Link href="/login">Back to Login</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
