import { MODULE_ID, FLAGS } from "../constants.mjs";
import { getMaxNetActions, isNetrunner } from "./cpr-bridge.mjs";

export function isJackedIn(actor) {
  return !!actor?.getFlag(MODULE_ID, FLAGS.JACKED_IN);
}

export async function setJackedIn(actor, value) {
  if (!actor) return;
  if (!isNetrunner(actor) && value) return;
  if (value) {
    await actor.setFlag(MODULE_ID, FLAGS.JACKED_IN, true);
  } else {
    await actor.unsetFlag(MODULE_ID, FLAGS.JACKED_IN);
  }
}

export function getActionsSpent(actor) {
  const v = actor?.getFlag(MODULE_ID, FLAGS.ACTIONS_SPENT);
  return Number.isInteger(v) ? v : 0;
}

export async function setActionsSpent(actor, value) {
  if (!actor) return;
  await actor.setFlag(MODULE_ID, FLAGS.ACTIONS_SPENT, value);
}

export function getRemainingActions(actor) {
  return getMaxNetActions(actor) - getActionsSpent(actor);
}

export function getTurnLog(actor) {
  const v = actor?.getFlag(MODULE_ID, FLAGS.TURN_LOG);
  return Array.isArray(v) ? v : [];
}

export async function appendTurnLog(actor, entry) {
  if (!actor) return;
  const log = getTurnLog(actor);
  const next = [...log, entry].slice(-20);
  await actor.setFlag(MODULE_ID, FLAGS.TURN_LOG, next);
}

export async function resetTurn(actor) {
  if (!actor) return;
  await actor.update({
    [`flags.${MODULE_ID}.${FLAGS.ACTIONS_SPENT}`]: 0,
    [`flags.${MODULE_ID}.${FLAGS.TURN_LOG}`]: [],
  });
}

export async function spendActions(actor, amount, logEntry) {
  if (!actor || amount == null) return;
  const current = getActionsSpent(actor);
  const next = current + amount;
  const updates = {
    [`flags.${MODULE_ID}.${FLAGS.ACTIONS_SPENT}`]: next,
  };
  if (logEntry) {
    const log = getTurnLog(actor);
    updates[`flags.${MODULE_ID}.${FLAGS.TURN_LOG}`] = [...log, logEntry].slice(
      -20
    );
  }
  await actor.update(updates);
}

export async function refundActions(actor, amount) {
  if (!actor) return;
  const next = Math.max(0, getActionsSpent(actor) - (amount ?? 1));
  await setActionsSpent(actor, next);
}
