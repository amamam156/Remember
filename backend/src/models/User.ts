export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    username: string;
  };
  message?: string;
}
