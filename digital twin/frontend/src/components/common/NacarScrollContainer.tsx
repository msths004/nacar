import React, { useCallback, useEffect, useRef, useState } from "react";

interface NacarScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenedor con botón flotante de arrastre integrado dentro de la misma UI
 * (mismo comportamiento que #c-scroll y #c-thumb en desarrollo-nacar-pag.html).
 * Solo muestra el thumb cuando el contenido interno excede la altura disponible.
 */
export const NacarScrollContainer: React.FC<NacarScrollContainerProps> = ({ children, className = "" }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [thumbY, setThumbY] = useState(0);
  const grabOffsetRef = useRef(0);

  const updateScrollState = useCallback(() => {
    const el = boxRef.current;
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const overflow = maxScroll > 6;
    setHasOverflow(overflow);
    if (overflow && rail && thumb) {
      const ratio = Math.max(0, Math.min(1, el.scrollTop / Math.max(1, maxScroll)));
      const maxThumbY = Math.max(0, rail.clientHeight - thumb.offsetHeight);
      setThumbY(ratio * maxThumbY);
    } else {
      setThumbY(0);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", updateScrollState);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, children]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const thumb = thumbRef.current;
    if (!thumb) return;
    setDragging(true);
    grabOffsetRef.current = e.clientY - thumb.getBoundingClientRect().top;
    thumb.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const el = boxRef.current;
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!el || !rail || !thumb) return;
    const railRect = rail.getBoundingClientRect();
    const maxThumbY = Math.max(1, railRect.height - thumb.offsetHeight);
    const ratio = Math.max(0, Math.min(1, (e.clientY - railRect.top - grabOffsetRef.current) / maxThumbY));
    setThumbY(ratio * maxThumbY);
    el.scrollTop = ratio * Math.max(0, el.scrollHeight - el.clientHeight);
  };

  const stopDrag = () => {
    if (dragging) setDragging(false);
  };

  return (
    <div className={`relative flex flex-col min-h-0 ${className}`}>
      <div
        ref={boxRef}
        onScroll={updateScrollState}
        className="flex-1 min-h-0 overflow-y-auto no-native-scroll pr-1"
      >
        <div>{children}</div>
      </div>

      <div
        ref={railRef}
        aria-hidden="true"
        className={`nacar-drag-rail transition-opacity duration-200 ${
          hasOverflow ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          ref={thumbRef}
          title="Arrastra para desplazarte"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          style={{ transform: `translate3d(0, ${thumbY.toFixed(1)}px, 0)` }}
          className={`nacar-drag-thumb ${dragging ? "dragging" : ""}`}
        />
      </div>
    </div>
  );
};
