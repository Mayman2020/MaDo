import { createReducer, on } from '@ngrx/store';
import { authActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(authActions.loginStart, (state) => ({ ...state, isLoading: true, error: null })),
  on(authActions.authSuccess, (state, { user, accessToken }) => ({
    ...state,
    user,
    accessToken,
    isLoading: false,
    error: null
  })),
  on(authActions.authFailure, (state, { error }) => ({ ...state, isLoading: false, error })),
  on(authActions.logout, () => initialAuthState)
);
