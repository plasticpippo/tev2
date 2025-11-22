import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Properly mock the fetch API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200
  } as Response)
);

// Provide a global jest mock function alias for compatibility
global.jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
} as any;