<template>
    <div class="theme-selector">
        <div class="dropdown">
            <button
                id="theme-selector-toggle"
                class="btn btn-link nav-link px-0 px-lg-2 py-2 dropdown-toggle d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                :title="`Current theme: ${currentThemeLabel}`"
            >
                <component :is="currentThemeIcon" :size="16" />
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="theme-selector-toggle">
                <li v-for="option in themeOptions" :key="option.value">
                    <button
                        class="dropdown-item d-flex align-items-center justify-content-between"
                        :class="{ active: themeStore.themeMode === option.value }"
                        @click="themeStore.setThemeMode(option.value)"
                    >
                        <div class="d-flex align-items-center">
                            <component :is="option.icon" :size="16" class="me-2" />
                            {{ option.label }}
                        </div>
                        <Check v-if="themeStore.themeMode === option.value" :size="16" />
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Check, Moon, Sun, SunMoon } from 'lucide-vue-next';
import { computed } from 'vue';

import { useThemeStore } from '@/stores/theme';
import type { ThemeMode } from '@/stores/theme';

const themeStore = useThemeStore();

// Theme options in your preferred order
const themeOptions = [
    { value: 'auto' as ThemeMode, label: 'Auto', icon: SunMoon },
    { value: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
    { value: 'light' as ThemeMode, label: 'Light', icon: Sun },
];

// Current theme display
const currentThemeIcon = computed(() => {
    const option = themeOptions.find(opt => opt.value === themeStore.themeMode);
    return option?.icon || SunMoon;
});

const currentThemeLabel = computed(() => {
    const option = themeOptions.find(opt => opt.value === themeStore.themeMode);
    return option?.label || 'Auto';
});
</script>

<style scoped>
.btn-link.nav-link {
    color: var(--bs-navbar-color, var(--bs-body-color));
    text-decoration: none;
    border: none;
    background: none;
}

.btn-link.nav-link:hover {
    color: var(--bs-navbar-hover-color, var(--bs-body-color));
}

.btn-link.nav-link:focus {
    color: var(--bs-navbar-hover-color, var(--bs-body-color));
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-body-color-rgb), 0.15);
}

/* Ensure dropdown appears above other content */
.dropdown-menu {
    z-index: 1050;
}
</style>
