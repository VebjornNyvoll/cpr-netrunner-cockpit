import { MODULE_ID } from "./constants.mjs";
import { isNetrunner } from "./utils/cpr-bridge.mjs";
import { isJackedIn, setJackedIn } from "./utils/cockpit-state.mjs";
import {
  getOpenCockpit,
  openCockpitForActor,
} from "./apps/NetrunnerCockpit.mjs";

function findCurrentNetrunner() {
  const selected = canvas.tokens?.controlled?.[0]?.actor;
  if (selected && isNetrunner(selected)) return selected;

  if (game.user.character && isNetrunner(game.user.character)) {
    return game.user.character;
  }

  const owned = game.actors.filter((a) => a.isOwner && isNetrunner(a));
  if (owned.length === 1) return owned[0];
  if (owned.length > 1 && game.user.character) {
    return (
      owned.find((a) => a.id === game.user.character.id) ?? owned[0]
    );
  }
  return owned[0] ?? null;
}

async function toggleCockpit() {
  const actor = findCurrentNetrunner();
  if (!actor) {
    ui.notifications.warn(
      game.i18n.localize(`${MODULE_ID}.notifications.noNetrunnerFound`)
    );
    return false;
  }

  const open = getOpenCockpit(actor.id);
  if (open?.rendered) {
    open.close({ force: true });
    return true;
  }

  if (!isJackedIn(actor)) {
    await setJackedIn(actor, true);
  }
  openCockpitForActor(actor);
  return true;
}

export function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "toggleCockpit", {
    name: `${MODULE_ID}.keybindings.toggleCockpit.name`,
    hint: `${MODULE_ID}.keybindings.toggleCockpit.hint`,
    editable: [{ key: "KeyJ", modifiers: ["Shift"] }],
    onDown: () => {
      toggleCockpit();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE?.NORMAL ?? 0,
  });
}
