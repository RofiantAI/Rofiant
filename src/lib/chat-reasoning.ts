const NATIVE_REASONING_MODELS = new Set([
  "openai/gpt-oss-120b",
  "qwen/qwen3-32b",
  "qwen/qwen3.6-27b",
  "qwen-qwq-32b",
  "deepseek-r1-distill-llama-70b",
]);

const REASONING_LABEL = /(?:^|\n)\s*(?:\*\*)?Reasoning:(?:\*\*)?\s*/i;
const ANSWER_LABEL = /(?:^|\n)\s*(?:\*\*)?Answer:(?:\*\*)?\s*/i;

export function supportsNativeReasoning(model: string) {
  return NATIVE_REASONING_MODELS.has(model);
}

// Groq only accepts graded reasoning_effort ("low"/"medium"/"high") on select
// models; others (e.g. qwen3.6-27b) reject anything but "none"/"default".
const GRADED_REASONING_EFFORT_MODELS = new Set(["openai/gpt-oss-120b"]);

export function reasoningEffortFor(model: string): "medium" | "default" {
  return GRADED_REASONING_EFFORT_MODELS.has(model) ? "medium" : "default";
}

export function stripThinkingTags(text: string) {
  return text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>\s*/gi, "").trim();
}

export function splitThinkingFromText(raw: string): {
  thinking: string;
  answer: string;
  isThinking: boolean;
} {
  const openTag = raw.match(/<think(?:ing)?>/i)?.[0];
  if (!openTag) {
    return { thinking: "", answer: raw, isThinking: false };
  }
  const closeTag = `</${openTag.slice(1, -1)}>`;

  const start = raw.indexOf(openTag);
  const contentStart = start + openTag.length;
  const end = raw.indexOf(closeTag, contentStart);

  if (end === -1) {
    return {
      thinking: raw.slice(contentStart).trimStart(),
      answer: "",
      isThinking: true,
    };
  }

  return {
    thinking: raw.slice(contentStart, end).trim(),
    answer: raw.slice(end + closeTag.length).trim(),
    isThinking: false,
  };
}

/** Split model output into thinking vs user-facing answer. */
export function parseAssistantOutput(raw: string): {
  thinking: string;
  answer: string;
  isThinking: boolean;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { thinking: "", answer: "", isThinking: false };
  }

  const tagged = splitThinkingFromText(trimmed);
  if (tagged.thinking || tagged.isThinking) {
    return tagged;
  }

  const answerParts = trimmed.split(ANSWER_LABEL);
  if (answerParts.length >= 2) {
    const thinking = answerParts[0].replace(REASONING_LABEL, "").trim();
    const answer = answerParts.slice(1).join("").trim();
    return { thinking, answer, isThinking: false };
  }

  if (REASONING_LABEL.test(trimmed)) {
    const thinking = trimmed.replace(REASONING_LABEL, "").trim();
    return { thinking, answer: "", isThinking: true };
  }

  return { thinking: "", answer: trimmed, isThinking: false };
}

/** Final answer text only — safe to show users and persist. */
export function cleanAnswerText(raw: string): string {
  const { answer, isThinking } = parseAssistantOutput(raw);
  if (isThinking) return "";
  if (answer) return answer;
  return stripThinkingTags(raw).trim();
}
