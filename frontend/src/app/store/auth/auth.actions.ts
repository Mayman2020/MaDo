import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../core/services/auth.service';

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login Start': emptyProps(),
    'Auth Success': props<{ user: User; accessToken: string }>(),
    'Auth Failure': props<{ error: string }>(),
    Logout: emptyProps()
  }
});
