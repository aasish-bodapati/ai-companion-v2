/**
 * State Synchronization Utilities
 * Helps keep different state sources in sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugUtils } from './debugUtils';

export interface StateSyncOptions {
  storageKey: string;
  validateFn?: (data: any) => boolean;
  transformFn?: (data: any) => any;
}

/**
 * Synchronizes state between memory and storage
 */
export class StateSync {
  private static instance: StateSync;
  private syncQueue: Map<string, Promise<any>> = new Map();

  static getInstance(): StateSync {
    if (!StateSync.instance) {
      StateSync.instance = new StateSync();
    }
    return StateSync.instance;
  }

  /**
   * Get data from storage with validation and transformation
   */
  async getFromStorage<T>(options: StateSyncOptions): Promise<T | null> {
    const { storageKey, validateFn, transformFn } = options;
    
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Validate data if validator provided
      if (validateFn && !validateFn(data)) {
        DebugUtils.warn(`⚠️ [STATE SYNC] Invalid data for ${storageKey}, clearing`);
        await AsyncStorage.removeItem(storageKey);
        return null;
      }

      // Transform data if transformer provided
      return transformFn ? transformFn(data) : data;
    } catch (error) {
      DebugUtils.error(`❌ [STATE SYNC] Error reading ${storageKey}:`, error);
      return null;
    }
  }

  /**
   * Save data to storage with debouncing
   */
  async saveToStorage<T>(options: StateSyncOptions, data: T): Promise<void> {
    const { storageKey } = options;
    
    // Debounce saves to prevent excessive storage writes
    if (this.syncQueue.has(storageKey)) {
      await this.syncQueue.get(storageKey);
    }

    const savePromise = this._performSave(storageKey, data);
    this.syncQueue.set(storageKey, savePromise);
    
    try {
      await savePromise;
    } finally {
      this.syncQueue.delete(storageKey);
    }
  }

  private async _performSave<T>(storageKey: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
      DebugUtils.log(`✅ [STATE SYNC] Saved ${storageKey}`);
    } catch (error) {
      DebugUtils.error(`❌ [STATE SYNC] Error saving ${storageKey}:`, error);
      throw error;
    }
  }

  /**
   * Clear data from storage
   */
  async clearFromStorage(storageKey: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(storageKey);
      DebugUtils.log(`🗑️ [STATE SYNC] Cleared ${storageKey}`);
    } catch (error) {
      DebugUtils.error(`❌ [STATE SYNC] Error clearing ${storageKey}:`, error);
    }
  }

  /**
   * Sync multiple storage keys atomically
   */
  async syncMultiple(operations: Array<{
    key: string;
    data?: any;
    action: 'get' | 'set' | 'clear';
  }>): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    try {
      const promises = operations.map(async (op) => {
        switch (op.action) {
          case 'get':
            results[op.key] = await this.getFromStorage({ storageKey: op.key });
            break;
          case 'set':
            await this.saveToStorage({ storageKey: op.key }, op.data);
            results[op.key] = op.data;
            break;
          case 'clear':
            await this.clearFromStorage(op.key);
            results[op.key] = null;
            break;
        }
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      DebugUtils.error('❌ [STATE SYNC] Error in syncMultiple:', error);
      throw error;
    }
  }
}

export const stateSync = StateSync.getInstance();
