import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-placeholder',
  templateUrl: './placeholder.html',
  styleUrl: './placeholder.scss',
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);

  private readonly data = toSignal(
    this.route.data.pipe(
      map((d) => ({
        title: (d['title'] as string | undefined) ?? 'Em breve',
        description:
          (d['description'] as string | undefined) ??
          'Esta área será preenchida em um próximo change do portal.',
      })),
    ),
    {
      initialValue: {
        title: 'Em breve',
        description: 'Esta área será preenchida em um próximo change do portal.',
      },
    },
  );

  readonly title = computed(() => this.data().title);
  readonly description = computed(() => this.data().description);
}
