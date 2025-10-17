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
            <div class="container app-container">
                <UserMessageBanner />
                <router-view />

                <!-- Footer Disclaimer -->
                <footer class="disclaimer-footer">
                    <p class="disclaimer-text">
                        This website is not affiliated with
                        <a class="link-secondary" href="https://pokemongo.com/" target="_blank" rel="noopener noreferrer">Pokémon GO</a> and is
                        intended to fall under Fair Use doctrine, similar to any other informational site such as a wiki. Pokémon and its trademarks
                        are ©1995-2025 Nintendo, Creatures, and GAMEFREAK. <br />All images and names are owned and trademarked by Nintendo, Niantic,
                        The Pokémon Company, and GAMEFREAK and are property of their respective owners.
                    </p>

                    <p class="disclaimer-text mt-2">
                        Event data is powered by
                        <a class="link-secondary" href="https://leekduck.com/" target="_blank" rel="noopener noreferrer">Leekduck</a> via
                        <a class="link-secondary" href="https://github.com/bigfoott/ScrapedDuck" target="_blank" rel="noopener noreferrer"
                            >ScrapedDuck</a
                        >.
                    </p>

                    <p class="disclaimer-text mt-2">
                        This site does not use cookies, tracking, or advertisements of any kind. All preferences are stored within
                        <a
                            class="link-secondary"
                            href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
                            target="_blank"
                            rel="noopener noreferrer"
                            >localStorage</a
                        >
                        in your browser.
                    </p>
                </footer>
            </div>
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
import UserMessageBanner from '@/components/UserMessages/UserMessageBanner.vue';

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

.disclaimer-footer {
    margin-top: 2rem;
    padding: 1.5rem 0;
    text-align: center;
    border-top: 1px solid var(--bs-border-color);
}

.disclaimer-text {
    margin: 0;
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
    line-height: 1.5;
}
</style>
