// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

// Mock ResizeObserver for jsdom environment
if (typeof window !== 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

import { fadeInPage, staggerEntrance, countUp } from '../lib/animations';
import LenisProvider from '../components/LenisProvider';

describe('Animations & Scroll Foundation Tests', () => {
  it('should export animation utilities as functions', () => {
    expect(typeof fadeInPage).toBe('function');
    expect(typeof staggerEntrance).toBe('function');
    expect(typeof countUp).toBe('function');
  });

  it('should render LenisProvider children without crashing', () => {
    const { getByText } = render(
      <LenisProvider>
        <div>Test Content</div>
      </LenisProvider>
    );
    expect(getByText('Test Content')).toBeDefined();
  });

  it('should verify document.documentElement has data-lenis-prevent attribute absent after LenisProvider mounts', () => {
    // Make sure we clear any existing attributes
    document.documentElement.removeAttribute('data-lenis-prevent');
    
    render(
      <LenisProvider>
        <div>Scroll Content</div>
      </LenisProvider>
    );
    
    expect(document.documentElement.getAttribute('data-lenis-prevent')).toBeNull();
  });
});
