import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
} from "electron";

export default (options: BrowserWindowConstructorOptions): BrowserWindow => {
  let state = {};
  let win;

  const browserOptions: BrowserWindowConstructorOptions = {
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      ...options.webPreferences,
    },
    minWidth: 360,
    minHeight: 600,
  };
  win = new BrowserWindow(browserOptions);

  return win;
};
