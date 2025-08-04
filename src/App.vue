<template>
    <div id="app">
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
            <div class="container">
                <a class="navbar-brand text-dark" href="#">
                    <img src="/favicon.svg" alt="Calendar" width="24" height="24" class="me-2" />
                    <strong>PoGo Event Calendar</strong>
                </a>
            </div>
        </nav>

        <router-view />
    </div>
</template>

<script lang="ts">
export default {
    name: 'App',
};
</script>

<style scoped>
.navbar-brand {
    color: #2c3e50 !important;
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
