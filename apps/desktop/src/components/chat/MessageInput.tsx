import { useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronRight, Mic, Plus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useSendMessage } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { useProviderStatus } from "@/hooks/useProviderConnections";
import { useTranscribeAudio } from "@/hooks/useTranscription";
import { useUsageFetch } from "@/hooks/useUsage";
import { useSkills, type Skill } from "@/hooks/useSkills";
import { CLAUDE_MODELS, FREE_MODELS } from "@/lib/models";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { personaFor } from "@/lib/personas";
import { useRunningStore } from "@/stores/useRunningStore";
import { stopAgentRun } from "@/hooks/useAgentRun";
import { FOCUS_COMPOSER_EVENT, matchesShortcut } from "@/lib/shortcuts";

/** Trailing "@query" at the cursor-less end of the text, if any (e.g. "hey @bu" -> "bu"). */
function trailingMention(text: string): string | null {
  const m = /(?:^|\s)@(\w*)$/.exec(text);
  return m ? m[1] : null;
}

/** Every @id in the text that's actually in the roster, deduped. */
function mentionedIn(text: string, roster: string[]): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/@(\w+)/g)) {
    if (roster.includes(m[1])) found.add(m[1]);
  }
  return [...found];
}

/** Finds a model by id or label substring for the /model slash command. */
function findModel(models: { id: string; label: string }[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    models.find((m) => m.id.toLowerCase() === q || m.label.toLowerCase() === q) ??
    models.find((m) => m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q))
  );
}

function transcriptionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const noSpeech = [
    "No audio captured",
    "Couldn't process the recorded audio",
    "Transcription returned no text",
  ].some((detail) => message.includes(detail));

  return noSpeech
    ? "I didn't hear anything. Try again and speak after tapping the microphone."
    : "Voice transcription isn't available right now. Please try again shortly.";
}

// The Web Speech API isn't implemented in Tauri's webview on any platform,
// so dictation goes through getUserMedia + MediaRecorder (both real webview
// features) and server-side Whisper transcription instead.
const micAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

interface PendingImage {
  id: string;
  mediaType: string;
  data: string;
  previewUrl: string;
}

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SLASH_COMMANDS = [
  { name: "model", usage: "/model <name>", description: "Switch the model for this chat", takesArgument: true },
  { name: "usage", usage: "/usage", description: "Show token usage for this chat", takesArgument: false },
] as const;

// Agent effort: a friendlier 3-position face on the existing maxSteps knob
// (Settings has the raw 1-16 slider) rather than a second setting to keep
// in sync with it.
const EFFORT_STEPS = [4, 8, 16] as const;
const EFFORT_LABELS = ["Low", "Medium", "High"] as const;

function closestEffortIndex(steps: number): number {
  let best = 0;
  let bestDiff = Infinity;
  EFFORT_STEPS.forEach((s, i) => {
    const diff = Math.abs(s - steps);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

function EffortSlider({ index, onChange }: { index: number; onChange: (index: number) => void }) {
  const position = ["1rem", "50%", "calc(100% - 1rem)"][index];

  return (
    <div
      className="relative h-10 w-full shrink-0"
      title={`Effort: ${EFFORT_LABELS[index]}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1 h-8 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200 ease-out"
          style={{ width: position }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-1 flex h-8 items-center justify-between px-4">
        {EFFORT_STEPS.map((step) => (
          <span key={step} className="h-1 w-1 rounded-full bg-white/30" />
        ))}
      </div>
      <span
        className="pointer-events-none absolute top-0 h-10 w-10 -translate-x-1/2 rounded-full bg-foreground shadow-md transition-[left] duration-200 ease-out"
        style={{ left: position }}
      />
      <input
        type="range"
        min={0}
        max={EFFORT_STEPS.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Agent effort"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

// Same button+panel pattern as NewChatMenu: relative wrapper, click-outside
// close, absolute panel. Opens upward since the composer sits at the
// bottom of the window.
function EffortPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const maxSteps = useUIStore((s) => s.maxSteps);
  const setMaxSteps = useUIStore((s) => s.setMaxSteps);
  const index = closestEffortIndex(maxSteps);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="Agent effort settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-secondary pl-2.5 pr-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {EFFORT_LABELS[index]}
        <ChevronRight className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-40 mb-2 w-[296px] rounded-[28px] border border-border bg-popover px-5 pb-[22px] pt-[19px] shadow-lg">
          <p className="mb-3 flex items-center text-lg text-foreground">
            {EFFORT_LABELS[index]}
          </p>
          <EffortSlider index={index} onChange={(i) => setMaxSteps(EFFORT_STEPS[i])} />
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MessageInput({
  onSent,
  conversationTitle,
}: {
  onSent: (mentionedPersonas?: string[]) => void | Promise<void>;
  conversationTitle?: string;
}) {
  const [value, setValue] = useState("");
  const [images, setImages] = useState<PendingImage[]>([]);
  const [listening, setListening] = useState(false);
  const [commandNotice, setCommandNotice] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousConversationRef = useRef<string | null>(null);
  const currentConversationRef = useRef<string | null>(null);

  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const agentRunning = useRunningStore((s) =>
    activeConversationId ? !!s.runs[activeConversationId]?.running : false,
  );
  const sendShortcut = useUIStore((s) => s.shortcuts.sendMessage);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const sendMessage = useSendMessage(activeConversationId);
  const transcribeAudio = useTranscribeAudio();
  const fetchUsage = useUsageFetch();
  const { data: installedSkills = [] } = useSkills();
  const { data: providerStatus } = useProviderStatus();
  const { data: conversations = [] } = useConversations();
  const models = providerStatus?.anthropic_oauth ? [...CLAUDE_MODELS, ...FREE_MODELS] : FREE_MODELS;
  const autoSendOnDictation = useUIStore((s) => s.autoSendOnDictation);
  const isEmpty = !value.trim() && images.length === 0;
  currentConversationRef.current = activeConversationId;

  useEffect(() => {
    if (providerStatus && !providerStatus.anthropic_oauth && selectedModel.startsWith("claude-")) {
      setSelectedModel(FREE_MODELS[0].id);
    }
  }, [providerStatus, selectedModel, setSelectedModel]);

  useEffect(() => {
    const focus = () => textareaRef.current?.focus();
    window.addEventListener(FOCUS_COMPOSER_EVENT, focus);
    return () => window.removeEventListener(FOCUS_COMPOSER_EVENT, focus);
  }, []);

  useEffect(() => {
    if (previousConversationRef.current !== null && previousConversationRef.current !== activeConversationId) {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setImages([]);
      setValue("");
      setInputError(null);
      setMentionQuery(null);
      mediaRecorderRef.current?.stop();
    }
    previousConversationRef.current = activeConversationId;
    // This effect deliberately snapshots the outgoing conversation's images.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const roster = (conversation?.personas?.length ?? 0) > 1 ? conversation!.personas! : [];
  const mentionMatches =
    mentionQuery !== null
      ? roster.filter((id) => personaFor(id).name.toLowerCase().includes(mentionQuery.toLowerCase()))
      : [];
  const slashQuery = /^\/([\w-]*)$/.exec(value)?.[1].toLowerCase() ?? null;
  const commandMatches = slashQuery === null
    ? []
    : SLASH_COMMANDS.filter((command) => command.name.startsWith(slashQuery));
  const skillMatches = slashQuery === null
    ? []
    : installedSkills.filter((skill) => skill.name.toLowerCase().startsWith(slashQuery));
  const commandMenuOpen =
    slashQuery !== null && !SLASH_COMMANDS.some((command) => command.name === slashQuery);

  function pickMention(id: string) {
    setValue((v) => v.replace(/@(\w*)$/, `@${id} `));
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  function pickCommand(command: (typeof SLASH_COMMANDS)[number]) {
    setValue(`/${command.name}${command.takesArgument ? " " : ""}`);
    setInputError(null);
    textareaRef.current?.focus();
  }

  function pickSkill(skill: Skill) {
    setValue(`/${skill.name} `);
    setInputError(null);
    textareaRef.current?.focus();
  }

  async function submit(text: string = value) {
    const trimmed = text.trim();

    if (trimmed.startsWith("/") && activeConversationId) {
      const [command, ...rest] = trimmed.slice(1).split(/\s+/);
      const arg = rest.join(" ");

      if (command === "model") {
        const match = findModel(models, arg);
        if (match) {
          setSelectedModel(match.id);
          setCommandNotice(`Model set to ${match.label}.`);
        } else {
          setCommandNotice(arg ? `No model matching "${arg}".` : "Usage: /model <name>");
        }
        setValue("");
        return;
      }

      if (command === "usage") {
        setCommandNotice("Checking usage...");
        setValue("");
        try {
          const { session, week } = await fetchUsage(activeConversationId);
          setCommandNotice(
            `This conversation: ${session.input_tokens + session.output_tokens} tokens · ` +
              `Past 7 days: ${week.input_tokens + week.output_tokens} tokens`,
          );
        } catch {
          setCommandNotice("Couldn't load usage.");
        }
        return;
      }
    }

    if ((!trimmed && images.length === 0) || !activeConversationId || agentRunning) return;
    setCommandNotice(null);
    setInputError(null);

    const content =
      images.length > 0
        ? JSON.stringify({
            kind: "multimodal",
            text: text.trim(),
            images: images.map(({ mediaType, data }) => ({ media_type: mediaType, data })),
          })
        : text.trim();

    try {
      await sendMessage.mutateAsync(content);
    } catch (err) {
      // Keep the draft and attachments intact so a transient send failure
      // does not destroy content the user has not successfully submitted.
      setInputError(err instanceof Error ? err.message : "Message failed to send.");
      return;
    }

    const mentioned = mentionedIn(trimmed, roster);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMentionQuery(null);
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    void onSent(mentioned.length > 0 ? mentioned : undefined);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setInputError(null);
    const remaining = MAX_IMAGE_COUNT - images.length;
    const candidates = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (candidates.length > remaining) setInputError(`You can attach up to ${MAX_IMAGE_COUNT} images.`);
    for (const file of candidates.slice(0, Math.max(0, remaining))) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_BYTES) {
        setInputError(`${file.name} is larger than 5 MB.`);
        continue;
      }
      const data = await fileToBase64(file);
      setImages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), mediaType: file.type, data, previewUrl: URL.createObjectURL(file) },
      ]);
    }
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  async function toggleListening() {
    if (!micAvailable) return;
    if (listening) {
      mediaRecorderRef.current?.stop();
      return;
    }

    let stream: MediaStream;
    try {
      // Explicit constraints, not `audio: true`: WebKitGTK's GStreamer audio
      // source has a caps-negotiation bug on some setups (logs
      // "gst_value_collect_int_range" assertions) when left to auto-pick a
      // rate/channel range, which silently yields zero captured samples.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
    } catch (err) {
      setInputError(err instanceof Error ? err.message : "Microphone access failed.");
      return; // permission denied, or no mic device
    }

    // The backend transcodes whatever container arrives through ffmpeg, so
    // no need to chase a mimeType Gemini would accept directly here.
    const recorder = new MediaRecorder(stream);
    const recordingConversationId = activeConversationId;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onerror = () => setInputError("Audio recording failed.");
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setListening(false);
      if (currentConversationRef.current !== recordingConversationId) return;
      const mimeType = recorder.mimeType.split(";")[0] || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      try {
        const transcript = await transcribeAudio.mutateAsync(blob);
        if (!transcript.trim()) {
          setInputError("I didn't hear anything. Try again and speak after tapping the microphone.");
          return;
        }
        // `value` here is the render-time snapshot, so compute the merged text
        // once and hand it straight to submit. The state update is async and
        // wouldn't be visible to a submit() called right after.
        const merged = value ? `${value} ${transcript}` : transcript;
        setValue(merged);
        if (autoSendOnDictation) submit(merged);
      } catch (err) {
        // Transcription failed server-side; leave the input as it was.
        setInputError(transcriptionErrorMessage(err));
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setListening(true);
  }

  return (
    <div className="relative px-2 pb-4 pt-2">
      {mentionQuery !== null && mentionMatches.length > 0 && (
        <div className="absolute bottom-full left-6 z-10 mb-1 w-48 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
          {mentionMatches.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => pickMention(id)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
            >
              <PersonaFace persona={id} size={20} />
              {personaFor(id).name}
            </button>
          ))}
        </div>
      )}
      {commandMenuOpen && (commandMatches.length > 0 || skillMatches.length > 0) && (
        <div
          role="listbox"
          aria-label="Slash commands"
          className="absolute bottom-full left-2 z-10 mb-1 w-72 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg"
        >
          {commandMatches.map((command) => (
            <button
              key={command.name}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => pickCommand(command)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent"
            >
              <span className="mt-0.5 font-mono text-sm font-medium text-foreground">{command.usage}</span>
              <span className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
                {command.description}
              </span>
            </button>
          ))}
          {skillMatches.length > 0 && (
            <p className="border-t border-border px-3 pb-1 pt-2 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
              Installed skills
            </p>
          )}
          {skillMatches.map((skill) => (
            <button
              key={skill.id}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => pickSkill(skill)}
              className="flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-accent"
            >
              <span className="mt-0.5 shrink-0 font-mono text-sm font-medium text-foreground">
                /{skill.name}
              </span>
              <span className="min-w-0 flex-1 text-xs leading-5 text-muted-foreground">
                {skill.description || "Run this skill"}
              </span>
            </button>
          ))}
        </div>
      )}
      <form
        className="rounded-[28px] border border-border bg-card px-2 py-2 transition-colors focus-within:border-ring"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {commandNotice && (
          <p className="mb-2 px-1 text-xs text-muted-foreground">{commandNotice}</p>
        )}
        {inputError && <p role="alert" className="mb-2 px-1 text-xs text-destructive">{inputError}</p>}

        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <img src={img.previewUrl} alt="Attached preview" className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label="Remove attached image"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach images"
            disabled={!activeConversationId || agentRunning}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (inputError) setInputError(null);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              if (commandNotice) setCommandNotice(null);
              setMentionQuery(roster.length > 0 ? trailingMention(e.target.value) : null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && mentionQuery !== null) {
                setMentionQuery(null);
                return;
              }
              if (e.key !== "Enter") return;
              if (commandMenuOpen && (commandMatches.length > 0 || skillMatches.length > 0)) {
                e.preventDefault();
                if (commandMatches[0]) pickCommand(commandMatches[0]);
                else pickSkill(skillMatches[0]);
                return;
              }
              if (mentionQuery !== null && mentionMatches.length > 0) {
                e.preventDefault();
                pickMention(mentionMatches[0]);
                return;
              }
              if (matchesShortcut(e.nativeEvent, sendShortcut)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              conversationTitle
                ? `Message ${conversationTitle}`
                : "Message the agent..."
            }
            rows={1}
            disabled={!activeConversationId || agentRunning}
            className="max-h-40 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-[0.9375rem] leading-5 text-foreground placeholder:text-[#777777] focus:outline-none disabled:cursor-not-allowed"
          />

          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            ariaLabel="Model"
            className="h-8 shrink-0 rounded-full border-none bg-secondary pl-2.5 pr-6 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            chevronClassName="right-1.5 h-3 w-3"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                <span className="flex items-center gap-1.5">
                  <img src={m.logo} alt="" className="h-3.5 w-3.5 shrink-0" />
                  {m.label}
                </span>
              </option>
            ))}
          </Select>

          <EffortPopover />

          {isEmpty && micAvailable && !agentRunning ? (
            <button
              type="button"
              onClick={toggleListening}
              aria-label={listening ? "Stop recording" : "Start dictation"}
              disabled={!activeConversationId || agentRunning || transcribeAudio.isPending}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-all active:scale-90 disabled:opacity-40",
                listening && "bg-destructive text-destructive-foreground",
              )}
            >
              {transcribeAudio.isPending ? <Spinner className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : agentRunning ? (
            <button
              type="button"
              aria-label="Stop response"
              onClick={() => activeConversationId && stopAgentRun(activeConversationId)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-90"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send message"
              disabled={isEmpty || !activeConversationId || sendMessage.isPending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-90 disabled:opacity-40"
            >
              {sendMessage.isPending ? (
                <Spinner className="h-4 w-4 text-primary-foreground" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
