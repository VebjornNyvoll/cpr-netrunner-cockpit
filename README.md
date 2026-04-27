# Netrunner Cockpit

A player-facing NET Action economy tracker for Cyberpunk Red netrunners in Foundry VTT. Keeps every Interface ability, program roll, and NET Action spend consistent with CPR rules, so the player never has to recount what they've done this turn.

## What it does

- **Jacked-in toggle** on the character sheet (netrunner-role-gated) that opens a player-facing cockpit window
- **NET Action counter** — shows remaining actions per turn, computed from the active Netrunner role's Interface rank
- **9 Interface ability buttons** — Pathfinder, Backdoor, Cloak, Control, Eye-Dee, Scanner, Slide, Virus, Zap. Each fires the cyberpunk-red-core native roll dialog and posts the native chat card. Actions only decrement if the roll is confirmed (dialog cancel = no spend)
- **Rezzed programs view** — lists programs rezzed on the equipped cyberdeck with ATK/DEF/DMG roll buttons that wire to the native program-roll flow
- **Turn log** — compact list of every action spent this turn, resets on turn advance
- **Auto-open** when the netrunner's turn starts in the Combat Tracker
- **Counter auto-reset** on the netrunner's turn start
- **Manual controls** — +/-, reset, pause auto-deduct for rules edge cases
- **Architecture-agnostic** — does not care which NET you are in, what floor you are on, or whether you have a NET architecture item at all

## What it does not do

- Does not roll Interface checks itself — delegates 100% to the cyberpunk-red-core native dialog and chat pipeline
- Does not manage Black ICE, program damage, or NET architecture
- Does not auto-detect jacked-in state from other modules — use the manual toggle

## Installation

Manual manifest URL:

```
https://github.com/VebjornNyvoll/cpr-netrunner-cockpit/releases/latest/download/module.json
```

## Usage

1. Give your character a Netrunner role and make it the active NET role
2. Equip a cyberdeck
3. Open the character sheet — click the **Jack In** button that appears in the netrunner section
4. The cockpit window opens. During combat, it auto-opens when your turn starts

## Settings

- **Auto-open on your turn** (client) — toggles the auto-open behavior
- **Always show while jacked in** (client) — keeps the window open outside combat turns too
- **Allow negative counter** (world) — disables the "out of actions" block on ability buttons

## Keybindings

- **Toggle Netrunner Cockpit** — default `Shift+J`. Opens the cockpit for your assigned netrunner, jacking in automatically if needed; press again to close. Rebind via *Configure Controls*. Targets in priority order: selected token's actor, your assigned `User.character`, then the first netrunner you own.

## Module API

Exposed at `game.modules.get("cpr-netrunner-cockpit").api`:

```js
const api = game.modules.get("cpr-netrunner-cockpit").api;

api.open(actor);                              // open the cockpit for an actor
api.close();                                  // close all cockpits
api.setJackedIn(actor, true);                 // jack in programmatically
api.setInterfaceRankOverride(actor, 6);       // grant +N bonus NET Actions via cyberware/talent
api.clearInterfaceRankOverride(actor);        // remove override
api.resetTurn(actor);                         // reset counter and turn log
```

## Compatibility

- Foundry VTT v12–v13
- cyberpunk-red-core system v0.89.1+

## Development

1. Clone into your Foundry `Data/modules/` directory
2. Restart Foundry and enable the module in your world

## Release

1. Update `version` in `module.json`
2. Commit and push
3. Create a GitHub Release with a tag matching the version (e.g., `v0.1.0`)
4. The GitHub Actions workflow attaches the module zip automatically
