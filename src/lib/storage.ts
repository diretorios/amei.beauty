/**
 * Local-first storage layer
 * Uses IndexedDB for structured data, localStorage for preferences
 */

import type { CardData } from '../models/types';

const DB_NAME = 'amei_beauty_db';
const DB_VERSION = 1;
const STORE_NAME = 'cards';

class Storage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        }
      };
    });
  }

  async saveCard(card: CardData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        id: 'current',
        ...card,
        updated_at: new Date().toISOString(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async loadCard(): Promise<CardData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('current');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Remove the 'id' field before returning
          const { id: _id, ...card } = result;
          resolve(card as CardData);
        } else {
          resolve(null);
        }
      };
    });
  }

  async deleteCard(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('current');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // localStorage helpers for simple preferences
  getPreference(key: string): string | null {
    return localStorage.getItem(key);
  }

  setPreference(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removePreference(key: string): void {
    localStorage.removeItem(key);
  }
}

export const storage = new Storage();

