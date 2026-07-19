<template>
    <Teleport to="body">
        <Transition name="offcanvas-fade">
            <div v-if="show" class="raid-bosses-backdrop" @click="emit('close')">
                <div class="offcanvas offcanvas-bottom show raid-bosses-offcanvas" @click.stop>
                    <CurrentRaidBossesOffcanvas @close="emit('close')" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import CurrentRaidBossesOffcanvas from '@/components/CurrentRaidBossesOffcanvas.vue';

defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>

<style scoped>
.raid-bosses-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1070;
    display: flex;
    align-items: flex-end;
    backdrop-filter: blur(2px);
}

.raid-bosses-offcanvas {
    position: relative;
    width: 100%;
    height: auto;
    min-height: 40vh;
    max-height: 80dvh;
    border: none;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    background-color: var(--bs-body-bg);
    display: flex;
    flex-direction: column;
    /* iOS safe area support */
    padding-bottom: env(safe-area-inset-bottom);
}

/* Bottom offcanvas slide-up animation */
.offcanvas-fade-enter-active .raid-bosses-offcanvas {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.offcanvas-fade-enter-from .raid-bosses-offcanvas {
    transform: translateY(100%);
}

.offcanvas-fade-enter-to .raid-bosses-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-active .raid-bosses-offcanvas {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.offcanvas-fade-leave-from .raid-bosses-offcanvas {
    transform: translateY(0);
}

.offcanvas-fade-leave-to .raid-bosses-offcanvas {
    transform: translateY(100%);
}
</style>
