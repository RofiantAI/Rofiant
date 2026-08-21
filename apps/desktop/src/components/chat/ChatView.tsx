import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { OnboardingScreen } from "@/components/chat/OnboardingScreen";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/useUIStore";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { DEFAULT_PERSONA, personaFor } from "@/lib/personas";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { useAgentRun } from "@/hooks/useAgentRun";

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
function BotGreeting({ persona }: { persona: string }) {
  const bot = personaFor(persona);
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
  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeConversationId);
  const { data: conversations = [] } = useConversations();
  const agentRun = useAgentRun(activeConversationId);

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
          {!activeConversationId ? (
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
            <BotGreeting persona={activeConversation?.persona ?? DEFAULT_PERSONA} />
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} group={isGroup} />
              ))}
              {agentRun.running &&
                (agentRun.draft ? (
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
                ) : (
                  <TypingIndicator />
                ))}
            </>
          )}
          {agentRun.error && (
            <p className="text-sm text-destructive">Agent failed: {agentRun.error}</p>
          )}
        </div>
      </div>
      <MessageInput
        onSent={agentRun.run}
        conversationTitle={
          activeConversation && activeConversation.persona !== DEFAULT_PERSONA
            ? personaFor(activeConversation.persona).name
            : activeConversation?.title
        }
      />
    </div>
  );
}
