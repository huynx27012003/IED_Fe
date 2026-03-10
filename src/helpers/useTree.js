
export function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}


export function findPathById(tree, id) {
  const target = String(id)
  const path = []
  let found = false

  function dfs(node) {
    if (!node || found) return
    path.push(node)
    if (String(node.id) === target) {
      found = true
      return
    }
    for (const child of node.children || []) {
      dfs(child)
      if (found) return
    }
    path.pop()
  }

  for (const root of tree) {
    if (found) break
    dfs(root)
  }
  
  return found ? path : null
}

export function flattenTree(tree) {
  const result = []
  
  function walk(nodes) {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      result.push(node)
      if (node?.children?.length) walk(node.children)
    }
  }
  
  walk(tree)
  return result
}

export function filterTreeByName(tree, keyword) {
  const q = keyword.trim().toLowerCase()
  if (!q) return tree
  
  function dfs(node) {
    const hit = (node?.name || '').toLowerCase().includes(q)
    const kids = (node?.children || []).map(dfs).filter(Boolean)
    return hit || kids.length ? { ...node, children: kids } : null
  }
  
  return tree.map(dfs).filter(Boolean)
}


export function normalizeNode(node = {}) {
  return {
    id: node.id ?? null,
    name: node.name ?? "",
    mode: node.mode ?? "",
    description: node.description ?? null,
    value: node.value ?? null,
    unit: node.unit ?? null,
    minVal: node.minVal ?? null,
    maxVal: node.maxVal ?? null,
    options: Array.isArray(node.options) ? [...node.options] : [],
    children: Array.isArray(node.children) ? node.children.map(normalizeNode) : [],
  }
}

export function getAncestorsById(tree, nodeId) {
  const path = findPathById(tree, nodeId)
  return Array.isArray(path) && path.length > 1 ? path.slice(0, -1) : []
}


export function getParentById(tree, nodeId) {
  const path = findPathById(tree, nodeId)
  return (!path || path.length < 2) ? null : path[path.length - 2]
}


export function collapseAllNodes(nodes) {
  if (!Array.isArray(nodes)) return
  nodes.forEach(node => {
    node.expanded = false
    if (node.children?.length > 0) {
      collapseAllNodes(node.children)
    }
  })
}


export function saveExpandedState(nodes) {
  const expandedNodes = new Set()
  
  function traverse(nodes) {
    nodes.forEach(node => {
      if (node.expanded) {
        expandedNodes.add(node.id)
      }
      if (node.children?.length) {
        traverse(node.children)
      }
    })
  }
  
  traverse(nodes)
  return expandedNodes
}


export function restoreExpandedState(nodes, expandedNodes) {
  nodes.forEach(node => {
    if (expandedNodes.has(node.id)) {
      node.expanded = true
    }
    if (node.children?.length) {
      restoreExpandedState(node.children, expandedNodes)
    }
  })
}
