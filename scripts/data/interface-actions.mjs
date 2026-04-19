import { MODULE_ID, INTERFACE_ABILITY_KEYS } from "../constants.mjs";

const ICONS = {
  scanner: "fa-satellite-dish",
  backdoor: "fa-door-open",
  cloak: "fa-user-secret",
  control: "fa-gamepad",
  eyedee: "fa-search",
  pathfinder: "fa-route",
  slide: "fa-running",
  virus: "fa-biohazard",
  zap: "fa-bolt",
};

export function getInterfaceActionDefs() {
  return INTERFACE_ABILITY_KEYS.map((key) => ({
    key,
    icon: ICONS[key] ?? "fa-microchip",
    labelKey: `CPR.global.role.netrunner.interfaceAbility.${key}`,
    descriptionKey: `${MODULE_ID}.abilities.${key}Desc`,
  }));
}
