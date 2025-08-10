<template>
    <div class="theme-selector">
        <div class="btn-group" role="group" aria-label="Theme selector">
            <input
                id="theme-auto"
                type="radio"
                class="btn-check"
                name="theme"
                value="auto"
                :checked="themeStore.themeMode === 'auto'"
                @change="() => themeStore.setThemeMode('auto')"
            />
            <label for="theme-auto" class="btn btn-theme-selector btn-sm" title="Auto (system) theme">
                <Monitor :size="16" />
            </label>

            <input
                id="theme-dark"
                type="radio"
                class="btn-check"
                name="theme"
                value="dark"
                :checked="themeStore.themeMode === 'dark'"
                @change="() => themeStore.setThemeMode('dark')"
            />
            <label for="theme-dark" class="btn btn-theme-selector btn-sm" title="Dark theme">
                <Moon :size="16" />
            </label>

            <input
                id="theme-light"
                type="radio"
                class="btn-check"
                name="theme"
                value="light"
                :checked="themeStore.themeMode === 'light'"
                @change="() => themeStore.setThemeMode('light')"
            />
            <label for="theme-light" class="btn btn-theme-selector btn-sm" title="Light theme">
                <Sun :size="16" />
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next';

import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>

<style scoped>
.theme-selector .btn-group {
    background-color: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius-sm);
    overflow: hidden;
}

.btn-theme-selector {
    background-color: transparent;
    border: none;
    color: var(--bs-body-color);
    opacity: 0.65;
    transition: all 0.15s ease-in-out;
}

.btn-theme-selector:hover {
    background-color: var(--bs-secondary-bg);
    color: var(--bs-body-color);
    opacity: 0.85;
}

.btn-check:checked + .btn-theme-selector {
    background-color: var(--bs-secondary-color);
    color: var(--bs-secondary-bg);
    opacity: 1;
    font-weight: 500;
}

.btn-check:focus + .btn-theme-selector {
    box-shadow: none;
}

/* Ensure proper spacing and alignment */
.btn-theme-selector {
    border-radius: 0;
    padding: 0.375rem 0.5rem;
}

.btn-theme-selector:first-child {
    border-top-left-radius: calc(var(--bs-border-radius-sm) - 1px);
    border-bottom-left-radius: calc(var(--bs-border-radius-sm) - 1px);
}

.btn-theme-selector:last-child {
    border-top-right-radius: calc(var(--bs-border-radius-sm) - 1px);
    border-bottom-right-radius: calc(var(--bs-border-radius-sm) - 1px);
}
</style>
