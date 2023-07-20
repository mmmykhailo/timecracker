import { ipcRenderer } from "electron";
import { create } from "zustand";
import {
  StateStorage,
  createJSONStorage,
  devtools,
  persist,
} from "zustand/middleware";

export type MainStore = {
  reportsFolder: string | null;
  setReportsFolder: (folder: string) => void;
};

const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await ipcRenderer.invoke("storage:get", name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await ipcRenderer.invoke("storage:set", name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await ipcRenderer.invoke("storage:delete", name);
  },
};

export const useMainStore = create<MainStore>()(
  devtools(
    persist(
      (set) => ({
        reportsFolder: null,
        setReportsFolder: (folder: string) => set({ reportsFolder: folder }),
      }),
      {
        name: "main-storage",
        storage: createJSONStorage(() => storage),
      }
    )
  )
);
