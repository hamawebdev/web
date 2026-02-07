"use client";

import * as React from "react";
import { Search, X, Check, ChevronsUpDown, CheckSquare, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/animate-ui/components/radix/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/animate-ui/components/radix/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

// Types
export type Option = {
  value: string;
  label: string;
  description?: string;
};

type BaseDialogSelectorProps = {
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  error?: string;
};

// Single Select Dialog
export type SingleSelectDialogProps = BaseDialogSelectorProps & {
  value: string;
  onChange: (value: string) => void;
};

export function SingleSelectDialog({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  className,
  error,
}: SingleSelectDialogProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {loading ? "Loading..." : selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Select Option</DialogTitle>
          <DialogDescription>
            Choose one option from the list below
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
            {options.length === 0 ? (
              <EmptyState
                title="No options available"
                description="There are no items to select at this time."
              />
            ) : (
              options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    value === option.value && "bg-accent text-accent-foreground"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border flex-shrink-0",
                      value === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    )}
                  >
                    {value === option.value && <Check className="h-3 w-3" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-medium">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-muted-foreground truncate">
                        {option.description}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>
        <DialogFooter className="flex-shrink-0">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sheet-based Single Select for Units
export type UnitSelectSheetProps = BaseDialogSelectorProps & {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
};

export function UnitSelectSheet({
  options,
  value,
  onChange,
  placeholder = "Select unit",
  title = "Select Unit",
  description = "Choose a unit for your practice session",
  searchPlaceholder = "Search units...",
  emptySearchMessage = "No units found",
  disabled = false,
  loading = false,
  className,
  error,
}: UnitSelectSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Focus search input when sheet opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {loading ? "Loading..." : selectedOption?.label || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Options List */}
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
              {filteredOptions.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={searchQuery ? emptySearchMessage : "No units available"}
                  description={
                    searchQuery
                      ? "Try adjusting your search terms"
                      : "There are no units to select at this time."
                  }
                />
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border flex-shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-medium">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <SheetFooter className="flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Sheet-based Multi Select for Modules
export type ModuleSelectSheetProps = BaseDialogSelectorProps & {
  value: string[];
  onChange: (values: string[]) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
  showSelectAll?: boolean;
};

export function ModuleSelectSheet({
  options,
  value,
  onChange,
  placeholder = "Select modules",
  title = "Select Modules",
  description = "Choose modules to include in your practice session",
  searchPlaceholder = "Search modules...",
  emptySearchMessage = "No modules found",
  disabled = false,
  loading = false,
  className,
  error,
  showSelectAll = true,
}: ModuleSelectSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const areAllSelected = value.length === options.length && options.length > 0;

  const removeOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // Focus search input when sheet opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((s) => (
                  <Badge
                    key={s.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 max-w-[150px]"
                  >
                    <span className="truncate">{s.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                      onClick={(e) => removeOption(s.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeOption(s.value);
                        }
                      }}
                    >
                      <X className="h-2 w-2" />
                    </span>
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="outline" className="flex-shrink-0">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Select All / Deselect All */}
        {showSelectAll && options.length > 0 && (
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {value.length} of {options.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={areAllSelected ? deselectAll : selectAll}
              className="h-7 text-xs gap-1"
            >
              {areAllSelected ? (
                <>
                  <Square className="h-3 w-3" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Options List */}
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
              {filteredOptions.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={searchQuery ? emptySearchMessage : "No modules available"}
                  description={
                    searchQuery
                      ? "Try adjusting your search terms"
                      : "There are no modules to select at this time."
                  }
                />
              ) : (
                <AnimatePresence>
                  {filteredOptions.map((option, index) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => toggleOption(option.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                          isSelected && "bg-accent/50"
                        )}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1, delay: index * 0.02 }}
                        layout
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "block truncate",
                              isSelected && "font-medium"
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <SheetFooter className="flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Sheet-based Multi Select for Courses
export type CourseSelectSheetProps = BaseDialogSelectorProps & {
  value: string[];
  onChange: (values: string[]) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
  showSelectAll?: boolean;
};

export function CourseSelectSheet({
  options,
  value,
  onChange,
  placeholder = "Select courses",
  title = "Select Courses",
  description = "Choose courses to include in your practice session",
  searchPlaceholder = "Search courses...",
  emptySearchMessage = "No courses found",
  disabled = false,
  loading = false,
  className,
  error,
  showSelectAll = true,
}: CourseSelectSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const areAllSelected = value.length === options.length && options.length > 0;

  const removeOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // Focus search input when sheet opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((s) => (
                  <Badge
                    key={s.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 max-w-[150px]"
                  >
                    <span className="truncate">{s.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                      onClick={(e) => removeOption(s.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeOption(s.value);
                        }
                      }}
                    >
                      <X className="h-2 w-2" />
                    </span>
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="outline" className="flex-shrink-0">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[450px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Select All / Deselect All */}
        {showSelectAll && options.length > 0 && (
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {value.length} of {options.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={areAllSelected ? deselectAll : selectAll}
              className="h-7 text-xs gap-1"
            >
              {areAllSelected ? (
                <>
                  <Square className="h-3 w-3" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Options List */}
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
              {filteredOptions.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={searchQuery ? emptySearchMessage : "No courses available"}
                  description={
                    searchQuery
                      ? "Try adjusting your search terms"
                      : "There are no courses to select at this time."
                  }
                />
              ) : (
                <AnimatePresence>
                  {filteredOptions.map((option, index) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => toggleOption(option.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                          isSelected && "bg-accent/50"
                        )}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1, delay: index * 0.02 }}
                        layout
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-input"
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "block truncate",
                              isSelected && "font-medium"
                            )}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="block text-xs text-muted-foreground truncate">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <SheetFooter className="flex-shrink-0">
          <SheetClose asChild>
            <Button variant="outline">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Multi Select Dialog with Search
export type MultiSelectDialogProps = BaseDialogSelectorProps & {
  value: string[];
  onChange: (values: string[]) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  emptySearchMessage?: string;
  showSelectAll?: boolean;
  maxHeight?: string;
};

export function MultiSelectDialog({
  options,
  value,
  onChange,
  placeholder = "Select options",
  title = "Select Options",
  description = "Choose one or more options from the list",
  searchPlaceholder = "Search...",
  emptySearchMessage = "No results found",
  disabled = false,
  loading = false,
  className,
  error,
  showSelectAll = true,
  maxHeight = "50vh",
}: MultiSelectDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const areAllSelected = value.length === options.length && options.length > 0;

  const removeOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  // Focus search input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((s) => (
                  <Badge
                    key={s.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 max-w-[150px]"
                  >
                    <span className="truncate">{s.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                      onClick={(e) => removeOption(s.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeOption(s.value);
                        }
                      }}
                    >
                      <X className="h-2 w-2" />
                    </span>
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="outline" className="flex-shrink-0">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Select All / Deselect All */}
        {showSelectAll && options.length > 0 && (
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {value.length} of {options.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={areAllSelected ? deselectAll : selectAll}
              className="h-7 text-xs gap-1"
            >
              {areAllSelected ? (
                <>
                  <Square className="h-3 w-3" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Options List */}
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
            {filteredOptions.length === 0 ? (
              <EmptyState
                icon={Search}
                title={searchQuery ? emptySearchMessage : "No options available"}
                description={
                  searchQuery
                    ? "Try adjusting your search terms"
                    : "There are no items to select at this time."
                }
              />
            ) : (
              <AnimatePresence>
                {filteredOptions.map((option, index) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                        isSelected && "bg-accent/50"
                      )}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.1, delay: index * 0.02 }}
                      layout
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "block truncate",
                            isSelected && "font-medium"
                          )}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <DialogFooter className="flex-shrink-0">
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple Multi Select Dialog (without search - for smaller lists)
export function SimpleMultiSelectDialog({
  options,
  value,
  onChange,
  placeholder = "Select options",
  title = "Select Options",
  description = "Choose one or more options",
  disabled = false,
  loading = false,
  className,
  error,
  showSelectAll = true,
}: Omit<MultiSelectDialogProps, "searchPlaceholder" | "emptySearchMessage" | "maxHeight">) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = React.useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const areAllSelected = value.length === options.length && options.length > 0;

  const removeOption = (optionValue: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <Dialog open={open} onOpenChange={disabled ? undefined : setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            error && "border-destructive focus:border-destructive",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 min-w-0">
            {loading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : selectedOptions.length === 0 ? (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((s) => (
                  <Badge
                    key={s.value}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1 max-w-[150px]"
                  >
                    <span className="truncate">{s.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center flex-shrink-0 cursor-pointer"
                      onClick={(e) => removeOption(s.value, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          removeOption(s.value);
                        }
                      }}
                    >
                      <X className="h-2 w-2" />
                    </span>
                  </Badge>
                ))}
                {selectedOptions.length > 2 && (
                  <Badge variant="outline" className="flex-shrink-0">
                    +{selectedOptions.length - 2}
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Select All / Deselect All */}
        {showSelectAll && options.length > 0 && (
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {value.length} of {options.length} selected
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={areAllSelected ? deselectAll : selectAll}
              className="h-7 text-xs gap-1"
            >
              {areAllSelected ? (
                <>
                  <Square className="h-3 w-3" />
                  Deselect All
                </>
              ) : (
                <>
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}

        {/* Options List */}
        <div className="relative flex-1 min-h-0 my-2">
          <ScrollArea className="h-full pr-3">
            <div className="space-y-1 py-2 pr-1">
            {options.length === 0 ? (
              <EmptyState
                title="No options available"
                description="There are no items to select at this time."
              />
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      isSelected && "bg-accent/50"
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-input"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "block truncate",
                          isSelected && "font-medium"
                        )}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block text-xs text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
          </ScrollArea>
          {/* Top fade gradient */}
          <div className="pointer-events-none absolute top-0 left-0 right-3 h-4 bg-gradient-to-b from-background to-transparent z-10" />
          {/* Bottom fade gradient */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-3 h-4 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <DialogFooter className="flex-shrink-0">
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
