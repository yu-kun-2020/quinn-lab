import path from 'node:path'
import { createContentLoader } from 'vitepress'

export interface GraphNode {
  id: string
  title: string
  url: string
  category: string
}

export interface GraphEdge {
  source: string
  target: string
  /** 双方互相链接时为 true，图谱上画双向箭头 */
  bidirectional: boolean
}

export interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

declare const data: KnowledgeGraph
export { data }

const EXCLUDE_RE = /(^|\/)(404|readme|index)\.md$/i
/** 匹配 markdown 内链：[text](url)，忽略 http(s) / mailto / #锚点 */
const MD_LINK_RE = /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

function normalizeArticleUrl(raw: string): string {
  let url = raw.trim()
  try {
    url = decodeURIComponent(url)
  } catch {
    // keep raw
  }
  url = url.split('#')[0]!.split('?')[0]!
  url = url.replace(/\.html?$/i, '').replace(/\.md$/i, '')
  if (!url.startsWith('/')) url = `/${url}`
  url = url.replace(/\/+/g, '/')
  if (url.length > 1 && url.endsWith('/')) url = url.slice(0, -1)
  return url
}

function resolveLink(fromUrl: string, href: string): string | null {
  const trimmed = href.trim()
  if (
    !trimmed ||
    /^(https?:|mailto:|tel:|javascript:)/i.test(trimmed) ||
    trimmed.startsWith('#')
  ) {
    return null
  }

  if (trimmed.startsWith('/')) {
    return normalizeArticleUrl(trimmed)
  }

  // 相对路径：相对当前文章目录解析
  const fromDir = path.posix.dirname(fromUrl)
  const joined = path.posix.normalize(path.posix.join(fromDir, trimmed))
  return normalizeArticleUrl(joined)
}

function titleFromSrc(src: string | undefined, fallback: string): string {
  const fromHeading = src?.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return fromHeading || fallback
}

function extractOutgoing(src: string | undefined, fromUrl: string): string[] {
  if (!src) return []
  const targets = new Set<string>()
  MD_LINK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = MD_LINK_RE.exec(src))) {
    const resolved = resolveLink(fromUrl, match[2]!)
    if (!resolved || resolved === fromUrl) continue
    targets.add(resolved)
  }
  return [...targets]
}

export default createContentLoader(
  [
    'notes/**/*.md',
    'thoughts/**/*.md',
    'projects/**/*.md',
    'resources/**/*.md',
  ],
  {
    includeSrc: true,
    transform(raw): KnowledgeGraph {
      const pages = raw.filter((page) => {
        const rel = page.url
          .replace(/^\//, '')
          .replace(/\.html$/, '')
          .replace(/\/$/, '/index')
        return !EXCLUDE_RE.test(`${rel}.md`)
      })

      const nodes: GraphNode[] = []
      const idSet = new Set<string>()
      const directed = new Set<string>()

      for (const page of pages) {
        const id = normalizeArticleUrl(page.url)
        const fileName =
          path.basename(id) ||
          decodeURIComponent(
            page.url.split('/').filter(Boolean).pop()?.replace(/\.html$/, '') ||
              '未命名',
          )
        const title = String(
          page.frontmatter.title ?? titleFromSrc(page.src, fileName),
        )
        const category = id.split('/').filter(Boolean)[0] || 'other'

        nodes.push({ id, title, url: id, category })
        idSet.add(id)

        for (const target of extractOutgoing(page.src, id)) {
          directed.add(`${id}\0${target}`)
        }
      }

      // 只保留指向已知文章的边；互链合并为双向
      const edgeMap = new Map<string, GraphEdge>()
      for (const key of directed) {
        const [source, target] = key.split('\0') as [string, string]
        if (!idSet.has(target)) continue

        const reverse = `${target}\0${source}`
        const undirectedKey = [source, target].sort().join('\0')
        const existing = edgeMap.get(undirectedKey)

        if (existing) {
          if (directed.has(reverse) || existing.source !== source) {
            existing.bidirectional = true
          }
          continue
        }

        edgeMap.set(undirectedKey, {
          source,
          target,
          bidirectional: directed.has(reverse),
        })
      }

      return {
        nodes: nodes.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')),
        edges: [...edgeMap.values()],
      }
    },
  },
)
