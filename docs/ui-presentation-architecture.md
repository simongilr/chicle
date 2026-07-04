# UI presentation architecture

Chicle Engine separates declarative screen intent from the component library that renders it. Forms and screens store
business structure, validation, bindings and optional presentation preferences. They never store Angular selectors,
CSS classes or imports from PrimeNG, Ionic, Material or Bootstrap.

## Two independent concepts

- **Kit** selects the component implementation: `primeng`, `ionic`, `native`, and future adapters such as `material`
  or `bootstrap`.
- **Theme** selects visual tokens: colors, typography, density, spacing, borders and radius. A theme must work across
  every installed kit.

Changing a theme does not change component behavior. Adding a kit does not change stored forms or screen definitions.

## Installed themes

`UiThemeService` is the single registry used by the application and the component library:

| Key | PrimeNG preset | Chicle/Ionic tokens |
| --- | --- | --- |
| `chicle` | Aura | Blue operational default |
| `lara` | Lara | Green light surfaces |
| `material` | Material | Compact indigo geometry |
| `nora` | Nora | Teal neutral contrast |

The active key is persisted locally and restored when the app starts. PrimeNG presets other than the initial Aura
preset are lazy-loaded when selected. The same selection updates Chicle CSS tokens and Ionic color variables.

## Resolution order

`UiPresentationService` resolves the effective kit in this order:

1. Field or component override.
2. Form or screen override.
3. Rules in the selected presentation profile.
4. Profile fallback.

The default profile comes from `ui.presentation.defaultProfile` in Confisys. If the API or parameter is unavailable,
the frontend uses the same built-in default and remains operational.

The initial adaptive profile selects Ionic for native iOS/Android or widths up to 767 px, and PrimeNG from 768 px.
Preview width is passed explicitly by the designer, so mobile previews do not depend on the browser window size.

## Stored contract

`presentation` is optional at form, screen and component level:

```json
{
  "presentation": {
    "profileKey": "adaptive",
    "kit": "auto",
    "theme": "chicle",
    "rules": [
      { "kit": "ionic", "platforms": ["ios", "android"] },
      { "kit": "ionic", "maxWidth": 767 },
      { "kit": "primeng", "minWidth": 768 }
    ]
  }
}
```

Valid current kits are `primeng`, `ionic` and `native`. `kit: "inherit"` delegates to the parent and `kit: "auto"`
uses profile rules.

## Implemented field adapters

`DynamicFieldControlComponent` is the public facade. It keeps label, help, validation and value events stable, then
delegates control rendering to:

- `PrimengFieldRendererComponent`
- `IonicFieldRendererComponent`
- `NativeFieldRendererComponent`

Text, email, number, date, password, telephone, URL, textarea, select and boolean controls share the same
`RuntimeField` and `valueChange` contract.

The same facade is used by runtime forms and will be used by Form Designer and Screen Designer. Business code must
not import a concrete field renderer.

## Adding another kit

Material or Bootstrap support requires:

1. Install the library and its Angular integration.
2. Create a field renderer that implements the existing inputs and `valueChange` output.
3. Register the kit identifier and capabilities.
4. Add its branch to the facade without changing stored form definitions.
5. Add live examples to `/components`.
6. Test every supported field state at desktop, tablet, 390 px and native shell.

Do not install all kits in the initial bundle by default. Future kit packages should be lazy-loaded or selected at
build/deployment level when bundle size becomes relevant.

## Registering another theme

1. Add its PrimeNG preset dependency or create a preset with `definePreset`.
2. Add one entry to `INSTALLED_UI_THEMES` with a lazy `loadPrimePreset` function.
3. Define all required Chicle/Ionic tokens; do not style individual pages.
4. Verify the theme from `/components` at desktop and 390 px.
5. Keep the theme key stable because forms and Confisys may reference it.

## Component equivalence strategy

Not every Chicle component needs a separate PrimeNG and Ionic class:

- **Behavioral components** such as dynamic fields, dialogs, tables, pickers, uploads and navigation controls need kit
  adapters because platform interaction differs.
- **Product components** such as workflow guides, status notices and module headers keep one Chicle implementation
  driven by shared tokens.
- **Domain components** such as Flow graph and mapper remain library-neutral unless they start using kit-specific
  primitives.

This avoids tripling every component while still providing native mobile interaction where it matters.

## Next adapter families

1. Buttons and command bars.
2. Dialog, modal, drawer and confirmation.
3. Entity table and mobile list.
4. Date/time, files, camera, barcode and catalogs.
5. Navigation shell and screen layout.
6. Toasts, menus and contextual overlays.

Each family must expose one Chicle contract, multiple adapters and a visual comparison in the component library.
