<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { withBase } from 'vitepress'
import {
  data as graph,
  type GraphEdge,
  type GraphNode,
} from '../graph.data'

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
}

interface RenderEdge {
  key: string
  source: SimNode
  target: SimNode
  bidirectional: boolean
  x1: number
  y1: number
  x2: number
  y2: number
}

const NODE_R = 10
const LABEL_MAX = 14

const containerRef = useTemplateRef<HTMLElement>('container')
const width = shallowRef(800)
const height = shallowRef(520)

const nodes = shallowRef<SimNode[]>([])
const rawEdges = shallowRef<GraphEdge[]>([])
const selectedId = shallowRef<string | null>(null)
const hoveredId = shallowRef<string | null>(null)

let raf = 0
let resizeObs: ResizeObserver | null = null
let dragId: string | null = null
let dragMoved = false

const adjacency = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const node of nodes.value) map.set(node.id, new Set())
  for (const edge of rawEdges.value) {
    map.get(edge.source)?.add(edge.target)
    map.get(edge.target)?.add(edge.source)
  }
  return map
})

const focusId = computed(() => hoveredId.value ?? selectedId.value)

const neighborSet = computed(() => {
  const id = focusId.value
  if (!id) return null
  const set = new Set<string>([id])
  for (const n of adjacency.value.get(id) ?? []) set.add(n)
  return set
})

const renderEdges = computed<RenderEdge[]>(() => {
  const byId = new Map(nodes.value.map((n) => [n.id, n]))
  const result: RenderEdge[] = []
  for (const edge of rawEdges.value) {
    const source = byId.get(edge.source)
    const target = byId.get(edge.target)
    if (!source || !target) continue

    const dx = target.x - source.x
    const dy = target.y - source.y
    const dist = Math.hypot(dx, dy) || 1
    const ux = dx / dist
    const uy = dy / dist
    // 线段停在节点圆外，箭头不被圆盖住
    const pad = NODE_R + 2

    result.push({
      key: `${edge.source}->${edge.target}`,
      source,
      target,
      bidirectional: edge.bidirectional,
      x1: source.x + ux * pad,
      y1: source.y + uy * pad,
      x2: target.x - ux * pad,
      y2: target.y - uy * pad,
    })
  }
  return result
})

const stats = computed(() => ({
  nodes: nodes.value.length,
  edges: rawEdges.value.length,
  bidirectional: rawEdges.value.filter((e) => e.bidirectional).length,
  directed: rawEdges.value.filter((e) => !e.bidirectional).length,
}))

const selectedNode = computed(
  () => nodes.value.find((n) => n.id === selectedId.value) ?? null,
)

const linkedFromSelected = computed(() => {
  const id = selectedId.value
  if (!id) return [] as { node: SimNode; bidirectional: boolean; outgoing: boolean }[]
  const byId = new Map(nodes.value.map((n) => [n.id, n]))
  const list: { node: SimNode; bidirectional: boolean; outgoing: boolean }[] = []
  for (const edge of rawEdges.value) {
    if (edge.source === id) {
      const node = byId.get(edge.target)
      if (node) list.push({ node, bidirectional: edge.bidirectional, outgoing: true })
    } else if (edge.target === id) {
      const node = byId.get(edge.source)
      if (node) list.push({ node, bidirectional: edge.bidirectional, outgoing: false })
    }
  }
  return list
})

function shortLabel(title: string): string {
  if (title.length <= LABEL_MAX) return title
  return `${title.slice(0, LABEL_MAX - 1)}…`
}

function categoryHue(category: string): string {
  const palette: Record<string, string> = {
    notes: 'var(--vp-c-brand-1)',
    thoughts: '#c27a3a',
    projects: '#3a8f6b',
    resources: '#4a7ab5',
  }
  return palette[category] ?? 'var(--vp-c-text-2)'
}

function isDimmed(id: string): boolean {
  const focus = neighborSet.value
  return !!focus && !focus.has(id)
}

function isEdgeDimmed(edge: RenderEdge): boolean {
  const focus = neighborSet.value
  if (!focus) return false
  return !(focus.has(edge.source.id) && focus.has(edge.target.id))
}

function initSimulation() {
  const w = width.value
  const h = height.value
  const cx = w / 2
  const cy = h / 2
  const count = Math.max(graph.nodes.length, 1)
  const radius = Math.min(w, h) * 0.28

  nodes.value = graph.nodes.map((node, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2
    const jitter = 8 + (i % 5) * 3
    return {
      ...node,
      x: cx + Math.cos(angle) * (radius + jitter),
      y: cy + Math.sin(angle) * (radius + jitter),
      vx: 0,
      vy: 0,
      pinned: false,
    }
  })
  rawEdges.value = graph.edges
}

function tick() {
  const list = nodes.value
  const n = list.length
  if (!n) return

  const w = width.value
  const h = height.value
  const cx = w / 2
  const cy = h / 2

  // 节点互斥
  for (let i = 0; i < n; i++) {
    const a = list[i]!
    for (let j = i + 1; j < n; j++) {
      const b = list[j]!
      let dx = b.x - a.x
      let dy = b.y - a.y
      let dist2 = dx * dx + dy * dy
      if (dist2 < 1) {
        dx = (Math.random() - 0.5) * 0.5
        dy = (Math.random() - 0.5) * 0.5
        dist2 = dx * dx + dy * dy
      }
      const dist = Math.sqrt(dist2)
      const force = (2200 / dist2) * 0.6
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      if (!a.pinned) {
        a.vx -= fx
        a.vy -= fy
      }
      if (!b.pinned) {
        b.vx += fx
        b.vy += fy
      }
    }
  }

  // 边弹簧
  const byId = new Map(list.map((node) => [node.id, node]))
  for (const edge of rawEdges.value) {
    const a = byId.get(edge.source)
    const b = byId.get(edge.target)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.hypot(dx, dy) || 1
    const ideal = 120
    const force = (dist - ideal) * 0.02
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    if (!a.pinned) {
      a.vx += fx
      a.vy += fy
    }
    if (!b.pinned) {
      b.vx -= fx
      b.vy -= fy
    }
  }

  // 向中心聚拢 + 阻尼 + 边界
  const pad = 36
  for (const node of list) {
    if (!node.pinned) {
      node.vx += (cx - node.x) * 0.004
      node.vy += (cy - node.y) * 0.004
      node.vx *= 0.84
      node.vy *= 0.84
      node.x += node.vx
      node.y += node.vy
    }
    node.x = Math.min(w - pad, Math.max(pad, node.x))
    node.y = Math.min(h - pad, Math.max(pad, node.y))
  }

  // 触发浅层更新
  nodes.value = list.slice()
}

function loop() {
  tick()
  raf = requestAnimationFrame(loop)
}

function measure() {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  width.value = Math.max(320, Math.floor(rect.width))
  height.value = Math.max(420, Math.floor(rect.width * 0.62))
}

function clientToSvg(ev: PointerEvent): { x: number; y: number } {
  const el = containerRef.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: ((ev.clientX - rect.left) / rect.width) * width.value,
    y: ((ev.clientY - rect.top) / rect.height) * height.value,
  }
}

function onNodePointerDown(node: SimNode, ev: PointerEvent) {
  ev.preventDefault()
  dragId = node.id
  dragMoved = false
  node.pinned = true
  ;(ev.currentTarget as Element).setPointerCapture?.(ev.pointerId)
}

function onPointerMove(ev: PointerEvent) {
  if (!dragId) return
  const pos = clientToSvg(ev)
  const node = nodes.value.find((n) => n.id === dragId)
  if (!node) return
  dragMoved = true
  node.x = pos.x
  node.y = pos.y
  node.vx = 0
  node.vy = 0
  nodes.value = nodes.value.slice()
}

function onPointerUp() {
  if (!dragId) return
  const id = dragId
  const node = nodes.value.find((n) => n.id === id)
  if (node) node.pinned = false
  if (!dragMoved) {
    selectedId.value = selectedId.value === id ? null : id
  }
  dragId = null
  dragMoved = false
}

function openArticle(url: string) {
  window.location.href = withBase(url)
}

function resetLayout() {
  selectedId.value = null
  hoveredId.value = null
  initSimulation()
}

function edgeMarker(edge: RenderEdge): string {
  return !isEdgeDimmed(edge) && neighborSet.value
    ? 'url(#kg-arrow-hi)'
    : 'url(#kg-arrow)'
}

function onNodeEnter(id: string) {
  hoveredId.value = id
}

function onNodeLeave(id: string) {
  if (hoveredId.value === id) hoveredId.value = null
}

onMounted(() => {
  measure()
  initSimulation()
  loop()
  resizeObs = new ResizeObserver(() => {
    const prevW = width.value
    const prevH = height.value
    measure()
    const sx = width.value / prevW
    const sy = height.value / prevH
    for (const node of nodes.value) {
      node.x *= sx
      node.y *= sy
    }
    nodes.value = nodes.value.slice()
  })
  if (containerRef.value) resizeObs.observe(containerRef.value)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  resizeObs?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})

watch(
  () => [graph.nodes.length, graph.edges.length] as const,
  () => initSimulation(),
)
</script>

<template>
  <div class="kg">
    <div class="kg__toolbar">
      <div class="kg__stats">
        <span>{{ stats.nodes }} 篇笔记</span>
        <span>{{ stats.edges }} 条链接</span>
        <span v-if="stats.bidirectional">{{ stats.bidirectional }} 组双向</span>
        <span v-if="stats.directed">{{ stats.directed }} 条单向</span>
      </div>
      <button type="button" class="kg__reset" @click="resetLayout">重置布局</button>
    </div>

    <div
      ref="container"
      class="kg__canvas"
      @pointerleave="hoveredId = null"
    >
      <svg
        class="kg__svg"
        :viewBox="`0 0 ${width} ${height}`"
        role="img"
        aria-label="文章知识图谱"
      >
        <defs>
          <marker
            id="kg-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" class="kg-marker" />
          </marker>
          <marker
            id="kg-arrow-hi"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" class="kg-marker is-hi" />
          </marker>
        </defs>

        <g class="kg__edges">
          <line
            v-for="edge in renderEdges"
            :key="edge.key"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
            class="kg-edge"
            :class="{ dim: isEdgeDimmed(edge), hi: !isEdgeDimmed(edge) && !!neighborSet }"
            :marker-end="edgeMarker(edge)"
            :marker-start="edge.bidirectional ? edgeMarker(edge) : undefined"
          />
        </g>

        <g class="kg__nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            class="kg-node"
            :class="{
              dim: isDimmed(node.id),
              selected: node.id === selectedId,
              focus: node.id === focusId,
            }"
            @pointerdown="onNodePointerDown(node, $event)"
            @pointerenter="onNodeEnter(node.id)"
            @pointerleave="onNodeLeave(node.id)"
            @dblclick.stop="openArticle(node.url)"
          >
            <circle
              :cx="node.x"
              :cy="node.y"
              :r="NODE_R"
              class="kg-node__dot"
              :style="{ fill: categoryHue(node.category) }"
            />
            <text
              :x="node.x"
              :y="node.y + NODE_R + 14"
              class="kg-node__label"
            >
              {{ shortLabel(node.title) }}
            </text>
            <title>{{ node.title }}（双击打开）</title>
          </g>
        </g>
      </svg>
    </div>

    <p class="kg__hint">
      拖拽节点调整位置；悬停高亮邻居；单击选中；双击打开文章。互链显示为
      <span class="kg__hint-bi">↔ 双向箭头</span>，单链为 → 单向箭头。
    </p>

    <div v-if="selectedNode" class="kg__detail">
      <div class="kg__detail-head">
        <h3>
          <a :href="withBase(selectedNode.url)">{{ selectedNode.title }}</a>
        </h3>
        <span class="kg__badge">{{ selectedNode.category }}</span>
      </div>
      <ul v-if="linkedFromSelected.length">
        <li v-for="item in linkedFromSelected" :key="item.node.id">
          <span class="kg__dir" :title="item.bidirectional ? '双向链接' : item.outgoing ? '链出' : '链入'">
            {{ item.bidirectional ? '↔' : item.outgoing ? '→' : '←' }}
          </span>
          <a :href="withBase(item.node.url)">{{ item.node.title }}</a>
        </li>
      </ul>
      <p v-else class="kg__empty">这篇笔记尚未与其他文章建立内链。</p>
    </div>
  </div>
</template>

<style scoped>
.kg {
  margin: 1rem 0 2rem;
}

.kg__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.kg__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
}

.kg__reset {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-radius: 6px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.kg__reset:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.kg__canvas {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent), transparent 45%),
    radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--vp-c-brand-1) 6%, transparent), transparent 40%),
    var(--vp-c-bg-soft);
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.kg__svg {
  display: block;
  width: 100%;
  height: auto;
}

.kg-marker {
  fill: var(--vp-c-text-3);
}

.kg-marker.is-hi {
  fill: var(--vp-c-brand-1);
}

.kg-edge {
  stroke: var(--vp-c-text-3);
  stroke-width: 1.5;
  opacity: 0.75;
  transition: opacity 0.15s ease;
}

.kg-edge.hi {
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  opacity: 1;
}

.kg-edge.dim {
  opacity: 0.12;
}

.kg-node {
  cursor: grab;
}

.kg-node:active {
  cursor: grabbing;
}

.kg-node__dot {
  stroke: var(--vp-c-bg);
  stroke-width: 2;
  transition: r 0.15s ease, opacity 0.15s ease;
}

.kg-node.focus .kg-node__dot,
.kg-node.selected .kg-node__dot {
  stroke: var(--vp-c-brand-1);
  stroke-width: 3;
}

.kg-node.dim {
  opacity: 0.18;
}

.kg-node__label {
  fill: var(--vp-c-text-1);
  font-size: 12px;
  text-anchor: middle;
  pointer-events: none;
  paint-order: stroke;
  stroke: var(--vp-c-bg-soft);
  stroke-width: 3px;
  stroke-linejoin: round;
}

.kg__hint {
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
}

.kg__hint-bi {
  color: var(--vp-c-brand-1);
}

.kg__detail {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.kg__detail-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.kg__detail-head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.kg__badge {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
}

.kg__detail ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.kg__detail li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.28rem 0;
}

.kg__dir {
  width: 1.25rem;
  text-align: center;
  color: var(--vp-c-brand-1);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.kg__empty {
  margin: 0.25rem 0 0;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .kg-node__label {
    font-size: 11px;
  }
}
</style>
