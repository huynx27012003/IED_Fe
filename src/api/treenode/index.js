import client from '@/api/client';

export async function getEntityTreeRaw() {
  try {
    const response = await client.get('/api/entity-tree', {
      headers: { accept: 'application/json' }
    });
    // console.log('getEntityTreeRaw: Result:', JSON.stringify(response.data, null, 5));
    return response.data;
  } catch (error) {
    console.error('getEntityTreeRaw: Error:', error.message, error.response?.data);
    throw error;
  }
}

// chẩn hóa cây
export async function getEntityTree() {
  const data = await getEntityTreeRaw();
  const result = Array.isArray(data) ? data.map(normalizeNode) : [];
  // console.log('getEntityTree: Result:', JSON.stringify(result, null, 2));
  return result;
}

// chuẩn hóa node
export function normalizeNode(n = {}) {
  const normalized = {
    id: n.id ?? null,
    name: n.name ?? '',
    mode: n.mode ?? '',
    description: n.description ?? null,
    value: n.value ?? null,
    unit: n.unit ?? null,
    minVal: n.minVal ?? null,
    maxVal: n.maxVal ?? null,
    children: Array.isArray(n.children) ? n.children.map(normalizeNode) : [],
  };
  return normalized;
}

export function findNodeById(tree = [], id) {
  const t = String(id);
  const stack = [...tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (String(n.id) === t) {
      // console.log('findNodeById: Result:', JSON.stringify(n, null, 2));
      return n;
    }
    if (n.children?.length) stack.push(...n.children);
  }
  // console.log('findNodeById: Result: null');
  return null;
}

// Làm phẳng cây
export function flattenTree(tree = []) {
  const out = [];
  (function walk(arr) {
    if (!Array.isArray(arr)) return;
    for (const n of arr) {
      out.push(n);
      if (n?.children?.length) walk(n.children);
    }
  })(tree);
  // console.log('flattenTree: Result:', JSON.stringify(out, null, 2));
  return out;
}

export function filterTreeByName(tree = [], keyword = '') {
  const q = keyword.trim().toLowerCase();
  if (!q) return tree;
  const dfs = (n) => {
    const hit = (n?.name || '').toLowerCase().includes(q);
    const kids = (n?.children || []).map(dfs).filter(Boolean);
    return hit || kids.length ? { ...n, children: kids } : null;
  };
  const res = [];
  for (const r of tree) {
    const n = dfs(r);
    if (n) res.push(n);
  }
  // console.log('filterTreeByName: Result:', JSON.stringify(res, null, 2));
  return res;
}

function findPathById(tree = [], id) {
  const target = String(id);
  const path = [];
  let ok = false;

  function dfs(n) {
    if (!n || ok) return;
    path.push(n);
    if (String(n.id) === target) {
      ok = true;
      return;
    }
    for (const k of n.children || []) {
      dfs(k);
      if (ok) return;
    }
    path.pop();
  }

  for (const root of tree) {
    if (ok) break;
    dfs(root);
  }
  // console.log('findPathById: Result:', ok ? JSON.stringify(path.map(p => ({ id: p.id, name: p.name })), null, 2) : null);
  return ok ? path : null;
}

// get properties by ID
export function getPropertiesById(tree = [], nodeId) {
  const props = {
    Owner1: '',
    Owner2: '',
    Owner3: '',
    Location: '',
    VoltageLevel: '',
    Feeder: '',
  };

  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const path = findPathById(normalized, nodeId);
  if (!path) {
    // console.log('getPropertiesById: Result:', JSON.stringify(props, null, 2));
    return props;
  }

  let ownerIdx = 0;
  for (const n of path) {
    switch (n.mode) {
      case 'organisation':
        if (ownerIdx < 3) props[`Owner${ownerIdx + 1}`] = n.name || '';
        ownerIdx++;
        break;
      case 'substation':
        props.Location = n.name || '';
        break;
      case 'voltageLevel':
        props.VoltageLevel = n.name || '';
        break;
      case 'bay':
        props.Feeder = n.name || '';
        break;
      default:
        break;
    }
  }
  // console.log('getPropertiesById: Result:', JSON.stringify(props, null, 2));
  return props;
}


export async function getPropertiesByIdAsync(nodeId) {
  const tree = await getEntityTree();
  const props = getPropertiesById(tree, nodeId);
  // console.log('getPropertiesByIdAsync: Result:', JSON.stringify(props, null, 2));
  return props;
}

export function getParentById(tree = [], nodeId) {
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const path = findPathById(normalized, nodeId);
  const parent = (!path || path.length < 2) ? null : path[path.length - 2];
  // console.log('getParentById: Result:', JSON.stringify(parent, null, 2));
  return parent;
}

export function getAncestorsById(tree = [], nodeId) {
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const path = findPathById(normalized, nodeId);
  const ancestors = Array.isArray(path) && path.length > 1 ? path.slice(0, -1) : [];
  // console.log('getAncestorsById: Result:', JSON.stringify(ancestors.map(a => ({ id: a.id, name: a.name })), null, 2));
  return ancestors;
}

export function getAncestorByMode(tree = [], nodeId, targetMode) {
  const ancestors = getAncestorsById(tree, nodeId);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (ancestors[i]?.mode === targetMode) {
      // console.log('getAncestorByMode: Result:', JSON.stringify(ancestors[i], null, 2));
      return ancestors[i];
    }
  }
  // console.log('getAncestorByMode: Result: null');
  return null;
}

export async function getParentByIdAsync(nodeId) {
  const tree = await getEntityTree();
  const parent = getParentById(tree, nodeId);
  // console.log('getParentByIdAsync: Result:', JSON.stringify(parent, null, 2));
  return parent;
}

export async function getAncestorByModeAsync(nodeId, targetMode) {
  const tree = await getEntityTree();
  const ancestor = getAncestorByMode(tree, nodeId, targetMode);
  // console.log('getAncestorByModeAsync: Result:', JSON.stringify(ancestor, null, 2));
  return ancestor;
}

export function getGroupByIedId(tree = [], iedId) {
  const t = String(iedId);
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const iedNode = findNodeById(normalized, t);
  if (!iedNode || iedNode.mode !== 'ied') {
    // console.log('getGroupByIedId: Result: null');
    return null;
  }
  const result = {
    ...iedNode,
    children: (iedNode.children || []).filter(c => c.mode === 'protectionGroup')
  };
  // console.log('getGroupByIedId: Result:', JSON.stringify(result, null, 2));
  return result;
}

export function findSubPathById(tree = [], nodeId, targetMode) {
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const fullPath = findPathById(normalized, nodeId);
  if (!fullPath) {
    // console.log('findSubPathById: Result: null');
    return null;
  }
  let startIdx = -1;
  for (let i = fullPath.length - 1; i >= 0; i--) {
    if (fullPath[i]?.mode === targetMode) {
      startIdx = i;
      break;
    }
  }
  const result = startIdx === -1 ? null : fullPath.slice(startIdx);
  // console.log('findSubPathById: Result:', result ? JSON.stringify(result.map(p => ({ id: p.id, name: p.name })), null, 2) : null);
  return result;
}

export default {
  getGroupByIedId,
  getEntityTreeRaw,
  getEntityTree,
  normalizeNode,
  findNodeById,
  flattenTree,
  filterTreeByName,
  getPropertiesById,
  getPropertiesByIdAsync,
  getParentById,
  getAncestorsById,
  getAncestorByMode,
  getParentByIdAsync,
  getAncestorByModeAsync,
  findSubPathById,
};