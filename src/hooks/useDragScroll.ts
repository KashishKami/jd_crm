import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook providing universal horizontal click-and-drag panning on data tables.
 * Safely distinguishes between quick clicks and dragging (> 5px) to prevent
 * accidental link navigation or row selections.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent<T>) => {
    // Only primary (left) button initiates drag
    if (e.button !== 0 || !ref.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - ref.current.offsetLeft;
    scrollLeftRef.current = ref.current.scrollLeft;
    setIsGrabbing(true);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!isDraggingRef.current || !ref.current) return;
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    ref.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<T>) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDraggedRef.current = false;
    }
  }, []);

  return {
    ref,
    isGrabbing,
    hasDraggedRef,
    dragProps: {
      ref,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onClickCapture,
    },
  };
}
