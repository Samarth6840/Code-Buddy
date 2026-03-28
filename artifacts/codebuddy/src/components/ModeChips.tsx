import React from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Baby, Bug, GraduationCap, Sparkles, TestTube2, Rocket } from "lucide-react";
import { AnalyzeRequestModesItem } from "@workspace/api-client-react";

interface ModeChipsProps {
  selected: string[];
  onChange: (modes: string[]) => void;
}

const MODES = [
  { id: AnalyzeRequestModesItem.explain, label: "Explain", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: AnalyzeRequestModesItem.eli5, label: "ELI5", icon: Baby, color: "text-pink-500", bg: "bg-pink-500/10" },
  { id: AnalyzeRequestModesItem.debug, label: "Debug", icon: Bug, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: AnalyzeRequestModesItem.teach, label: "Teach", icon: GraduationCap, color: "text-green-500", bg: "bg-green-500/10" },
  { id: AnalyzeRequestModesItem.refactor, label: "Refactor", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: AnalyzeRequestModesItem.tests, label: "Tests", icon: TestTube2, color: "text-teal-500", bg: "bg-teal-500/10" },
  { id: AnalyzeRequestModesItem.full, label: "Full Analysis", icon: Rocket, color: "text-primary", bg: "bg-primary/10" },
];

export function ModeChips({ selected, onChange }: ModeChipsProps) {
  const toggle = (id: string) => {
    if (id === AnalyzeRequestModesItem.full) {
      // If clicking full, deselect others or toggle it
      if (selected.includes(id)) {
        onChange([AnalyzeRequestModesItem.explain]); // fallback
      } else {
        onChange([id]);
      }
      return;
    }

    let next = [...selected];
    
    // Remove "full" if selecting individual modes
    next = next.filter(m => m !== AnalyzeRequestModesItem.full);
    
    if (next.includes(id)) {
      next = next.filter(m => m !== id);
      // Ensure at least one is selected
      if (next.length === 0) next = [AnalyzeRequestModesItem.explain];
    } else {
      next.push(id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((mode) => {
        const isSelected = selected.includes(mode.id);
        const Icon = mode.icon;
        
        return (
          <button
            key={mode.id}
            onClick={() => toggle(mode.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              "border hover:-translate-y-0.5 active:translate-y-0",
              isSelected 
                ? `${mode.bg} border-transparent ${mode.color} shadow-sm` 
                : "bg-background border-border text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
