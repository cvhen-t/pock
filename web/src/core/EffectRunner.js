/** Config-driven effect dispatch — extend modules as gameplay grows. */
export class EffectRunner {
    run(effects, ctx) {
        if (!effects?.length)
            return;
        for (const effect of effects) {
            switch (effect.type) {
                case 'spawn_timer':
                    // Handled by work-site stacks in GameScene
                    break;
                case 'log':
                    console.info(`[${ctx.sourceCardId}]`, effect);
                    break;
                default:
                    console.warn('Unknown effect:', effect.type);
            }
        }
    }
}
export const effectRunner = new EffectRunner();
