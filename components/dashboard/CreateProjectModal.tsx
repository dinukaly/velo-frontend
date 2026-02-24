"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/FormInput";
import { Label } from "@/components/ui/label";
import type { Project, ProjectLanguage } from "@/types/project";

const LANGUAGES: ProjectLanguage[] = [
    "TypeScript",
    "JavaScript",
    "Python",
    "Go",
    "Rust",
    "Java",
    "C++",
    "Other",
];

interface CreateProjectModalProps {
    onConfirm: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
}

export function CreateProjectModal({ onConfirm }: CreateProjectModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [language, setLanguage] = useState<ProjectLanguage>("TypeScript");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onConfirm({ name: name.trim(), description: description.trim(), language });
        // Reset
        setName("");
        setDescription("");
        setLanguage("TypeScript");
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create new project</DialogTitle>
                    <DialogDescription>
                        Give your project a name and choose a primary language to get started.
                    </DialogDescription>
                </DialogHeader>

                <form id="create-project-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <FormInput
                        label="Project name"
                        id="project-name"
                        type="text"
                        placeholder="my-awesome-project"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            placeholder="A short description of what this project does…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 transition-shadow"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <select
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as ProjectLanguage)}
                            className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 transition-shadow"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                    {lang}
                                </option>
                            ))}
                        </select>
                    </div>
                </form>

                <DialogFooter className="gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="create-project-form">
                        Create Project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
