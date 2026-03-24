/**
 * ProtectedLayout
 *
 * Wraps all routes that require authentication.
 * now AuthContext handles redirection for unauthenticated users globally.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            {children}
        </div>
    );
}
