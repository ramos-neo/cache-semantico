import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HealthService } from '../../core/health/health.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatListModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  private readonly health = inject(HealthService);

  readonly healthState = this.health.state;
  readonly healthError = this.health.lastError;

  readonly navItems: NavItem[] = [
    { path: '/lab', label: 'Lab', icon: 'science' },
    { path: '/cenarios', label: 'Cenários', icon: 'route' },
    { path: '/observabilidade', label: 'Observabilidade', icon: 'monitoring' },
    { path: '/arquitetura', label: 'Arquitetura', icon: 'architecture' },
  ];

  ngOnInit(): void {
    this.health.refresh().subscribe();
  }

  refreshHealth(): void {
    this.health.refresh().subscribe();
  }

  healthIcon(): string {
    switch (this.healthState()) {
      case 'healthy':
        return 'check_circle';
      case 'unhealthy':
        return 'error';
      default:
        return 'hourglass_empty';
    }
  }

  healthLabel(): string {
    switch (this.healthState()) {
      case 'healthy':
        return 'API ok';
      case 'unhealthy':
        return 'API offline';
      default:
        return 'Verificando…';
    }
  }

  healthAriaLabel(): string {
    return `Status do backend: ${this.healthLabel()}. Clique para atualizar.`;
  }

  healthTooltip(): string {
    const err = this.healthError();
    if (this.healthState() === 'unhealthy' && err) {
      return err;
    }
    return 'Atualizar status da API (GET /health + /db/status)';
  }
}
