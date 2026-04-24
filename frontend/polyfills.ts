// Polyfills for old Android tablets (Chrome 77-85, Firefox 68-80)
// This file should be imported before the main application code

// Ensure globalThis is available (for older browsers)
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// 1. ResizeObserver polyfill (missing in older browsers)
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;
    private targets: Set<Element>;
    private observer: MutationObserver | null;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      this.targets = new Set();
      this.observer = null;
    }

    observe(target: Element, options?: ResizeObserverOptions) {
      if (!this.targets.has(target)) {
        this.targets.add(target);
        this.scheduleObservation();
      }
    }

    unobserve(target: Element) {
      if (this.targets.has(target)) {
        this.targets.delete(target);
      }
    }

    disconnect() {
      this.targets.clear();
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }

    private scheduleObservation() {
      if (!this.observer) {
        this.observer = new MutationObserver(() => this.checkTargets());
        this.observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
      }
      // Initial check
      setTimeout(() => this.checkTargets(), 0);
    }

    private checkTargets() {
      const entries: ResizeObserverEntry[] = [];
      this.targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        entries.push({
          target,
          contentRect: rect,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: []
        } as ResizeObserverEntry);
      });
      if (entries.length > 0) {
        this.callback(entries, this);
      }
    }
  };
}

// 2. IntersectionObserver polyfill (missing in some older browsers)
if (typeof IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    private callback: IntersectionObserverCallback;
    private targets: Set<Element>;
    private root: Element | Document | null;
    private rootMargin: string;
    private thresholds: number[];

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.callback = callback;
      this.targets = new Set();
      this.root = options?.root || null;
      this.rootMargin = options?.rootMargin || '0px';
      this.thresholds = Array.isArray(options?.threshold)
        ? options.threshold
        : [options?.threshold ?? 0];
    }

    observe(target: Element) {
      if (!this.targets.has(target)) {
        this.targets.add(target);
        this.checkIntersection();
      }
    }

    unobserve(target: Element) {
      if (this.targets.has(target)) {
        this.targets.delete(target);
      }
    }

    disconnect() {
      this.targets.clear();
    }

    private checkIntersection() {
      const entries: IntersectionObserverEntry[] = [];
      this.targets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const rootRect = this.root
          ? (this.root as Element).getBoundingClientRect()
          : { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 };

        const isIntersecting = !(
          rect.bottom < rootRect.top ||
          rect.top > rootRect.bottom ||
          rect.right < rootRect.left ||
          rect.left > rootRect.right
        );

        entries.push({
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: isIntersecting ? rect : { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 },
          rootBounds: rootRect,
          time: Date.now()
        } as IntersectionObserverEntry);
      });

      if (entries.length > 0) {
        this.callback(entries, this);
      }
    }
  };
}

// 3. String.prototype.replaceAll polyfill (missing in older browsers)
if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search: string | RegExp, replacement: string): string {
    if (typeof search === 'string') {
      return this.split(search).join(replacement);
    }
    return this.replace(search, replacement);
  };
}

// 4. Promise.prototype.finally polyfill (missing in some older browsers)
if (!Promise.prototype.finally) {
  Promise.prototype.finally = function<T>(onFinally?: () => void): Promise<T> {
    return this.then(
      (value) => Promise.resolve(onFinally ? onFinally() : undefined).then(() => value),
      (reason) => Promise.resolve(onFinally ? onFinally() : undefined).then(() => { throw reason; })
    );
  };
}

// 5. Object.fromEntries polyfill (missing in older browsers)
if (!Object.fromEntries) {
  Object.fromEntries = function<T = any>(entries: Iterable<readonly [PropertyKey, T]>): Record<PropertyKey, T> {
    const obj: Record<PropertyKey, T> = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  };
}

// 6. Array.prototype.flat polyfill (missing in older browsers)
if (!Array.prototype.flat) {
  Array.prototype.flat = function<T>(this: T[], depth: number = 1): T[] {
    const flatten = (arr: T[], d: number): any[] => {
      return d > 0
        ? arr.reduce((acc: any[], val: T) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
        : arr.slice();
    };
    return flatten(this, depth);
  };
}

// 7. Array.prototype.flatMap polyfill (missing in older browsers)
if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function<T, U>(this: T[], callback: (value: T, index: number, array: T[]) => U | U[], thisArg?: any): U[] {
    return this.map(callback, thisArg).flat();
  };
}

// 8. Optional chaining and nullish coalescing helpers for older transpilation
export const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined => {
  return obj?.[key];
};

export const safeCall = <T extends (...args: any[]) => any>(fn: T | null | undefined, ...args: Parameters<T>): ReturnType<T> | undefined => {
  return fn?.(...args);
};

// 9. AbortController polyfill (for fetch cancellation)
if (typeof AbortController === 'undefined') {
  globalThis.AbortController = class AbortController {
    public signal: AbortSignal;
    private _aborted: boolean = false;
    private _listeners: Set<() => void> = new Set();

    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: (type: string, listener: () => void) => {
          if (type === 'abort') {
            this._listeners.add(listener);
          }
        },
        removeEventListener: (type: string, listener: () => void) => {
          if (type === 'abort') {
            this._listeners.delete(listener);
          }
        },
        dispatchEvent: () => false
      } as any;
    }

    abort() {
      if (!this._aborted) {
        this._aborted = true;
        (this.signal as any).aborted = true;
        this._listeners.forEach(listener => listener());
        this._listeners.clear();
      }
    }
  };
}

// 10. requestIdleCallback polyfill (for React 18 concurrent features)
if (typeof requestIdleCallback === 'undefined') {
  globalThis.requestIdleCallback = (callback: IdleRequestCallback, options?: IdleRequestOptions): number => {
    const start = Date.now();
    return window.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1) as unknown as number;
  };
}

if (typeof cancelIdleCallback === 'undefined') {
  globalThis.cancelIdleCallback = (id: number) => {
    window.clearTimeout(id);
  };
}

// 11. Number.isNaN polyfill
if (!Number.isNaN) {
  Number.isNaN = (value: any): boolean => {
    return typeof value === 'number' && value !== value;
  };
}

// 12. Number.isInteger polyfill
if (!Number.isInteger) {
  Number.isInteger = (value: any): boolean => {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };
}

// 13. Array.prototype.includes polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function<T>(this: T[], searchElement: T, fromIndex: number = 0): boolean {
    const O = Object(this);
    const len = O.length >>> 0;
    let k = fromIndex;
    if (k < 0) {
      k = Math.max(len + k, 0);
    }
    while (k < len) {
      if (O[k] === searchElement) {
        return true;
      }
      k++;
    }
    return false;
  };
}

// 14. String.prototype.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search: string, start: number = 0): boolean {
    if (typeof start !== 'number') {
      start = 0;
    }
    if (start + search.length > this.length) {
      return false;
    }
    return this.indexOf(search, start) !== -1;
  };
}

// 15. String.prototype.startsWith polyfill
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(search: string, pos: number = 0): boolean {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}

// 16. String.prototype.endsWith polyfill
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search: string, this_len: number = this.length): boolean {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}