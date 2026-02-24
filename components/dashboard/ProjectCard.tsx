import { Clock, Code2, FolderOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LANGUAGE_COLOURS } from "@/lib/mockData";
import type { Project } from "@/types/project";

interface ProjectCardProps {
    project: Project;
    onDelete: (project: Project) => void;
}

function timeAgo(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
    const langColour = LANGUAGE_COLOURS[project.language]; 
    
    return (
        <div className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all duration-200 hover:border-border/80 hover:bg-card/80 hover:shadow-lg hover:shadow-black/20">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 text-primary">
                        <Code2 className="h-4 w-4" />
                    </div>
                    <h3 className="truncate font-semibold leading-tight tracking-tight text-foreground">
                        {project.name}
                    </h3>
                </div>
                
                <Badge
                    variant="outline"
                    className={`shrink-0 text-xs font-medium ${langColour}`}
                >
                    {project.language}
                </Badge>
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {project.description}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo(project.updatedAt)} 
                </span>
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(project)} 
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 gap-1.5 px-3 text-xs"
                    >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Open
                    </Button>
                </div>
            </div>
        </div>
    );
}