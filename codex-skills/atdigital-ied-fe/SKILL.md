---
name: atdigital-ied-fe
description: Architecture + workflows for the ATDigital IED Frontend (Vue 3 + Element Plus). Updated for ActivityBar views, split panes (Owner/SCL Import/Parameter), SCLManage layout+global store, PropertiesPane extraction, and tab routing in Tabs.vue.
---

# ATDigital IED FE

## Project Shape

- Treat this repo as a single-screen explorer: left sidebar (ActivityBar + panes) + center tab workspace + right Object Properties.
- Typical wiring: `TreeNode.vue` -> `ContextMenu.vue` -> `treeNavigation.(vue|script.js)` -> `Tabs.vue` -> view component -> `src/api/*`.

## Tech Stack (Project-Specific)

- Vue 3 (Options API), Vue Router, Vuex
- Element Plus UI (dialogs/tables), FontAwesome icons, Leaflet maps (`@vue-leaflet/vue-leaflet`)
- Axios client wrapper in `src/api/client.js`
- Vue CLI 4.5 (`npm run serve` defaults to port `8081` from `vue.config.js`)

## Key Files (Start Here)

- App bootstrap/auth: `src/main.js`, `src/store/index.js`, `src/router/index.js`
- Main screen layout: `src/views/MainScreenView/treeNavigation.vue`
- Main screen logic: `src/views/MainScreenView/treeNavigation.script.js`
- Tree rendering/expand/filter: `src/views/common/TreeNode.vue`
- Right-click menu: `src/views/common/ContextMenu.vue`
- Tab host + dynamic component mapping: `src/views/common/Tabs.vue`
- Right panel UI: `src/views/common/PropertiesPane.vue`
- SCL import/management shared view: `src/views/common/SCLManage.vue`
- SCL Management tab wrapper: `src/views/SCLManagementView/SCLManagementTab.vue`
- SCL Import (table-in-tab) wrapper: `src/views/SCLManagementView/SCLImportSubtreeTab.vue`
- Parameter Settings view: `src/views/ParameterSettingView/SystemSettingTab.vue`, `src/views/ParameterSettingView/SystemSettingTab.script.js`
- API client + auth headers/refresh: `src/api/client.js`

## UI Architecture (Mental Model)

### Screen Layout

- Left: ActivityBar switches views (see `activeView` in `treeNavigation.script.js`).
  - `activeView === "explorer"`: resizable sidebar with panes.
    - Owner Tree pane (always present)
    - Optional SCL pane (`showSCL`)
    - Optional Parameter pane (`showParam`)
  - `activeView === "mock1"`: SCL Import tree (left) with table opened in a center tab.
- Center: `Tabs.vue` renders view components based on a tab object: `{ id, name, component, node, focusNode, mode }`.
- Right: Object Properties panel rendered by `PropertiesPane.vue` when `propertiesSign === true`.

### Data Model

Tree nodes (both server tree and client-side synthetic trees) follow this shape:

```js
{
  id: string|number,
  name: string,
  mode: string,          // controls icons + menu + behavior
  expanded?: boolean,
  children?: Array<node>,
  childrenFromData?: Array<node>,
  parentNode?: node,
  parentArr?: Array<node>,

  // Special flags used by FE logic
  isSclTree?: boolean,     // SCL import/management tree
  showParamTree?: boolean, // allow showing IED children in Parameter trees
  showAllGroups?: boolean,
  groupVisibleCount?: number
}
```

Tree source:
- Raw entity tree is loaded from backend `GET /entity-tree` via `src/api/treenode/index.js`.

## Tree Rendering Rules (TreeNode.vue)

- `TreeNode.vue` is recursive; it emits events upward instead of directly calling APIs.
- Icons are PNG assets under `src/assets/images/*` and are preloaded at module load to reduce repeated icon fetches.

### Filtering

- Normal trees: hide child nodes with `name === "operation"`.
- Parameter trees: also hide child nodes with `mode === "pcDataObject"` in the left tree (these values should be shown in the right table, not as tree leaves).
- SCL trees (`node.isSclTree === true`): hide nodes with `mode` `dataObject` and `dataAttribute`.
  - Implementation: `baseChildren` computed filters a blacklist.

### Split Owner Tree vs Parameter Trees

- Owner Tree should stop at `mode === "ied"` (no expanding IED children there).
- Parameter trees are rendered separately (sidebar pane and inside `SystemSettingTab.vue`).
  - The parameter tree clones/derives the IED subtree and sets `showParamTree: true`.
  - In `TreeNode.vue`, when `node.mode === "ied" && !node.isSclTree && !node.showParamTree`, `visibleChildren` returns `[]`.
- `lineParameters` is a parameter-focused mode:
  - In `TreeNode.vue`, render icon same as `systemSetting`.
  - Treat as fast-open mode (same behavior family as `systemSetting`/`settingFunction`/`protection*`).

## SCL Import vs SCL Management

### Shared UI: SCLManage.vue

`src/views/common/SCLManage.vue` is used in 2 contexts:

- SCL Management tab: `src/views/SCLManagementView/SCLManagementTab.vue`
  - Uses `<SCLManage mode="ied" />` (default `layout="split"`).
- SCL Import (ActivityBar): `src/views/MainScreenView/treeNavigation.vue`
  - Shows tree only: `<SCLManage mode="global" layout="tree" />`.
  - Table is rendered in a center tab: `src/views/SCLManagementView/SCLImportSubtreeTab.vue` with `<SCLManage mode="global" layout="table" />`.

Props/behavior to know:
- `layout`: `"split" | "tree" | "table"`
- `mode`:
  - `"global"`: uses injected shared store (`sclImportStore`) when available.
  - `"ied"`: uses local state inside the component.
- Emits `open-subtree-tab` when a node is selected/imported in ActivityBar SCL Import, so the parent can open/activate the table tab.
- Table expand/collapse is independent from the SCL tree expand/collapse (`tableExpandedById`).
- Table title uses `Data set entries for <node>`.
- Name column has a search UI (visual only): filter dropdown for LD/LN/DO/DA; selected icons render inside the search bar; dropdown opens via filter icon only.
- Emits `control-block-update` when SCL node selection changes (tree or table).

### Global Store (SCL Import)

For SCL Import, `treeNavigation.script.js` provides a stable reactive store:

- `provide() { return { sclImportStore: this.sclImportStore } }`
- Keep the object reference stable (update fields, do not replace the whole object), otherwise inject reactivity breaks.
- `openSclImportSubtreeTab()` opens/activates tab id `scl-import-subtree` with `component: "SCLImportSubtreeTab"`.

## Parameter Settings (SystemSettingTab)

`src/views/ParameterSettingView/SystemSettingTab.vue` is a split view:

- Left: parameter tree pane (`param-tree-pane`) with its own `overflow-y`.
- Right: table pane (`table-pane`) with:
  - Title bar: `Data set entries for ...` (`.table-pane-title`)
  - Header action row (no floating/overlay menu): `.table-pane-actions`
    - Edit/Save/Cancel: `onClickEdit`, `saveAll`, `cancelAll`
    - Collapse/Expand muted rows: `collapseMutedRows`, `expandAllRows`
    - Bulk Operation: `onClickSetOperation("On"|"Off")`
  - Body scroll container: `.table-pane-body { overflow-y: auto; overflow-x: hidden; }`
- Sticky table header: `.parameter-table thead th { position: sticky; top: 0; }`
- When node mode is `ied`, table merges System Settings/Line Parameters with Protection Groups.

Virtualized rendering (for large data sets):
- Table body supports windowed rendering when row count is large.
- Toggle/threshold lives in `SystemSettingTab.script.js`:
  - `virtualEnabled`, `virtualMinRows`, `virtualRowHeight`, `virtualOverscan`.
- When enabled, only visible rows + spacer rows are rendered to improve scroll perf.

Editing behavior:
- Only render dropdowns when `row.options` is a non-empty array (avoid empty `No data` selects).

Mode behavior:
- `rowsToRender` must include `lineParameters` so selecting that node renders its children rows in the table (including hidden-in-tree `pcDataObject` children).
- Keep `.row-lineParameters` visual style aligned with `.row-systemSetting` for hierarchy readability.

## Object Properties (Right Panel)

- The right panel is a component: `src/views/common/PropertiesPane.vue`.
- Parent state lives in `treeNavigation.script.js`:
  - `propertiesSign` toggles panel visibility.
  - `propertiesPaneTab` controls `Object Properties` vs `Control Block attributes`.
  - `controlBlockAttributeRows` is currently mock data.
- `showPropertiesData(node)` resets `propertiesPaneTab = "object"` and refreshes `properties` + `Information`.
- Resizing uses a component ref now:
  - `this.$refs.properties` may be a Vue instance; use `this.$refs.properties.$el` for DOM sizing.

## Context Menu -> Action Routing

### How Right-Click Works

- `TreeNode.vue` emits `open-context-menu` for most modes.
- Some modes are "fast open" on right-click (open tab immediately) by emitting `node-dblclick`:
  - `settingFunction`, `systemSetting`, `lineParameters`, `protectionFunction`, `protectionLevel`, `protectionGroup`.

### Where Menu Actions Land

- Menu UI and emitted events: `src/views/common/ContextMenu.vue`
- Event handlers (open tabs, open dialogs, import SCL, open parameter tree): `src/views/MainScreenView/treeNavigation.script.js`
- Tabs rendering & component mapping: `src/views/common/Tabs.vue`

## API Layer Conventions (src/api/*)

### Axios Client

- Use `src/api/client.js` (axios instance), not raw `axios`.
- Base URL is derived from Vuex `store.state.serverAddr`:
  - If empty, base is `/api` (devServer proxy can handle it).
  - Otherwise `toApiBase()` ensures it ends with `/api`.
- Token header: `smart-sso-token-1005` read from `localStorage["accessToken1005"]`.
- Response interceptor supports a backend `{ code }` envelope (code `1` ok, `10` not logged in, `15` refresh, `20` no permission).
  - Endpoints that return raw arrays/objects still work (no `code` field).

### API Module Pattern

- Put each domain in its own folder: `src/api/<domain>/index.js`.
- Validate required IDs early; use `params` for query string.
- For multipart endpoints use `FormData` + `Content-Type: multipart/form-data` (see `src/api/scl/index.js`).

## Common Extension Workflows

### Add a New Tabbed View

1. Create the view under `src/views/<Feature>/<Feature>.vue`.
2. Import it in `src/views/common/Tabs.vue` and register in `components`.
3. Extend `checkTab(tab)` to return the new component when `tab.component === "<ComponentName>"`.
4. From `treeNavigation.script.js`, push a tab object:

```js
this.tabs.push({
  id: `${node.id}-my-feature`,
  name: `${node.name} - My Feature`,
  component: "MyFeatureView",
  node,
  focusNode: node,
  mode: node.mode
});
```

### Add a Context Menu Action

1. Add an item in `ContextMenu.vue` for the relevant `nodeMode`.
2. In `emitAction()`, emit a dedicated event name and include the `selectedNode`.
3. Declare the event in `emits: []` (Vue 3 warning suppression).
4. Handle the event in `treeNavigation.vue` `<ContextMenu ... @my-event="handler" />` + implement handler in `treeNavigation.script.js`.

## Vue 3 / ESLint Pitfalls (Project-Specific)

- Do not use `this.$set` (Vue 2 only). Use normal assignment on reactive state, or replace arrays/objects immutably.
- Do not mutate props (`vue/no-mutating-props`): derive filtered lists in computed, or clone before editing.
- Use `beforeUnmount` not `beforeDestroy`.
- Declare `emits` and ensure single-root templates to avoid runtime warnings about extraneous listeners/attrs.
- Avoid irregular whitespace / control characters in `.vue` files (can break `vue/no-parsing-error`).
- Vue feature-flag warning is handled in `vue.config.js` via `DefinePlugin`.
