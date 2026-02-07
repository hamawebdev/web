"use client";

/**
 * @author: @kokonutui
 * @description: AI Prompt Input
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */
import { ArrowRight, Bot, Check, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";
import type { AIModel } from "@/types/ai-chat-types";
interface AIPromptProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export default function AI_Prompt({
  value,
  onValueChange,
  onSubmit,
  isLoading,
  disabled,
  selectedModel,
  onModelChange,
}: AIPromptProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 72,
    maxHeight: 300,
  });

  const AI_MODELS: AIModel[] = ["chatgpt", "deepseek"];

  const MODEL_ICONS: Record<AIModel, React.ReactNode> = {
    chatgpt: (
      <div className="w-4 h-4 flex items-center justify-center">
        🤖
      </div>
    ),
    deepseek: (
      <div className="w-4 h-4 flex items-center justify-center">
        🧠
      </div>
    ),
  };

  const MODEL_NAMES: Record<AIModel, string> = {
    chatgpt: "ChatGPT",
    deepseek: "DeepSeek",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      adjustHeight(true);
    }
  };

  return (
    <div className="w-full py-0">
      <div className="rounded-2xl bg-black/5 p-1 pt-2 dark:bg-white/5 border border-black/10 dark:border-white/10">
        <div className="mx-2 mb-1.5 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-foreground text-xs tracking-tighter font-medium">
              AI Study Assistant
            </h3>
          </div>
          <p className="text-muted-foreground text-[10px] tracking-tighter">
            Powered by DeepSeek & ChatGPT
          </p>
        </div>
        <div className="relative">
          <div className="relative flex flex-col">
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              <Textarea
                className={cn(
                  "w-full resize-none rounded-xl rounded-b-none border-none bg-black/5 px-4 py-3 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-white/5 dark:text-foreground",
                  "min-h-[72px]"
                )}
                id="ai-input-15"
                onChange={(e) => {
                  onValueChange(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder={"Ask about this question..."}
                ref={textareaRef}
                value={value}
                disabled={disabled || isLoading}
              />
            </div>

            <div className="flex h-14 items-center rounded-b-xl bg-black/5 dark:bg-white/5">
              <div className="absolute right-3 bottom-3 left-3 flex w-[calc(100%-24px)] items-center justify-between">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="flex h-8 items-center gap-1 rounded-md pr-2 pl-1 text-xs text-foreground hover:bg-black/10 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-0 dark:hover:bg-white/10"
                        variant="ghost"
                        disabled={disabled || isLoading}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            className="flex items-center gap-1"
                            exit={{
                              opacity: 0,
                              y: 5,
                            }}
                            initial={{
                              opacity: 0,
                              y: -5,
                            }}
                            key={selectedModel}
                            transition={{
                              duration: 0.15,
                            }}
                          >
                            {MODEL_ICONS[selectedModel]}
                            {MODEL_NAMES[selectedModel]}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </motion.div>
                        </AnimatePresence>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={cn(
                        "min-w-[10rem]",
                        "border-border bg-popover text-popover-foreground shadow-lg"
                      )}
                      align="start"
                    >
                      {AI_MODELS.map((model) => (
                        <DropdownMenuItem
                          className="flex items-center justify-between gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground"
                          key={model}
                          onSelect={() => onModelChange(model)}
                        >
                          <div className="flex items-center gap-2">
                            {MODEL_ICONS[model]}
                            <span className="font-medium">{MODEL_NAMES[model]}</span>
                          </div>
                          {selectedModel === model && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/10" />
                </div>
                <button
                  aria-label="Send message"
                  className={cn(
                    "rounded-lg bg-primary/10 p-2",
                    "hover:bg-primary/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0",
                    "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  )}
                  disabled={!value.trim() || isLoading || disabled}
                  onClick={onSubmit}
                  type="button"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 transition-opacity duration-200 text-primary",
                        value.trim() ? "opacity-100" : "opacity-30"
                      )}
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

