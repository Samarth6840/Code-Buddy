export type AnalysisMode =
  | "explain"
  | "eli5"
  | "debug"
  | "teach"
  | "refactor"
  | "tests"
  | "full";

export type UserLevel = "beginner" | "intermediate" | "advanced";

function getSections(modes: AnalysisMode[]): string[] {
  if (modes.includes("full")) {
    return [
      "summary",
      "eli5",
      "breakdown",
      "issues",
      "suggestedFix",
      "glossary",
      "learnMore",
      "tests",
      "confidence",
    ];
  }

  const sections: string[] = [];
  const hasMode = (m: AnalysisMode) => modes.includes(m);

  if (hasMode("explain") || hasMode("teach")) sections.push("summary");
  if (hasMode("eli5")) sections.push("eli5");
  if (hasMode("explain") || hasMode("teach")) sections.push("breakdown");
  if (hasMode("debug")) sections.push("issues");
  if (hasMode("debug")) sections.push("suggestedFix");
  if (hasMode("eli5") || hasMode("teach")) sections.push("glossary");
  if (hasMode("teach")) sections.push("learnMore");
  if (hasMode("tests")) sections.push("tests");
  if (hasMode("refactor")) sections.push("refactoredCode");
  sections.push("confidence");

  return [...new Set(sections)];
}

export function buildAnalysisPrompt(params: {
  code: string;
  language?: string;
  modes: AnalysisMode[];
  errorMessage?: string;
  userLevel?: UserLevel;
}): { systemPrompt: string; userPrompt: string; sections: string[] } {
  const { code, language, modes, errorMessage, userLevel = "beginner" } = params;
  const sections = getSections(modes);

  const levelGuidance: Record<UserLevel, string> = {
    beginner: `
The user is a beginner — treat every concept as if they've never seen code before.
- Use real-world analogies for EVERYTHING (functions = recipes, variables = labeled boxes, loops = assembly lines, etc.)
- Never assume they know what a keyword, operator, or syntax element means — explain it
- Be warm, encouraging, and patient
- Celebrate what the code does right before pointing out issues
- Avoid jargon; if you must use a technical term, immediately define it in plain English
- Write explanations at an 8th-grade reading level`,

    intermediate: `
The user has some coding experience — they understand basic concepts but may not know advanced patterns.
- You can use standard terms (function, variable, loop, class, etc.) without defining them
- Explain the "why" behind design choices, not just the "what"
- Point out best practices and common pitfalls
- Be direct and informative, not condescending`,

    advanced: `
The user is an experienced developer — be technical and concise.
- Skip basic explanations, focus on subtle bugs, edge cases, and architectural concerns
- Reference design patterns, algorithmic complexity, and performance implications
- Point out language-specific idioms and anti-patterns
- Be precise and direct`,
  };

  const systemPrompt = `You are CodeBuddy, the most helpful coding tutor in the world. Your job is to make code understandable, debugging feel less overwhelming, and learning feel rewarding.

Tone: Warm, precise, occasionally playful — never robotic, never vague, never condescending.

${levelGuidance[userLevel]}

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY a valid JSON object. No markdown, no code fences around the JSON, no text outside the JSON.
2. Every explanation field must be a rich, complete, deeply helpful response — not a one-liner.
3. For the "breakdown" field: analyze EVERY meaningful line or block. Be thorough. Each entry should have a genuinely useful explanation that teaches the reader something.
4. For the "summary" field: give a confident, engaging 3-5 sentence overview of WHAT the code does, WHY it might be written this way, and HOW it accomplishes its goal.
5. For the "eli5" field: use a creative, memorable analogy. Make it stick.
6. Strip ALL markdown from explanation text fields (no **bold**, no ## headers, no bullet hyphens in plain text fields). Arrays and nested objects are fine.
7. Always fill in the "detectedLanguage" and "languageConfidence" fields.

JSON Schema (include only fields for sections: ${sections.join(", ")}):
{
  "detectedLanguage": "string — the programming language name (e.g. 'Python', 'JavaScript')",
  "languageConfidence": number (0.0 to 1.0),
  "summary": "string — rich, 3-5 sentence plain-English overview of what this code does, how it works, and why",
  "eli5": "string — explain using a fun, memorable real-world analogy as if talking to a curious 10-year-old. Be creative and specific — make the analogy stick",
  "breakdown": [
    {
      "lineRange": "string — e.g. '1-3' or 'Line 7'",
      "label": "string — short name for this block (e.g. 'Import statements', 'The add function', 'Main loop')",
      "explanation": "string — DETAILED explanation of what these lines do, why they exist, and what would happen without them. For beginners, include analogies. Minimum 2-3 sentences.",
      "codeSnippet": "string — the exact code from these lines"
    }
  ],
  "issues": [
    {
      "id": "string",
      "severity": "error | warning | info",
      "title": "string — short, clear title",
      "location": "string — e.g. 'Line 14' or 'Function foo'",
      "whatIsWrong": "string — plain-English description of the problem",
      "whyItHappens": "string — explain the root cause clearly",
      "howToFix": "string — concrete step-by-step instructions to fix it",
      "fixedSnippet": "string — the corrected code",
      "certainty": "confirmed | likely | possible"
    }
  ],
  "suggestedFix": {
    "fullRewrite": "string — complete rewritten code (ONLY if original is under 80 lines, otherwise omit)",
    "patchedSnippets": [{ "before": "string", "after": "string", "explanation": "string" }],
    "explanation": "string — overall explanation of what was fixed and why the new approach is better"
  },
  "glossary": [
    { "term": "string — the technical term or keyword", "definition": "string — plain English definition with an analogy if helpful" }
  ],
  "learnMore": {
    "concepts": ["string — key concept names from this code worth learning more about"],
    "tryNext": ["string — specific coding exercises or experiments to try, written as concrete action items"],
    "relatedTopics": ["string — related topics that would help the user level up"]
  },
  "tests": [
    {
      "name": "string — descriptive test name",
      "input": "string — the test input",
      "expectedOutput": "string — what the code should return/do",
      "type": "happy_path | edge_case | error_case",
      "framework": "string — e.g. 'pytest', 'jest', 'junit', 'go test'"
    }
  ],
  "refactoredCode": "string — the full improved/refactored code",
  "confidence": "high | medium | low",
  "confidenceNote": "string — brief note on confidence level and why"
}`;

  const modeDescriptions: Partial<Record<AnalysisMode, string>> = {
    explain: "explain what this code does in detail",
    eli5: "explain it using simple analogies",
    debug: "find ALL bugs, potential errors, edge cases, and issues",
    teach: "teach the concepts behind this code",
    refactor: "suggest a cleaner, more idiomatic rewrite",
    tests: "generate comprehensive test cases covering happy paths, edge cases, and error cases",
    full: "provide a complete, thorough analysis",
  };

  const requestedModes = modes.map((m) => modeDescriptions[m] ?? m).join("; ");

  let userPrompt = `Requested: ${requestedModes}
Include these sections in the JSON: ${sections.join(", ")}
${language ? `Language hint: ${language}` : "Auto-detect the language."}

Here is the code to analyze:

\`\`\`
${code}
\`\`\``;

  if (errorMessage) {
    userPrompt += `

The user is also seeing this error:
${errorMessage}

Please explain this error in plain English, identify which line(s) are likely responsible, and show exactly how to fix it.`;
  }

  userPrompt += `

Remember: 
- Return ONLY the JSON object, nothing else.
- Make every explanation rich and genuinely helpful — not generic placeholder text.
- The breakdown should cover every meaningful section of the code.`;

  return { systemPrompt, userPrompt, sections };
}

export function detectLanguage(code: string): string | null {
  const patterns: Array<[RegExp, string]> = [
    [/import\s+React|jsx|tsx|useState|useEffect/, "TypeScript/React"],
    [/import\s+\{[^}]+\}\s+from\s+['"]|export\s+(default|const|function)|=>\s*\{/, "JavaScript"],
    [/:\s*(str|int|float|bool|list|dict|tuple|None)\b|def\s+\w+\s*\(|print\s*\(/, "Python"],
    [/<\?php|\$\w+\s*=/, "PHP"],
    [/fn\s+\w+|let\s+mut\s+|println!|impl\s+\w+/, "Rust"],
    [/public\s+(static\s+)?void\s+main|System\.out\.println|import\s+java\./, "Java"],
    [/package\s+main|func\s+\w+\s*\(.*\)|fmt\.Println|:=/, "Go"],
    [/SELECT\s+.+FROM\s+|INSERT\s+INTO|CREATE\s+TABLE/i, "SQL"],
    [/^\s*#!\/bin\/(bash|sh)|export\s+\w+=|fi\s*$|then\s*$/m, "Bash"],
    [/interface\s+\w+\s*\{|type\s+\w+\s*=\s*\{|:\s*\w+(\[\])?\s*[;,{]/, "TypeScript"],
    [/def\s+\w+|class\s+\w+|puts\s+|require\s+/, "Ruby"],
    [/<html|<!DOCTYPE|<div|<span/i, "HTML"],
    [/\{[^}]+:\s*[^,}]+\}/, "JSON"],
    [/^---\n|^\w+:\s/m, "YAML"],
    [/\.(w+|px|rem|em|vh|vw)\s*;|@media\s+|:root\s*\{/, "CSS"],
  ];

  for (const [regex, lang] of patterns) {
    if (regex.test(code)) return lang;
  }
  return null;
}
