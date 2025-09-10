<template>
    <div id="app">
        <nav class="navbar navbar-expand-lg border-bottom page-header">
            <div class="container app-container" style="max-width: none">
                <a class="navbar-brand" href="#">
                    <img src="/favicon.svg" alt="Calendar" width="24" height="24" class="me-2" />
                    <strong>PoGo Event Calendar</strong>
                </a>

                <div class="ms-auto">
                    <ThemeSelector />
                </div>
            </div>
        </nav>

        <router-view />

        <!-- Toast notifications -->
        <ToastContainer />
    </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';

import ThemeSelector from '@/components/ThemeSelector.vue';
import ToastContainer from '@/components/Toast/ToastContainer.vue';

// Initialize theme store to apply theme on app start
useThemeStore();
</script>

<style scoped>
.page-header {
    background-color: #343a40;
    border-color: rgba(255, 255, 255, 0.1) !important;
}

[data-bs-theme='dark'] .page-header {
    background-color: #1a1919;
    border-color: rgba(255, 255, 255, 0.08) !important;
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
    font-size: 1.1rem;
    font-weight: 700;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
}

.navbar-brand:hover {
    color: #e74c3c !important;
}
</style>
