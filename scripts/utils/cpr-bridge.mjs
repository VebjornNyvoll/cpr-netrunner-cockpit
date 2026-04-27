import { MODULE_ID, FLAGS } from "../constants.mjs";

export function isNetrunner(actor) {
  return !!actor?.system?.roleInfo?.activeNetRole;
}

export function getNetRole(actor) {
  const roleId = actor?.system?.roleInfo?.activeNetRole;
  if (!roleId) return null;
  return actor.items.get(roleId) ?? null;
}

export function getInterfaceRank(actor) {
  const override = actor?.getFlag?.(MODULE_ID, FLAGS.INTERFACE_OVERRIDE);
  if (Number.isInteger(override) && override >= 0) return override;
  const role = getNetRole(actor);
  if (!role) return 0;
  return Number.parseInt(role.system?.rank, 10) || 0;
}

// CPR corebook p. 197: NET Actions per Turn by Interface Rank
// 1-3 → 2, 4-6 → 3, 7-9 → 4, 10 → 5. Rank 0 = not a netrunner.
export function netActionsForRank(rank) {
  const r = Number.parseInt(rank, 10);
  if (!Number.isFinite(r) || r < 1) return 0;
  if (r >= 10) return 5;
  if (r >= 7) return 4;
  if (r >= 4) return 3;
  return 2;
}

export function getMaxNetActions(actor) {
  return netActionsForRank(getInterfaceRank(actor));
}

export function getEquippedCyberdeck(actor) {
  if (!actor) return null;
  if (typeof actor.getEquippedCyberdeck === "function") {
    const deck = actor.getEquippedCyberdeck();
    if (deck) return deck;
  }
  return (
    actor.items.find(
      (i) => i.type === "cyberdeck" && i.system?.equipped === "equipped"
    ) ??
    actor.items.find((i) => i.type === "cyberdeck") ??
    null
  );
}

export function getInstalledPrograms(cyberdeck) {
  if (!cyberdeck) return [];
  const list = cyberdeck.system?.installedPrograms;
  return Array.isArray(list) ? list : [];
}

export function getRezzedPrograms(cyberdeck) {
  if (!cyberdeck) return [];
  const list = cyberdeck.system?.rezzedPrograms;
  return Array.isArray(list) ? list : [];
}

export function getInterfaceAbilities() {
  return CONFIG.CPR?.interfaceAbilities ?? {};
}

export function resolveActor(actorOrId) {
  if (!actorOrId) return null;
  if (typeof actorOrId === "string") return game.actors.get(actorOrId) ?? null;
  return actorOrId;
}
