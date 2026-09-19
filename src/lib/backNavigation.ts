import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export type BackHandlerFn = () => boolean | void;

interface HandlerEntry {
  id: string;
  priority: number;
  fn: BackHandlerFn;
}

class BackNavigationManager {
  private handlers: HandlerEntry[] = [];
  private lastRootBackPressTime: number = 0;
  private isCapacitorListenerAttached: boolean = false;
  private rootExitCallback?: () => void;
  private showToastCallback?: (message: string, type?: 'info' | 'success' | 'error') => void;

  init(options?: {
    onRootExit?: () => void;
    showToast?: (message: string, type?: 'info' | 'success' | 'error') => void;
  }) {
    if (options?.onRootExit) this.rootExitCallback = options.onRootExit;
    if (options?.showToast) this.showToastCallback = options.showToast;

    if (!this.isCapacitorListenerAttached) {
      this.isCapacitorListenerAttached = true;

      // Capacitor Hardware Back Button listener (Android)
      if (Capacitor.isNativePlatform()) {
        try {
          App.addListener('backButton', () => {
            this.handleBack();
          });
        } catch (e) {
          console.warn('Capacitor App backButton listener error:', e);
        }
      }

      // Browser popstate listener for Web / PWA
      window.addEventListener('popstate', () => {
        // When user presses browser back
        const handled = this.handleBack();
        if (handled) {
          // Push a dummy state back so next back press also triggers popstate
          window.history.pushState({ chatbaseBack: true }, '');
        }
      });

      // Seed initial history state
      try {
        window.history.pushState({ chatbaseBack: true }, '');
      } catch {
        // ignore
      }
    }
  }

  setToastHandler(toastFn: (message: string, type?: 'info' | 'success' | 'error') => void) {
    this.showToastCallback = toastFn;
  }

  /**
   * Register a back button handler. Higher priority runs first.
   * Priority guidelines:
   * 100+: Modals, Lightbox, full-screen popups
   * 50+: Menus, Drawers, Pickers (Emoji, Context menus)
   * 20+: Active Chat Window
   * 10+: Tab Navigation
   * 0: Root Screen
   */
  register(fn: BackHandlerFn, priority: number = 10): () => void {
    const id = Math.random().toString(36).substring(2, 9);
    this.handlers.push({ id, priority, fn });
    // Sort descending by priority (highest priority first)
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => {
      this.handlers = this.handlers.filter((h) => h.id !== id);
    };
  }

  /**
   * Execute back action. Returns true if an action was handled, false if at root.
   */
  handleBack(): boolean {
    // Provide a light tactile feedback on back press if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }

    // Run registered handlers from highest priority to lowest
    for (let i = 0; i < this.handlers.length; i++) {
      const entry = this.handlers[i];
      try {
        const result = entry.fn();
        // If handler returned true or did not explicitly return false, consider it handled
        if (result !== false) {
          return true;
        }
      } catch (err) {
        console.error('Error executing back handler:', err);
      }
    }

    // If no custom handlers handled it, we are at the ROOT level of the application
    const now = Date.now();
    const doublePressDelay = 2000; // 2 seconds threshold

    if (now - this.lastRootBackPressTime < doublePressDelay) {
      // Second press within 2s -> exit the application
      if (Capacitor.isNativePlatform()) {
        try {
          App.exitApp();
        } catch {
          // fallback
        }
      } else if (this.rootExitCallback) {
        this.rootExitCallback();
      }
      return false;
    } else {
      // First press at root screen -> show confirmation toast
      this.lastRootBackPressTime = now;
      if (this.showToastCallback) {
        this.showToastCallback('Press back again to exit', 'info');
      }
      return true;
    }
  }
}

export const backNavigation = new BackNavigationManager();
