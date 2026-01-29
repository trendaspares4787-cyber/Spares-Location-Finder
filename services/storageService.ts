
import { AppState } from '../types';
import { INITIAL_USERS } from '../constants';

const STORAGE_KEY = 'spares_finder_v2_state';

/**
 * Saves the full application state to local storage.
 * Ensures data persists across browser restarts.
 */
export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist state to storage:', error);
  }
};

/**
 * Loads the application state from local storage or returns the default initial state.
 */
export const loadState = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        currentUser: null,
        parts: [],
        logs: [],
        manualEntries: [],
        users: INITIAL_USERS,
        lastUploadInfo: null,
        lastCredentials: { userId: '', password: '' }
      };
    }
    const parsed = JSON.parse(data);
    // Ensure users list is never empty even if storage is corrupted
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = INITIAL_USERS;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load state from storage:', error);
    return {
      currentUser: null,
      parts: [],
      logs: [],
      manualEntries: [],
      users: INITIAL_USERS,
      lastUploadInfo: null,
      lastCredentials: { userId: '', password: '' }
    };
  }
};

export const clearData = () => {
  const state = loadState();
  const clearedState = { ...state, parts: [], lastUploadInfo: null };
  saveState(clearedState);
};
