# App Studio Completion Roadmap

Status date: 2026-07-31.

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

Finish the visualizer/canvas pass.

The visualizer must become the main way to understand and edit an app screen:

- show screen regions clearly;
- show component placement, width and order;
- make navigation, header, content, aside and actions visible;
- make web, tablet and mobile behavior understandable;
- let the user select a component directly from the preview/canvas;
- keep the inspector synchronized with the selected component;
- avoid exposing technical chips that do not help the user understand the app;
- make bindings and actions visible in business language.

## Product Completion Blocks

### 1. Visual Canvas

Required:

- region-based canvas for header, content, aside and actions;
- component cards with icon, title, binding, action and permission status;
- selected-component highlight;
- move up/down and region changes from the canvas;
- width controls: full, half, third, quarter, compact;
- desktop/tablet/mobile preview toggle;
- visual warnings when a component is missing binding, action target or permission.

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
- the assistant can describe what exists on the current screen and suggest the next concrete change.

## Known Remaining Risks

- The current visualizer can still become crowded if every component exposes technical metadata.
- Drag/resizable behavior should not be introduced before the region model is stable.
- Runtime parity across web, Ionic/mobile and desktop must be tested after each new component adapter.
- Text bundles must be generated automatically for app labels, routes, buttons and messages.
- Generated apps must not depend on Admin-only components unless the target is admin.
- Package export/import must validate dependencies before installation.

## Recommended Immediate Sequence

1. Redesign the App Studio visualizer around screen regions and selected-component inspector.
2. Add a navigation builder visible inside the app workspace.
3. Add component preview samples to the app component catalog.
4. Connect visualizer selection with component JSON and inspector fields.
5. Teach Chicle AI to read the current app graph and modify the selected screen without starting over.
6. Run build, AI tests and runtime route smoke tests.

