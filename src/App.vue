<template>
    <div id="app">
        <nav
            class="navbar navbar-expand-lg navbar-light bg-white border-bottom"
        >
            <div class="container">
                <a class="navbar-brand text-dark" href="#">
                    <CalendarDays :size="24" class="me-2" />
                    <strong>Pokemon Go Event Calendar</strong>
                </a>
            </div>
        </nav>

        <router-view />
    </div>
</template>

<script lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { CalendarDays } from 'lucide-vue-next';

export default {
    name: 'App',
    components: {
        CalendarDays,
    },
    setup() {
        let navbar: HTMLElement | null = null;

        const handleScroll = () => {
            if (!navbar) return;

            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        onMounted(() => {
            navbar = document.querySelector('.navbar');
            window.addEventListener('scroll', handleScroll);
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll);
        });

        return {};
    },
};
</script>

<style scoped>
.navbar {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
}

@media (min-width: 768px) {
    .navbar {
        position: sticky;
        top: 0;
        z-index: 1030;
        backdrop-filter: blur(8px);
        background-color: rgba(255, 255, 255, 0.95) !important;
    }

    .navbar.scrolled {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
}

.navbar-brand {
    color: #2c3e50 !important;
    font-weight: 700;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
}

.navbar-brand:hover {
    color: #e74c3c !important;
}
</style>
