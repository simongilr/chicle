import { AnimationBuilder, createAnimation } from '@ionic/angular/standalone';

interface PageTransitionOptions {
  direction?: 'forward' | 'back' | 'root';
  enteringEl: HTMLElement;
  leavingEl?: HTMLElement;
}

export const chiclePageTransition: AnimationBuilder = (_baseEl, rawOptions) => {
  const options = rawOptions as PageTransitionOptions;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isBack = options.direction === 'back';
  const distance = reducedMotion ? '0px' : isBack ? '-10px' : '10px';
  const duration = reducedMotion ? 1 : 190;

  const entering = createAnimation()
    .addElement(options.enteringEl)
    .beforeRemoveClass('ion-page-invisible')
    .duration(duration)
    .easing('cubic-bezier(0.2, 0, 0, 1)')
    .fromTo('opacity', '0.01', '1')
    .fromTo('transform', `translate3d(${distance}, 0, 0)`, 'translate3d(0, 0, 0)');

  const transition = createAnimation().duration(duration).easing('cubic-bezier(0.2, 0, 0, 1)').addAnimation(entering);

  if (options.leavingEl) {
    const leavingDistance = reducedMotion ? '0px' : isBack ? '8px' : '-8px';
    const leaving = createAnimation()
      .addElement(options.leavingEl)
      .duration(duration)
      .easing('cubic-bezier(0.2, 0, 0, 1)')
      .fromTo('opacity', '1', '0.72')
      .fromTo('transform', 'translate3d(0, 0, 0)', `translate3d(${leavingDistance}, 0, 0)`);

    transition.addAnimation(leaving);
  }

  return transition;
};
