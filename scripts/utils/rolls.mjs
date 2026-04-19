import { getEquippedCyberdeck, getNetRole } from "./cpr-bridge.mjs";

let _CPRChatCache = null;

async function getCPRChat() {
  if (_CPRChatCache) return _CPRChatCache;
  try {
    const mod = await import(
      "/systems/cyberpunk-red-core/modules/chat/cpr-chat.js"
    );
    _CPRChatCache = mod.default ?? mod.CPRChat ?? null;
  } catch (err) {
    console.warn(
      "cpr-netrunner-cockpit | Could not load CPRChat, chat cards may be missing:",
      err
    );
    _CPRChatCache = null;
  }
  return _CPRChatCache;
}

function notify(key, type = "warn") {
  const msg = game.i18n.localize(key);
  ui.notifications?.[type]?.(msg);
}

async function renderChatCard(actor, cprRoll, token, item) {
  const targetedTokens = (() => {
    try {
      return (
        game.cpr?.macro?.SystemUtils?.getUserTargetedOrSelected?.("targeted") ??
        Array.from(game.user.targets ?? []).map((t) => t.id)
      );
    } catch {
      return [];
    }
  })();

  cprRoll.entityData = {
    actor: actor.id,
    token: token?.id ?? token?._id ?? null,
    tokens: targetedTokens,
  };
  if (item) cprRoll.entityData.item = item.id;

  const CPRChat = await getCPRChat();
  if (CPRChat && typeof CPRChat.RenderRollCard === "function") {
    await CPRChat.RenderRollCard(cprRoll);
    return;
  }

  const flavor = cprRoll.rollTitle ?? "Netrunner Cockpit Roll";
  const roll = cprRoll.roll ?? null;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor,
    content: `<p>${flavor} — total <strong>${cprRoll.resultTotal ?? ""}</strong></p>`,
    rolls: roll ? [roll] : [],
  });
}

async function runCPRRoll({ event, actor, item, cprRoll }) {
  const keepRolling = await cprRoll.handleRollDialog(
    event ?? new Event("click"),
    actor,
    item
  );
  if (!keepRolling) return false;

  let finalRoll = cprRoll;
  if (item && typeof item.confirmRoll === "function") {
    const confirmed = await item.confirmRoll(cprRoll);
    if (confirmed) finalRoll = confirmed;
  }

  await finalRoll.roll();

  if (Number.isInteger(finalRoll.luck) && finalRoll.luck > 0) {
    const luckStat = actor.system?.stats?.luck?.value;
    if (Number.isFinite(luckStat)) {
      const spend = Math.min(finalRoll.luck, luckStat);
      await actor.update({ "system.stats.luck.value": luckStat - spend });
    }
  }

  await renderChatCard(actor, finalRoll, actor.getActiveTokens?.()?.[0], item);
  return true;
}

export async function rollInterfaceAbility(actor, abilityKey, event) {
  const cyberdeck = getEquippedCyberdeck(actor);
  const netRoleItem = getNetRole(actor);
  if (!cyberdeck) {
    notify("cpr-netrunner-cockpit.notifications.noCyberdeck", "warn");
    return false;
  }
  if (!netRoleItem) {
    notify("CPR.messages.noNetrunningRoleConfigured", "error");
    return false;
  }
  const cprRoll = cyberdeck.createRoll("interfaceAbility", actor, {
    interfaceAbility: abilityKey,
    cyberdeck,
    netRoleItem,
  });
  if (!cprRoll) return false;
  return runCPRRoll({ event, actor, item: cyberdeck, cprRoll });
}

export async function rollProgram(actor, programId, executionType, event) {
  const cyberdeck = getEquippedCyberdeck(actor);
  const netRoleItem = getNetRole(actor);
  if (!cyberdeck) {
    notify("cpr-netrunner-cockpit.notifications.noCyberdeck", "warn");
    return false;
  }
  if (!netRoleItem) {
    notify("CPR.messages.noNetrunningRoleConfigured", "error");
    return false;
  }
  const cprRoll = cyberdeck.createRoll("cyberdeckProgram", actor, {
    cyberdeckId: cyberdeck.id,
    programId,
    executionType,
    netRoleItem,
  });
  if (!cprRoll) return false;
  return runCPRRoll({ event, actor, item: cyberdeck, cprRoll });
}
