import vue from '@vitejs/plugin-vue';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

function buildInfoPlugin() {
    return {
        name: 'build-info',
        transformIndexHtml(html) {
            let buildHash = 'dev';

            if (process.env.NODE_ENV === 'production') {
                try {
                    buildHash = execSync('git rev-parse --short HEAD').toString().trim();
                } catch {
                    buildHash = Date.now().toString(36);
                }
            }

            return html.replace('<head>', `<head>\n        <!-- Build: ${buildHash} -->`);
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), buildInfoPlugin()],
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
