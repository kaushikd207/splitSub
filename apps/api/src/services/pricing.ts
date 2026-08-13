export type FeeConfig = { type: 'PERCENTAGE' | 'FIXED' | 'HYBRID'; percentage: number; fixed: number };
export function pricing(totalPrice:number, totalMembers:number, config:FeeConfig) {
  if (!Number.isFinite(totalPrice) || totalPrice <= 0 || !Number.isInteger(totalMembers) || totalMembers < 2) throw new Error('Invalid group pricing');
  const baseShare = Number((totalPrice / totalMembers).toFixed(2));
  const platformFee = Number((config.type === 'FIXED' ? config.fixed : config.type === 'PERCENTAGE' ? baseShare * config.percentage / 100 : baseShare * config.percentage / 100 + config.fixed).toFixed(2));
  return { baseShare, platformFee, memberTotal: Number((baseShare + platformFee).toFixed(2)) };
}
