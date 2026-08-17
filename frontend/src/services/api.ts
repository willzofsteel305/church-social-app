import axios, { AxiosInstance } from 'axios';
import { AuthResponse, Event, LoginPayload, Post, RegisterPayload, User } from '../types';

const configuredBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const normalizedBase = configuredBase.endsWith('/api') ? configuredBase : `${configuredBase}/api`;

const api: AxiosInstance = axios.create({
  baseURL: normalizedBase,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Token ' + token;
  }
  return config;
});

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },
};

export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const { data } = await api.get<{ posts: Post[] }>('/posts');
    return data.posts;
  },
};

export const eventsApi = {
  getAll: async (): Promise<Event[]> => {
    const { data } = await api.get<{ events: Event[] }>('/events');
    return data.events;
  },
  rsvp: async (eventId: number, status: string = 'interested'): Promise<void> => {
    await api.post(`/events/${eventId}/rsvp`, { status });
  },
};

export const usersApi = {
  getById: async (id: number): Promise<User> => {
    const { data } = await api.get<{ user: User }>(`/users/${id}`);
    return data.user;
  },
  getPosts: async (id: number): Promise<Post[]> => {
    const { data } = await api.get<{ posts: Post[] }>(`/users/${id}/posts`);
    return data.posts;
  },
  getEvents: async (id: number): Promise<Event[]> => {
    const { data } = await api.get<{ events: Event[] }>(`/users/${id}/events`);
    return data.events;
  },
};

export default api;
