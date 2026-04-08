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
function WheelColumn({date, items, selectedIndex, onChange, label }) {

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
  // ============================================================

  const handlePointerDown = (e) => {
    if (animFrame.current) cancelAnimationFrame(animFrame.current);

    isDragging.current = true;
    hasMoved.current = false;          
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

    // Mark as a drag if the pointer moved more than 3px
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

    // Clamp during drag so you can't scroll past the edges
    setOffset(clampOffset(startOffset.current + dy));
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // If the pointer didn't move, treat it as a click.
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
  // ============================================================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault(); 
      e.stopPropagation(); 

      if (animFrame.current) cancelAnimationFrame(animFrame.current);

      scrollAccum.current += e.deltaY;

      const newOffset = clampOffset(
        -Math.round(-offset / ITEM_HEIGHT) * ITEM_HEIGHT - scrollAccum.current * 0.6
      );
      setOffset(newOffset);

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        scrollAccum.current = 0;
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
                  fontSize: isSelected ? 22 : 20,
                  fontWeight: isSelected ? 400 : 325,
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
// TimePicker
// ============================================================
export default function TimePicker(props) {
  const date = props.date;
  const setDate = props.setDate;

  const monthIdx = date.getMonth();
  function setMonthIdx(month) {
    const year = date.getFullYear();
    const day = date.getDate();
    setDate(new Date(year, month, day));
  }
//   const [monthIdx, setMonthIdx] = useState(date.getMonth());
const months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
const years = Array.from({ length: 500 }, (_, i) => String(new Date().getFullYear() - 250 + i));
const yearIdx = 250;
function setYearIdx(year) {
    year = years[year];
    const month = date.getMonth();
    const day = date.getDate();
    setDate(new Date(year, month, day));
}
//   const [yearIdx, setYearIdx] = useState(50);
  const timeVisible = props.timeVisible;

  const dateStr = `${months[monthIdx]}, ${date.getFullYear()}`;
  console.log()

  return (
    <div className={"timePick"} style={{
      visibility: `${timeVisible ? "visible" : "hidden"}`,
      maxWidth: 400,
      margin: "0 auto",
      padding: "2rem 0",
    }}>
      <div style={{
        textAlign: "center",
        marginBottom: 24,
        fontSize: 34,
        fontWeight: 3200,
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
        <div style={{ display: "flex", gap: 0}}>
          <WheelColumn date={date} items={months} selectedIndex={monthIdx} onChange={setMonthIdx} label="Month" />
          <WheelColumn date={date} items={years} selectedIndex={yearIdx} onChange={setYearIdx} label="Year" />
        </div>
      </div>

      <p style={{
        textAlign: "center",
        fontSize: 13,
        color: "var(--color-text-tertiary)",
        marginTop: 20,
      }}>
        Drag, click, or scroll to select
      </p>
    </div>
  );
}