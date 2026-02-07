"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiOption = { value: string; label: string };

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  className,
  disabled = false,
}: {
  options: MultiOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const remove = (v: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(value.filter((x) => x !== v));
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between min-h-[40px] h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {selected.length === 0 && <span className="text-muted-foreground truncate">{placeholder}</span>}
            {selected.slice(0, 2).map((s) => (
              <Badge key={s.value} variant="secondary" className="flex items-center gap-1 pr-1 max-w-[150px]">
                <span className="truncate">{s.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                  onClick={(e) => remove(s.value, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      remove(s.value, e);
                    }
                  }}
                >
                  <X className="h-2 w-2" />
                </span>
              </Badge>
            ))}
            {selected.length > 2 && (
              <Badge variant="outline" className="flex-shrink-0">+{selected.length - 2}</Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] max-w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center gap-2"
                  >
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0", isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background")}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="truncate" title={opt.label}>{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

