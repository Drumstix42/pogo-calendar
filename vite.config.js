import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

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
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['color-functions', 'global-builtin', 'import'],
            },
        },
    },
});
