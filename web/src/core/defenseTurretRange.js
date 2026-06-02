const DEFAULT_RANGE = 190;
/** Attack range from card config (`defense_turret.range`), or null if not an attack plant. */
export function getDefenseTurretRange(definition) {
    const effect = definition.effects?.find((e) => e.type === 'defense_turret');
    if (!effect)
        return null;
    const range = effect.range;
    return typeof range === 'number' ? range : DEFAULT_RANGE;
}
