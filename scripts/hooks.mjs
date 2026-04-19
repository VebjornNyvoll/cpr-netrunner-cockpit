import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { isNetrunner } from "./utils/cpr-bridge.mjs";
import {
  isJackedIn,
  resetTurn,
  setJackedIn,
} from "./utils/cockpit-state.mjs";
import {
  getOpenCockpit,
  openCockpitForActor,
  refreshCockpitsForActor,
} from "./apps/NetrunnerCockpit.mjs";

function isEnabled() {
  return game.settings.get(MODULE_ID, SETTINGS.ENABLED);
}

function injectSheetButton(app, html) {
  const actor = app.actor;
  if (!actor || !isNetrunner(actor)) return;

  const root = html instanceof jQuery ? html[0] : html;
  if (!root) return;

  if (root.querySelector(".cpr-cockpit-toggle")) return;

  const target =
    root.querySelector(".interface-abilities-section") ??
    root.querySelector(".net-actions-content") ??
    root.querySelector(".netrunning-section") ??
    root.querySelector(".sheet-header");
  if (!target) return;

  const wrapper = document.createElement("div");
  wrapper.className = "cpr-cockpit-toggle-wrapper";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("cpr-cockpit-toggle");
  if (isJackedIn(actor)) btn.classList.add("active");
  btn.dataset.actorId = actor.id;

  const iconClass = isJackedIn(actor) ? "fa-plug-circle-bolt" : "fa-plug";
  const labelKey = isJackedIn(actor)
    ? `${MODULE_ID}.sheet.jackedInLabel`
    : `${MODULE_ID}.sheet.jackInLabel`;

  btn.innerHTML = `<i class="fas ${iconClass}"></i> <span>${game.i18n.localize(
    labelKey
  )}</span>`;

  btn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const current = isJackedIn(actor);
    await setJackedIn(actor, !current);
    if (!current) {
      openCockpitForActor(actor);
    } else {
      const app = getOpenCockpit(actor.id);
      if (app) app.render(false);
    }
  });

  btn.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    openCockpitForActor(actor);
  });

  wrapper.appendChild(btn);
  target.prepend(wrapper);
}

export function registerHooks() {
  Hooks.on("renderCPRCharacterActorSheet", (app, html) => {
    if (!isEnabled()) return;
    injectSheetButton(app, html);
  });

  Hooks.on("updateActor", (actor, changes) => {
    if (!isEnabled()) return;
    const flagsChanged = changes?.flags?.[MODULE_ID];
    if (flagsChanged !== undefined) {
      refreshCockpitsForActor(actor);
    }
    if (changes?.system?.roleInfo) {
      const app = getOpenCockpit(actor.id);
      if (app && !isNetrunner(actor)) app.close({ force: true });
      else if (app) app.render(false);
    }
  });

  Hooks.on("updateItem", (item) => {
    if (!isEnabled()) return;
    const actor = item.parent;
    if (!actor || actor.documentName !== "Actor") return;
    if (!["cyberdeck", "program", "role"].includes(item.type)) return;
    refreshCockpitsForActor(actor);
  });

  Hooks.on("createItem", (item) => {
    if (!isEnabled()) return;
    const actor = item.parent;
    if (!actor || actor.documentName !== "Actor") return;
    if (!["cyberdeck", "program", "role"].includes(item.type)) return;
    refreshCockpitsForActor(actor);
  });

  Hooks.on("deleteItem", (item) => {
    if (!isEnabled()) return;
    const actor = item.parent;
    if (!actor || actor.documentName !== "Actor") return;
    if (!["cyberdeck", "program", "role"].includes(item.type)) return;
    refreshCockpitsForActor(actor);
  });

  Hooks.on("updateCombat", (combat, changes) => {
    if (!isEnabled()) return;
    if (!("turn" in changes) && !("round" in changes)) return;
    const currentCombatant = combat.combatant;
    const actor = currentCombatant?.actor;
    if (!actor || !isNetrunner(actor) || !isJackedIn(actor)) return;

    if (game.user.isGM) resetTurn(actor);

    const autoOpen = game.settings.get(MODULE_ID, SETTINGS.AUTO_OPEN);
    if (!autoOpen) return;
    if (actor.isOwner && !game.user.isGM) openCockpitForActor(actor);
  });

  Hooks.on("deleteCombat", (combat) => {
    if (!isEnabled()) return;
    if (!game.user.isGM) return;
    for (const combatant of combat.combatants ?? []) {
      const actor = combatant.actor;
      if (actor && isNetrunner(actor) && isJackedIn(actor)) {
        resetTurn(actor);
      }
    }
  });

  Hooks.on("ready", () => {
    if (!isEnabled()) return;
    if (!game.settings.get(MODULE_ID, SETTINGS.ALWAYS_SHOW)) return;
    for (const actor of game.actors) {
      if (
        actor.isOwner &&
        isNetrunner(actor) &&
        isJackedIn(actor) &&
        !game.user.isGM
      ) {
        openCockpitForActor(actor);
      }
    }
  });
}
