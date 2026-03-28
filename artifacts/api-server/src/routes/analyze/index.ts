import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { buildAnalysisPrompt, detectLanguage, type AnalysisMode, type UserLevel } from "./prompt.js";
import { AnalyzeCodeBody } from "@workspace/api-zod";

const router: IRouter = Router();

const ipRequestCounts = new Map<string, { count: number; resetAt: number; dailyCount: number; dailyResetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const data = ipRequestCounts.get(ip) ?? {
    count: 0,
    resetAt: now + 60_000,
    dailyCount: 0,
    dailyResetAt: now + 86_400_000,
  };

  if (now > data.resetAt) {
    data.count = 0;
    data.resetAt = now + 60_000;
  }
  if (now > data.dailyResetAt) {
    data.dailyCount = 0;
    data.dailyResetAt = now + 86_400_000;
  }

  if (data.count >= 10) {
    return { allowed: false, retryAfter: Math.ceil((data.resetAt - now) / 1000) };
  }
  if (data.dailyCount >= 100) {
    return { allowed: false, retryAfter: Math.ceil((data.dailyResetAt - now) / 1000) };
  }

  data.count++;
  data.dailyCount++;
  ipRequestCounts.set(ip, data);
  return { allowed: true };
}

function sanitizeText(text: unknown): string {
  if (typeof text !== "string") return String(text ?? "");
  return text
    .replace(/```[\s\S]*?```/g, (m) => m)
    .replace(/\r\n/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function credentialScan(code: string): boolean {
  const patterns = [
    /\b(api[_-]?key|api[_-]?secret|access[_-]?token|secret[_-]?key|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    /\b(password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
    /\bsk-[a-zA-Z0-9]{20,}\b/g,
    /\bghp_[a-zA-Z0-9]{36,}\b/g,
    /\bAIza[a-zA-Z0-9_-]{35}\b/g,
  ];
  return patterns.some((p) => p.test(code));
}

router.post("/analyze", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: "Too many requests. Take a breath and try again in a moment.",
      code: "RATE_LIMIT",
      retryAfter: rateCheck.retryAfter,
    });
    return;
  }

  const parseResult = AnalyzeCodeBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body", code: "VALIDATION_ERROR" });
    return;
  }

  const { code, language, modes, errorMessage, userLevel, sessionId } = parseResult.data;

  if (!code || code.trim().length === 0) {
    res.status(400).json({ error: "Code is required", code: "MISSING_CODE" });
    return;
  }

  const hasCredentials = credentialScan(code);

  const detectedLang = language || detectLanguage(code) || undefined;

  const { systemPrompt, userPrompt, sections } = buildAnalysisPrompt({
    code,
    language: detectedLang,
    modes: (modes as AnalysisMode[]) ?? ["explain"],
    errorMessage: errorMessage ?? undefined,
    userLevel: (userLevel as UserLevel) ?? "beginner",
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (hasCredentials) {
    res.write(
      `event: warning\ndata: ${JSON.stringify({ message: "Possible credentials detected in your code. We've processed it, but please avoid sharing real secrets." })}\n\n`
    );
  }

  const startTime = Date.now();

  try {
    let fullJson = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullJson += event.delta.text;
      }
    }

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = fullJson.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? fullJson);
    } catch {
      res.write(
        `event: error\ndata: ${JSON.stringify({ code: "PARSE_ERROR", message: "Failed to parse AI response. Please try again." })}\n\n`
      );
      res.end();
      return;
    }

    for (const section of sections) {
      const content = parsed[section];
      if (content !== undefined && content !== null) {
        const sanitized =
          typeof content === "string" ? sanitizeText(content) : content;
        res.write(
          `event: section\ndata: ${JSON.stringify({ section, content: sanitized, done: false })}\n\n`
        );
      }
    }

    const confidence =
      typeof parsed.confidence === "string"
        ? parsed.confidence
        : "medium";

    const processingTimeMs = Date.now() - startTime;

    res.write(
      `event: complete\ndata: ${JSON.stringify({
        processingTimeMs,
        confidence,
        detectedLanguage: parsed.detectedLanguage ?? detectedLang ?? "unknown",
        languageConfidence: parsed.languageConfidence ?? 0.7,
        confidenceNote: parsed.confidenceNote ?? "",
        done: true,
      })}\n\n`
    );
  } catch (err) {
    req.log.error({ err }, "Analysis error");
    res.write(
      `event: error\ndata: ${JSON.stringify({ code: "AI_ERROR", message: "Something went wrong. Please try again." })}\n\n`
    );
  }

  res.end();
});

router.post("/resolve-url", async (req, res) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  try {
    let rawUrl = url;

    if (url.includes("github.com")) {
      rawUrl = url
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");
    } else if (url.includes("gist.github.com")) {
      const gistId = url.split("/").pop()?.split("#")[0];
      if (gistId) {
        const apiResp = await fetch(`https://api.github.com/gists/${gistId}`);
        const data = (await apiResp.json()) as { files?: Record<string, { raw_url?: string; content?: string }> };
        const files = data.files;
        if (files) {
          const firstFile = Object.values(files)[0];
          rawUrl = firstFile?.raw_url ?? url;
        }
      }
    } else if (url.includes("gitlab.com")) {
      rawUrl = url
        .replace("/-/blob/", "/-/raw/")
        .replace("/blob/", "/raw/");
    }

    const response = await fetch(rawUrl, {
      headers: { "User-Agent": "CodeBuddy/1.0" },
    });

    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch URL: ${response.statusText}` });
      return;
    }

    const text = await response.text();

    if (text.length > 15000) {
      res.status(400).json({ error: "File is too large (max 15,000 characters)" });
      return;
    }

    const filename = rawUrl.split("/").pop()?.split("?")[0];
    const ext = filename?.split(".").pop()?.toLowerCase();

    const extToLang: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      jsx: "javascript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      go: "go",
      rs: "rust",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      sh: "bash",
      sql: "sql",
      html: "html",
      css: "css",
      yaml: "yaml",
      yml: "yaml",
      json: "json",
    };

    res.json({
      code: text,
      language: ext ? extToLang[ext] : undefined,
      filename,
      lineCount: text.split("\n").length,
    });
  } catch (err) {
    req.log.error({ err }, "URL resolution error");
    res.status(400).json({ error: "Failed to resolve URL" });
  }
});

export default router;
