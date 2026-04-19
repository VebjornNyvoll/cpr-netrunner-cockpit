import { MODULE_ID, SETTINGS } from "../constants.mjs";
import {
  getEquippedCyberdeck,
  getInstalledPrograms,
  getInterfaceRank,
  getRezzedPrograms,
  isNetrunner,
} from "../utils/cpr-bridge.mjs";
import {
  appendTurnLog,
  getActionsSpent,
  getRemainingActions,
  getTurnLog,
  isJackedIn,
  refundActions,
  resetTurn,
  setJackedIn,
  spendActions,
} from "../utils/cockpit-state.mjs";
import { getInterfaceActionDefs } from "../data/interface-actions.mjs";
import { getActionCost } from "../settings.mjs";
import { rollInterfaceAbility, rollProgram } from "../utils/rolls.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const _openByActor = new Map();

export function getOpenCockpit(actorId) {
  return _openByActor.get(actorId) ?? null;
}

export function closeAllCockpits() {
  for (const app of _openByActor.values()) app.close({ force: true });
  _openByActor.clear();
}

export function openCockpitForActor(actor, { force = false } = {}) {
  if (!actor || !isNetrunner(actor)) return null;
  if (!actor.isOwner && !game.user.isGM) return null;
  let existing = _openByActor.get(actor.id);
  if (existing) {
    existing.render(true);
    return existing;
  }
  const app = new NetrunnerCockpit({ actor });
  _openByActor.set(actor.id, app);
  app.render(true);
  return app;
}

export function refreshCockpitsForActor(actor) {
  const app = _openByActor.get(actor?.id);
  if (app?.rendered) app.render(false);
}

export class NetrunnerCockpit extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  constructor(options = {}) {
    super(options);
    this.actor = options.actor;
    this.autoDeductPaused = false;
  }

  _initializeApplicationOptions(options) {
    const opts = super._initializeApplicationOptions(options);
    const actorId = options.actor?.id ?? "noactor";
    opts.id = `${MODULE_ID}-cockpit-${actorId}`;
    return opts;
  }

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-cockpit`,
    classes: [MODULE_ID, "netrunner-cockpit"],
    tag: "section",
    window: {
      icon: "fa-solid fa-satellite-dish",
      resizable: true,
      minimizable: true,
    },
    position: { width: 380, height: "auto" },
    actions: {
      rollAbility: NetrunnerCockpit._onRollAbility,
      rollProgram: NetrunnerCockpit._onRollProgram,
      plusOne: NetrunnerCockpit._onPlusOne,
      minusOne: NetrunnerCockpit._onMinusOne,
      resetTurn: NetrunnerCockpit._onResetTurn,
      togglePause: NetrunnerCockpit._onTogglePause,
      jackOut: NetrunnerCockpit._onJackOut,
      openProgram: NetrunnerCockpit._onOpenProgram,
    },
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/cockpit.hbs`,
      scrollable: [".cockpit-turnlog"],
    },
  };

  get title() {
    const name = this.actor?.name ?? "";
    return `${game.i18n.localize(`${MODULE_ID}.window.title`)} — ${name}`;
  }

  _onClose(options) {
    if (this.actor) _openByActor.delete(this.actor.id);
    return super._onClose(options);
  }

  async _prepareContext(options) {
    const actor = this.actor;
    const rank = actor ? getInterfaceRank(actor) : 0;
    const spent = getActionsSpent(actor);
    const remaining = rank - spent;
    const jackedIn = isJackedIn(actor);
    const cyberdeck = getEquippedCyberdeck(actor);
    const rezzed = getRezzedPrograms(cyberdeck);
    const installed = getInstalledPrograms(cyberdeck);

    const pips = Array.from({ length: Math.max(rank, 1) }, (_, i) => ({
      spent: i < spent,
    }));

    const allowNegative = game.settings.get(MODULE_ID, SETTINGS.ALLOW_NEGATIVE);
    const abilities = getInterfaceActionDefs().map((def) => {
      const cost = getActionCost(def.key);
      const disabled = !jackedIn || (!allowNegative && remaining < cost);
      return {
        ...def,
        cost,
        showCost: cost !== 1,
        label: game.i18n.localize(def.labelKey),
        disabled,
      };
    });

    const programs = rezzed.map((p) => {
      const atk = Number(p.system?.atk);
      const def = Number(p.system?.def);
      const dmgFormula = p.system?.damage?.standard;
      return {
        id: p.id ?? p._id,
        name: p.name,
        img: p.img,
        class: p.system?.class ?? "",
        rezValue: p.system?.rez?.value ?? null,
        rezMax: p.system?.rez?.max ?? null,
        hasAtk: Number.isFinite(atk) && atk > 0,
        hasDef: Number.isFinite(def) && def > 0,
        hasDmg: !!dmgFormula && dmgFormula !== "0d0",
        atk: Number.isFinite(atk) ? atk : null,
        def: Number.isFinite(def) ? def : null,
        damage: dmgFormula ?? null,
      };
    });

    return {
      moduleId: MODULE_ID,
      actor,
      actorName: actor?.name ?? "",
      actorImg: actor?.img ?? "icons/svg/mystery-man.svg",
      jackedIn,
      hasCyberdeck: !!cyberdeck,
      cyberdeckName: cyberdeck?.name ?? "",
      rank,
      spent,
      remaining,
      pips,
      abilities,
      programs,
      installedCount: installed.length,
      rezzedCount: rezzed.length,
      turnLog: getTurnLog(actor),
      autoDeductPaused: this.autoDeductPaused,
      i18n: {
        noCyberdeck: `${MODULE_ID}.window.noCyberdeck`,
        notJackedIn: `${MODULE_ID}.window.notJackedIn`,
        actionsRemaining: `${MODULE_ID}.window.actionsRemaining`,
        abilitiesHeader: `${MODULE_ID}.window.abilitiesHeader`,
        programsHeader: `${MODULE_ID}.window.programsHeader`,
        turnLogHeader: `${MODULE_ID}.window.turnLogHeader`,
        noPrograms: `${MODULE_ID}.window.noPrograms`,
        paused: `${MODULE_ID}.window.paused`,
        jackOut: `${MODULE_ID}.window.jackOut`,
        resetTurn: `${MODULE_ID}.window.resetTurn`,
        togglePause: `${MODULE_ID}.window.togglePause`,
        costLabel: `${MODULE_ID}.window.costLabel`,
      },
    };
  }

  async _logAndSpend(actor, cost, logEntry) {
    if (this.autoDeductPaused || !cost) {
      if (logEntry) await appendTurnLog(actor, logEntry);
      return;
    }
    await spendActions(actor, cost, logEntry);
  }

  static async _onRollAbility(event, target) {
    const key = target.dataset.ability;
    const actor = this.actor;
    if (!actor) return;
    if (!isJackedIn(actor)) {
      ui.notifications.warn(
        game.i18n.localize(`${MODULE_ID}.notifications.notJackedIn`)
      );
      return;
    }
    const cost = getActionCost(key);
    const allowNegative = game.settings.get(MODULE_ID, SETTINGS.ALLOW_NEGATIVE);
    if (!allowNegative && getRemainingActions(actor) < cost) {
      ui.notifications.warn(
        game.i18n.localize(`${MODULE_ID}.notifications.outOfActions`)
      );
      return;
    }
    const confirmed = await rollInterfaceAbility(actor, key, event);
    if (!confirmed) return;
    await this._logAndSpend(actor, cost, {
      timestamp: Date.now(),
      type: "ability",
      key,
      label: game.i18n.localize(
        `CPR.global.role.netrunner.interfaceAbility.${key}`
      ),
      cost,
    });
  }

  static async _onRollProgram(event, target) {
    const programId = target.dataset.programId;
    const executionType = target.dataset.executionType;
    const actor = this.actor;
    if (!actor) return;
    if (!isJackedIn(actor)) {
      ui.notifications.warn(
        game.i18n.localize(`${MODULE_ID}.notifications.notJackedIn`)
      );
      return;
    }
    const cost = getActionCost("program");
    const allowNegative = game.settings.get(MODULE_ID, SETTINGS.ALLOW_NEGATIVE);
    if (!allowNegative && getRemainingActions(actor) < cost) {
      ui.notifications.warn(
        game.i18n.localize(`${MODULE_ID}.notifications.outOfActions`)
      );
      return;
    }
    const program = actor.items.get(programId);
    const confirmed = await rollProgram(actor, programId, executionType, event);
    if (!confirmed) return;
    await this._logAndSpend(actor, cost, {
      timestamp: Date.now(),
      type: "program",
      key: executionType,
      label: `${program?.name ?? programId} (${executionType})`,
      cost,
    });
  }

  static async _onPlusOne(event, target) {
    await refundActions(this.actor, 1);
  }

  static async _onMinusOne(event, target) {
    await spendActions(this.actor, 1, {
      timestamp: Date.now(),
      type: "manual",
      label: game.i18n.localize(`${MODULE_ID}.window.manualSpend`),
      cost: 1,
    });
  }

  static async _onResetTurn(event, target) {
    await resetTurn(this.actor);
  }

  static async _onTogglePause(event, target) {
    this.autoDeductPaused = !this.autoDeductPaused;
    this.render(false);
  }

  static async _onJackOut(event, target) {
    if (!this.actor) return;
    await setJackedIn(this.actor, false);
    await resetTurn(this.actor);
    ui.notifications.info(
      game.i18n.format(`${MODULE_ID}.notifications.jackedOut`, {
        name: this.actor.name,
      })
    );
  }

  static async _onOpenProgram(event, target) {
    const programId = target.dataset.programId;
    const program = this.actor?.items.get(programId);
    if (program) program.sheet?.render(true);
  }
}
