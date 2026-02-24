import { AuthGuard } from "@/components/AuthGuard";

/**
 * ProtectedLayout
 *
 * Wraps all routes that require authentication.
 * now AuthGuard handles redirection for unauthenticated users.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
        <div className="flex min-h-screen flex-col bg-background">
            {children}
        </div>
        </AuthGuard>
    );
}
