# UI presentation architecture

Chicle Engine separates declarative screen intent from the component library that renders it. Forms and screens store
business structure, validation, bindings and optional presentation preferences. They never store Angular selectors,
CSS classes or imports from PrimeNG, Ionic, Material or Bootstrap.

## Two independent concepts

- **Kit** selects the component implementation: `primeng`, `ionic`, `native`, `material` or `bootstrap`.
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

## Personalization hierarchy

Theme and personalization are resolved independently from the component kit. The renderer must apply the first explicit
value it finds in this order:

1. Field or command override.
2. Step override.
3. Form or screen override.
4. Selected app template default.
5. Tenant/organization Confisys default.
6. Chicle built-in default.

Supported stored values:

| Property | Purpose | Allowed strategy |
| --- | --- | --- |
| `theme` | Installed theme key such as `chicle`, `lara`, `material`, `nora` | Must exist in `UiThemeService`. |
| `themeMode` | `light`, `dark`, `system` or `inherit` | Defaults to app/tenant setting. |
| `density` | `comfortable`, `compact`, `spacious` or `inherit` | Affects spacing and control height. |
| `radius` | `none`, `sm`, `md`, `lg`, `inherit` | Tokenized only; no arbitrary CSS radius per field. |
| `tokens` | Safe color token overrides | Allowlisted token names and validated color values. |

Allowed token override keys:

- `primary`
- `primaryContrast`
- `surface`
- `background`
- `text`
- `muted`
- `border`
- `success`
- `warning`
- `danger`
- `info`

Rules:

- Stored JSON may reference installed themes and safe tokens; it must not store raw CSS classes, selectors or style
  blocks.
- Token overrides are optional and should be rare. Prefer installed themes for brand consistency.
- The designer must check contrast for `text` over `background`, `text` over `surface` and `primaryContrast` over
  `primary`.
- Dark mode is a mode over the selected theme, not a separate component kit.
- A field-level color override must be semantic, such as `tone=warning`, before using raw token overrides.
- Theme changes must be previewed in desktop, tablet and mobile before publishing when a form forces a theme.

## Responsive form transformation

Dynamic forms keep one stored schema, but the renderer changes the layout pattern by viewport. This is intentional:
large web screens should not look like stretched mobile screens, and mobile screens should not look like squeezed web
forms.

| Viewport | Primary pattern | Step behavior |
| --- | --- | --- |
| Wide desktop | PrimeNG operational form | Steps render as sections or cards, often two cards per row. |
| Desktop previewing mobile | Preview viewport shell | The mobile screen renders inside the preview frame, with compact step progress. |
| Tablet | PrimeNG or Ionic by profile | Steps render as one card per row or mobile-style screens when touch-first. |
| Mobile web/native | Ionic guided screen | One step becomes one screen with bottom navigation. |

The decision is controlled by the dynamic form `layout` contract, not by page-local CSS. The same runtime component
must receive a preview width and resolve the correct presentation without reading the browser width when it is inside a
designer preview.

## Stored contract

`presentation` is optional at form, screen and component level:

```json
{
  "presentation": {
    "profileKey": "adaptive",
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system",
    "density": "comfortable",
    "rules": [
      { "kit": "ionic", "platforms": ["ios", "android"] },
      { "kit": "ionic", "maxWidth": 767 },
      { "kit": "primeng", "minWidth": 768 }
    ],
    "tokens": {
      "primary": "#1554a2",
      "primaryContrast": "#ffffff"
    }
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
