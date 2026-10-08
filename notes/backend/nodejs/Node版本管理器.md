# Node版本管理器

## 常用的

### 1.nvm(unix系统)、 nvm-windows(windows系统)

最老牌

### 2.fnm(Fast Node Manager) ✨✨✨✨✨

跨平台、高性能  ----  个人学习、快速

### 3.Volta ✨✨✨✨✨

工程化（强调项目级工具链固定） ---- 团队

## 为什么需要？

不同项目需要不同的 Node 版本，而系统里只能装一个全局 Node。

## 一些概念

```text
                    Node.js
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
       npm / pnpm                  fnm
          │                         │
          │                         └── 管 Node 版本
          │
          ├── 安装依赖
          │      ↓
          │  node_modules
          │
          └── 执行包里的命令
                 ↓
                npx
          （npm 体系下的命令执行工具）

例如：

npx vite
npx create-vue
npx eslint
```

如果使用pmpm，则会遇到`pnpm exec vite`或者`pnpm dlx create-vue`