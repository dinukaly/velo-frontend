"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendVerification } from "@/services/authService";
import { useVerificationCooldown } from "@/hooks/useVerificationCooldown";
import { formatCooldown } from "@/lib/verificationCooldown";
import { toast } from "sonner";
import Link from "next/link";

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { remainingSeconds, canResend, beginCooldown } = useVerificationCooldown(email);

  useEffect(() => {
    setIsMounted(true);
    const storedEmail = sessionStorage.getItem("pendingVerificationEmail");
    if (!storedEmail) {
      router.replace("/register");
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  async function handleResend() {
    if (!email) return;
    if (!canResend) {
      toast.info(`Please wait ${formatCooldown(remainingSeconds)} before requesting another email.`);
      return;
    }

    setIsResending(true);
    try {
      await resendVerification(email);
      beginCooldown();
      toast.success("Verification email resent. Please check your inbox.");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? "Failed to resend email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  }

  // Prevent hydration mismatch by not rendering until client-side mount
  if (!isMounted || !email) return null;

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
          We've sent a verification link to
          <br />
          <span className="font-semibold text-foreground mt-1 inline-block">
            {email}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Click the link in the email to activate your account. 
          If you don't see it, check your spam folder.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleResend}
          disabled={isResending || !canResend}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : !canResend ? (
            `Resend available in ${formatCooldown(remainingSeconds)}`
          ) : (
            "Resend verification email"
          )}
        </Button>
        {!canResend && (
          <p className="text-xs text-muted-foreground">
            To protect your inbox, you can request another email after the cooldown ends.
          </p>
        )}
        <Button variant="link" size="sm" asChild className="w-full text-muted-foreground">
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
