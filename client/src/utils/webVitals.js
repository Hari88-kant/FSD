export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) console.debug('[CWV] LCP (ms):', Math.round(last.startTime));
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
      console.debug('[CWV] CLS:', clsValue.toFixed(4));
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    // Ignore unsupported entry types in older browsers
  }
}
