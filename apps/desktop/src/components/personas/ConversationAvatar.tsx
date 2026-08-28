import { PersonaFace } from "@/components/personas/PersonaFace";
import type { Conversation } from "@/types/chat";

// Facepile positions as {top,left,right,bottom} fractions of the container
// (only the two that anchor each face are set). 2 bots: diagonal pair. 3+:
// one on top, two below — classic triangular cluster, everything contained
// inside the circular mask so nothing bleeds past the row.
const LAYOUTS: Record<number, Array<Partial<Record<"top" | "left" | "right" | "bottom", number>>>> = {
  2: [
    { top: 0, left: 0 },
    { bottom: 0, right: 0 },
  ],
  3: [
    { top: 0, left: 0.2 },
    { bottom: 0, left: 0 },
    { bottom: 0, right: 0 },
  ],
};

// Dot size scales with the avatar so it stays proportionate at every
// call site (sidebar row: 48/40, wherever else this gets reused).
function WorkingDot({ size }: { size: number }) {
  const dot = Math.max(8, size * 0.28);
  return (
    <span
      className="absolute rounded-full bg-emerald-500 ring-2 ring-sidebar"
      style={{ width: dot, height: dot, bottom: -dot * 0.4, right: -dot * 0.4, zIndex: 10 }}
    />
  );
}

export function ConversationAvatar({
  conversation,
  size,
  working = false,
}: {
  conversation: Pick<Conversation, "persona" | "personas">;
  size: number;
  working?: boolean;
}) {
  const roster = conversation.personas?.length ? conversation.personas : null;
  if (!roster)
    return (
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <PersonaFace persona={conversation.persona} size={size} />
        {working && <WorkingDot size={size} />}
      </div>
    );

  const shown = roster.slice(0, 3);
  const layout = LAYOUTS[shown.length] ?? LAYOUTS[3];
  const faceSize = shown.length === 2 ? size * 0.62 : size * 0.52;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-secondary"
      style={{ width: size, height: size }}
    >
      {working && <WorkingDot size={size} />}
      {shown.map((id, i) => {
        const pos = layout[i];
        return (
          <PersonaFace
            key={id}
            persona={id}
            size={faceSize}
            className="absolute rounded-full ring-2 ring-sidebar"
            style={{
              top: pos.top !== undefined ? pos.top * size : undefined,
              bottom: pos.bottom !== undefined ? pos.bottom * size : undefined,
              left: pos.left !== undefined ? pos.left * size : undefined,
              right: pos.right !== undefined ? pos.right * size : undefined,
              zIndex: i + 1,
            }}
          />
        );
      })}
    </div>
  );
}
