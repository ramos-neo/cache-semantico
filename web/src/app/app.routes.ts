import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'lab' },
      {
        path: 'lab',
        loadComponent: () =>
          import('./features/lab/lab').then((m) => m.Lab),
      },
      {
        path: 'cenarios',
        loadComponent: () =>
          import('./features/cenarios/cenarios').then((m) => m.Cenarios),
      },
      {
        path: 'observabilidade',
        loadComponent: () =>
          import('./features/observabilidade/observabilidade').then(
            (m) => m.Observabilidade,
          ),
      },
      {
        path: 'arquitetura',
        loadComponent: () =>
          import('./features/arquitetura/arquitetura').then((m) => m.Arquitetura),
      },
    ],
  },
  { path: '**', redirectTo: 'lab' },
];
