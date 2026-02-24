/**
 * ProtectedLayout
 *
 * Wraps all routes that require authentication.
 * Auth guard logic will be added in a future.
 * For now this is a structural wrapper only.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            {children}
        </div>
    );
}
