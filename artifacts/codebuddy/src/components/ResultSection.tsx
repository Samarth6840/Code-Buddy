import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Baby,
  Wrench,
  GraduationCap,
  Sparkles,
  FlaskConical,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisSection } from "@/hooks/use-analyze";

function FormattedText({ content }: { content: string }) {
  const formatted = content
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre class="bg-muted/80 border border-border/60 p-4 rounded-xl overflow-x-auto my-3 text-sm font-mono leading-relaxed"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-foreground mt-4 mb-2 text-base">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-foreground mt-4 mb-2 text-lg">$1</h3>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc marker:text-primary/60 mb-1">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)/g, "<ul class=\"my-2 space-y-1\">$1</ul>")
    .replace(/\n\n/g, '</p><p class="mb-3 leading-relaxed">');

  return (
    <div
      className="text-sm md:text-base leading-relaxed text-foreground/90 space-y-2"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-3 leading-relaxed">${formatted}</p>` }}
    />
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    error: {
      label: "Error",
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    warning: {
      label: "Warning",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
    info: {
      label: "Info",
      className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <Info className="w-3 h-3" />,
    },
  };
  const s = map[severity?.toLowerCase()] ?? map.info;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", s.className)}>
      {s.icon} {s.label}
    </span>
  );
}

function TestTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    happy_path: "bg-green-100 text-green-700 border-green-200",
    edge_case: "bg-orange-100 text-orange-700 border-orange-200",
    error_case: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize", map[type] ?? "bg-muted text-muted-foreground border-border")}>
      {type?.replace("_", " ")}
    </span>
  );
}

function IssuesContent({ content }: { content: unknown }) {
  const issues = Array.isArray(content) ? content : [];
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-3 py-3 text-green-600">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">No issues detected! Your code looks clean.</span>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {issues.map((issue: Record<string, unknown>, i: number) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-muted/30 border-b border-border">
            <SeverityBadge severity={String(issue.severity ?? "info")} />
            <span className="font-semibold text-foreground text-sm">{String(issue.title ?? "Issue")}</span>
            {issue.location && <span className="ml-auto text-xs text-muted-foreground font-mono">{String(issue.location)}</span>}
          </div>
          <div className="p-4 space-y-3 text-sm">
            {issue.whatIsWrong && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">What's wrong</div>
                <p className="text-foreground/90">{String(issue.whatIsWrong)}</p>
              </div>
            )}
            {issue.whyItHappens && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Why it happens</div>
                <p className="text-foreground/90">{String(issue.whyItHappens)}</p>
              </div>
            )}
            {issue.howToFix && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">How to fix</div>
                <p className="text-foreground/90">{String(issue.howToFix)}</p>
              </div>
            )}
            {issue.fixedSnippet && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Fixed code</div>
                <pre className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg text-xs font-mono overflow-x-auto text-green-700 dark:text-green-400">
                  {String(issue.fixedSnippet)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BreakdownContent({ content }: { content: unknown }) {
  const items = Array.isArray(content) ? content : [];
  return (
    <div className="space-y-4">
      {items.map((item: Record<string, unknown>, i: number) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-3 bg-muted/30 border-b border-border">
            <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{String(item.lineRange ?? "")}</span>
            <span className="font-semibold text-sm text-foreground">{String(item.label ?? "")}</span>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-foreground/90">{String(item.explanation ?? "")}</p>
            {item.codeSnippet && (
              <pre className="bg-muted/60 border border-border/50 p-3 rounded-lg text-xs font-mono overflow-x-auto mt-2">
                {String(item.codeSnippet)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GlossaryContent({ content }: { content: unknown }) {
  const items = Array.isArray(content) ? content : [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item: Record<string, unknown>, i: number) => (
        <div key={i} className="border border-border rounded-xl p-4 bg-muted/20">
          <div className="font-semibold text-primary text-sm mb-1 font-mono">{String(item.term ?? "")}</div>
          <p className="text-sm text-foreground/80 leading-relaxed">{String(item.definition ?? "")}</p>
        </div>
      ))}
    </div>
  );
}

function LearnMoreContent({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <FormattedText content={String(content ?? "")} />;
  const data = content as Record<string, unknown>;
  const concepts = Array.isArray(data.concepts) ? data.concepts : [];
  const tryNext = Array.isArray(data.tryNext) ? data.tryNext : [];
  const relatedTopics = Array.isArray(data.relatedTopics) ? data.relatedTopics : [];
  return (
    <div className="space-y-5">
      {concepts.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Key Concepts</div>
          <div className="flex flex-wrap gap-2">
            {concepts.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">{String(c)}</span>
            ))}
          </div>
        </div>
      )}
      {tryNext.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Try Next</div>
          <ul className="space-y-2">
            {tryNext.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="text-primary mt-0.5">→</span> {String(t)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {relatedTopics.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Related Topics</div>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((t, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">{String(t)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestsContent({ content }: { content: unknown }) {
  const items = Array.isArray(content) ? content : [];
  return (
    <div className="space-y-4">
      {items.map((test: Record<string, unknown>, i: number) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 border-b border-border">
            <span className="font-semibold text-sm text-foreground">{String(test.name ?? `Test ${i + 1}`)}</span>
            <div className="flex items-center gap-2">
              {test.type && <TestTypeBadge type={String(test.type)} />}
              {test.framework && <span className="text-xs text-muted-foreground font-mono">{String(test.framework)}</span>}
            </div>
          </div>
          <div className="p-4 grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Input</div>
              <pre className="bg-muted/60 border border-border/50 p-2 rounded-lg text-xs font-mono overflow-x-auto">{String(test.input ?? "")}</pre>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Expected Output</div>
              <pre className="bg-green-500/5 border border-green-500/20 p-2 rounded-lg text-xs font-mono overflow-x-auto text-green-700 dark:text-green-400">{String(test.expectedOutput ?? "")}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SuggestedFixContent({ content }: { content: unknown }) {
  if (!content || typeof content !== "object") return <FormattedText content={String(content ?? "")} />;
  const fix = content as Record<string, unknown>;
  const patches = Array.isArray(fix.patchedSnippets) ? fix.patchedSnippets : [];
  return (
    <div className="space-y-5">
      {fix.explanation && <p className="text-sm text-foreground/90 leading-relaxed">{String(fix.explanation)}</p>}
      {fix.fullRewrite && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Full Rewrite</div>
          <pre className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl text-xs font-mono overflow-x-auto text-foreground">{String(fix.fullRewrite)}</pre>
        </div>
      )}
      {patches.map((patch: Record<string, unknown>, i: number) => (
        <div key={i} className="border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground">{String(patch.explanation ?? `Change ${i + 1}`)}</div>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-3">
              <div className="text-xs text-red-500 font-bold mb-1.5 uppercase tracking-wide">Before</div>
              <pre className="bg-red-500/5 border border-red-500/20 p-2 rounded-lg text-xs font-mono overflow-x-auto text-red-700 dark:text-red-400">{String(patch.before ?? "")}</pre>
            </div>
            <div className="p-3">
              <div className="text-xs text-green-500 font-bold mb-1.5 uppercase tracking-wide">After</div>
              <pre className="bg-green-500/5 border border-green-500/20 p-2 rounded-lg text-xs font-mono overflow-x-auto text-green-700 dark:text-green-400">{String(patch.after ?? "")}</pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RefactoredContent({ content }: { content: unknown }) {
  return (
    <div>
      <pre className="bg-muted/60 border border-border/50 p-4 rounded-xl text-sm font-mono overflow-x-auto leading-relaxed">{String(content ?? "")}</pre>
    </div>
  );
}

function ConfidenceContent({ content }: { content: unknown }) {
  const level = String(content ?? "medium").toLowerCase();
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
    high: {
      label: "High Confidence",
      color: "text-green-700 dark:text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      desc: "The analysis is detailed and specific to your code.",
    },
    medium: {
      label: "Medium Confidence",
      color: "text-yellow-700 dark:text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
      desc: "Some parts may be inferred. Consider providing more context.",
    },
    low: {
      label: "Low Confidence",
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      desc: "The code was complex or incomplete. Results are best-effort.",
    },
  };
  const s = map[level] ?? map.medium;
  return (
    <div className={cn("flex items-center gap-4 p-4 rounded-xl border", s.bg)}>
      {s.icon}
      <div>
        <div className={cn("font-semibold", s.color)}>{s.label}</div>
        <p className="text-sm text-muted-foreground">{s.desc}</p>
      </div>
    </div>
  );
}

const SECTION_META: Record<string, { title: string; icon: React.ReactNode; style: string }> = {
  summary: { title: "Summary", icon: <Info className="w-5 h-5 text-blue-500" />, style: "bg-card border-border" },
  eli5: { title: "ELI5 — Simple Explanation", icon: <Baby className="w-5 h-5 text-pink-500" />, style: "bg-gradient-to-br from-pink-500/5 to-purple-500/5 border-pink-500/20" },
  breakdown: { title: "Code Breakdown", icon: <BookOpen className="w-5 h-5 text-indigo-500" />, style: "bg-card border-border" },
  issues: { title: "Issues Detected", icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, style: "border-l-4 border-l-orange-500 bg-orange-500/5 border-border" },
  suggestedFix: { title: "Suggested Fix", icon: <Wrench className="w-5 h-5 text-green-500" />, style: "border-l-4 border-l-green-500 bg-green-500/5 border-border" },
  glossary: { title: "Glossary", icon: <Globe className="w-5 h-5 text-cyan-500" />, style: "bg-card border-border" },
  learnMore: { title: "Learn More", icon: <GraduationCap className="w-5 h-5 text-purple-500" />, style: "bg-card border-border" },
  tests: { title: "Test Cases", icon: <FlaskConical className="w-5 h-5 text-teal-500" />, style: "bg-card border-border" },
  refactoredCode: { title: "Refactored Code", icon: <Sparkles className="w-5 h-5 text-violet-500" />, style: "bg-card border-border" },
  confidence: { title: "Confidence", icon: <Zap className="w-5 h-5 text-amber-500" />, style: "bg-card border-border" },
};

function renderContent(type: string, content: unknown) {
  const str = typeof content === "string" ? content : null;

  switch (type) {
    case "issues":
      return <IssuesContent content={tryParse(content)} />;
    case "breakdown":
      return <BreakdownContent content={tryParse(content)} />;
    case "glossary":
      return <GlossaryContent content={tryParse(content)} />;
    case "learnMore":
      return <LearnMoreContent content={tryParse(content)} />;
    case "tests":
      return <TestsContent content={tryParse(content)} />;
    case "suggestedFix":
      return <SuggestedFixContent content={tryParse(content)} />;
    case "refactoredCode":
      return <RefactoredContent content={content} />;
    case "confidence":
      return <ConfidenceContent content={content} />;
    default:
      return <FormattedText content={str ?? JSON.stringify(content, null, 2)} />;
  }
}

function tryParse(content: unknown): unknown {
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }
  return content;
}

export function ResultSection({ section }: { section: AnalysisSection }) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const meta = SECTION_META[section.type] ?? {
    title: section.type,
    icon: <Info className="w-5 h-5 text-muted-foreground" />,
    style: "bg-card border-border",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden shadow-sm transition-all duration-300",
        meta.style,
        section.status === "streaming" &&
          "shadow-[0_0_15px_hsl(var(--primary)/0.15)] border-primary/30"
      )}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {meta.icon}
          <h3 className="font-semibold text-base text-foreground">
            {meta.title}
          </h3>
          {section.status === "streaming" && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Generating...
            </span>
          )}
        </div>
        <button className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50"
          >
            <div className="p-5 md:p-6">
              {renderContent(section.type, section.content)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
