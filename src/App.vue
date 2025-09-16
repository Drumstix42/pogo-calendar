<template>
    <div id="app">
        <nav class="navbar navbar-expand-lg border-bottom page-header" :class="{ 'navbar-scrolled': isScrolled }">
            <div class="container app-container" style="max-width: none">
                <a class="navbar-brand" href="#">
                    <img src="/favicon.svg" alt="Calendar" width="24" height="24" class="me-2" />
                    <strong>PoGO Event Calendar</strong>
                </a>

                <div class="ms-auto d-flex align-items-center gap-1">
                    <ThemeSelector />
                    <button
                        type="button"
                        class="btn btn-icon-ghost-dark btn-options-toggle d-flex align-items-center gap-1"
                        title="Settings"
                        @click="calendarSettings.toggleOptionsExpanded"
                    >
                        <Settings :size="18" class="flex-grow-0" />
                    </button>
                </div>
            </div>
        </nav>

        <router-view />

        <!-- Toast notifications -->
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';
import { Settings } from 'lucide-vue-next';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useThemeStore } from '@/stores/theme';

import ThemeSelector from '@/components/ThemeSelector.vue';
import ToastContainer from '@/components/Toast/ToastContainer.vue';

// Initialize theme store to apply theme on app start
useThemeStore();

// Initialize calendar settings store for options button
const calendarSettings = useCalendarSettingsStore();

// Scroll detection for navbar minimization using VueUse
const { y: scrollY } = useWindowScroll();
const scrollThreshold = 10; // Pixels to scroll before minimizing

const isScrolled = computed(() => scrollY.value > scrollThreshold);
</script>

<style scoped>
.page-header {
    background-color: #343a40;
    border-color: rgba(255, 255, 255, 0.1) !important;
    position: sticky;
    top: 0;
    z-index: 300;
    transition:
        padding 0.3s ease,
        box-shadow 0.3s ease;
    padding: 0.5rem 0;

    &.navbar-scrolled {
        height: var(--navbar-height-scrolled);
        padding: 0.2rem 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
}

[data-bs-theme='dark'] .page-header {
    background-color: #1a1919;
    border-color: rgba(255, 255, 255, 0.08) !important;
}

[data-bs-theme='dark'] .page-header.navbar-scrolled {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

[data-bs-theme='light'] .page-header .navbar-brand {
    color: #ffffff !important;
}

[data-bs-theme='light'] .page-header .navbar-brand:hover {
    color: #e74c3c !important;
}

/* Make theme selector visible on dark header */
[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link) {
    color: rgba(255, 255, 255, 0.8) !important;
}

[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link:hover),
[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link:focus) {
    color: #ffffff !important;
}

.navbar-brand {
    color: var(--bs-navbar-brand-color, var(--bs-body-color));
    font-size: 1rem;
    line-height: 1;
    font-weight: 600;
    display: flex;
    align-items: center;
    transition:
        color 0.2s ease,
        font-size 0.3s ease;
}

.navbar-scrolled .navbar-brand {
    font-size: 0.85rem;
    font-weight: 500;
}

.navbar-brand:hover {
    color: #e74c3c !important;
}

.btn-options-toggle {
    padding: 0.375rem 0.5rem;
}
</style>
