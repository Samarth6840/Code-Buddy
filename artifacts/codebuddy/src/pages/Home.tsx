import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Brain,
  UploadCloud,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Paperclip,
} from "lucide-react";
import { CodeInput } from "@/components/CodeInput";
import { ModeChips } from "@/components/ModeChips";
import { ResultSection } from "@/components/ResultSection";
import { UrlLoader } from "@/components/UrlLoader";
import { useAnalyze } from "@/hooks/use-analyze";
import { AnalyzeRequestModesItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const FOLLOW_UP_PROMPTS = [
  "Show me a real-world example",
  "Explain like I'm 5",
  "Where could bugs hide?",
  "How do I test this?",
  "Make this faster",
];

const EXT_TO_LANG: Record<string, string> = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
  c: "c", cpp: "cpp", cs: "csharp", php: "php", swift: "swift",
  kt: "kotlin", sh: "bash", sql: "sql", html: "html", css: "css",
  yaml: "yaml", yml: "yaml", json: "json",
};

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorInput, setShowErrorInput] = useState(false);
  const [modes, setModes] = useState<string[]>([AnalyzeRequestModesItem.explain]);
  const [userLevel, setUserLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { status, sections, error, processingTimeMs, confidence, detectedLanguage, analyze, reset } = useAnalyze();

  // When analysis completes with a detected language, update the badge
  useEffect(() => {
    if (detectedLanguage && detectedLanguage !== "unknown" && !language) {
      setLanguage(detectedLanguage);
    }
  }, [detectedLanguage]);

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) return;
    analyze({
      code,
      language: language || undefined,
      modes,
      errorMessage: errorMessage || undefined,
      userLevel,
    });
  }, [code, language, modes, errorMessage, userLevel, analyze]);

  const handleFollowUp = (prompt: string) => {
    setErrorMessage(prompt);
    setShowErrorInput(false);
    analyze({
      code,
      language: language || undefined,
      modes,
      errorMessage: prompt,
      userLevel,
    });
  };

  // Keyboard shortcut Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze]);

  // File drop & upload handler
  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;
      setCode(content);
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (ext && EXT_TO_LANG[ext]) setLanguage(EXT_TO_LANG[ext]);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const displayLanguage = language || (detectedLanguage && detectedLanguage !== "unknown" ? detectedLanguage : "");

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Left Panel: Input */}
      <div
        className="w-full md:w-1/2 flex flex-col h-screen border-r border-border bg-card/30 relative z-10"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-4 border-dashed border-primary/50 m-4 rounded-3xl"
            >
              <UploadCloud className="w-16 h-16 text-primary mb-4 animate-bounce" />
              <h2 className="text-2xl font-display font-bold text-primary">Drop file to load code</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.cs,.php,.swift,.kt,.sh,.sql,.html,.css,.yaml,.yml,.json,.txt,.md"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6">
          {/* Header */}
          <header className="mb-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">CodeBuddy</h1>
            </div>
            <p className="text-muted-foreground font-medium ml-13">Explain My Code Like I'm 5.</p>
          </header>

          {/* URL Loader */}
          <UrlLoader
            onLoaded={(c, l) => {
              setCode(c);
              if (l) setLanguage(l);
            }}
          />

          {/* Code Input */}
          <div className="flex-1 flex flex-col relative min-h-[280px]">
            <CodeInput
              value={code}
              onChange={setCode}
              language={displayLanguage}
            />
            {/* File upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground bg-background/80 border border-border/50 hover:border-primary/40 hover:text-primary transition-all backdrop-blur-sm shadow-sm"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Upload file
            </button>
          </div>

          {/* Error message toggle */}
          <AnimatePresence>
            {showErrorInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <textarea
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  placeholder="Paste terminal error, stack trace, or additional context here..."
                  className="w-full h-24 p-4 text-sm bg-destructive/5 border-2 border-destructive/20 rounded-xl focus:outline-none focus:border-destructive text-foreground placeholder:text-destructive/50 resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!showErrorInput && (
            <button
              onClick={() => setShowErrorInput(true)}
              className="text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-orange-500 self-start transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              Add context or error message
            </button>
          )}

          {/* Mode chips + User Level + Analyze Button */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Analysis Modes</label>
              <ModeChips selected={modes} onChange={setModes} />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
              <div className="bg-muted p-1 rounded-xl inline-flex">
                {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setUserLevel(lvl)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                      userLevel === lvl
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!code.trim() || status === "loading" || status === "streaming"}
                className="flex-1 md:flex-none relative overflow-hidden group px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-accent shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_25px_-4px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center justify-center gap-2">
                  {status === "loading" || status === "streaming" ? (
                    <>
                      Analyzing…{" "}
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </>
                  ) : (
                    <>
                      Analyze Code{" "}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Keyboard shortcut hint */}
            <p className="text-xs text-muted-foreground/60 text-right">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs border border-border/50">⌘</kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs border border-border/50">↵</kbd> to analyze
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Results */}
      <div className="w-full md:w-1/2 h-screen overflow-y-auto bg-gradient-to-b from-background to-muted/20 relative">
        {/* Idle state */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <img
              src={`${import.meta.env.BASE_URL}images/mascot-empty.png`}
              alt="CodeBuddy Mascot"
              className="w-48 h-48 object-contain mb-8 drop-shadow-2xl"
            />
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">
              Ready to demystify some code!
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              Paste a snippet, drop a file, or load a URL on the left. I'll break it down so simply, even your rubber duck will understand.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {status === "loading" && sections.length === 0 && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-2xl font-display font-bold">Reading your code…</h2>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border shadow-sm animate-pulse">
                <div className="w-1/3 h-6 bg-muted rounded-md mb-4" />
                <div className="space-y-3">
                  <div className="w-full h-4 bg-muted/50 rounded-md" />
                  <div className="w-5/6 h-4 bg-muted/50 rounded-md" />
                  <div className="w-4/6 h-4 bg-muted/50 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {(status === "streaming" || status === "complete" || status === "error" || sections.length > 0) && (
          <div className="p-6 lg:p-10 space-y-6 max-w-3xl mx-auto">
            {sections.map((section) => (
              <ResultSection key={section.id} section={section} />
            ))}

            {status === "error" && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl flex gap-4">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-1">Analysis Halted</h3>
                  <p className="opacity-90">{error}</p>
                  <button
                    onClick={handleAnalyze}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                  </button>
                </div>
              </div>
            )}

            {status === "complete" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-8 flex flex-col items-center border-t border-border/50 mt-8 gap-6"
              >
                {/* Stats row */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                  {confidence && confidence.toLowerCase() === "high" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 font-medium border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" /> High Confidence
                    </span>
                  )}
                  {confidence && confidence.toLowerCase() === "medium" && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium border border-yellow-500/20">
                      Medium Confidence
                    </span>
                  )}
                  {displayLanguage && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20 font-mono text-xs uppercase tracking-wide">
                      {displayLanguage}
                    </span>
                  )}
                  {processingTimeMs && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {(processingTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Follow-up chips */}
                <div className="text-center">
                  <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Explore Further
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {FOLLOW_UP_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleFollowUp(prompt)}
                        className="px-4 py-2 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-medium text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Re-analyze button */}
                <button
                  onClick={reset}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Analyze a different snippet
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
