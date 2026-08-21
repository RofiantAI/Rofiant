// The "Working…" spinner from RofiantDesktop (Dotm3x3_20 + grad-sunset),
// rebuilt as plain CSS instead of porting its dot-matrix engine. An L-shaped
// corner glyph rotates 90° per 180ms step through a 3x3 grid; each dot's
// on/off sequence over the four turns is the same square wave at a different
// offset, so one keyframe set plus a per-dot delay reproduces it exactly.
// Delay is in steps: 0 = top-left pair, 3 = the last corner to light.
const DOT_STEP_DELAY = [0, 0, 1, 3, null, 1, 3, 2, 2];

export function TypingIndicator({ size = 14, dotSize = 3 }: { size?: number; dotSize?: number }) {
  const gap = (size - 3 * dotSize) / 2;

  return (
    <div className="flex animate-in fade-in items-center gap-2 px-1 py-2 text-xs text-muted-foreground duration-300">
      <div className="grid grid-cols-3" style={{ width: size, height: size, gap }}>
        {DOT_STEP_DELAY.map((step, i) => (
          <span
            key={i}
            className="dot-spin block"
            style={{
              width: dotSize,
              height: dotSize,
              // The center dot is never part of the glyph: it stays dim.
              ...(step === null
                ? { opacity: 0.09, animation: "none" }
                : { animationDelay: `${step * 0.15}s` }),
            }}
          />
        ))}
      </div>
      Working…
    </div>
  );
}
