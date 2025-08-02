<template>
    <div id="app">
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
            <div class="container">
                <a class="navbar-brand" href="#">
                    <strong>Pokemon Go Event Calendar</strong>
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

<style scoped></style>
