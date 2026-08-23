/**
 * Navigation History Utility
 * Keeps an in-session stack of visited routes so back buttons always navigate
 * back to the user's actual previous / recent screen rather than jumping to an arbitrary fallback.
 */

const HISTORY_KEY = 'constructos_route_history';

export function recordCurrentRoute(pathname: string): void {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    let history: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history)) history = [];

    // Avoid pushing consecutive duplicate routes
    if (history.length === 0 || history[history.length - 1] !== pathname) {
      history.push(pathname);
      // Keep up to 50 recent routes
      if (history.length > 50) {
        history = history.slice(history.length - 50);
      }
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.warn('Failed to record route history:', e);
  }
}

export function getPreviousRoute(currentPathname?: string): string | null {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const history: string[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history) || history.length === 0) return null;

    // Look backwards from the end to find the most recent route that is different from current
    for (let i = history.length - 1; i >= 0; i--) {
      const route = history[i];
      if (currentPathname) {
        if (route !== currentPathname) {
          return route;
        }
      } else if (i < history.length - 1) {
        return route;
      }
    }
  } catch (e) {
    console.warn('Failed to get previous route:', e);
  }
  return null;
}

export function navigateToPreviousRoute(
  navigate: (to: any) => void,
  fallbackPath: string = '/'
): void {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    let history: string[] = raw ? JSON.parse(raw) : [];

    if (Array.isArray(history) && history.length > 1) {
      // Current is at top
      history.pop();
      // Previous is next
      const prev = history.pop();
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      if (prev) {
        navigate(prev);
        return;
      }
    }
  } catch (e) {
    console.warn('Failed to navigate to previous route:', e);
  }

  // Fallback to browser back or designated default
  if (window.history.length > 1 && window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
    navigate(-1);
  } else {
    navigate(fallbackPath);
  }
}
