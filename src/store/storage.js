/**
 * storage.js
 * Handles LocalStorage persistence with error boundaries
 */

const STORAGE_KEY = 'smart_todo_tasks';
const SETTINGS_KEY = 'smart_todo_settings';

export const Storage = {
    saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    },

    getTasks() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },

    getSettings() {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : { dailyCapacity: 8 }; // Default 8 hours
    }
};