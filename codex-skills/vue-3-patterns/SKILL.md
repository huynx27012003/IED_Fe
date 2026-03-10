---
name: vue-3-patterns
description: Vue 3 best practices for Composition API, reactivity, component design, and Element Plus integration. Use when building Vue 3 components, managing state with Vuex, or optimizing performance.
---

# Vue 3 Patterns

Vue 3 best practices specifically for ATDigital IED Frontend project using Options API and Element Plus.

## Core Principles

- **Options API**: Project uses classic Vue Options API (`data`, `methods`, `computed`, `watch`)
- **Vue 3 Reactivity**: Use `Vue.set` replacement for reactive updates (use normal assignment in Vue 3)
- **Element Plus**: UI component library - check docs at https://element-plus.org
- **Leaflet Maps**: Geographic visualization with `@vue-leaflet/vue-leaflet`

## Component Structure

```vue
<template>
  <div class="component-name">
    <!-- Element Plus components -->
    <el-button @click="handleClick">Click</el-button>
    <el-table :data="tableData" />
  </div>
</template>

<script>
export default {
  name: 'ComponentName',
  
  props: {
    node: { type: Object, required: true },
    mode: { type: String, default: 'default' }
  },
  
  emits: ['open-context-menu', 'node-dblclick'],
  
  data() {
    return {
      localState: null,
      loading: false
    }
  },
  
  computed: {
    visibleChildren() {
      // Filter logic here
      return this.filteredChildren
    }
  },
  
  watch: {
    node(newVal) {
      // React to prop changes
      this.initialize(newVal)
    }
  },
  
  mounted() {
    this.initialize()
  },
  
  beforeUnmount() {
    // Cleanup
  },
  
  methods: {
    handleClick() {
      this.$emit('node-dblclick', this.node)
    },
    
    initialize() {
      // Setup logic
    }
  }
}
</script>

<style scoped>
.component-name {
  /* Component styles */
}
</style>
```

## Vue 3 Migration Notes (from Vue 2)

### Do NOT use (Vue 2 only)
- ❌ `this.$set()` - Use normal assignment
- ❌ `beforeDestroy` - Use `beforeUnmount`
- ❌ `destroyed` - Use `unmounted`
- ❌ Mutating props directly

### Use in Vue 3
- ✅ Normal assignment for reactivity: `this.items.push(newItem)`
- ✅ `emits: []` declaration
- ✅ Multiple root elements (fragments)
- ✅ `beforeUnmount` lifecycle hook

## Component Communication

### Parent to Child (Props)
```vue
<!-- Parent -->
<template>
  <TreeNode 
    :node="treeData" 
    :mode="'explorer'"
    @open-context-menu="showMenu"
  />
</template>
```

```javascript
// Child: TreeNode.vue
export default {
  props: {
    node: { type: Object, required: true },
    mode: { type: String, default: 'default' }
  }
}
```

### Child to Parent (Events)
```javascript
// Emit events with data
this.$emit('open-context-menu', {
  node: this.node,
  x: event.clientX,
  y: event.clientY
})
```

### Provide/Inject (for deep nesting)
```javascript
// Parent: treeNavigation.script.js
provide() {
  return {
    sclImportStore: this.sclImportStore
  }
},

// Child: SCLManage.vue
inject: ['sclImportStore'],
```

## Reactivity Patterns

### Arrays
```javascript
// ✅ Good - Vue 3 tracks array methods
this.items.push(newItem)
this.items.splice(index, 1)
this.items = [...this.items, newItem] // Replace for big changes

// ❌ Don't - Creating new array loses reactivity in some cases
this.items = this.items.filter(...) // Use with caution
```

### Objects
```javascript
// ✅ Good
this.user.name = 'New Name' // Triggers update

// For new properties, ensure they exist in data()
data() {
  return {
    user: { name: '', email: '' } // Pre-define all fields
  }
}
```

## Tree Component Patterns

### Recursive TreeNode
```vue
<!-- TreeNode.vue -->
<template>
  <div class="tree-node">
    <div @click="toggle" @contextmenu.prevent="showContextMenu">
      <img :src="iconSrc" />
      <span>{{ node.name }}</span>
    </div>
    <div v-if="expanded" class="children">
      <TreeNode 
        v-for="child in visibleChildren" 
        :key="child.id"
        :node="child"
        @open-context-menu="$emit('open-context-menu', $event)"
      />
    </div>
  </div>
</template>
```

### Computed Filtered Children
```javascript
computed: {
  visibleChildren() {
    // Hide operation nodes
    let children = (this.node.children || [])
      .filter(child => child.name !== 'operation')
    
    // SCL tree filtering
    if (this.node.isSclTree) {
      children = children.filter(child => 
        !['dataObject', 'dataAttribute'].includes(child.mode)
      )
    }
    
    // Parameter tree filtering
    if (this.showParamTree && this.node.mode === 'pcDataObject') {
      return [] // Hide in tree, show in table
    }
    
    return children
  }
}
```

## Tab Management

### Tab Object Structure
```javascript
{
  id: 'unique-tab-id',
  name: 'Tab Display Name',
  component: 'ComponentName', // Maps to component in Tabs.vue
  node: { /* tree node data */ },
  focusNode: { /* selected node */ },
  mode: 'systemSetting' // Controls behavior
}
```

### Opening Tabs
```javascript
// From treeNavigation.script.js
openTab(node, mode) {
  const existingTab = this.tabs.find(t => t.id === `${node.id}-${mode}`)
  
  if (existingTab) {
    this.activeTabId = existingTab.id
  } else {
    this.tabs.push({
      id: `${node.id}-${mode}`,
      name: `${node.name} - ${this.getModeLabel(mode)}`,
      component: this.getComponentForMode(mode),
      node,
      focusNode: node,
      mode
    })
    this.activeTabId = `${node.id}-${mode}`
  }
}
```

## Element Plus Integration

### Common Components
```vue
<template>
  <!-- Button -->
  <el-button type="primary" @click="save">Save</el-button>
  <el-button type="danger" :disabled="!canDelete">Delete</el-button>
  
  <!-- Table -->
  <el-table :data="rows" stripe>
    <el-table-column prop="name" label="Name" />
    <el-table-column prop="value" label="Value">
      <template #default="{ row }">
        <el-select v-if="row.options" v-model="row.value">
          <el-option 
            v-for="opt in row.options" 
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <span v-else>{{ row.value }}</span>
      </template>
    </el-table-column>
  </el-table>
  
  <!-- Dialog -->
  <el-dialog v-model="showDialog" title="Confirm">
    <p>Are you sure?</p>
    <template #footer>
      <el-button @click="showDialog = false">Cancel</el-button>
      <el-button type="primary" @click="confirm">Confirm</el-button>
    </template>
  </el-dialog>
  
  <!-- Loading -->
  <el-loading v-if="loading" />
</template>
```

## API Client Pattern

```javascript
// src/api/client.js
import axios from 'axios'
import store from '@/store'

const client = axios.create({
  baseURL: '/api'
})

// Request interceptor
client.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken1005')
  if (token) {
    config.headers['smart-sso-token-1005'] = token
  }
  return config
})

// Response interceptor
client.interceptors.response.use(
  response => {
    // Handle backend envelope format
    if (response.data.code !== undefined) {
      if (response.data.code === 1) {
        return response.data.data
      } else if (response.data.code === 10) {
        // Not logged in
        window.location.href = '/login'
      }
    }
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)

export default client
```

## Performance Optimization

### Lazy Loading Components
```javascript
// Tabs.vue - Dynamic component loading
components: {
  TreeNode: () => import('@/views/common/TreeNode.vue'),
  SCLManage: () => import('@/views/common/SCLManage.vue')
}
```

### v-once for Static Content
```vue
<template>
  <div v-once>
    <!-- This never updates - good for icons/labels -->
    <img src="@/assets/logo.png" />
  </div>
</template>
```

### Key Usage in Lists
```vue
<!-- Always use unique keys -->
<TreeNode 
  v-for="child in children" 
  :key="child.id"  <!-- NOT :key="index" -->
  :node="child"
/>
```

## Common Pitfalls

1. **Mutating Props**: Never mutate props directly
   ```javascript
   // ❌ Bad
   this.node.name = 'New Name'
   
   // ✅ Good
   this.$emit('update-node', { ...this.node, name: 'New Name' })
   ```

2. **Forgetting emits declaration**
   ```javascript
   // ✅ Good
   emits: ['open-context-menu', 'node-dblclick']
   ```

3. **Not cleaning up listeners**
   ```javascript
   beforeUnmount() {
     window.removeEventListener('resize', this.handleResize)
   }
   ```

## Project-Specific Conventions

### Tree Node Modes
| Mode | Behavior |
|------|----------|
| `organisation` | Expandable, has context menu |
| `substation` | Expandable, shows location |
| `voltageLevel` | Expandable |
| `bay` | Expandable |
| `ied` | Expandable (in param trees only) |
| `systemSetting` | Fast open - opens tab on click |
| `protectionFunction` | Fast open |
| `lineParameters` | Fast open |
| `pcDataObject` | Hidden in tree, shown in table |

### File Organization
```
src/
├── views/
│   ├── MainScreenView/        # Main layout
│   │   ├── treeNavigation.vue
│   │   └── treeNavigation.script.js
│   ├── common/                # Shared components
│   │   ├── TreeNode.vue
│   │   ├── ContextMenu.vue
│   │   ├── Tabs.vue
│   │   ├── PropertiesPane.vue
│   │   └── SCLManage.vue
│   ├── ParameterSettingView/  # Parameter settings
│   ├── SCLManagementView/     # SCL import/management
│   └── OrganisationView/      # Organization management
├── api/                       # API clients
│   ├── client.js
│   ├── treenode/
│   ├── scl/
│   └── ...
├── store/                     # Vuex store
└── router/                    # Vue Router
```

## References

- Vue 3 Docs: https://vuejs.org/guide/introduction.html
- Element Plus: https://element-plus.org
- Vue Leaflet: https://github.com/vue-leaflet/vue-leaflet
- Project Skill: See `atdigital-ied-fe` skill for architecture details
