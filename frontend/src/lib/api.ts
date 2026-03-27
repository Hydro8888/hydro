import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyAdult: () => api.post('/auth/verify-adult'),
};

export const jobsAPI = {
  list: (params?: Record<string, any>) => api.get('/jobs', { params }),
  detail: (id: string) => api.get(`/jobs/${id}`),
  apply: (id: string, message?: string) => api.post(`/jobs/${id}/apply`, { message }),
  save: (id: string) => api.post(`/jobs/${id}/save`),
  report: (id: string, data: { reason: string; description?: string }) => api.post(`/jobs/${id}/report`, data),
};

export const communityAPI = {
  listPosts: (params?: Record<string, any>) => api.get('/posts', { params }),
  getPost: (id: string) => api.get(`/posts/${id}`),
  createPost: (data: any) => api.post('/posts', data),
  addComment: (postId: string, data: { content: string; isAnonymous?: boolean }) => api.post(`/posts/${postId}/comments`, data),
};

export const userAPI = {
  profile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
  applications: () => api.get('/user/applications'),
  savedJobs: () => api.get('/user/saved-jobs'),
  notifications: () => api.get('/user/notifications'),
  readNotification: (id: string) => api.put(`/user/notifications/${id}/read`),
};

export const uploadAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return api.post('/upload/multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
