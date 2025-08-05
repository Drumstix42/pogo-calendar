import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import router from './router';
import './style.css';

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(FloatingVue, {
    themes: {
        // touch seems buggy when zooming and panning, so disabled for now
        tooltip: {
            placement: 'top',
            triggers: ['hover', 'focus', /* 'touch', */ 'click'],
        },
        menu: {
            placement: 'top',
            triggers: ['hover', 'focus', /* 'touch', */ 'click'],
        },
    },
});
app.mount('#app');
