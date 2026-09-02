import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ServersComponent } from './pages/servers/servers.component';
import { PlansComponent } from './pages/plans/plans.component';
import { ServicesComponent } from './pages/services/services.component';
import { UsersComponent } from './pages/users/users.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SubPreviewComponent } from './pages/sub-preview/sub-preview.component';
import { BroadcastComponent } from './pages/broadcast/broadcast.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'servers', component: ServersComponent },
  { path: 'plans', component: PlansComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'users', component: UsersComponent },
  { path: 'broadcast', component: BroadcastComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'sub-preview', component: SubPreviewComponent },
  { path: '**', redirectTo: 'dashboard' }
];
