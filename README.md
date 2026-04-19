# Netrunner Cockpit

A player-facing NET Action economy tracker for Cyberpunk Red netrunners. Enforces correct NET Action spending per turn by wrapping the cyberpunk-red-core system's native Interface ability and program roll flows. Architecture-agnostic — purely a counter, action buttons, rezzed-programs view, and turn log. Netrunner-role-gated with a manual jacked-in toggle.

## Installation

### Foundry Module Browser
Search for "Netrunner Cockpit" in the Foundry VTT module browser.

### Manual Installation
1. In Foundry VTT, go to Settings > Add-on Modules > Install Module
2. Paste this manifest URL: `https://github.com/VebjornNyvoll/cpr-netrunner-cockpit/releases/latest/download/module.json`
3. Click Install

## Development

1. Clone this repo into your Foundry `Data/modules/` directory
2. Restart Foundry and enable the module in your world

## Release

1. Update `version` in `module.json`
2. Commit and push
3. Create a GitHub Release with a tag matching the version (e.g., `v1.0.0`)
4. The GitHub Actions workflow will build and attach the module zip
