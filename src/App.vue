<template>
    <div id="app">
        <div class="navbar-wrapper">
            <nav class="navbar navbar-expand-lg border-bottom page-header">
                <div class="container app-container" style="max-width: none">
                    <a class="navbar-brand" href="#" @click.prevent="goHome">
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
        </div>

        <main class="main-content">
            <router-view />
        </main>

        <!-- Toast notifications -->
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { Settings } from 'lucide-vue-next';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useThemeStore } from '@/stores/theme';

import ThemeSelector from '@/components/ThemeSelector.vue';
import ToastContainer from '@/components/Toast/ToastContainer.vue';

useThemeStore();

const calendarSettings = useCalendarSettingsStore();
const { urlMonth, urlYear } = useUrlSync();

function goHome() {
    const now = dayjs();
    urlMonth.value = now.month();
    urlYear.value = now.year();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<style scoped>
.navbar-wrapper {
    position: sticky;
    top: 0;
    z-index: 300;
    height: var(--navbar-height-scrolled);
    overflow: visible;
}

.page-header {
    background-color: #343a40;
    border-color: rgba(255, 255, 255, 0.1) !important;
    height: var(--navbar-height-scrolled);
    display: flex;
    align-items: center;
    transition: box-shadow 0.3s ease;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 calc(var(--bs-gutter-x) * 0.5);
        margin: 0;
    }
}

.main-content {
    padding-top: 0;
}

[data-bs-theme='dark'] .page-header {
    background-color: #1f2023;
    border-color: rgba(255, 255, 255, 0.08) !important;
}

[data-bs-theme='dark'] .page-header {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

[data-bs-theme='light'] .page-header .navbar-brand {
    color: #ffffff !important;
}

[data-bs-theme='light'] .page-header .navbar-brand:hover {
    color: #e74c3c !important;
}

[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link) {
    color: rgba(255, 255, 255, 0.8) !important;
}

[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link:hover),
[data-bs-theme='light'] .page-header :deep(.btn-link.nav-link:focus) {
    color: #ffffff !important;
}

.navbar-brand {
    color: var(--bs-navbar-brand-color, var(--bs-body-color));
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1;
    display: flex;
    margin: 0;
    align-items: center;
    transition:
        color 0.2s ease,
        font-size 0.3s ease;
}

.navbar-brand:active {
    color: #e74c3c !important;
}

@media (pointer: fine) {
    .navbar-brand:hover {
        color: #e74c3c !important;
    }
    .navbar-brand:active {
        color: #cf4030 !important;
    }
}

.btn-options-toggle {
    padding: 0.375rem 0.5rem;
}
</style>
