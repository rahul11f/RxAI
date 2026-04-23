import { create } from 'zustand';

export const useStore = create((set, get) => ({
  user:            null,
  token:           localStorage.getItem('rxai_token'),
  isAuthenticated: !!localStorage.getItem('rxai_token'),
  theme:           'dark',
  prescriptions:   [],
  chatHistory:     [],

  login: (user, token) => {
    localStorage.setItem('rxai_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('rxai_token');
    set({ user: null, token: null, isAuthenticated: false, prescriptions: [], chatHistory: [] });
  },
  toggleTheme: () => {
    // Theme is fixed to dark robotic AI mode
  },
  setPrescriptions: p  => set({ prescriptions: p }),
  addPrescription:  p  => set(s => ({ prescriptions: [p, ...s.prescriptions] })),
  addChatMsg:       m  => set(s => ({ chatHistory: [...s.chatHistory, m] })),
  clearChat:        () => set({ chatHistory: [] }),
}));
