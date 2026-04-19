import { User } from '../../core/services/auth.service';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  error: null
};
