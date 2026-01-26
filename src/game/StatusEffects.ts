
export const StatusEffectType = {
  SLOW: 'SLOW',
  BURN: 'BURN',
  STUN: 'STUN',
  WEAKEN: 'WEAKEN' // Takes more damage
} as const;

export type StatusEffectType = typeof StatusEffectType[keyof typeof StatusEffectType];

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // in frames
  strength: number; // e.g. 0.5 for 50% slow, or 5 for 5 damage per tick
  tickInterval?: number; // for DoT
  tickTimer?: number;
  sourceId?: string; // which tower applied it?
}
