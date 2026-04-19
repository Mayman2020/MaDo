import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { BrowseComponent } from './features/browse/browse.component';
import { CategoryBrowseComponent } from './features/browse/category-browse.component';
import { ChannelPageComponent } from './features/channel/channel-page.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AnalyticsComponent } from './features/dashboard/analytics.component';
import { ModerationDashboardComponent } from './features/dashboard/moderation.component';
import { SettingsShellComponent } from './features/settings/settings-shell.component';
import { SettingsProfileComponent } from './features/settings/settings-profile.component';
import { SettingsSecurityComponent } from './features/settings/settings-security.component';
import { SettingsPreferencesComponent } from './features/settings/settings-preferences.component';
import { SettingsNotificationsComponent } from './features/settings/settings-notifications.component';
import { SettingsConnectionsComponent } from './features/settings/settings-connections.component';
import { SettingsPaymentsComponent } from './features/settings/settings-payments.component';
import { WalletComponent } from './features/wallet/wallet.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';
import { ClipsComponent } from './features/clips/clips.component';
import { FollowingComponent } from './features/following/following.component';
import { SearchComponent } from './features/search/search.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { streamerGuard } from './core/guards/streamer.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'browse', component: BrowseComponent },
  { path: 'browse/:cat', component: CategoryBrowseComponent },
  { path: 'clips', component: ClipsComponent },
  { path: 'following', component: FollowingComponent, canActivate: [authGuard] },
  { path: 'search', component: SearchComponent },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [streamerGuard] },
  { path: 'dashboard/analytics', component: AnalyticsComponent, canActivate: [streamerGuard] },
  { path: 'dashboard/moderation', component: ModerationDashboardComponent, canActivate: [streamerGuard] },
  {
    path: 'settings',
    component: SettingsShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      { path: 'profile', component: SettingsProfileComponent },
      { path: 'security', component: SettingsSecurityComponent },
      { path: 'preferences', component: SettingsPreferencesComponent },
      { path: 'notifications', component: SettingsNotificationsComponent },
      { path: 'connections', component: SettingsConnectionsComponent },
      { path: 'payments', component: SettingsPaymentsComponent }
    ]
  },
  { path: 'wallet', component: WalletComponent },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: [authGuard] },
  { path: 'not-found', component: NotFoundComponent },
  { path: ':username', component: ChannelPageComponent },
  { path: '**', component: NotFoundComponent }
];
