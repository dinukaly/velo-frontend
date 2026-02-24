import { AuthGuard } from "@/components/AuthGuard";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
             <div className="flex min-h-screen items-center justify-center bg-background">
            {children}
        </div>
        </AuthGuard>
       
    );
}
