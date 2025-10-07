import dayjs from 'dayjs';
import { onMounted, onUnmounted, ref } from 'vue';

// state shared across all instances
const globalLiveMinute = ref(dayjs());
let intervalId: number | null = null;
let subscriberCount = 0;

function scheduleNextUpdate() {
    // calculate ms until next minute boundary
    const now = dayjs();
    const msUntilNextMinute = (60 - now.second()) * 1000 - now.millisecond();

    intervalId = window.setTimeout(() => {
        globalLiveMinute.value = dayjs();
        scheduleNextUpdate(); // recursively schedule the next update
    }, msUntilNextMinute);
}

function startGlobalTimer() {
    if (intervalId) {
        return;
    }
    globalLiveMinute.value = dayjs();
    scheduleNextUpdate();
}

function stopGlobalTimer() {
    if (intervalId) {
        clearTimeout(intervalId);
        intervalId = null;
    }
}

export const useCurrentTime = () => {
    onMounted(() => {
        subscriberCount++;
        if (subscriberCount === 1) {
            startGlobalTimer();
        }
    });

    onUnmounted(() => {
        subscriberCount--;
        if (subscriberCount === 0) {
            stopGlobalTimer();
        }
    });

    return { liveMinute: globalLiveMinute };
};
