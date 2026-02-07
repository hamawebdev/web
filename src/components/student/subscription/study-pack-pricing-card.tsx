"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { StudyPack } from "@/types/api";

const TRANSITION = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

interface StudyPackPricingCardProps {
  pack: StudyPack;
  billingCycle: "monthly" | "yearly";
  isSelected: boolean;
  isDisabled: boolean;
  isGrace: boolean;
  ctaLabel: string;
  ctaVariant: "default" | "outline";
  onSelect: () => void;
  onCtaClick: () => void;
}

export function StudyPackPricingCard({
  pack,
  billingCycle,
  isSelected,
  isDisabled,
  isGrace,
  ctaLabel,
  ctaVariant,
  onSelect,
  onCtaClick,
}: StudyPackPricingCardProps) {
  const isResidency = pack.type === "RESIDENCY";
  const price = billingCycle === "monthly" ? pack.pricePerMonth : pack.pricePerYear;



  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer ${isDisabled && !isGrace ? "opacity-60" : ""}`}
    >
      <div
        className={`relative rounded-xl bg-card border border-foreground/10 transition-colors duration-300 ${
          isSelected ? "z-10 border-primary border-2" : ""
        }`}
      >
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="mt-1 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/15"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="w-4 h-4 rounded-full bg-primary"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          duration: 0.2,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground leading-tight">
                  {pack.name}
                </h3>
               
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-medium text-foreground">
                <NumberFlow
                  value={price}
                  format={{ style: "currency", currency: "DZD" }}
                />
              </div>
              <div className="text-xs text-muted-foreground/60 flex items-center justify-end gap-1">
                {billingCycle === "monthly" ? "Month" : "Year"}
              </div>
            </div>
          </div>

          {/* Grace period badge */}
          {isGrace && (
            <div className="mt-3">
              <Badge variant="outline" className="text-amber-500 border-amber-500/40">
                <Clock className="h-3 w-3 mr-1" /> Renew available 3 days
              </Badge>
            </div>
          )}

          <AnimatePresence initial={false}>
            {isSelected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="overflow-hidden w-full"
              >
                <div className="pt-6">
                  <Button
                    className="w-full"
                    variant={ctaVariant}
                    disabled={isDisabled && !isGrace}
                    title={isDisabled && !isGrace ? "You already have an active subscription" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCtaClick();
                    }}
                  >
                    {ctaLabel}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default StudyPackPricingCard;
