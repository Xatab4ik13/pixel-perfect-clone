import { describe, expect, it } from 'vitest';
import { canShowApp } from './app-visibility';

describe('application entry', () => {
  it('shows the interface in development without Telegram', () => {
    expect(canShowApp(false, true)).toBe(true);
  });
  it('requires Telegram outside development', () => {
    expect(canShowApp(false, false)).toBe(false);
  });
  it('allows Telegram entry in production', () => {
    expect(canShowApp(true, false)).toBe(true);
  });
});