let listeners = [];
let id = 0;

export const toastBus = {
  subscribe(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  },
  emit(payload) {
    listeners.forEach((l) => l(payload));
  }
};

export function showToast({ message, variant = "success", duration = 3000 }) {
  toastBus.emit({ id: ++id, message, variant, duration });
}