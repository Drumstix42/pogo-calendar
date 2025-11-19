import vue from '@vitejs/plugin-vue';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
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

function versionPlugin() {
    return {
        name: 'version-generator',
        buildStart() {
            const timestamp = Date.now();
            const date = new Date(timestamp);

            // format: MM/DD/YYYY, HH:MM:SS AM/PM TIMEZONE
            const hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();

            // get timezone abbreviation (e.g., EST, UTC, PST)
            const timezone =
                new Intl.DateTimeFormat('en-US', {
                    timeZoneName: 'short',
                })
                    .formatToParts(date)
                    .find(part => part.type === 'timeZoneName')?.value || 'UTC';

            const humanReadable = `${month}/${day}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm} ${timezone}`;

            const versionData = {
                timestamp: timestamp,
                timestampFormatted: humanReadable,
            };

            const versionPath = resolve(__dirname, 'public', 'version.json');
            writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

            console.log(`Generated version.json: ${humanReadable}`);
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), buildInfoPlugin(), versionPlugin()],
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
