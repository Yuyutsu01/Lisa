/**
 * Local Heuristic Pre-Check Engine (Client-Side Instant Feedback).
 *
 * NOTE ON DUAL QA SYSTEM RECONCILIATION:
 * This scorecard provides instantaneous, deterministic client-side feedback (keyword overlap,
 * character limits, regex checks, and phrase scanning) while the user edits copy in the browser.
 *
 * It is distinct from the authoritative backend QualityAssuranceAgent (backend/app/agents/qa.py),
 * which runs full LLM-based factual grounding, multi-agent auto-revision loops, and database logging.
 *
 * APPROVAL GATING RULE:
 * Production release gating requires passing authoritative backend QA review or explicit human
 * editorial sign-off. This local scorecard acts as a real-time drafting guide.
 */

export interface QualityCheckItem {
  name: string;
  category: string;
  score: number; // 0 - 10
  max_score: number;
  status: "pass" | "warning" | "fail";
  reason: string;
}

export interface QAScorecardResult {
  quality_score: number; // 0 - 100
  passed: boolean;
  check_items: QualityCheckItem[];
  checks: Record<string, string>;
  issues: { severity: "critical" | "warning" | "info"; message: string }[];
  suggestions: string[];
}

export interface BrandProfileInput {
  tone?: string;
  target_audience?: string;
  preferred_vocab_json?: string[];
  forbidden_phrases_json?: string[];
}

export interface VariantInput {
  platform?: string;
  format?: string;
  title?: string;
  body: string;
  caption?: string;
  cta?: string;
  hashtags_json?: string[];
}

export interface SourceInput {
  title?: string;
  body?: string;
  content_pillar?: string;
}

const DEFAULT_FORBIDDEN_PHRASES = [
  "game-changer",
  "game changer",
  "supercharge",
  "revolutionize",
  "paradigm shift",
  "seamlessly",
  "delve into",
  "in today's fast-paced world",
  "in todays fast-paced world",
  "synergy",
  "unleash",
  "testament to",
  "silver bullet",
  "magic bullet",
  "at the end of the day",
  "needless to say",
  "it goes without saying",
  "without further ado",
  "take it to the next level",
  "transformative journey",
];

const DEFAULT_PREFERRED_VOCAB = [
  "benchmark",
  "architecture",
  "latency",
  "throughput",
  "resilience",
  "determinism",
  "zero-copy",
  "p95",
  "p99",
  "scalability",
  "distributed",
  "concurrency",
  "reproducible",
  "metric",
  "tradeoff",
];

const PLATFORM_LIMITS: Record<
  string,
  {
    maxChars: number;
    optimalMin: number;
    optimalMax: number;
    recommendedHashtags: [number, number];
    requiresThreadIfOver?: number;
  }
> = {
  linkedin: { maxChars: 3000, optimalMin: 400, optimalMax: 1800, recommendedHashtags: [2, 5] },
  x: { maxChars: 280, optimalMin: 120, optimalMax: 280, recommendedHashtags: [1, 3], requiresThreadIfOver: 280 },
  instagram: { maxChars: 2200, optimalMin: 300, optimalMax: 1200, recommendedHashtags: [3, 8] },
  discord: { maxChars: 2000, optimalMin: 200, optimalMax: 1500, recommendedHashtags: [0, 3] },
  youtube: { maxChars: 1500, optimalMin: 250, optimalMax: 900, recommendedHashtags: [2, 5] },
  threads: { maxChars: 500, optimalMin: 80, optimalMax: 480, recommendedHashtags: [0, 2] },
  email: { maxChars: 10000, optimalMin: 350, optimalMax: 3500, recommendedHashtags: [0, 0] },
  blog: { maxChars: 25000, optimalMin: 600, optimalMax: 8000, recommendedHashtags: [0, 2] },
};

/**
 * Calculates a local heuristic pre-check scorecard for any content variant.
 */
export function calculateQAScorecard(
  variant?: VariantInput | null,
  source?: SourceInput | null,
  brandProfile?: BrandProfileInput | null
): QAScorecardResult {
  if (!variant || !variant.body || variant.body.trim().length === 0) {
    return {
      quality_score: 0,
      passed: false,
      check_items: [
        {
          name: "Variant Content Check",
          category: "Integrity",
          score: 0,
          max_score: 10,
          status: "fail",
          reason: "Variant body is empty. Generate or enter content to evaluate.",
        },
      ],
      checks: { content_empty: "Fail" },
      issues: [{ severity: "critical", message: "Variant body is completely empty." }],
      suggestions: ["Write or generate content copy to calculate scorecard."],
    };
  }

  const platform = (variant.platform || "linkedin").toLowerCase();
  const body = variant.body.trim();
  const title = (variant.title || "").trim();
  const caption = (variant.caption || "").trim();
  const cta = (variant.cta || "").trim();
  const hashtags = variant.hashtags_json || [];

  const sourceBody = (source?.body || "").trim();
  const sourceTitle = (source?.title || "").trim();

  const forbiddenList = Array.from(
    new Set([
      ...DEFAULT_FORBIDDEN_PHRASES,
      ...(brandProfile?.forbidden_phrases_json || []).map((p) => p.toLowerCase().trim()),
    ])
  ).filter(Boolean);

  const preferredList = Array.from(
    new Set([
      ...DEFAULT_PREFERRED_VOCAB,
      ...(brandProfile?.preferred_vocab_json || []).map((p) => p.toLowerCase().trim()),
    ])
  ).filter(Boolean);

  const checkItems: QualityCheckItem[] = [];
  const issues: { severity: "critical" | "warning" | "info"; message: string }[] = [];
  const suggestions: string[] = [];

  const lowerBody = body.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerCaption = caption.toLowerCase();
  const fullText = `${lowerTitle} ${lowerCaption} ${lowerBody}`;

  // ==========================================
  // 1. Keyword Overlap with Source (10 pts)
  // (Relabeled from "Source Fidelity" to accurately describe deterministic bag-of-words overlap)
  // ==========================================
  let fidelityScore = 10;
  let fidelityReason = "Variant maintains high keyword overlap with the canonical source.";

  if (sourceBody || sourceTitle) {
    const sourceWords = `${sourceTitle} ${sourceBody}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 5 && !["about", "their", "there", "which", "would", "these", "after"].includes(w));

    const uniqueSourceWords = Array.from(new Set(sourceWords));
    if (uniqueSourceWords.length > 0) {
      let matched = 0;
      for (const w of uniqueSourceWords) {
        if (fullText.includes(w)) matched++;
      }
      const overlapRatio = matched / uniqueSourceWords.length;

      if (overlapRatio < 0.15) {
        fidelityScore = 4;
        fidelityReason = `Low keyword overlap (${Math.round(overlapRatio * 100)}%) with source. Key terms missing.`;
        issues.push({ severity: "warning", message: "Variant omits core keywords present in the canonical source." });
        suggestions.push("Incorporate core terms from the canonical source (e.g. system components, architecture metrics).");
      } else if (overlapRatio < 0.3) {
        fidelityScore = 7;
        fidelityReason = `Moderate keyword overlap (${Math.round(overlapRatio * 100)}% term coverage).`;
      } else {
        fidelityScore = 10;
        fidelityReason = `Strong keyword overlap (${Math.round(overlapRatio * 100)}% source term coverage).`;
      }
    }
  } else {
    fidelityScore = 9;
    fidelityReason = "Source text not provided; evaluated as standalone original copy.";
  }

  checkItems.push({
    name: "Keyword Overlap with Source",
    category: "Substance",
    score: fidelityScore,
    max_score: 10,
    status: fidelityScore >= 8 ? "pass" : fidelityScore >= 6 ? "warning" : "fail",
    reason: fidelityReason,
  });

  // ==========================================
  // 2. Brand Voice & Tone Compliance (10 pts)
  // ==========================================
  let toneScore = 10;
  const hyperboleWords = ["insane", "shocking", "mind-blowing", "1000x", "secret hack", "unbelievable", "guaranteed"];
  const foundHyperbole = hyperboleWords.filter((hw) => fullText.includes(hw));
  const exclamationCount = (body.match(/!/g) || []).length;

  if (foundHyperbole.length > 0) {
    toneScore -= foundHyperbole.length * 2;
    issues.push({
      severity: "warning",
      message: `Detected sensationalist hyperbole: "${foundHyperbole.join('", "')}". Acme brand guidelines require empirical tone.`,
    });
    suggestions.push(`Replace emotional buzzwords (${foundHyperbole.join(", ")}) with concrete metrics or benchmarks.`);
  }

  if (exclamationCount > 3) {
    toneScore -= 2;
    issues.push({
      severity: "info",
      message: `High exclamation mark density (${exclamationCount} exclamation marks). Professional engineering tone favors periods.`,
    });
  }

  toneScore = Math.max(2, Math.min(10, toneScore));
  checkItems.push({
    name: "Brand Voice & Tone Compliance",
    category: "Brand",
    score: toneScore,
    max_score: 10,
    status: toneScore >= 8 ? "pass" : toneScore >= 6 ? "warning" : "fail",
    reason:
      toneScore >= 9
        ? "Tone is authoritative, measured, and aligns with brand voice guidelines."
        : `Tone check identified ${foundHyperbole.length ? `sensational phrasing (${foundHyperbole.join(", ")})` : "formatting friction"}.`,
  });

  // ==========================================
  // 3. Forbidden Clichés & Brand Policy Audit (10 pts)
  // ==========================================
  const detectedForbidden: string[] = [];
  for (const phrase of forbiddenList) {
    if (phrase && fullText.includes(phrase)) {
      detectedForbidden.push(phrase);
    }
  }

  let forbiddenScore = 10;
  if (detectedForbidden.length > 0) {
    forbiddenScore = Math.max(0, 10 - detectedForbidden.length * 3);
    issues.push({
      severity: "critical",
      message: `Forbidden brand phrases/clichés detected: "${detectedForbidden.join('", "')}". Prohibited by brand policy.`,
    });
    suggestions.push(`Remove or rewrite banned phrases: "${detectedForbidden.join('", "')}".`);
  }

  checkItems.push({
    name: "Forbidden Clichés & Policy Compliance",
    category: "Brand",
    score: forbiddenScore,
    max_score: 10,
    status: forbiddenScore === 10 ? "pass" : forbiddenScore >= 6 ? "warning" : "fail",
    reason:
      forbiddenScore === 10
        ? "Zero forbidden phrases or policy violations detected. Clean copy."
        : `Detected ${detectedForbidden.length} prohibited term(s): ${detectedForbidden.map((f) => `"${f}"`).join(", ")}.`,
  });

  // ==========================================
  // 4. Preferred Vocabulary & Technical Precision (10 pts)
  // ==========================================
  const detectedPreferred = preferredList.filter((term) => fullText.includes(term));
  const hasNumbersOrMetrics = /\b\d+(\.\d+)?(%|ms|s|k|m|gb|mb|x)?\b/i.test(body);

  let vocabScore = 8;
  if (detectedPreferred.length >= 2 && hasNumbersOrMetrics) {
    vocabScore = 10;
  } else if (detectedPreferred.length >= 1 || hasNumbersOrMetrics) {
    vocabScore = 8;
  } else {
    vocabScore = 5;
    suggestions.push("Add concrete technical vocabulary or numerical benchmarks (e.g. latency figures, architecture metrics).");
  }

  checkItems.push({
    name: "Preferred Vocab & Technical Precision",
    category: "Substance",
    score: vocabScore,
    max_score: 10,
    status: vocabScore >= 8 ? "pass" : "warning",
    reason:
      vocabScore === 10
        ? `Rich technical precision with ${detectedPreferred.length} preferred terms (${detectedPreferred.slice(0, 3).join(", ")}) and quantitative benchmarks.`
        : `Moderate precision. Found ${detectedPreferred.length} domain terms. Adding reproducible numbers enhances authority.`,
  });

  // ==========================================
  // 5. Platform Constraints & Native Syntax (10 pts)
  // ==========================================
  const limits = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.linkedin;
  const charLength = body.length;
  let syntaxScore = 10;
  let syntaxReason = "Length and structural formatting conform to native network specs.";

  if (platform === "x") {
    const isThread = /^\s*(1\/\d+|1\/\?|1\.)/m.test(body) || body.includes("---");
    if (charLength > 280 && !isThread) {
      syntaxScore = 4;
      syntaxReason = `Post exceeds single tweet limit (${charLength}/280 chars) without numbered thread formatting (1/N).`;
      issues.push({ severity: "critical", message: "X post exceeds 280 characters and is not formatted as a thread." });
      suggestions.push("Split copy into a multi-tweet thread format (e.g. 1/6, 2/6) or reduce to under 280 characters.");
    } else if (isThread) {
      syntaxScore = 10;
      syntaxReason = "Valid multi-tweet thread syntax with sequential tweet delimiters.";
    }
  } else if (charLength > limits.maxChars) {
    syntaxScore = 3;
    syntaxReason = `Content length (${charLength} chars) exceeds hard limit of ${limits.maxChars} chars for ${platform.toUpperCase()}.`;
    issues.push({ severity: "critical", message: `Exceeds ${platform.toUpperCase()} character limit by ${charLength - limits.maxChars} characters.` });
    suggestions.push(`Trim ${charLength - limits.maxChars} characters to ensure proper platform display.`);
  } else if (charLength < limits.optimalMin) {
    syntaxScore = 6;
    syntaxReason = `Content length (${charLength} chars) is below optimal minimum (${limits.optimalMin} chars) for depth on ${platform.toUpperCase()}.`;
    suggestions.push(`Expand on key takeaways to hit the optimal platform depth (${limits.optimalMin}-${limits.optimalMax} chars).`);
  } else {
    syntaxScore = 10;
    syntaxReason = `Compliant native length (${charLength} chars, optimal range ${limits.optimalMin}-${limits.optimalMax}).`;
  }

  // Check specific platform formatting cues
  if (platform === "youtube" && !body.includes("[") && !body.includes("00:")) {
    syntaxScore = Math.max(5, syntaxScore - 2);
    suggestions.push("Add video timestamp cue markers (e.g. [00:00 - 00:05] HOOK) for YouTube Shorts teleprompter pacing.");
  }

  checkItems.push({
    name: "Platform Constraints & Native Syntax",
    category: "Formatting",
    score: syntaxScore,
    max_score: 10,
    status: syntaxScore >= 8 ? "pass" : syntaxScore >= 6 ? "warning" : "fail",
    reason: syntaxReason,
  });

  // ==========================================
  // 6. Opening Hook Strength & Retention (10 pts)
  // ==========================================
  const firstLine = body.split("\n")[0].trim().toLowerCase();
  let hookScore = 10;
  let hookReason = "Compelling opening hook with immediate tension, question, or value promise.";

  const weakOpenings = [
    "in this post",
    "in this article",
    "i wanted to share",
    "today i want to",
    "hello everyone",
    "hi guys",
    "we are pleased to",
    "excited to announce",
  ];

  const hasWeakOpening = weakOpenings.some((wo) => firstLine.startsWith(wo));
  if (hasWeakOpening) {
    hookScore = 4;
    hookReason = "Opening contains weak conversational filler preamble instead of direct insight or contrast.";
    issues.push({ severity: "warning", message: "Opening sentence lacks tension. Avoid preamble like 'In this post'." });
    suggestions.push("Start directly with a contrarian statement, surprising benchmark, or compelling question.");
  } else if (firstLine.length < 15) {
    hookScore = 6;
    hookReason = "Opening hook is very short; ensure first line drives curiosity.";
  } else {
    hookScore = 10;
    hookReason = "Opening line establishes strong narrative tension or clear technical relevance.";
  }

  checkItems.push({
    name: "Opening Hook Strength & Retention",
    category: "Engagement",
    score: hookScore,
    max_score: 10,
    status: hookScore >= 8 ? "pass" : hookScore >= 6 ? "warning" : "fail",
    reason: hookReason,
  });

  // ==========================================
  // 7. Call-to-Action (CTA) Efficacy (10 pts)
  // ==========================================
  let ctaScore = 10;
  let ctaReason = "Clear, actionable call-to-action that invites technical discussion or next steps.";

  const ctaText = `${cta} ${body.slice(-200)}`.toLowerCase();
  const strongCtaVerbs = [
    "join",
    "share",
    "comment",
    "drop",
    "subscribe",
    "read",
    "explore",
    "benchmark",
    "repost",
    "save",
    "reply",
    "let us know",
    "thoughts",
  ];

  const hasStrongCta = strongCtaVerbs.some((verb) => ctaText.includes(verb));
  if (!hasStrongCta && !cta) {
    ctaScore = 5;
    ctaReason = "No distinct call-to-action detected. Audience is left without a prompt to engage.";
    issues.push({ severity: "info", message: "Variant lacks an explicit closing call-to-action." });
    suggestions.push(`Add a direct CTA tailored to ${platform.toUpperCase()} (e.g. asking for engineering perspectives or bookmarking).`);
  } else {
    ctaScore = 10;
    ctaReason = cta ? `Explicit CTA configured: "${cta.slice(0, 50)}..."` : "Closing paragraph contains clear engagement prompt.";
  }

  checkItems.push({
    name: "Call-to-Action (CTA) Efficacy",
    category: "Engagement",
    score: ctaScore,
    max_score: 10,
    status: ctaScore >= 8 ? "pass" : "warning",
    reason: ctaReason,
  });

  // ==========================================
  // 8. Hashtag Optimization & Policy (10 pts)
  // ==========================================
  const tagCount = hashtags.length;
  const [minTags, maxTags] = limits.recommendedHashtags;
  let tagScore = 10;
  let tagReason = `Hashtag count (${tagCount}) aligns with ${platform.toUpperCase()} distribution best practices (${minTags}-${maxTags}).`;

  if (tagCount < minTags && minTags > 0) {
    tagScore = 7;
    tagReason = `Hashtag count (${tagCount}) is below platform recommendation of ${minTags}-${maxTags} tags.`;
    suggestions.push(`Add ${minTags - tagCount} focused technical hashtags (e.g. #SystemDesign, #CloudArchitecture).`);
  } else if (tagCount > maxTags && maxTags > 0) {
    tagScore = 6;
    tagReason = `Too many hashtags (${tagCount}). Exceeds ${platform.toUpperCase()} recommendation of max ${maxTags} tags.`;
    suggestions.push(`Reduce hashtags to top ${maxTags} relevant domain tags to avoid spam filters.`);
  } else if (maxTags === 0 && tagCount > 0) {
    tagScore = 7;
    tagReason = `Hashtags are generally discouraged on ${platform.toUpperCase()}; recommended count is 0.`;
  }

  checkItems.push({
    name: "Hashtag Optimization & Strategy",
    category: "Distribution",
    score: tagScore,
    max_score: 10,
    status: tagScore >= 8 ? "pass" : "warning",
    reason: tagReason,
  });

  // ==========================================
  // 9. Visual Pacing & Whitespace Rhythm (10 pts)
  // ==========================================
  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).length > 60);

  let pacingScore = 10;
  let pacingReason = "Excellent visual rhythm with concise paragraphs and readable whitespace breaks.";

  if (paragraphs.length === 1 && body.length > 350) {
    pacingScore = 4;
    pacingReason = "Wall-of-text detected. Single dense paragraph hurts mobile retention.";
    issues.push({ severity: "warning", message: "Variant is a single dense block of text without blank line separators." });
    suggestions.push("Break dense paragraphs into 1-3 sentence blocks with blank lines between them.");
  } else if (longParagraphs.length > 0) {
    pacingScore = 7;
    pacingReason = `${longParagraphs.length} paragraph(s) exceed 60 words. Breaking them improves readability.`;
    suggestions.push("Split longer paragraphs into punchy micro-paragraphs or bullet points.");
  }

  checkItems.push({
    name: "Visual Pacing & Whitespace Rhythm",
    category: "Readability",
    score: pacingScore,
    max_score: 10,
    status: pacingScore >= 8 ? "pass" : pacingScore >= 6 ? "warning" : "fail",
    reason: pacingReason,
  });

  // ==========================================
  // 10. Signal-to-Noise & Readability (10 pts)
  // ==========================================
  const fillerPhrases = [
    "at the end of the day",
    "in order to",
    "it is important to remember that",
    "needless to say",
    "all things considered",
    "for all intents and purposes",
  ];

  const foundFiller = fillerPhrases.filter((f) => fullText.includes(f));
  let snrScore = 10;
  let snrReason = "High signal density with direct, efficient sentence structure.";

  if (foundFiller.length > 0) {
    snrScore = Math.max(5, 10 - foundFiller.length * 2);
    snrReason = `Contains filler phrasing (${foundFiller.join(", ")}). Tightening increases impact.`;
    suggestions.push(`Cut verbose filler like "${foundFiller[0]}" for punchier delivery.`);
  }

  checkItems.push({
    name: "Signal-to-Noise & Conciseness",
    category: "Readability",
    score: snrScore,
    max_score: 10,
    status: snrScore >= 8 ? "pass" : "warning",
    reason: snrReason,
  });

  // ==========================================
  // Aggregate Score Calculation
  // ==========================================
  const totalScoreSum = checkItems.reduce((acc, item) => acc + item.score, 0);
  const quality_score = Math.round(totalScoreSum); // Exactly 0 - 100

  // Build checks key-value map for quick inspection
  const checks: Record<string, string> = {};
  for (const item of checkItems) {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    checks[key] = item.status === "pass" ? "Passed" : item.status === "warning" ? "Warning" : "Failed";
  }

  return {
    quality_score,
    passed: quality_score >= 80,
    check_items: checkItems,
    checks,
    issues,
    suggestions: Array.from(new Set(suggestions)),
  };
}
