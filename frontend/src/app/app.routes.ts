import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { streamerGuard } from './core/guards/streamer.guard';
import { HomeComponent } from './features/home/home.component';

/** Home is eager-loaded so `/` always renders even if lazy chunks fail; other routes stay lazy. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register/register.component').then((m) => m.RegisterComponent) },
  { path: 'browse', loadComponent: () => import('./features/browse/browse.component').then((m) => m.BrowseComponent) },
  {
    path: 'browse/:cat',
    loadComponent: () => import('./features/browse/category-browse.component').then((m) => m.CategoryBrowseComponent)
  },
  { path: 'clips', loadComponent: () => import('./features/clips/clips.component').then((m) => m.ClipsComponent) },
  {
    path: 'following',
    loadComponent: () => import('./features/following/following.component').then((m) => m.FollowingComponent),
    canActivate: [authGuard]
  },
  { path: 'search', loadComponent: () => import('./features/search/search.component').then((m) => m.SearchComponent) },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [streamerGuard]
  },
  {
    path: 'dashboard/analytics',
    loadComponent: () => import('./features/dashboard/analytics.component').then((m) => m.AnalyticsComponent),
    canActivate: [streamerGuard]
  },
  {
    path: 'dashboard/moderation',
    loadComponent: () => import('./features/dashboard/moderation.component').then((m) => m.ModerationDashboardComponent),
    canActivate: [streamerGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-shell.component').then((m) => m.SettingsShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        loadComponent: () => import('./features/settings/settings-profile.component').then((m) => m.SettingsProfileComponent)
      },
      {
        path: 'security',
        loadComponent: () => import('./features/settings/settings-security.component').then((m) => m.SettingsSecurityComponent)
      },
      {
        path: 'preferences',
        loadComponent: () => import('./features/settings/settings-preferences.component').then((m) => m.SettingsPreferencesComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/settings/settings-notifications.component').then((m) => m.SettingsNotificationsComponent)
      },
      {
        path: 'connections',
        loadComponent: () => import('./features/settings/settings-connections.component').then((m) => m.SettingsConnectionsComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./features/settings/settings-payments.component').then((m) => m.SettingsPaymentsComponent)
      }
    ]
  },
  { path: 'wallet', loadComponent: () => import('./features/wallet/wallet.component').then((m) => m.WalletComponent) },
  {
    path: 'subscriptions',
    loadComponent: () => import('./features/subscriptions/subscriptions.component').then((m) => m.SubscriptionsComponent),
    canActivate: [authGuard]
  },
  { path: 'leaderboard', loadComponent: () => import('./features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent) },
  { path: 'not-found', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) },
  { path: ':username', loadComponent: () => import('./features/channel/channel-page.component').then((m) => m.ChannelPageComponent) },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent) }
];
