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
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Lab',
          description:
            'Laboratório interativo do cache semântico — em construção.',
        },
      },
      {
        path: 'cenarios',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Cenários',
          description: 'Cenários didáticos de hit/miss e fingerprint — em construção.',
        },
      },
      {
        path: 'observabilidade',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Observabilidade',
          description:
            'Telemetria de source, cache e latência — em construção.',
        },
      },
      {
        path: 'arquitetura',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Arquitetura',
          description:
            'Visão da cascata exact → semantic → AI — em construção.',
        },
      },
    ],
  },
  { path: '**', redirectTo: 'lab' },
];
