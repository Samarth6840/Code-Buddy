import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { AnalyzeRequest } from "@workspace/api-client-react";

export type AnalysisSection = {
  id: string;
  type: string;
  title?: string;
  content: unknown;
  metadata?: unknown;
  status: "streaming" | "complete" | "error";
};

export type AnalysisState = {
  status: "idle" | "loading" | "streaming" | "complete" | "error";
  sections: AnalysisSection[];
  error?: string;
  processingTimeMs?: number;
  confidence?: string;
  detectedLanguage?: string;
};

export function useAnalyze() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    sections: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (
      request: Partial<AnalyzeRequest> & { code: string; modes: string[] }
    ) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState({ status: "loading", sections: [] });

      const sessionId = uuidv4();
      const payload: AnalyzeRequest = {
        ...request,
        sessionId,
        streamResponse: true,
        source: "web",
      };

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMsg = "Analysis failed";
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch {
            // ignore
          }
          throw new Error(errorMsg);
        }

        setState((s) => ({ ...s, status: "streaming" }));

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not supported");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // SSE messages are separated by double newlines
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";

          for (const message of messages) {
            // Each SSE message may be multi-line: "event: section\ndata: {...}"
            // Find the data: line within the message
            const dataLine = message
              .split("\n")
              .find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            const dataStr = dataLine.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const evt = JSON.parse(dataStr);

              if (evt.done === true) {
                setState((s) => ({
                  ...s,
                  status: "complete",
                  processingTimeMs: evt.processingTimeMs,
                  confidence: evt.confidence,
                  detectedLanguage: evt.detectedLanguage,
                }));
                continue;
              }

              if (evt.code && evt.message) {
                // Error event from server
                setState((s) => ({
                  ...s,
                  status: "error",
                  error: evt.message,
                }));
                continue;
              }

              if (evt.section) {
                setState((s) => {
                  const existingIndex = s.sections.findIndex(
                    (x) => x.type === evt.section
                  );

                  if (existingIndex >= 0) {
                    const newSections = [...s.sections];
                    newSections[existingIndex] = {
                      ...newSections[existingIndex],
                      content: evt.content,
                      status: "complete",
                    };
                    return { ...s, sections: newSections };
                  } else {
                    return {
                      ...s,
                      sections: [
                        ...s.sections,
                        {
                          id: uuidv4(),
                          type: evt.section,
                          title: evt.section,
                          content: evt.content,
                          status: "complete" as const,
                        },
                      ],
                    };
                  }
                });
              }
            } catch (err) {
              console.error("Failed to parse SSE event:", dataStr, err);
            }
          }
        }

        // Ensure we're marked complete after stream ends
        setState((s) => ({
          ...s,
          status: s.status === "error" ? "error" : "complete",
          sections: s.sections.map((sec) => ({ ...sec, status: "complete" as const })),
        }));
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name === "AbortError") return;
        setState((s) => ({
          ...s,
          status: "error",
          error: error.message || "An unexpected error occurred",
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ status: "idle", sections: [] });
  }, []);

  return { ...state, analyze, reset };
}
