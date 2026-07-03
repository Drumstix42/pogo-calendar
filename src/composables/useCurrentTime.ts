import dayjs from 'dayjs';
import { onMounted, onUnmounted, ref } from 'vue';

// Dev-only "now" override for testing (e.g. ?devTime=2026-07-06T14:00:00): computes a fixed
// offset once at load, then time keeps ticking forward normally from that point.
function getDevTimeOffsetMs() {
    if (!import.meta.env.DEV) return 0;

    const devTime = new URLSearchParams(window.location.search).get('devTime');
    if (!devTime) return 0;

    const target = dayjs(devTime);
    return target.isValid() ? target.diff(dayjs()) : 0;
}

const devTimeOffsetMs = getDevTimeOffsetMs();

function getNow() {
    return devTimeOffsetMs ? dayjs().add(devTimeOffsetMs, 'millisecond') : dayjs();
}

// state shared across all instances
const globalLiveMinute = ref(getNow());
const globalLiveHour = ref(getNow().startOf('hour'));
const globalLiveDay = ref(getNow().startOf('day'));
let intervalId: number | null = null;
let subscriberCount = 0;

function scheduleNextUpdate() {
    // calculate ms until next minute boundary
    const now = getNow();
    const msUntilNextMinute = (60 - now.second()) * 1000 - now.millisecond();

    intervalId = window.setTimeout(() => {
        const newNow = getNow();
        globalLiveMinute.value = newNow;

        // update hour only when it changes
        const newHour = newNow.startOf('hour');
        if (!globalLiveHour.value.isSame(newHour, 'hour')) {
            globalLiveHour.value = newHour;
        }

        // update day only when it changes
        const newDay = newNow.startOf('day');
        if (!globalLiveDay.value.isSame(newDay, 'day')) {
            globalLiveDay.value = newDay;
        }

        scheduleNextUpdate(); // recursively schedule the next update
    }, msUntilNextMinute);
}

function startGlobalTimer() {
    if (intervalId) {
        return;
    }
    globalLiveMinute.value = getNow();
    globalLiveHour.value = getNow().startOf('hour');
    globalLiveDay.value = getNow().startOf('day');
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

    return { liveMinute: globalLiveMinute, liveHour: globalLiveHour, liveDay: globalLiveDay };
};
