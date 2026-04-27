import { MODULE_ID, FLAGS, SETTINGS } from "./constants.mjs";
import { registerSettings } from "./settings.mjs";
import { registerHooks } from "./hooks.mjs";
import {
  openCockpitForActor,
  getOpenCockpit,
  closeAllCockpits,
} from "./apps/NetrunnerCockpit.mjs";
import {
  getInterfaceRank,
  getMaxNetActions,
  netActionsForRank,
  getEquippedCyberdeck,
  getNetRole,
  getRezzedPrograms,
  isNetrunner,
} from "./utils/cpr-bridge.mjs";
import {
  isJackedIn,
  setJackedIn,
  resetTurn,
  getActionsSpent,
  getRemainingActions,
} from "./utils/cockpit-state.mjs";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing`);
  registerSettings();

  loadTemplates([`modules/${MODULE_ID}/templates/cockpit.hbs`]);

  registerHooks();
});

Hooks.once("ready", () => {
  if (!game.settings.get(MODULE_ID, SETTINGS.ENABLED)) return;

  const moduleData = game.modules.get(MODULE_ID);
  if (!moduleData) return;

  moduleData.api = {
    open: (actor) => openCockpitForActor(actor),
    close: () => closeAllCockpits(),
    isJackedIn,
    setJackedIn,
    isNetrunner,
    getInterfaceRank,
    getMaxNetActions,
    netActionsForRank,
    getEquippedCyberdeck,
    getNetRole,
    getRezzedPrograms,
    getActionsSpent,
    getRemainingActions,
    resetTurn,
    setInterfaceRankOverride: (actor, value) =>
      actor?.setFlag(MODULE_ID, FLAGS.INTERFACE_OVERRIDE, value),
    clearInterfaceRankOverride: (actor) =>
      actor?.unsetFlag(MODULE_ID, FLAGS.INTERFACE_OVERRIDE),
  };

  Hooks.callAll(`${MODULE_ID}.ready`, moduleData.api);
  console.log(`${MODULE_ID} | Ready`);
});
