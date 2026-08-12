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
      { text: 'Notes', link: '/notes/backend/nodejs/初始NodeJS' },
      { text: 'Map', link: '/map/' },
      { text: 'Timeline', link: '/timeline/' },
      { text: 'Resources', link: '/resources/english/song1' },
      { text: 'Thoughts', link: '/thoughts/movies/欢迎到龙餐馆' },
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
                { text: '初始Node.js', link: '/notes/backend/nodejs/初始NodeJS' },
                { text: 'Buffer', link: '/notes/backend/nodejs/Buffer' },
              ]
            },
            {
              text: '基础概念',
              collapsed: false,
              items: [
                { text: '计算机存储容量单位', link: '/notes/基础概念/计算机存储容量单位' },
                { text: '计算器基本组成', link: '/notes/基础概念/计算器基本组成' },
                { text: '进程和线程', link: '/notes/基础概念/进程和线程' },
              ]
            }
          ]
        }
      ],
      '/map/': [
        {
          text: 'Map',
          items: [
            { text: '知识图谱', link: '/map/' },
          ]
        }
      ],
      '/timeline/': [
        {
          text: 'Timeline',
          items: [
            { text: '时光轴', link: '/timeline/' },
            { text: '编辑热力图', link: '/timeline/heatmap' },
            { text: '文章分布', link: '/timeline/tags' },
          ]
        }
      ],
      '/resources/': [
        {
          text: 'Resources',
          items: [
            {
              text: '资源库',
              collapsed: false,
              items: [
                {
                  text: '英语',
                  collapsed: false,
                  items: [
                    { text: 'Do You Like Broccoli Ice Cream', link: '/resources/english/song1' },
                  ]
                },
              ]
            },
          ]
        }
      ],
      '/thoughts/': [
        {
          text: 'Thoughts',
          collapsed: false,
          items: [
            {
              text: '电影',
              collapsed: false,
              items: [
                { text: '欢迎到龙餐馆', link: '/thoughts/movies/欢迎到龙餐馆' },
              ]
            },
            {
              text: '阅读',
              collapsed: false,
              items: [
                { text: '小王子', link: '/thoughts/reading/小王子' },
              ]
            },
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
    ],

    lastUpdated: {
      text: '最后更新于',
    }
  }
})
