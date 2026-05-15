"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FolderKanban,
    Loader2,
    LogOut,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    UserCog,
    Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logoutUser } from "@/services/authService";
import {
    deleteAdminProject,
    fetchAdminProjects,
    fetchAdminStats,
    fetchAdminUsers,
    updateAdminUser,
    type AdminProject,
    type AdminRole,
    type AdminStats,
    type AdminUser,
} from "@/services/adminService";
import { useAuthStore } from "@/store/authStore";

type AdminTab = "users" | "projects";

const emptyStats: AdminStats = {
    totalUsers: 0,
    enabledUsers: 0,
    disabledUsers: 0,
    adminUsers: 0,
    totalProjects: 0,
    activeSandboxes: 0,
};

export default function AdminPage() {
    const router = useRouter();
    const currentUser = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [stats, setStats] = useState<AdminStats>(emptyStats);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [projects, setProjects] = useState<AdminProject[]>([]);
    const [tab, setTab] = useState<AdminTab>("users");
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);
    const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

    const loadAdminData = useCallback(async (quiet = false) => {
        if (quiet) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const [nextStats, nextUsers, nextProjects] = await Promise.all([
                fetchAdminStats(),
                fetchAdminUsers(),
                fetchAdminProjects(),
            ]);

            setStats(nextStats);
            setUsers(nextUsers);
            setProjects(nextProjects);
        } catch {
            toast.error("Failed to load admin data");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAdminData();
    }, [loadAdminData]);

    const normalizedSearch = search.trim().toLowerCase();
    const filteredUsers = useMemo(
        () =>
            users.filter((user) =>
                [user.name, user.email, user.role, user.enabled ? "enabled" : "disabled"]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)
            ),
        [users, normalizedSearch]
    );

    const filteredProjects = useMemo(
        () =>
            projects.filter((project) =>
                [project.name, project.description, project.language, project.ownerName, project.ownerEmail]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch)
            ),
        [projects, normalizedSearch]
    );

    async function handleLogout() {
        try {
            await logoutUser();
        } catch {
            // Ignore logout network errors and clear local auth state.
        } finally {
            logout();
            router.replace("/login");
        }
    }

    async function handleRoleChange(user: AdminUser, role: AdminRole) {
        setPendingUserId(user.id);
        try {
            const updated = await updateAdminUser(user.id, { role });
            setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
            setStats((prev) => ({
                ...prev,
                adminUsers: prev.adminUsers + (role === "ADMIN" ? 1 : -1),
            }));
            toast.success("User role updated");
        } catch {
            toast.error("Failed to update user role");
        } finally {
            setPendingUserId(null);
        }
    }

    async function handleEnabledChange(user: AdminUser, enabled: boolean) {
        setPendingUserId(user.id);
        try {
            const updated = await updateAdminUser(user.id, { enabled });
            setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
            setStats((prev) => ({
                ...prev,
                enabledUsers: prev.enabledUsers + (enabled ? 1 : -1),
                disabledUsers: prev.disabledUsers + (enabled ? -1 : 1),
            }));
            toast.success(enabled ? "User enabled" : "User disabled");
        } catch {
            toast.error("Failed to update user status");
        } finally {
            setPendingUserId(null);
        }
    }

    async function handleDeleteProject(project: AdminProject) {
        const confirmed = window.confirm(`Delete "${project.name}"? This removes the project workspace.`);
        if (!confirmed) return;

        setPendingProjectId(project.id);
        try {
            await deleteAdminProject(project.id);
            setProjects((prev) => prev.filter((item) => item.id !== project.id));
            setStats((prev) => ({
                ...prev,
                totalProjects: Math.max(0, prev.totalProjects - 1),
            }));
            toast.success("Project deleted");
        } catch {
            toast.error("Failed to delete project");
        } finally {
            setPendingProjectId(null);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")} title="Back to dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2.5 font-semibold tracking-tight text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        Velo Admin
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => loadAdminData(true)} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="flex-1 px-6 py-8">
                <div className="mb-6 flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage users, project ownership, and active workspace activity.
                    </p>
                </div>

                <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <Metric icon={Users} label="Users" value={stats.totalUsers} />
                    <Metric icon={UserCheck} label="Enabled" value={stats.enabledUsers} />
                    <Metric icon={UserCog} label="Disabled" value={stats.disabledUsers} />
                    <Metric icon={Shield} label="Admins" value={stats.adminUsers} />
                    <Metric icon={FolderKanban} label="Projects" value={stats.totalProjects} />
                    <Metric icon={RefreshCw} label="Sandboxes" value={stats.activeSandboxes} />
                </section>

                <section className="space-y-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-fit rounded-md border border-border bg-muted/40 p-1">
                            <Button
                                variant={tab === "users" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTab("users")}
                            >
                                <Users className="h-4 w-4" />
                                Users
                            </Button>
                            <Button
                                variant={tab === "projects" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setTab("projects")}
                            >
                                <FolderKanban className="h-4 w-4" />
                                Projects
                            </Button>
                        </div>

                        <div className="relative w-full lg:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={tab === "users" ? "Search users..." : "Search projects..."}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center rounded-lg border border-border py-20">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : tab === "users" ? (
                        <UsersTable
                            users={filteredUsers}
                            currentUserId={currentUser?.id}
                            pendingUserId={pendingUserId}
                            onRoleChange={handleRoleChange}
                            onEnabledChange={handleEnabledChange}
                        />
                    ) : (
                        <ProjectsTable
                            projects={filteredProjects}
                            pendingProjectId={pendingProjectId}
                            onDeleteProject={handleDeleteProject}
                        />
                    )}
                </section>
            </main>
        </div>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{value}</div>
            <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
        </div>
    );
}

function UsersTable({
    users,
    currentUserId,
    pendingUserId,
    onRoleChange,
    onEnabledChange,
}: {
    users: AdminUser[];
    currentUserId?: string;
    pendingUserId: string | null;
    onRoleChange: (user: AdminUser, role: AdminRole) => void;
    onEnabledChange: (user: AdminUser, enabled: boolean) => void;
}) {
    if (users.length === 0) {
        return <EmptyTable label="No users found" />;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">User</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Projects</th>
                            <th className="px-4 py-3 font-medium">Joined</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => {
                            const isSelf = user.id === currentUserId;
                            const isPending = pendingUserId === user.id;

                            return (
                                <tr key={user.id} className="bg-card/40">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={user.enabled ? "outline" : "destructive"}>
                                            {user.enabled ? "Enabled" : "Disabled"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">{user.projectCount}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <select
                                                value={user.role}
                                                disabled={isPending || isSelf}
                                                onChange={(event) => onRoleChange(user, event.target.value as AdminRole)}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Change role"
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                            <Button
                                                variant={user.enabled ? "outline" : "secondary"}
                                                size="sm"
                                                disabled={isPending || isSelf}
                                                onClick={() => onEnabledChange(user, !user.enabled)}
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : user.enabled ? (
                                                    "Disable"
                                                ) : (
                                                    "Enable"
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProjectsTable({
    projects,
    pendingProjectId,
    onDeleteProject,
}: {
    projects: AdminProject[];
    pendingProjectId: string | null;
    onDeleteProject: (project: AdminProject) => void;
}) {
    if (projects.length === 0) {
        return <EmptyTable label="No projects found" />;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Project</th>
                            <th className="px-4 py-3 font-medium">Language</th>
                            <th className="px-4 py-3 font-medium">Owner</th>
                            <th className="px-4 py-3 font-medium">Updated</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {projects.map((project) => {
                            const isPending = pendingProjectId === project.id;

                            return (
                                <tr key={project.id} className="bg-card/40">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{project.name}</div>
                                        <div className="max-w-md truncate text-xs text-muted-foreground">
                                            {project.description}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">{project.language}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{project.ownerName}</div>
                                        <div className="text-xs text-muted-foreground">{project.ownerEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(project.updatedAt)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => onDeleteProject(project)}
                                            >
                                                {isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmptyTable({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 text-sm text-muted-foreground">
            {label}
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
    }).format(new Date(value));
}
