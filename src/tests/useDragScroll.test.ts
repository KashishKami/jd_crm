// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDragScroll } from '../hooks/useDragScroll';

describe('W-4803: Universal Table Drag-to-Scroll Hook (useDragScroll)', () => {
  it('initializes with isGrabbing false and dragProps configured', () => {
    const { result } = renderHook(() => useDragScroll());

    expect(result.current.isGrabbing).toBe(false);
    expect(result.current.dragProps).toBeDefined();
    expect(typeof result.current.dragProps.onMouseDown).toBe('function');
    expect(typeof result.current.dragProps.onMouseMove).toBe('function');
    expect(typeof result.current.dragProps.onMouseUp).toBe('function');
    expect(typeof result.current.dragProps.onMouseLeave).toBe('function');
    expect(typeof result.current.dragProps.onClickCapture).toBe('function');
  });

  it('initiates drag on left-click (button === 0) and sets isGrabbing to true', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    mockElement.scrollLeft = 50;
    result.current.ref.current = mockElement;

    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 200,
      } as any);
    });

    expect(result.current.isGrabbing).toBe(true);
  });

  it('ignores right-click (button === 2) and does not initiate drag', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    result.current.ref.current = mockElement;

    act(() => {
      result.current.dragProps.onMouseDown({
        button: 2,
        pageX: 200,
      } as any);
    });

    expect(result.current.isGrabbing).toBe(false);
  });

  it('updates scrollLeft during mousemove while dragging', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    mockElement.scrollLeft = 100;
    Object.defineProperty(mockElement, 'offsetLeft', { value: 0 });
    result.current.ref.current = mockElement;

    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 100,
      } as any);
    });

    // Drag to the left: mouse moved to 50 (walk = (50 - 100) * 1.5 = -75 -> scrollLeft = 100 - (-75) = 175)
    act(() => {
      result.current.dragProps.onMouseMove({
        pageX: 50,
      } as any);
    });

    expect(mockElement.scrollLeft).toBe(175);
    expect(result.current.hasDraggedRef.current).toBe(true);
  });

  it('resets isGrabbing on mouseup or mouseleave', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    result.current.ref.current = mockElement;

    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 100,
      } as any);
    });
    expect(result.current.isGrabbing).toBe(true);

    act(() => {
      result.current.dragProps.onMouseUp();
    });
    expect(result.current.isGrabbing).toBe(false);

    // Test mouseLeave
    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 100,
      } as any);
    });
    expect(result.current.isGrabbing).toBe(true);

    act(() => {
      result.current.dragProps.onMouseLeave();
    });
    expect(result.current.isGrabbing).toBe(false);
  });

  it('prevents click propagation in onClickCapture if drag movement exceeded threshold', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'offsetLeft', { value: 0 });
    result.current.ref.current = mockElement;

    // Simulate drag
    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 100,
      } as any);
      result.current.dragProps.onMouseMove({
        pageX: 50,
      } as any);
    });

    expect(result.current.hasDraggedRef.current).toBe(true);

    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();

    act(() => {
      result.current.dragProps.onClickCapture({
        stopPropagation,
        preventDefault,
      } as any);
    });

    expect(stopPropagation).toHaveBeenCalled();
    expect(preventDefault).toHaveBeenCalled();
    expect(result.current.hasDraggedRef.current).toBe(false);
  });

  it('allows click propagation if no drag occurred (simple click)', () => {
    const { result } = renderHook(() => useDragScroll<HTMLDivElement>());
    const mockElement = document.createElement('div');
    result.current.ref.current = mockElement;

    // Simulate click without move
    act(() => {
      result.current.dragProps.onMouseDown({
        button: 0,
        pageX: 100,
      } as any);
      result.current.dragProps.onMouseUp();
    });

    expect(result.current.hasDraggedRef.current).toBe(false);

    const stopPropagation = vi.fn();
    const preventDefault = vi.fn();

    act(() => {
      result.current.dragProps.onClickCapture({
        stopPropagation,
        preventDefault,
      } as any);
    });

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
