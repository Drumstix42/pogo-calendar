import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ToastAction {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export interface ToastMessage {
    id: number;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message?: string;
    duration?: number; // milliseconds, default 5000
    actions?: ToastAction[];
    color?: string;
}

export const useToastsStore = defineStore('toasts', () => {
    const toasts = ref<ToastMessage[]>([]);
    const nextId = ref(1);

    const addToast = (toast: Omit<ToastMessage, 'id'>): number => {
        const id = nextId.value++;
        const newToast: ToastMessage = {
            id,
            ...toast,
            duration: toast.duration ?? 5000, // Default 5 seconds
        };

        toasts.value.push(newToast);
        return id;
    };

    const removeToast = (id: number): void => {
        const index = toasts.value.findIndex(toast => toast.id === id);
        if (index > -1) {
            toasts.value.splice(index, 1);
        }
    };

    const clearAllToasts = (): void => {
        toasts.value = [];
    };

    const addEventFilterToast = ({
        eventTypeName,
        eventTypeColor,
        action,
        undoAction,
        duration,
    }: {
        eventTypeName: string;
        eventTypeColor: string;
        action: 'hidden' | 'shown';
        undoAction?: () => void;
        duration?: number;
    }): number => {
        const actionColor = action === 'hidden' ? '#e6a700' : '#32d74b'; // yellow / green
        const styledAction = `<span style="color: ${actionColor}">${action}</span>`;
        const title = `Event type ${styledAction}:`;
        const message = eventTypeName;

        const actions: ToastAction[] = [];
        if (undoAction) {
            actions.push({
                label: 'UNDO',
                action: undoAction,
                style: 'secondary',
            });
        }

        return addToast({
            type: action === 'hidden' ? 'warning' : 'success',
            title,
            message,
            color: eventTypeColor,
            actions: actions.length > 0 ? actions : undefined,
            duration,
        });
    };

    return {
        // State
        toasts,

        // Actions
        addToast,
        removeToast,
        clearAllToasts,
        addEventFilterToast,
    };
});
