import { Directive, Input, inject } from '@angular/core';
import { UiKitId, UiKitPreference } from '../../core/ui/ui-presentation.types';
import { UiPresentationService } from '../../core/ui/ui-presentation.service';

@Directive()
export abstract class UiKitAwareComponent {
  private readonly presentation = inject(UiPresentationService);

  @Input() kit: UiKitPreference = 'auto';

  get resolvedKit(): UiKitId {
    return this.presentation.resolve({ local: { kit: this.kit } }).kit;
  }
}
