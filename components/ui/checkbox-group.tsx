"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface CheckboxGroupOption {
    value: number
    label: string
}

interface CheckboxGroupProps {
    options: CheckboxGroupOption[]
    selected: number[]
    onChange: (selected: number[]) => void
    className?: string
    disabled?: boolean
    columns?: 1 | 2 | 3
    maxHeight?: string
}

export function CheckboxGroup({
    options,
    selected,
    onChange,
    className,
    disabled = false,
    columns = 2,
    maxHeight = "200px",
}: CheckboxGroupProps) {
    const handleToggle = (value: number) => {
        if (selected.includes(value)) {
            onChange(selected.filter((item) => item !== value))
        } else {
            onChange([...selected, value])
        }
    }

    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    }

    return (
        <div
            className={cn(
                "border rounded-md p-3 overflow-y-auto",
                className
            )}
            style={{ maxHeight }}
        >
            <div className={cn("grid gap-3", gridCols[columns])}>
                {options.map((option) => (
                    <div
                        key={String(option.value)}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                        <Checkbox
                            id={`checkbox-${option.value}`}
                            checked={selected.includes(option.value)}
                            onCheckedChange={() => handleToggle(option.value)}
                            disabled={disabled}
                        />
                        <Label
                            htmlFor={`checkbox-${option.value}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                        >
                            {option.label}
                        </Label>
                    </div>
                ))}
            </div>
            {options.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    No hay servicios disponibles
                </p>
            )}
        </div>
    )
}
