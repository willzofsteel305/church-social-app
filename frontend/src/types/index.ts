export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  bio?: string;
  profileImageUrl?: string;
  isAdmin?: boolean;
  createdAt?: string;
}

export interface Post {
  id: number;
  user_id?: number;
  title?: string;
  content: string;
  type?: string;
  visibility?: string;
  created_at?: string;
  createdAt?: string;
  user?: User;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  date?: string;
  event_date?: string;
  location?: string;
  organizerId?: number;
  organizerName?: string;
  capacity?: number;
  rsvpStatus?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
