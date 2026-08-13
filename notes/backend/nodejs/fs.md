# fs 模块

## 前置知识

[模块系统](/notes/基础概念/JavaScript中的模块系统.md)

## 文件写入

1. 导入fs模块

CommonJS写法

```js
const fs = require('fs') 
```

ES Module写法

```js
import { writeFile } from 'node:fs/promises'
```

2. 使用writeFile方法

```js
try {
  await writeFile('./test.txt', 'Hello Node.js');
  console.log('写入成功');
} catch (error) {
  console.log('写入失败', error);
}
```

## 同步与异步

writeFile 是异步方法，不会阻塞 JavaScript 主线程。文件系统操作通常由 Node.js 通过 libuv 线程池处理，完成后再通知主线程继续处理结果。

writeFileSync 是同步方法，会阻塞当前 JavaScript 线程，直到文件写入完成后才继续执行后续代码。

## 文件追加写入

### 方式一 appendFile

```js
import { appendFile } from 'node:fs/promises'
try {
  await appendFile('./test.txt', ', I am Quinn.');
  console.log('写入成功');
} catch (error) {
  console.log('写入失败', error);
}
```

### 方式二 writeFile

```js
import { writeFile } from 'node:fs/promises'
try {
  await writeFile('./test.txt', 'Hello Node.js', { flag: 'a' });
  console.log('写入成功');
} catch (error) {
  console.log('写入失败', error);
}
```

> `writeFile` 默认使用 `flag: 'w'`，会覆盖原文件。
> 设置 `flag: 'a'` 后才会追加内容。
> 文件不存在时，通常会自动创建文件。

## 文件流式写入

```js
import { createWriteStream } from 'node:fs'

const ws = createWriteStream('./test.txt')

// 追加
// const ws = createWriteStream('./test.txt', { flag: 'a' })

ws.on('error', (error) => {
  console.error('写入失败', error)
})

ws.on('finish', () => {
  console.log('写入完成')
})

ws.write('1\r\n')
ws.write('2\r\n')
ws.end('3\r\n')
```

`end()` 会写入最后的数据并结束流，待缓冲区数据全部写入后触发 `finish`。如果要兼容不同操作系统的换行符，可使用 `node:os` 中的 `EOL`。

### 为什么需要流式写入？

打开文件是非常消耗资源的，流式写入可以减少打开文件的次数
流式写入适合大文件写入或者是高频次写入的场景，fileWrite适合低频次少内容的场景

## 文件写入场景

- 下载文件
- 安装软件
- 视频录入
- 程序日志，比如Git
- VSCODE编辑器写入保存


::: tip Tip
当需要持久化保存数据时，要想到文件写入
:::
