import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        hmr: {
            //overlay: false,
        },
        watch: {
            //usePolling: false,
            ignored: ['**/node_modules/**', '**/dist/**'],
        },
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    optimizeDeps: {
        include: ['vue', 'vue-router', 'lucide-vue-next', 'pinia'],
    },
});
