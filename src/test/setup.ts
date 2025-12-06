/**
 * Vitest setup file
 * Configures test environment
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IndexedDB
class IDBFactoryMock {
  open(_name: string, _version?: number): IDBOpenDBRequest {
    const request = {} as IDBOpenDBRequest;
    // Simplified mock - implement full IDB mock if needed
    return request;
  }

  deleteDatabase(_name: string): IDBOpenDBRequest {
    const request = {} as IDBOpenDBRequest;
    return request;
  }
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'indexedDB', {
  value: new IDBFactoryMock(),
});

