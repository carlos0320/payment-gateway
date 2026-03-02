import type { GlobalSettingsItem } from './settings.item';

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function isNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

export function isGlobalSettingsItem(x: unknown): x is GlobalSettingsItem {
  if (!isObj(x)) return false;
  const o = x;
  return (
    o.settingsKey === 'global' &&
    isNumber(o.baseFeeInCents) &&
    isNumber(o.deliveryFeeInCents)
  );
}
