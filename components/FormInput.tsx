import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function FormInput({ label, error, className, ...props }: FormInputProps) {
    return (
        <div className="space-y-2 w-full">
            <Label
                htmlFor={props.id || props.name}
                className={cn(
                    error && "text-destructive",
                    props.required && "after:content-['*'] after:ml-0.5 after:text-destructive"
                )}
            >
                {label}
            </Label>
            <Input
                className={cn(
                    "bg-background/50 border-border focus-visible:ring-primary/50",
                    error && "border-destructive focus-visible:ring-destructive/50",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-xs font-medium text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
