# App Studio Completion Roadmap

Status date: 2026-08-03.

This document preserves the working roadmap for completing Chicle App Studio after cuts 9 through 14. It is intentionally practical: it defines what is already available, what blocks product-grade usability and what should be finished next.

## Current Position

App Studio is now a functional foundation, not only a scaffold.

Current estimates:

| Area | Estimate |
| --- | ---: |
| Technical foundation | 82% |
| Product usability | 65% |
| Runtime readiness | 70% |
| AI-assisted app drafting | 60% |
| Template/export foundation | 60% |

The platform can already manage tenant apps, screens, versions, navigation, reusable components, JSON authoring, runtime route lookup, preview/testing and package dry-run foundations.

The main gap is the visual authoring experience. App Studio still feels more like a technical form than a product-grade visual builder.

## Next Session Objective

Finish the visualizer/canvas pass and make it usable as the primary app-building surface.

The visualizer must become the main way to understand and edit an app screen:

- show screen regions clearly;
- show component placement, width and order;
- make navigation, header, content, aside and actions visible;
- make web, tablet and mobile behavior understandable;
- let the user select a component directly from the preview/canvas;
- keep the inspector synchronized with the selected component;
- avoid exposing technical chips that do not help the user understand the app;
- make bindings and actions visible in business language.
- keep the component catalog as a vertical list, not a horizontal-scrolling strip;
- make viewport changes visibly resize and reshape the work area;
- render real preview controls, not static guide placeholders;
- allow safe interaction inside the preview while the app is being built;
- document enough structure so Chicle AI can generate, modify and explain app drafts reliably.

## Next Session Notes

These points were explicitly preserved for the next working session:

1. The available component list must read downward as a clear palette. It should not force horizontal scrolling to
   discover components.
2. The visual canvas must keep desktop, tablet and mobile switching obvious. Changing the target should resize the
   frame, alter the composition rules and make the responsive behavior visible.
3. Component previews must show real working controls whenever possible: inputs, selects, buttons, menus, tables,
   galleries, maps, modals, metrics and forms. They must not remain only abstract guide cards.
4. Preview interaction must be safe. Users should be able to click buttons, open selects, type in sample inputs and
   move through the app preview without accidentally corrupting the screen contract.
5. Ionic must receive full component coverage. The App Studio palette must be able to use Ionic-native equivalents for
   mobile app components, especially navigation, form controls, buttons, lists, modals, tabs, sheets, menus, cards,
   upload/camera/GPS controls and mobile action bars.
6. The designer must support a "build while previewing" workflow: add a component, see it rendered, configure binding
   and action, test the behavior, then continue building.
7. Chicle AI must understand this workflow. It should read the current app, screen, components, bindings, available
   forms/services/flows/texts and then produce reviewable app or screen drafts instead of isolated visual fragments.

## Product Completion Blocks

### 1. Visual Canvas

Required:

- region-based canvas for header, content, aside and actions;
- component cards with icon, title, binding, action and permission status;
- selected-component highlight;
- move up/down and region changes from the canvas;
- width controls: full, half, third, quarter, compact;
- desktop/tablet/mobile preview toggle;
- visual warnings when a component is missing binding, action target or permission;
- viewport frames that clearly change width and composition for desktop, tablet and mobile;
- real component previews for the supported block types;
- safe sample interaction inside the preview surface.

Later:

- drag and drop;
- resizable grid;
- snap-to-grid;
- keyboard movement;
- multi-select.

### 2. App Workspace

The workspace must stay organized by app.

Required tabs:

- Overview;
- Pages;
- Navigation;
- Components;
- Security;
- Texts;
- Theme;
- Preview;
- Publish;
- Export / install.

Each app belongs to one tenant. A tenant can own many apps. Each app can own many screens, routes, text bundles, preferences and permissions.

### 3. Navigation Builder

Required:

- top menu;
- side menu;
- bottom mobile menu;
- tabs;
- route list;
- start route;
- menu labels by text key;
- icon selection;
- permission per menu item;
- visibility by target: web, mobile, desktop, admin.

The generated runtime must read navigation from the app contract, not from hardcoded frontend routes.

### 4. Component Library For Apps

Required component groups:

- navigation: top menu, side menu, bottom menu, tabs;
- auth: login, logout, session status;
- data entry: dynamic form, search panel, filters;
- data display: table, card list, detail panel, entity card;
- process: service button, flow button, action button;
- content: hero/header, text block, image, gallery, timeline;
- layout: container, section, columns, modal, drawer;
- operational: map, metrics, chart, activity log.

Each component must declare:

- key;
- label;
- category;
- supported targets;
- supported visual kits;
- required inputs;
- optional inputs;
- supported bindings;
- supported actions;
- default empty state;
- preview sample.

The component palette must be vertical and searchable. Categories can collapse, filter or group by business purpose,
but the user must be able to scan available blocks from top to bottom. Palette cards should show the component name,
purpose, target support, kit support and whether it needs a binding, action or permission.

Preview samples are no longer passive sketches. A component preview must use the same adapter family that will render
the generated app whenever that is practical. For example, a form component should display sample fields, a table
component should display rows and row actions, a navigation component should display menu items, and a modal component
should show an openable modal preview.

Ionic coverage is mandatory for mobile-first apps. The library must expose Ionic-native adapters or faithful Ionic
wrappers for:

- `ion-input`, `ion-textarea`, `ion-select`, `ion-toggle`, `ion-checkbox`, `ion-radio-group`, `ion-datetime`;
- `ion-button`, `ion-fab`, `ion-segment`, `ion-tabs`, `ion-menu`, `ion-list`, `ion-item`;
- `ion-card`, `ion-modal`, `ion-alert`, `ion-action-sheet`, `ion-toast`, `ion-loading`;
- camera, file upload, GPS/location and mobile evidence controls;
- mobile bottom navigation and sticky action bars.

### 5. Runtime Completeness

Required:

- resolve `tenant + appKey + target + route`;
- load the published app version;
- load the published screen version;
- filter navigation by permissions and target;
- render components by contract;
- execute service actions;
- execute flow actions;
- submit dynamic forms;
- open modal actions;
- navigate between dynamic routes;
- show loading, empty, success and error states;
- use text bundles and local fallback;
- respect visual kit, palette, density and dark mode.

The design-time preview and runtime renderer must converge. The preview may run with sample data or sandboxed
execution, but it should use the same component registry, bindings, actions and responsive layout rules as the runtime.
This is what lets users test the app while building it.

### 6. AI App Authoring

The assistant must create complete app graphs, not isolated screens.

Required examples:

- "Create an app named Tuerca with login and a home menu";
- "Create a gallery app with image upload and a detail modal";
- "Add a clients page with CRUD form and table";
- "Connect this form to the mobile bottom menu";
- "Make this app use a green theme and Spanish as default language";
- "Export this app as a template package".

The assistant must produce reviewable drafts:

- app manifest;
- screen definitions;
- navigation items;
- component bindings;
- text keys;
- permissions;
- template dependencies.

It must not publish automatically unless the user explicitly uses an approved publish action.

The assistant must also understand the visual workspace:

- current app and selected screen;
- available components from the palette;
- current viewport and target;
- selected component and inspector state;
- current bindings, actions and permission gaps;
- published forms, services, flows, tables and text bundles available to the tenant.

When the user asks for an app, the assistant should be able to propose the app graph, place components into regions,
connect bindings/actions and explain what changed in the preview.

### 7. Templates And Packages

Required package contents:

- app manifest;
- app versions;
- screens;
- screen versions;
- navigation;
- component definitions;
- dynamic forms used by the app;
- dynamic services used by the app;
- flows used by the app;
- text bundles;
- theme preferences;
- permissions;
- dependency map;
- install metadata.

Required install behavior:

- dry run before install;
- conflict report;
- active-key protection;
- trash-aware restore behavior;
- optional overwrite;
- dependency validation;
- post-install preview.

## Definition Of Done For The Next Visualizer Pass

The next implementation pass is done when:

- opening App Studio shows a clear app-centered workspace;
- selecting a screen shows a visual canvas that explains the screen structure;
- adding a component is understandable without reading JSON;
- component placement, width, binding and action are visible;
- web/tablet/mobile preview is readable and aligned;
- the inspector edits the selected component without losing context;
- the JSON remains the source of truth;
- the assistant can describe what exists on the current screen and suggest the next concrete change;
- the component palette is a vertical, searchable list;
- desktop/tablet/mobile switching visibly changes the preview frame and layout;
- component previews render real controls instead of placeholder guides;
- Ionic mobile components are represented in the palette and preview strategy;
- preview interaction is sandboxed enough to test the app while building it.

## Known Remaining Risks

- The current visualizer can still become crowded if every component exposes technical metadata.
- Drag/resizable behavior should not be introduced before the region model is stable.
- Runtime parity across web, Ionic/mobile and desktop must be tested after each new component adapter.
- Text bundles must be generated automatically for app labels, routes, buttons and messages.
- Generated apps must not depend on Admin-only components unless the target is admin.
- Package export/import must validate dependencies before installation.

## Recommended Immediate Sequence

1. Convert the component palette into a vertical searchable catalog with categories and target/kit badges.
2. Finish the viewport switch behavior so the canvas frame and layout change clearly for desktop, tablet and mobile.
3. Replace every placeholder preview with a real interactive preview adapter.
4. Add the missing Ionic-native component families to the component catalog and preview adapters.
5. Connect preview interaction to sandboxed sample state and safe runtime tests.
6. Add a navigation builder visible inside the app workspace.
7. Connect visualizer selection with component JSON and inspector fields.
8. Teach Chicle AI to read the current app graph and modify the selected screen without starting over.
9. Run build, AI tests, runtime route smoke tests and viewport interaction checks.
