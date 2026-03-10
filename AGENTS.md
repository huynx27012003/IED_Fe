# Project Agents - IED Web

## Overview

ATDigital IED Frontend - Vue 3 + Element Plus application for managing IEC 61850 IED configurations. Features tree navigation, SCL import/management, parameter settings, and device management.

## Skills

These skills are discovered at startup from project docs. Each entry includes a name, description, and file path.

- **atdigital-ied-fe**: Project-specific architecture, component patterns, and workflows for IED Frontend. Tree rendering, tab management, SCL operations. (file: codex-skills/atdigital-ied-fe/SKILL.md)
- **vue-3-patterns**: Vue 3 best practices for Composition API, reactivity, component design, and Element Plus integration. (file: codex-skills/vue-3-patterns/SKILL.md)
- **modern-javascript-patterns**: ES6+ features, async/await, functional programming patterns. (file: codex-skills/modern-javascript-patterns/SKILL.md)
- **web-component-design**: Component architecture, props/events, composition patterns. (file: codex-skills/web-component-design/SKILL.md)
- **javascript-testing-patterns**: Comprehensive testing with Jest/Vitest, component testing, mocking, TDD workflows. (file: codex-skills/javascript-testing-patterns/SKILL.md)
- **playwright**: End-to-end browser automation for UI testing, debugging, and screenshot capture. (file: codex-skills/playwright/SKILL.md)

## Build/Lint/Test Commands

### Development
```bash
# Start development server (port 8081)
npm run serve

# Build for production
npm run build

# Run ESLint
npm run lint
```

### Testing
```bash
# Run unit tests
npm test

# Run single test file
npm test -- --grep "ComponentName"

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Debug tests
npm test -- --inspect-brk
```

### E2E Testing with Playwright
```bash
# Open browser for manual testing
npx playwright open http://localhost:8081 --headed

# Run E2E tests
npx playwright test

# Debug E2E tests
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Code Style Guidelines

### Vue Single File Components
```vue
<template>
  <!-- Template content -->
</template>

<script>
export default {
  name: 'ComponentName',
  props: {},
  emits: [],
  data() { return {} },
  computed: {},
  methods: {}
}
</script>

<style scoped>
/* Component styles */
</style>
```

### JavaScript
- Use ES6+ features (const/let, arrow functions, destructuring)
- Prefer async/await over Promise chains
- Use functional array methods (map, filter, reduce)
- Avoid mutating function arguments

### Component Naming
- PascalCase for component names: `TreeNode.vue`, `PropertiesPane.vue`
- camelCase for methods and computed properties
- UPPER_CASE for constants

### Props & Events
```javascript
// Always define props with types
props: {
  node: { type: Object, required: true },
  mode: { type: String, default: 'default' }
}

// Always declare emits
emits: ['open-context-menu', 'node-dblclick']
```

### API Layer
```javascript
// Use client.js wrapper, not raw axios
import client from '@/api/client.js'

// Domain-specific modules
import { getTreeNodes } from '@/api/treenode'
```

## Error Handling

### Try/Catch with Async
```javascript
async fetchData() {
  try {
    this.loading = true
    const data = await getTreeNodes()
    this.items = data
  } catch (error) {
    this.$message.error('Failed to load data')
    console.error(error)
  } finally {
    this.loading = false
  }
}
```

## Common Operations

### Adding a New Tab
1. Create view component: `src/views/Feature/Feature.vue`
2. Register in `Tabs.vue` components
3. Add to `checkTab()` method
4. Emit from `ContextMenu.vue` with node data

### Adding Context Menu Action
1. Add menu item in `ContextMenu.vue`
2. Emit event with `selectedNode`
3. Handle in `treeNavigation.vue` template
4. Implement handler in `treeNavigation.script.js`

### API Module
```javascript
// src/api/feature/index.js
import client from '../client.js'

export function getFeatureData(id) {
  return client.get(`/feature/${id}`)
}

export function saveFeatureData(id, data) {
  return client.post(`/feature/${id}`, data)
}
```

## Project Structure

```
src/
├── api/              # API clients
├── assets/           # Images, styles
├── router/           # Vue Router config
├── store/            # Vuex store
├── views/            # Page components
│   ├── common/       # Shared components
│   ├── MainScreenView/
│   ├── ParameterSettingView/
│   └── SCLManagementView/
└── main.js          # App entry
```

## Tech Stack

- **Vue 3** (Options API)
- **Vue Router 4**
- **Vuex 4**
- **Element Plus** (UI components)
- **Leaflet** (Maps via vue-leaflet)
- **Axios** (HTTP client)
- **SCSS** (Styling)

## Development Server

- Port: `8081`
- Proxy configured in `vue.config.js` for `/api`
- Environment: `.env` file
