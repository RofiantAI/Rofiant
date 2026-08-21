import { useRef, useState } from "react";
import { ArrowUp, Mic, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useSendMessage } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { useProviderStatus } from "@/hooks/useProviderConnections";
import { useTranscribeAudio } from "@/hooks/useTranscription";
import { useUsageFetch } from "@/hooks/useUsage";
import { Select } from "@/components/ui/select";
import { CLAUDE_MODELS, FREE_MODELS } from "@/lib/models";
import { Spinner } from "@/components/ui/spinner";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { personaFor } from "@/lib/personas";

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
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const sendOnEnter = useUIStore((s) => s.sendOnEnter);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const sendMessage = useSendMessage(activeConversationId);
  const transcribeAudio = useTranscribeAudio();
  const fetchUsage = useUsageFetch();
  const { data: providerStatus } = useProviderStatus();
  const { data: conversations = [] } = useConversations();
  const models = providerStatus?.anthropic_oauth ? [...CLAUDE_MODELS, ...FREE_MODELS] : FREE_MODELS;
  const autoSendOnDictation = useUIStore((s) => s.autoSendOnDictation);
  const isEmpty = !value.trim() && images.length === 0;

  const conversation = conversations.find((c) => c.id === activeConversationId);
  const roster = (conversation?.personas?.length ?? 0) > 1 ? conversation!.personas! : [];
  const mentionMatches =
    mentionQuery !== null
      ? roster.filter((id) => personaFor(id).name.toLowerCase().includes(mentionQuery.toLowerCase()))
      : [];

  function pickMention(id: string) {
    setValue((v) => v.replace(/@(\w*)$/, `@${id} `));
    setMentionQuery(null);
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

    if ((!trimmed && images.length === 0) || !activeConversationId) return;
    setCommandNotice(null);

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
    } catch {
      // Keep the draft and attachments intact so a transient send failure
      // does not destroy content the user has not successfully submitted.
      return;
    }

    const mentioned = mentionedIn(trimmed, roster);
    setValue("");
    setMentionQuery(null);
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    void onSent(mentioned.length > 0 ? mentioned : undefined);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
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
      console.error("getUserMedia failed:", err);
      return; // permission denied, or no mic device
    }

    // The backend transcodes whatever container arrives through ffmpeg, so
    // no need to chase a mimeType Gemini would accept directly here.
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onerror = (e) => console.error("recorder error:", e);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setListening(false);
      const mimeType = recorder.mimeType.split(";")[0] || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      try {
        const transcript = await transcribeAudio.mutateAsync(blob);
        // `value` here is the render-time snapshot, so compute the merged text
        // once and hand it straight to submit. The state update is async and
        // wouldn't be visible to a submit() called right after.
        const merged = value ? `${value} ${transcript}` : transcript;
        setValue(merged);
        if (autoSendOnDictation) submit(merged);
      } catch (err) {
        // Transcription failed server-side; leave the input as it was.
        console.error("Transcription failed:", err);
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setListening(true);
  }

  return (
    <div className="relative px-6 pb-6 pt-2">
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
      <form
        className="rounded-[28px] bg-secondary px-4 py-2.5 transition-shadow focus-within:shadow-[0_0_0_1px_hsl(var(--ring))]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {commandNotice && (
          <p className="mb-2 px-1 text-xs text-muted-foreground">{commandNotice}</p>
        )}

        {images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <img src={img.previewUrl} className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (commandNotice) setCommandNotice(null);
              setMentionQuery(roster.length > 0 ? trailingMention(e.target.value) : null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && mentionQuery !== null) {
                setMentionQuery(null);
                return;
              }
              if (e.key !== "Enter") return;
              if (mentionQuery !== null && mentionMatches.length > 0) {
                e.preventDefault();
                pickMention(mentionMatches[0]);
                return;
              }
              const shouldSend = sendOnEnter ? !e.shiftKey : e.metaKey || e.ctrlKey;
              if (shouldSend) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              conversationTitle
                ? `Message ${conversationTitle}`
                : sendOnEnter
                  ? "Message the agent..."
                  : "Message the agent... (Cmd/Ctrl+Enter to send)"
            }
            rows={1}
            disabled={!activeConversationId}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />

          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            className="rounded-full border-none bg-transparent py-1.5 pl-2 pr-6 text-xs text-muted-foreground hover:text-foreground"
            chevronClassName="right-1 h-3 w-3"
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

          {isEmpty && micAvailable ? (
            <button
              type="button"
              onClick={toggleListening}
              disabled={!activeConversationId || transcribeAudio.isPending}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-all active:scale-90 disabled:opacity-40",
                listening && "bg-destructive text-destructive-foreground",
              )}
            >
              {transcribeAudio.isPending ? <Spinner className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="submit"
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
