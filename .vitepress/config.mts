import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/quinn-lab/',
  title: "QuinnLab",
  description: "Quinn's personal website and blog",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Projects', link: '/projects/404' },
      { text: 'Notes', link: '/notes/backend/nodejs/01初始' },
      { text: 'Resources', link: '/resources/404' },
      { text: 'Thoughts', link: '/thoughts/404' },
      { text: 'About', link: '/about/Me' },
    ],

    // 按路径前缀切换侧边栏：点击不同 nav 进入对应目录后自动变化
    sidebar: {
      '/projects/': [
        {
          text: 'Projects',
          items: [
            { text: '项目介绍', link: '/projects/404' },
          ]
        }
      ],
      '/notes/': [
        {
          text: 'Backend',
          collapsed: false,
          items: [
            {
              text: 'Node.js',
              collapsed: false,
              items: [
                { text: '01 初始', link: '/notes/backend/nodejs/01初始' },
              ]
            }
          ]
        }
      ],
      '/resources/': [
        {
          text: 'Resources',
          items: [
            { text: '资源库', link: '/resources/404' },
          ]
        }
      ],
      '/thoughts/': [
        {
          text: 'Thoughts',
          items: [
            { text: '思考', link: '/thoughts/404' },
          ]
        }
      ],
      '/about/': [
        {
          text: 'About',
          items: [
            { text: '关于我', link: '/about/Me' },
          ]
        }
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yu-kun-2020' }
    ]
  }
})
