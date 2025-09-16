import { useLocalStorage, usePreferredColorScheme } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, watch } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Pinia store for theme management with persistent localStorage
 * Supports light, dark, and auto (system preference) modes
 */
export const useThemeStore = defineStore('theme', () => {
    // Store the user's theme preference
    const themeMode = useLocalStorage<ThemeMode>(STORAGE_KEYS.THEME_MODE, 'light');

    // Get system preference
    const systemPreference = usePreferredColorScheme();

    // Computed theme - resolves 'auto' to actual theme
    const resolvedTheme = computed((): 'light' | 'dark' => {
        if (themeMode.value === 'auto') {
            return systemPreference.value === 'dark' ? 'dark' : 'light';
        }
        return themeMode.value;
    });

    // Apply theme to document
    const applyTheme = (theme: 'light' | 'dark') => {
        const html = document.documentElement;
        html.setAttribute('data-bs-theme', theme);
    };

    // Watch for theme changes and apply them
    watch(
        resolvedTheme,
        newTheme => {
            applyTheme(newTheme);
        },
        { immediate: true },
    );

    // Actions
    const setThemeMode = (mode: ThemeMode) => {
        themeMode.value = mode;
    };

    const toggleTheme = () => {
        if (themeMode.value === 'light') {
            setThemeMode('dark');
        } else if (themeMode.value === 'dark') {
            setThemeMode('auto');
        } else {
            setThemeMode('light');
        }
    };

    return {
        // State
        themeMode,
        resolvedTheme,
        systemPreference,

        // Actions
        setThemeMode,
        toggleTheme,
    };
});
