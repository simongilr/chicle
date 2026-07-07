# Formly runtime architecture

Chicle Engine uses Formly 7 as the Angular form orchestration layer. Formly owns Reactive Forms construction,
validation, parsers, visibility expressions and field lifecycle. Chicle owns the public persisted contract, security,
presentation profile and concrete PrimeNG/Ionic/native rendering.

The canonical stored contract is documented in `docs/dynamic-forms-contract.md`. The Formly adapter is an
implementation detail that converts that Chicle document into `FormlyFieldConfig[]`.

## Dependency boundary

Installed packages:

- `@ngx-formly/core`
- `@ngx-formly/primeng`
- `@ngx-formly/ionic`

The PrimeNG and Ionic Formly packs are intentionally not registered together under their default aliases. Both define
names such as `input`, `select`, `checkbox` and `form-field`; global registration would make the last package override
the first.

Instead, Chicle registers two stable Formly types:

- `chicle-field`: delegates editable controls to `DynamicFieldControlComponent`.
- `chicle-display`: renders declarative title, paragraph and divider fields.

`DynamicFieldControlComponent` resolves PrimeNG, Ionic or native through the existing presentation profile. One stored
form therefore works in every installed kit without rewriting Formly fields.

## Runtime flow

```text
Stored dynamic_forms.schema
  -> FormRuntimeService normalization
  -> FormlySchemaAdapterService
  -> FormlyFieldConfig[]
  -> FormlyRuntimeComponent
  -> chicle-field / chicle-display
  -> PrimeNG | Ionic | native adapter
```

`FormlyRuntimeComponent` is the public reusable form surface. It receives a `RuntimeForm`, model, presentation profile
and viewport width. It emits model updates, validity and final submission without calling a business API.

## Supported imported concepts

The reusable parts recovered from the earlier example project are now represented generically:

- Text, number, email, password, telephone and URL.
- Textarea, select, radio, checkbox and toggle.
- Date, time and date-time.
- Title, paragraph and divider.
- Multi-step forms.
- Required, minimum, maximum and exact length.
- `uppercase`, `lowercase` and `trim` parsers.
- Declarative conditional visibility.
- Full, half and third layout intent.

No product names, product tables or product-specific validation services were copied.

The earlier project also had useful concepts such as button settings, dynamic sources, grouped fields and nested arrays.
Those concepts are not copied directly. They are translated into the Chicle contract as `actions`, `dataSources`,
`steps`, field layout and future `repeater`/`object_group` field types.

## Safe conditional visibility

Stored JSON does not contain JavaScript. `visibleWhen` accepts only a field, approved operator and optional value:

```json
{
  "visibleWhen": {
    "field": "channel",
    "operator": "equals",
    "value": "phone"
  }
}
```

Supported operators are `equals`, `not_equals`, `truthy`, `falsy` and `contains`. The adapter converts this declarative
object into an in-memory Formly expression.

## Capability fields

Camera, files, OCR, barcode, GPS, NFC, RFID and BLE must become Formly types backed by Chicle capability services.
They are not copied from the earlier application because that implementation mixes hardware access, product rules and
form rendering in one component.

The required architecture for a capability field is:

1. Library-neutral stored field definition.
2. Permission and availability check through a capability service.
3. Web fallback and native adapter.
4. Typed result written to the Formly control.
5. Loading, denied, unavailable, retry and offline states.
6. Visual example and mobile/native test.

## Adding a field type

1. Extend `RuntimeField` with a declarative, serializable contract.
2. Add conversion in `FormlySchemaAdapterService`.
3. Add equivalent rendering to every supported UI adapter, or define an explicit fallback.
4. Register a specialized Formly type only when the generic `chicle-field` contract is insufficient.
5. Add a neutral example to `docs/examples/dynamic-form-formly.examples.json`.
6. Render it in `/components` and verify every theme, kit and viewport.

Formly's official standalone APIs are `FormlyForm`, `provideFormlyCore` and `provideFormlyConfig`. Chicle uses the
standalone API rather than importing the earlier application's NgModules.
