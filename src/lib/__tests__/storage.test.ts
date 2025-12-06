import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load preferences', () => {
    storage.setPreference('test_key', 'test_value');
    const value = storage.getPreference('test_key');
    expect(value).toBe('test_value');
  });

  it('should remove preferences', () => {
    storage.setPreference('test_key', 'test_value');
    storage.removePreference('test_key');
    const value = storage.getPreference('test_key');
    expect(value).toBeNull();
  });

  it('should return null for non-existent preference', () => {
    const value = storage.getPreference('nonexistent');
    expect(value).toBeNull();
  });

  // Note: IndexedDB tests would require a more complete mock
  // For now, we test the localStorage helpers
});

