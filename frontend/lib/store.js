import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  setUser: (user) => set({ user }),

  // IDE State
  openFiles: [],
  activeFile: null,
  files: [],

  setOpenFiles: (files) => set({ openFiles: files }),
  setActiveFile: (file) => set({ activeFile: file }),
  setFiles: (files) => set({ files }),

  addFile: (file) =>
    set((state) => ({
      openFiles: state.openFiles.find((f) => f.path === file.path)
        ? state.openFiles
        : [...state.openFiles, file],
      activeFile: file,
    })),

  closeFile: (path) =>
    set((state) => {
      const newFiles = state.openFiles.filter((f) => f.path !== path);
      const newActive = state.activeFile?.path === path
        ? newFiles[newFiles.length - 1] || null
        : state.activeFile;
      return { openFiles: newFiles, activeFile: newActive };
    }),
}));

export default useStore;
