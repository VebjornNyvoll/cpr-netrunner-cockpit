import { MODULE_ID, SETTINGS, INTERFACE_ABILITY_KEYS } from "./constants.mjs";

function defaultActionCosts() {
  const out = {};
  for (const key of INTERFACE_ABILITY_KEYS) out[key] = 1;
  out.program = 1;
  out.moveFloor = 1;
  out.jackOut = 0;
  return out;
}

export function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.ENABLED, {
    name: `${MODULE_ID}.settings.enabled.name`,
    hint: `${MODULE_ID}.settings.enabled.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, SETTINGS.AUTO_OPEN, {
    name: `${MODULE_ID}.settings.autoOpen.name`,
    hint: `${MODULE_ID}.settings.autoOpen.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, SETTINGS.ALWAYS_SHOW, {
    name: `${MODULE_ID}.settings.alwaysShow.name`,
    hint: `${MODULE_ID}.settings.alwaysShow.hint`,
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, SETTINGS.ALLOW_NEGATIVE, {
    name: `${MODULE_ID}.settings.allowNegative.name`,
    hint: `${MODULE_ID}.settings.allowNegative.hint`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, SETTINGS.ACTION_COSTS, {
    name: `${MODULE_ID}.settings.actionCosts.name`,
    hint: `${MODULE_ID}.settings.actionCosts.hint`,
    scope: "world",
    config: false,
    type: Object,
    default: defaultActionCosts(),
  });
}

export function getActionCost(key) {
  const costs = game.settings.get(MODULE_ID, SETTINGS.ACTION_COSTS) ?? {};
  const merged = { ...defaultActionCosts(), ...costs };
  return Number.isFinite(merged[key]) ? merged[key] : 1;
}
