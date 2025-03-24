/**
 * Utility functions for Telegram WebApp integration
 */

// Define the type for Telegram WebApp object
export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: {
      type: 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
      id?: string;
    }[];
  }) => Promise<{ button_id: string }>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    isVisible: boolean;
  };
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }) => void;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
  };
  initData: string;
  initDataUnsafe: Record<string, any>;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

// Define a type for the window object with Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

/**
 * Check if the application is running in Telegram WebApp
 */
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && window.Telegram?.WebApp !== undefined;
};

/**
 * Get the Telegram WebApp object
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (isTelegramWebApp()) {
    return window.Telegram!.WebApp;
  }
  return null;
};

/**
 * Get user ID from URL parameters
 */
export const getUserId = (): string => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user_id') || 'default';
  }
  return 'default';
};

/**
 * Initialize the Telegram WebApp
 */
export const initTelegramWebApp = (): void => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    // Notify Telegram that the WebApp is ready
    webApp.ready();

    // Expand the WebApp to its maximum allowed height
    webApp.expand();

    // Configure closing confirmation if game is in progress
    webApp.enableClosingConfirmation();

    // Apply Telegram theme colors to the app
    applyTelegramTheme(webApp);
  }
};

/**
 * Apply Telegram theme colors to the application
 */
const applyTelegramTheme = (webApp: TelegramWebApp): void => {
  const root = document.documentElement;

  // Apply theme colors if available
  if (webApp.themeParams) {
    if (webApp.themeParams.bg_color) {
      root.style.setProperty('--tg-bg-color', webApp.themeParams.bg_color);
    }
    if (webApp.themeParams.text_color) {
      root.style.setProperty('--tg-text-color', webApp.themeParams.text_color);
    }
    if (webApp.themeParams.button_color) {
      root.style.setProperty('--tg-button-color', webApp.themeParams.button_color);
    }
    if (webApp.themeParams.button_text_color) {
      root.style.setProperty('--tg-button-text-color', webApp.themeParams.button_text_color);
    }
    if (webApp.themeParams.secondary_bg_color) {
      root.style.setProperty('--tg-secondary-bg-color', webApp.themeParams.secondary_bg_color);
    }
  }

  // Add a class to the body based on the color scheme
  document.body.classList.add(`tg-${webApp.colorScheme || 'light'}`);
};

/**
 * Show a popup in Telegram WebApp
 */
export const showTelegramPopup = async (
  message: string,
  title?: string,
  buttons?: {
    type: 'ok' | 'close' | 'cancel' | 'destructive';
    text: string;
    id?: string;
  }[]
): Promise<string | null> => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      const result = await webApp.showPopup({
        title,
        message,
        buttons: buttons || [{ type: 'ok', text: 'OK' }],
      });
      return result.button_id || null;
    } catch (error) {
      console.error('Error showing Telegram popup:', error);
    }
  }
  return null;
};

/**
 * Show an alert in Telegram WebApp
 */
export const showTelegramAlert = async (message: string): Promise<void> => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      await webApp.showAlert(message);
    } catch (error) {
      console.error('Error showing Telegram alert:', error);
    }
  }
};

/**
 * Show a confirmation dialog in Telegram WebApp
 */
export const showTelegramConfirm = async (message: string): Promise<boolean> => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    try {
      return await webApp.showConfirm(message);
    } catch (error) {
      console.error('Error showing Telegram confirmation:', error);
    }
  }
  return false;
};

/**
 * Save game statistics to server
 */
export const saveStatsToServer = async (stats: Record<string, any>): Promise<void> => {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/save-stats?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stats),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error saving stats to server:', error);
  }
};

/**
 * Load game statistics from server
 */
export const loadStatsFromServer = async (): Promise<Record<string, any> | null> => {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/get-stats?user_id=${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error loading stats from server:', error);
    return null;
  }
};
