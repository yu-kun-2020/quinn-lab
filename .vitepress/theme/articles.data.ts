import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContentLoader, getGitTimestamp } from 'vitepress'

export interface ArticleMeta {
  title: string
  url: string
  /** 最后编辑时间（毫秒时间戳，优先取 git） */
  updatedAt: number
  /** 一级分类，如 notes / thoughts */
  category: string
}

declare const data: ArticleMeta[]
export { data }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const EXCLUDE_RE = /(^|\/)(404|readme|index)\.md$/i

function urlToMarkdownPath(url: string): string {
  const rel = url
    .replace(/^\//, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '/index')
  return path.join(root, `${rel}.md`)
}

function titleFromSrc(src: string | undefined, fallback: string): string {
  const fromHeading = src?.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return fromHeading || fallback
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
    async transform(raw): Promise<ArticleMeta[]> {
      const articles = await Promise.all(
        raw
          .filter((page) => {
            const rel = page.url
              .replace(/^\//, '')
              .replace(/\.html$/, '')
              .replace(/\/$/, '/index')
            return !EXCLUDE_RE.test(`${rel}.md`)
          })
          .map(async (page) => {
            const filePath = urlToMarkdownPath(page.url)
            const fileName =
              path.basename(filePath, '.md') ||
              decodeURIComponent(
                page.url.split('/').filter(Boolean).pop()?.replace(/\.html$/, '') ||
                  '未命名',
              )

            let updatedAt = 0
            if (fs.existsSync(filePath)) {
              try {
                updatedAt = await getGitTimestamp(filePath)
              } catch {
                updatedAt = 0
              }
              if (!updatedAt) {
                updatedAt = fs.statSync(filePath).mtimeMs
              }
            }

            const title = String(
              page.frontmatter.title ?? titleFromSrc(page.src, fileName),
            )
            const category = page.url.split('/').filter(Boolean)[0] || 'other'

            return {
              title,
              url: page.url,
              updatedAt,
              category,
            } satisfies ArticleMeta
          }),
      )

      return articles
        .filter((article) => article.updatedAt > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    },
  },
)
