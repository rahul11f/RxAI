import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('rxai_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('rxai_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export default api;

export const authAPI = {
  login:    d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  me:       () => api.get('/auth/me'),
};

export const rxAPI = {
  validate: fd => api.post('/prescriptions/validate', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000,
  }),
  list: ()   => api.get('/prescriptions'),
  get:  id   => api.get(`/prescriptions/${id}`),
};

export const drugAPI = {
  list: p   => api.get('/drugs', { params: p }),
  get:  id  => api.get(`/drugs/${id}`),
};

export const chatAPI = {
  send: (message, history) => api.post('/chatbot/message', { message, history }),
};

export const interAPI = {
  check:    (a, b) => api.get('/interactions', { params: { drugA: a, drugB: b } }),
  checkMany: ids   => api.post('/interactions/check-multiple', { drugIds: ids }),
  list:     ()     => api.get('/interactions'),
};

export const healthAPI = {
  list:   t => api.get('/health', t ? { params: { type: t } } : {}),
  create: d => api.post('/health', d),
};
