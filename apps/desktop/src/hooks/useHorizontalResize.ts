import { useCallback } from "react";

export function useHorizontalResize({
  width,
  setWidth,
  min,
  max,
  fromRight = false,
}: {
  width: number;
  setWidth: (width: number) => void;
  min: number;
  max: number;
  fromRight?: boolean;
}) {
  return useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;

      function onMouseMove(ev: MouseEvent) {
        const delta = fromRight ? startX - ev.clientX : ev.clientX - startX;
        setWidth(Math.min(max, Math.max(min, startWidth + delta)));
      }
      function onMouseUp() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, setWidth, min, max, fromRight],
  );
}
