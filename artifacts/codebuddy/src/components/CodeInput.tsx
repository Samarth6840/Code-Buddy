import React, { useState, useRef, useEffect } from "react";
import { FileCode2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  placeholder?: string;
}

export function CodeInput({ value, onChange, language, onLanguageChange, placeholder }: CodeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Create an array of line numbers based on line breaks in value
  const lineCount = Math.max(1, value.split("\n").length);
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync scroll between line numbers and textarea
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col w-full h-full min-h-[300px] max-h-[600px] overflow-hidden rounded-2xl border-2 transition-all duration-300",
        isFocused 
          ? "border-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" 
          : "border-border hover:border-border/80 bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card text-xs font-medium text-muted-foreground z-10">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-primary" />
          <span>source_code</span>
        </div>
        
        {language && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">
              {language}
            </span>
          </div>
        )}
      </div>

      <div className="relative flex flex-1 overflow-hidden bg-card/50">
        {/* Line Numbers */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 py-4 flex flex-col text-right pr-3 font-mono text-sm text-muted-foreground/40 bg-muted/20 border-r select-none overflow-hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {lines.map(line => (
            <div key={line} className="h-6 leading-6">{line}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder || "Paste your mysterious code here..."}
          className="flex-1 w-full h-full py-4 pl-16 pr-4 font-mono text-sm leading-6 text-foreground bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/50 whitespace-pre"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
