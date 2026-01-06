import {FormEvent, useState} from "react";
import {Loader2, Play, Settings2} from "lucide-react";
import {formatCamelCase} from "@/lib/utils/formating";
import {Label} from "@/lib/client/components/ui/label";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {InputSchema, TaskItem} from "@/routes/_admin/admin/admin-tasks";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/lib/client/components/ui/dialog";


interface TaskFormDialogProps {
    task: TaskItem;
    isRunning: boolean;
    onSubmit: (input: Record<string, any>) => void;
}


export function TaskFormDialog({ task, isRunning, onSubmit }: TaskFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>(() => getDefaultValues(task.inputSchema));

    const handleSubmit = (ev: FormEvent) => {
        ev.preventDefault();
        onSubmit(formData);
        setOpen(false);
    };

    const updateField = (key: string, value: unknown) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setFormData(getDefaultValues(task.inputSchema));
        }
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" disabled={isRunning}>
                    {isRunning ? <Loader2 className="size-4 animate-spin"/> : <Settings2 className="size-4"/>}
                    {isRunning ? "Running" : "Configure"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{formatCamelCase(task.name)}</DialogTitle>
                        <DialogDescription>{task.description}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {Object.entries(task.inputSchema.properties).map(([key, schema]) =>
                            <TaskFormField
                                key={key}
                                name={key}
                                fieldSchema={schema}
                                value={formData[key]}
                                required={task.inputSchema.required?.includes(key)}
                                onChange={(value) => updateField(key, value)}
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isRunning}>
                            {isRunning ? <Loader2 className="size-4 animate-spin"/> : <Play className="size-4"/>}
                            Run Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


interface TaskFormFieldProps {
    name: string;
    value: unknown;
    required: boolean;
    onChange: (value: unknown) => void;
    fieldSchema: InputSchema["properties"][string];
}


function TaskFormField({ name, fieldSchema, value, required, onChange }: TaskFormFieldProps) {
    const label = formatCamelCase(name);

    if (fieldSchema.enum && fieldSchema.enum.length > 0) {
        return (
            <div className="grid gap-2">
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {fieldSchema.description &&
                    <p className="text-muted-foreground text-xs">
                        {fieldSchema.description}
                    </p>
                }
                <Select value={String(value ?? "")} onValueChange={(v) => onChange(v)}>
                    <SelectTrigger id={name}>
                        <SelectValue placeholder={`Select ${label.toLowerCase()}`}/>
                    </SelectTrigger>
                    <SelectContent>
                        {fieldSchema.enum.map((option) =>
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    if (fieldSchema.type === "boolean") {
        return (
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={name}
                    checked={Boolean(value)}
                    onCheckedChange={(checked) => onChange(checked)}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={name} className="cursor-pointer">
                        {label}
                    </Label>
                    {fieldSchema.description &&
                        <p className="text-muted-foreground text-xs">
                            {fieldSchema.description}
                        </p>
                    }
                </div>
            </div>
        );
    }

    if (fieldSchema.type === "number" || fieldSchema.type === "integer") {
        return (
            <div className="grid gap-2">
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {fieldSchema.description &&
                    <p className="text-muted-foreground text-xs">{fieldSchema.description}</p>
                }
                <Input
                    id={name}
                    type="number"
                    required={required}
                    value={value === undefined ? "" : String(value)}
                    onChange={(ev) => {
                        const val = ev.target.value;
                        onChange(val === "" ? undefined : Number(val));
                    }}
                />
            </div>
        );
    }

    if (fieldSchema.type === "array") {
        const arrayValue = Array.isArray(value) ? value : [];
        return (
            <div className="grid gap-2">
                <Label htmlFor={name}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {fieldSchema.description &&
                    <p className="text-muted-foreground text-xs">{fieldSchema.description}</p>
                }
                <Input
                    id={name}
                    type="text"
                    placeholder="Comma-separated values"
                    value={arrayValue.join(", ")}
                    onChange={(ev) => {
                        const val = ev.target.value;
                        if (val.trim() === "") {
                            onChange([]);
                        }
                        else {
                            onChange(val.split(",").map((s) => s.trim()));
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {fieldSchema.description &&
                <p className="text-muted-foreground text-xs">
                    {fieldSchema.description}
                </p>
            }
            <Input
                id={name}
                type="text"
                required={required}
                value={String(value ?? "")}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}


function getDefaultValues(schema: InputSchema) {
    const defaults: Record<string, any> = {};

    for (const [key, fieldSchema] of Object.entries(schema.properties)) {
        if (fieldSchema.default !== undefined) {
            defaults[key] = fieldSchema.default;
        }
        else if (fieldSchema.type === "boolean") {
            defaults[key] = false;
        }
        else if (fieldSchema.type === "array") {
            defaults[key] = [];
        }
    }

    return defaults;
}
