import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { AgentTimeline } from "@/components/chat/AgentTimeline";
import { OnboardingScreen } from "@/components/chat/OnboardingScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/useUIStore";
import { useMessages } from "@/hooks/useMessages";
import { useToolCalls } from "@/hooks/useToolCalls";
import { useConversations } from "@/hooks/useConversations";
import { DEFAULT_PERSONA, personaFor } from "@/lib/personas";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { useAgentRun } from "@/hooks/useAgentRun";
import { ApprovalDialog } from "@/components/chat/ApprovalDialog";
import type { Conversation, ToolCall } from "@/types/chat";

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3.5 w-16" />
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
    </div>
  );
}

// Bot's opening card, shown until the first message lands. Cheaper than
// seeding a greeting row: no fake history for the model to answer to.
function BotGreeting({ conversation }: { conversation?: Conversation }) {
  const roster = conversation?.personas?.length ? conversation.personas : null;
  const bot = personaFor(conversation?.persona ?? DEFAULT_PERSONA);

  if (roster && roster.length > 1) {
    const bots = roster.map(personaFor);
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {bots.map((member) => (
            <PersonaFace key={member.id} persona={member.id} size={56} />
          ))}
        </div>
        <p className="mt-4 text-base font-medium text-foreground">
          {bots.map((member) => member.name).join(", ")}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Send a message to start the group chat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <PersonaFace persona={bot.id} size={72} />
      <p className="mt-4 text-base font-medium text-foreground">{bot.name}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{bot.tagline}</p>
    </div>
  );
}

export function ChatView() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useMessages(activeConversationId);
  const { data: conversations = [], error: conversationsError } = useConversations();
  const { data: allToolCalls = [] } = useToolCalls(activeConversationId);
  const agentRun = useAgentRun(activeConversationId);

  // A tool call carries no message id — only a conversation id and a
  // timestamp — so a completed message's own trace is the calls that
  // landed between it and the previous message, not a real foreign key.
  const toolCallsByMessageId = useMemo(() => {
    const map = new Map<string, ToolCall[]>();
    let since = -Infinity;
    for (const m of messages) {
      const at = Date.parse(m.created_at);
      if (m.role === "assistant") {
        map.set(
          m.id,
          allToolCalls.filter((t) => {
            const t_at = Date.parse(t.created_at);
            return t_at > since && t_at <= at;
          }),
        );
      }
      since = at;
    }
    return map;
  }, [messages, allToolCalls]);

  const showTimestampsSetting = useUIStore((s) => s.showTimestamps);
  // A timestamp above every message is clutter — only mark the first
  // message of a new burst (a gap of 10+ minutes since the previous one).
  const TIMESTAMP_GAP_MS = 10 * 60 * 1000;
  const messagesWithTimestamp = useMemo(() => {
    const ids = new Set<string>();
    if (!showTimestampsSetting) return ids;
    let prevAt = -Infinity;
    for (const m of messages) {
      const at = Date.parse(m.created_at);
      if (at - prevAt > TIMESTAMP_GAP_MS) ids.add(m.id);
      prevAt = at;
    }
    return ids;
  }, [messages, showTimestampsSetting]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [activeConversationId, messages.length, agentRun.draft, agentRun.running]);

  const density = useUIStore((s) => s.density);
  const chatWidth = useUIStore((s) => s.chatWidth);
  const autoOpenPanelOnTool = useUIStore((s) => s.autoOpenPanelOnTool);
  const setWorkspacePanelOpen = useUIStore((s) => s.setWorkspacePanelOpen);
  const setWorkspaceTab = useUIStore((s) => s.setWorkspaceTab);

  const toolCallsStarted = agentRun.liveToolCalls.length > 0;
  useEffect(() => {
    if (!autoOpenPanelOnTool || !toolCallsStarted) return;
    setWorkspacePanelOpen(true);
    setWorkspaceTab("agent");
  }, [autoOpenPanelOnTool, toolCallsStarted, setWorkspacePanelOpen, setWorkspaceTab]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isGroup = (activeConversation?.personas?.length ?? 0) > 1;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto px-6",
            chatWidth === "wide" ? "max-w-5xl" : "max-w-3xl",
            density === "compact" ? "space-y-2 py-4" : "space-y-5 py-8",
          )}
        >
          {conversationsError || messagesError ? (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Couldn't load chat data. Check your connection and try again.
            </p>
          ) : !activeConversationId ? (
            conversations.length === 0 ? (
              <OnboardingScreen />
            ) : (
              <p className="text-sm text-muted-foreground">Select or create a chat to get started.</p>
            )
          ) : messagesLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          ) : messages.length === 0 && !agentRun.running ? (
            <BotGreeting conversation={activeConversation} />
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  group={isGroup}
                  toolCalls={toolCallsByMessageId.get(m.id)}
                  showTimestamp={messagesWithTimestamp.has(m.id)}
                />
              ))}
              {agentRun.running && (
                <>
                  <AgentTimeline calls={agentRun.liveToolCalls} thinking={!agentRun.draft} />
                  {agentRun.draft && (
                    <MessageBubble
                      group={isGroup}
                      message={{
                        id: "draft",
                        conversation_id: activeConversationId ?? "",
                        role: "assistant",
                        content: agentRun.draft,
                        persona: agentRun.draftPersona,
                        created_at: new Date().toISOString(),
                      }}
                    />
                  )}
                  <TypingIndicator startedAt={agentRun.startedAt} />
                </>
              )}
            </>
          )}
          {agentRun.error && (
            <p className="text-sm text-destructive">Agent failed: {agentRun.error}</p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <MessageInput
        onSent={(conversationId, mentionedPersonas) => agentRun.run(mentionedPersonas, conversationId)}
        conversationTitle={
          activeConversation && activeConversation.persona !== DEFAULT_PERSONA
            ? personaFor(activeConversation.persona).name
            : activeConversation?.title
        }
      />
      {agentRun.pendingApproval && <ApprovalDialog approval={agentRun.pendingApproval} />}
    </div>
  );
}
