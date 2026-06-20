import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Keluarga,
  AnggotaKeluarga,
  User,
  ScreenName,
} from "./types";
import { SEED_KK, genId, now } from "./mock-data";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  keluargaList: Keluarga[];
  currentScreen: ScreenName;
  selectedKeluargaId: string | null;
  draftKeluarga: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt"> | null;
  ocrProvider: string | null;
  ocrDurationMs: number | null;
  ocrError: string | null;
  deskewInfo: {
    detectedAngle: number;
    confidence: number;
    corrected: boolean;
    durationMs: number;
  } | null;

  login: (email: string, displayName?: string) => void;
  logout: () => void;
  navigate: (screen: ScreenName, kkId?: string) => void;
  addKeluarga: (
    data: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt">,
  ) => string;
  updateKeluarga: (id: string, data: Partial<Keluarga>) => void;
  deleteKeluarga: (id: string) => void;
  getKeluarga: (id: string) => Keluarga | undefined;
  setDraftKeluarga: (
    data: Omit<Keluarga, "id" | "createdBy" | "createdAt" | "updatedAt"> | null,
  ) => void;
  addDraftAnggota: (anggota: AnggotaKeluarga) => void;
  updateDraftAnggota: (id: string, data: Partial<AnggotaKeluarga>) => void;
  removeDraftAnggota: (id: string) => void;
  setOcrMeta: (
    provider: string | null,
    durationMs: number | null,
    error: string | null,
    deskewInfo?: {
      detectedAngle: number;
      confidence: number;
      corrected: boolean;
      durationMs: number;
    } | null,
  ) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      keluargaList: SEED_KK,
      currentScreen: "login",
      selectedKeluargaId: null,
      draftKeluarga: null,
      ocrProvider: null,
      ocrDurationMs: null,
      ocrError: null,
      deskewInfo: null,

      login: (email, displayName) => {
        const user: User = {
          uid: genId("uid"),
          email,
          displayName: displayName || email.split("@")[0] || "Operator",
          role: "admin",
        };
        set({
          user,
          isAuthenticated: true,
          currentScreen: "home",
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          currentScreen: "login",
          selectedKeluargaId: null,
          draftKeluarga: null,
        });
      },

      navigate: (screen, kkId) => {
        set({
          currentScreen: screen,
          ...(kkId !== undefined ? { selectedKeluargaId: kkId } : {}),
        });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      },

      addKeluarga: (data) => {
        const id = genId("kk");
        const newKk: Keluarga = {
          ...data,
          id,
          createdBy: get().user?.uid ?? "unknown",
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({
          keluargaList: [newKk, ...state.keluargaList],
          draftKeluarga: null,
        }));
        return id;
      },

      updateKeluarga: (id, data) => {
        set((state) => ({
          keluargaList: state.keluargaList.map((kk) =>
            kk.id === id ? { ...kk, ...data, updatedAt: now() } : kk,
          ),
        }));
      },

      deleteKeluarga: (id) => {
        set((state) => ({
          keluargaList: state.keluargaList.filter((kk) => kk.id !== id),
          selectedKeluargaId: null,
          currentScreen: "home",
        }));
      },

      getKeluarga: (id) => get().keluargaList.find((kk) => kk.id === id),

      setDraftKeluarga: (data) => {
        set({ draftKeluarga: data });
      },

      addDraftAnggota: (anggota) => {
        set((state) => {
          if (!state.draftKeluarga) return {};
          return {
            draftKeluarga: {
              ...state.draftKeluarga,
              anggota: [...state.draftKeluarga.anggota, anggota],
            },
          };
        });
      },

      updateDraftAnggota: (id, data) => {
        set((state) => {
          if (!state.draftKeluarga) return {};
          return {
            draftKeluarga: {
              ...state.draftKeluarga,
              anggota: state.draftKeluarga.anggota.map((a) =>
                a.id === id ? { ...a, ...data } : a,
              ),
            },
          };
        });
      },

      removeDraftAnggota: (id) => {
        set((state) => {
          if (!state.draftKeluarga) return {};
          return {
            draftKeluarga: {
              ...state.draftKeluarga,
              anggota: state.draftKeluarga.anggota.filter((a) => a.id !== id),
            },
          };
        });
      },

      setOcrMeta: (provider, durationMs, error, deskewInfo = null) => {
        set({
          ocrProvider: provider,
          ocrDurationMs: durationMs,
          ocrError: error,
          deskewInfo,
        });
      },
    }),
    {
      name: "kk-scanner-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        keluargaList: state.keluargaList,
      }),
    },
  ),
);
