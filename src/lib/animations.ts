import { gsap } from 'gsap';

export function fadeInPage(element: Element, delay: number = 0) {
  if (typeof window === 'undefined' || !element) return;
  gsap.fromTo(
    element,
    { opacity: 0 },
    { opacity: 1, duration: 0.4, delay, ease: 'power2.out' }
  );
}

export function staggerEntrance(elements: Element[] | NodeList | HTMLCollection, stagger: number = 0.05, onComplete?: () => void) {
  if (typeof window === 'undefined' || !elements || elements.length === 0) return;
  gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, stagger, ease: 'power2.out', onComplete }
  );
}

/**
 * Smooth opacity-only fade-in for table rows or list items.
 * Avoids the jitter caused by y-offset translation on already-laid-out DOM elements.
 */
export function fadeInStagger(elements: Element[] | NodeList | HTMLCollection, stagger: number = 0.04, onComplete?: () => void) {
  if (typeof window === 'undefined' || !elements || elements.length === 0) return;
  gsap.fromTo(
    elements,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, stagger, ease: 'power1.out', onComplete }
  );
}

export function countUp(element: Element, endValue: number, duration: number = 1) {
  if (typeof window === 'undefined' || !element) return;
  const obj = { val: 0 };
  gsap.to(obj, {
    val: endValue,
    duration,
    ease: 'power1.out',
    onUpdate: () => {
      element.textContent = String(Math.floor(obj.val));
    },
  });
}

export function slideInSidebar(element: Element) {
  if (typeof window === 'undefined' || !element) return;
  gsap.fromTo(
    element,
    { x: -280 },
    { x: 0, duration: 0.5, ease: 'power2.out' }
  );
}
