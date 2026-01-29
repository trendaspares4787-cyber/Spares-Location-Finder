
import { AppState } from '../types';
import { INITIAL_USERS } from '../constants';

const STORAGE_KEY = 'spares_finder_v1_state';

/**
 * Saves the full application state to local storage.
 * Using a direct write ensures the state managed by React is the single source of truth.
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
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load state from storage:', error);
    return {
      currentUser: null,
      parts: [],
      logs: [],
      manualEntries: [],
      users: INITIAL_USERS,
      lastUploadInfo: null,
    };
  }
};

export const clearData = () => {
  const state = loadState();
  const clearedState = { ...state, parts: [], lastUploadInfo: null };
  saveState(clearedState);
};
