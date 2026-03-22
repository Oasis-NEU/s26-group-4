import { useState, useRef, useCallback, useEffect } from "react";

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PERSPECTIVE = 800; // CSS perspective value — lower = more dramatic 3D curve, higher = flatter


// ============================================================
// WheelColumn — A single scrollable column in the picker.
//
// Props:
//   items         — array of strings to display
//   selectedIndex — which item index is currently selected
//   onChange      — callback fired with the new index when selection changes
//   label         — optional header text above the column
// ============================================================
function WheelColumn({ items, selectedIndex, onChange, label }) {

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const velocity = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef(null);
  const hasMoved = useRef(false);        //Track if pointer actually moved during a drag
  const scrollAccum = useRef(0);         //Accumulate small scroll deltas from trackpad
  const scrollTimeout = useRef(null);    //Debounce timer for snapping after scroll ends

  const [offset, setOffset] = useState(-selectedIndex * ITEM_HEIGHT);

  useEffect(() => {
    setOffset(-selectedIndex * ITEM_HEIGHT);
  }, [selectedIndex]);


  // ============================================================
  // Helper: clamp an offset to valid bounds (hard stop at edges).
  // Used everywhere we update offset to prevent overscroll.
  // [FIX #1] — This is the key fix. Instead of only clamping at
  // snap time, we clamp during drag and momentum too, so the user
  // never sees empty space beyond the first/last item.
  // ============================================================
  const clampOffset = useCallback((off) => {
    const max = 0;
    const min = -(items.length - 1) * ITEM_HEIGHT;
    return Math.max(min, Math.min(max, off));
  }, [items.length]);


  // ============================================================
  // clampAndSnap — Clamp + round to nearest item. Called when
  // scrolling finishes (drag release, momentum end, scroll wheel).
  // ============================================================
  const clampAndSnap = useCallback(
    (rawOffset) => {
      const clamped = clampOffset(rawOffset);
      const snapped = Math.round(clamped / ITEM_HEIGHT) * ITEM_HEIGHT;
      const newIndex = Math.round(-snapped / ITEM_HEIGHT);

      setOffset(snapped);

      if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
        onChange(newIndex);
      }
      return snapped;
    },
    [clampOffset, items.length, selectedIndex, onChange]
  );


  // ============================================================
  // momentumDecay — Flick physics with friction.
  // ============================================================
  const momentumDecay = useCallback(
    (currentOffset, currentVelocity) => {
      if (Math.abs(currentVelocity) < 0.5) {
        clampAndSnap(currentOffset);
        return;
      }

      const friction = 0.95;
      const nextVelocity = currentVelocity * friction;
      const nextOffset = clampOffset(currentOffset + nextVelocity);

      // If we hit the edge, stop momentum immediately and snap
      if (nextOffset === clampOffset(currentOffset) && Math.abs(nextVelocity) > 0.5) {
        // We're at the boundary and still have velocity — kill it
        clampAndSnap(nextOffset);
        return;
      }

      setOffset(nextOffset);

      animFrame.current = requestAnimationFrame(() =>
        momentumDecay(nextOffset, nextVelocity)
      );
    },
    [clampAndSnap, clampOffset]
  );


  // ============================================================
  // POINTER EVENT HANDLERS
  //
  // [FIX #2] We track `hasMoved` to distinguish a click (pointer
  // down + up with no movement) from a drag. On desktop, pointer
  // capture can swallow click events, so we handle click-to-select
  // inside handlePointerUp when hasMoved is false.
  // ============================================================

  const handlePointerDown = (e) => {
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    isDragging.current = true;
    hasMoved.current = false;            // [FIX #2] Reset — hasn't moved yet
    startY.current = e.clientY;
    startOffset.current = offset;
    velocity.current = 0;
    lastY.current = e.clientY;
    lastTime.current = Date.now();

    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;

    const dy = e.clientY - startY.current;

    // [FIX #2] Mark as a drag if the pointer moved more than 3px
    if (Math.abs(dy) > 3) {
      hasMoved.current = true;
    }

    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.clientY - lastY.current) / dt * 16;
    }
    lastY.current = e.clientY;
    lastTime.current = now;

    // [FIX #1] Clamp during drag so you can't scroll past the edges
    setOffset(clampOffset(startOffset.current + dy));
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // [FIX #2] If the pointer didn't move, treat it as a click.
    // Figure out which item was clicked based on the pointer Y position.
    if (!hasMoved.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickY = e.clientY - rect.top;                  // Y position within the container
        const centerY = PICKER_HEIGHT / 2;                     // Center of the container
        const deltaFromCenter = clickY - centerY;              // How far above/below center was clicked
        const indexOffset = Math.round(deltaFromCenter / ITEM_HEIGHT); // How many items away from current
        const currentCenter = Math.round(-offset / ITEM_HEIGHT);
        const clickedIndex = currentCenter + indexOffset;

        if (clickedIndex >= 0 && clickedIndex < items.length) {
          const newOffset = -clickedIndex * ITEM_HEIGHT;
          setOffset(newOffset);
          onChange(clickedIndex);
        }
      }
      return;
    }

    // Normal drag release — momentum or snap
    if (Math.abs(velocity.current) > 2) {
      momentumDecay(offset, velocity.current);
    } else {
      clampAndSnap(offset);
    }
  };


  // ============================================================
  // SCROLL WHEEL / TRACKPAD HANDLER
  //
  // [FIX #3] We attach a native event listener with { passive: false }
  // so that preventDefault() actually works and stops the page from
  // scrolling. React's onWheel is passive by default in modern browsers,
  // which means preventDefault() is ignored.
  //
  // [FIX #4] We accumulate small scroll deltas and debounce the snap.
  // Trackpads send many tiny deltaY values (1-5px each) over hundreds
  // of milliseconds. The old code tried to snap on every single event,
  // which meant small gestures got rounded away to nothing. Now we:
  //   1. Accumulate deltas into scrollAccum
  //   2. Move the wheel smoothly on every event
  //   3. Only snap to the nearest item 150ms after scrolling stops
  // ============================================================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();   // [FIX #3] Works because { passive: false }
      e.stopPropagation();  // [FIX #3] Prevent any parent scroll containers from scrolling

      if (animFrame.current) cancelAnimationFrame(animFrame.current);

      // [FIX #4] Accumulate the delta
      scrollAccum.current += e.deltaY;

      // Apply the accumulated scroll, clamped to valid range
      const newOffset = clampOffset(
        -Math.round(-offset / ITEM_HEIGHT) * ITEM_HEIGHT - scrollAccum.current * 0.6
      );
      setOffset(newOffset);

      // [FIX #4] Debounce: wait for scrolling to stop, then snap
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        scrollAccum.current = 0; // Reset accumulator
        clampAndSnap(newOffset);
      }, 150);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  });


  const centerIndex = Math.round(-offset / ITEM_HEIGHT);


  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>

      {label && (
        <div style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-text-tertiary)",
          marginBottom: 8,
          fontFamily: "'SF Pro Text', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
        }}>
          {label}
        </div>
      )}

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          height: PICKER_HEIGHT,
          overflow: "hidden",
          position: "relative",
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          width: "100%",
        }}
      >
        {/* Selection indicator lines */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: ITEM_HEIGHT,
            transform: "translateY(-50%)",
            borderTop: "1px solid var(--color-border-secondary)",
            borderBottom: "1px solid var(--color-border-secondary)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Top fade gradient */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: PICKER_HEIGHT * 0.35,
            background: "linear-gradient(to bottom, var(--color-background-primary), transparent)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* Bottom fade gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: PICKER_HEIGHT * 0.35,
            background: "linear-gradient(to top, var(--color-background-primary), transparent)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* 3D perspective container */}
        <div
          style={{
            position: "relative",
            height: "100%",
            perspective: PERSPECTIVE,
            perspectiveOrigin: "center center",
          }}
        >
          {items.map((item, i) => {
            // [BUGFIX] Removed the old `+ (PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2)` term.
            // That was adding an 80px offset that pushed everything down by 2 items.
            // Your `- 80` hack was compensating for it — now neither is needed.
            // The correct formula is simply: position in list + scroll offset.
            // When item i is selected (offset = -i * ITEM_HEIGHT), displacement = 0 → centered.
            const displacement = i * ITEM_HEIGHT + offset;

            const normalizedDisplacement = displacement / (PICKER_HEIGHT / 2);
            const rotateX = -normalizedDisplacement * 28;
            const absDisp = Math.abs(normalizedDisplacement);
            const opacity = Math.max(0, 1 - absDisp * 0.55);
            const scale = Math.max(0.7, 1 - absDisp * 0.15);
            const isSelected = i === centerIndex;

            if (absDisp > 2.5) return null;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `translateY(-50%) translateY(${displacement}px) perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity,
                  transition: isDragging.current
                    ? "none"
                    : "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s ease",
                  fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                  fontSize: isSelected ? 22 : 20,
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  willChange: "transform, opacity",
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// DATA
// ============================================================
const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
const years = Array.from({ length: 100 }, (_, i) => String(2020 + i));


// ============================================================
// TimePicker
// ============================================================
export default function TimePicker() {
  const [monthIdx, setMonthIdx] = useState(2);
  const [yearIdx, setYearIdx] = useState(6);

  const dateStr = `${months[monthIdx]}, ${years[yearIdx]}`;

  return (
    <div style={{
      fontFamily: "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      maxWidth: 400,
      margin: "0 auto",
      padding: "2rem 0",
    }}>
      <div style={{
        textAlign: "center",
        marginBottom: 24,
        fontSize: 36,
        fontWeight: 300,
        letterSpacing: "-0.02em",
        color: "var(--color-text-primary)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {dateStr}
      </div>

      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", gap: 0 }}>
          <WheelColumn items={months} selectedIndex={monthIdx} onChange={setMonthIdx} label="Month" />
          <WheelColumn items={years} selectedIndex={yearIdx} onChange={setYearIdx} label="Year" />
        </div>
      </div>

      <p style={{
        textAlign: "center",
        fontSize: 13,
        color: "var(--color-text-tertiary)",
        marginTop: 20,
      }}>
        Drag to select
      </p>
    </div>
  );
}