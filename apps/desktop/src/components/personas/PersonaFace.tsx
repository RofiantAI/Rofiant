import { personaFor } from "@/lib/personas";
import { cn } from "@/lib/utils";

// Shape is pure CSS: a border-radius for the round ones, a clip-path for the
// triangle. No SVG, no sprite sheet. Idle bob + blink live in index.css
// (`persona-face` / `persona-eye`), so Appearance > Reduce motion kills them
// with everything else.
const TRIANGLE_POINTS: [number, number][] = [
  [0.5, 0.02],
  [0.98, 0.96],
  [0.02, 0.96],
];

// clip-path: polygon() has no corner-radius, so round each vertex by hand:
// path() only accepts px, so this is size-dependent and built per render
// rather than living in the static SHAPE_STYLE table below.
function roundedTrianglePath(size: number): string {
  const r = size * 0.14;
  const pts = TRIANGLE_POINTS.map(([fx, fy]) => [fx * size, fy * size]);
  const seg = pts.map((p, i) => {
    const prev = pts[(i + 2) % 3];
    const next = pts[(i + 1) % 3];
    const toward = ([px, py]: number[]) => {
      const dx = px - p[0];
      const dy = py - p[1];
      const len = Math.hypot(dx, dy);
      return [p[0] + (dx / len) * r, p[1] + (dy / len) * r];
    };
    return { start: toward(prev), vertex: p, end: toward(next) };
  });
  const d = seg
    .map((s, i) => `${i === 0 ? "M" : "L"} ${s.start[0]} ${s.start[1]} Q ${s.vertex[0]} ${s.vertex[1]} ${s.end[0]} ${s.end[1]}`)
    .join(" ");
  return `path('${d} Z')`;
}

const SHAPE_STYLE: Record<string, React.CSSProperties> = {
  circle: { borderRadius: "50%" },
  leaf: { borderRadius: "56% 56% 56% 14%" },
};

export function PersonaFace({
  persona,
  size = 40,
  className,
  style,
}: {
  persona: string | undefined;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const p = personaFor(persona);
  const eyeWidth = Math.max(2, size * 0.11);
  const eyeHeight = Math.max(4, size * 0.28);
  // Same bot blinks in step wherever it appears; different bots don't.
  const delay = `${(PERSONA_DELAYS[p.id] ?? 0).toFixed(1)}s`;

  return (
    <div
      className={cn("persona-face flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: p.color,
        animationDelay: delay,
        ...(p.shape === "triangle" ? { clipPath: roundedTrianglePath(size) } : SHAPE_STYLE[p.shape]),
        ...style,
      }}
    >
      <div
        className="flex items-center"
        style={{
          gap: size * 0.17,
          // Triangle's usable area is its lower half, so the eyes sit below center.
          marginTop: p.shape === "triangle" ? size * 0.16 : 0,
        }}
      >
        {[-16, 16].map((angle) => (
          <span key={angle} style={{ transform: `rotate(${angle}deg)` }}>
            <span
              className="persona-eye block"
              style={{ width: eyeWidth, height: eyeHeight, animationDelay: delay }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

const PERSONA_DELAYS: Record<string, number> = {
  agent: 0,
  builder: 1.3,
  reviewer: 2.1,
  explainer: 0.7,
  duck: 2.8,
};
