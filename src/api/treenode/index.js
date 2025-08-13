// src/api/treenode/index.js
const URL = 'http://192.168.4.48:8082/api/entity-tree';

export async function getEntityTreeRaw() {
  const r = await fetch(URL, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function getEntityTree() {
  const data = await getEntityTreeRaw();
  return Array.isArray(data) ? data.map(normalizeNode) : [];
}

export function normalizeNode(n = {}) {
  return {
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
}

export function findNodeById(tree = [], id) {
  const t = String(id);
  const stack = [...tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (String(n.id) === t) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}

export function flattenTree(tree = []) {
  const out = [];
  (function walk(arr) {
    if (!Array.isArray(arr)) return;
    for (const n of arr) {
      out.push(n);
      if (n?.children?.length) walk(n.children);
    }
  })(tree);
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
  return res;
}


function findPathById(tree = [], id) {
  const target = String(id);
  const path = [];
  let ok = false;

  function dfs(n) {
    if (!n || ok) return;
    path.push(n);
    if (String(n.id) === target) { ok = true; return; }
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
  return ok ? path : null;
}


/**
 * Trả về object:
 * {
 *   Owner1, Owner2, Owner3,  // các level 'organisation' từ root xuống
 *   Location,                // 'substation'
 *   VoltageLevel,            // 'voltageLevel'
 *   Feeder                   // 'bay'
 * }
 */
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
  if (!path) return props;

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
  return props;
}

// fetch cây và trả về object properties
export async function getPropertiesByIdAsync(nodeId) {
  const tree = await getEntityTree(); // normalize sẵn
  return getPropertiesById(tree, nodeId);
}

/** node cha trực tiếp */
export function getParentById(tree = [], nodeId) {
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const path = findPathById(normalized, nodeId);
  if (!path || path.length < 2) return null;
  return path[path.length - 2];
}

/**  danh sách tổ tiên */
export function getAncestorsById(tree = [], nodeId) {
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const path = findPathById(normalized, nodeId);
  return Array.isArray(path) && path.length > 1 ? path.slice(0, -1) : [];
}

/** ancestor gần nhất có mode = targetMode */
export function getAncestorByMode(tree = [], nodeId, targetMode) {
  const ancestors = getAncestorsById(tree, nodeId);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    if (ancestors[i]?.mode === targetMode) return ancestors[i];
  }
  return null;
}

// Bản async
export async function getParentByIdAsync(nodeId) {
  const tree = await getEntityTree();
  return getParentById(tree, nodeId);
}

export async function getAncestorByModeAsync(nodeId, targetMode) {
  const tree = await getEntityTree();
  return getAncestorByMode(tree, nodeId, targetMode);
}
export function getGroupByIedId(tree = [], iedId) {
  const t = String(iedId);
  const normalized = Array.isArray(tree) ? tree.map(normalizeNode) : [];
  const iedNode = findNodeById(normalized, t);

  if (!iedNode || iedNode.mode !== 'ied') {
    console.warn("Không tìm thấy IED node với id:", t);
    return null;
  }

  return {
    ...iedNode,
    children: (iedNode.children || []).filter(c => c.mode === 'protectionGroup')
  };
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
};
