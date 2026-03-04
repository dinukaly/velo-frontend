"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Project } from "@/types/project";

interface DeleteProjectModalProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (projectId: string) => void;
}

export function DeleteProjectModal({
    project,
    open,
    onOpenChange,
    onConfirm,
}: DeleteProjectModalProps) {
    if (!project) return null;

    function handleConfirm() {
        onConfirm(project!.id);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                            <Trash2 className="h-5 w-5" />
                        </div>
                        <DialogTitle>Delete project</DialogTitle>
                    </div>
                    <DialogDescription className="text-left">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                            &ldquo;{project.name}&rdquo;
                        </span>
                        ? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 pt-2">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        type="button"
                        onClick={handleConfirm}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
