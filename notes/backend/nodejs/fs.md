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

`end()` 会写入最后的数据并结束流，待缓冲区数据全部写入后触发 `finish`。

如果要兼容不同操作系统的[换行符](/notes/基础概念/换行符.md)，可使用 `node:os` 中的 `EOL`。

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

## 文件读取

### readFile 异步

```js
import { readFile } from 'node:fs/promises'
try {
  const res = await readFile('./test.txt'); //读的文件的路径
  console.log(res); //<Buffer 31 0d 0a 32 0d 0a 33 0d 0a>
  console.log(res.toString()); //1 2 3
} catch (error) {
  console.log('读取失败', error);
}
```

#### readFileSync 同步读取

```js
import { readFileSync } from 'node:fs'
const res = readFileSync('./test.txt'); //读的文件的路径
console.log(res); //<Buffer 31 0d 0a 32 0d 0a 33 0d 0a>
console.log(res.toString()); //1 2 3
```

## 文件读取的应用场景

- 电脑开机 操作系统载入内存
- 程序运行 软件载入内存
- 编辑器打开文件
- 查看图片
- 播放视频
- 播放音频
- Git查看日志
- 上传文件
- 查看聊天记录

## 文件流式读取 creatReadStream

不要一次性把整个文件搬进内存，而是像“喝水”一样，一点一点地读取。

处理大文件、网络请求、视频、图片、日志等数据，内存有限，但数据可能非常大，就必须要用creatReadStream，可以提升效率。

## 例子

```js
import { createReadStream } from 'node:fs';

const stream = createReadStream('./test.txt');

stream.on('data', (chunk) => {
  console.log(chunk.length);
});

// 可选事件
stream.on('end', () => {
  console.log('读取完成');
});
```

> Node.js 会控制 chunk 大小，但不保证每次一样，前面的 chunk 可能都是 64KB，最后一个因为文件剩余的数据不足 64KB，所以更小。但不要把 chunk 理解成“永远固定 64KB”。

### 可以自己设置读取大小

```js
const stream = createReadStream('./test.txt', {
  highWaterMark: 1024 //1024 bytes = 1KB
}); 
```

## 复制文件

取出文件内容，写入另一个文件

### 普通文件，优先`CopyFile`

```js

import { copyFile } from 'node:fs/promises';

await copyFile('./a.txt', './b.txt');

```

### 普通小文件，需要自己处理内容 `readFile` + `writeFile`

```js
import { readFile, writeFile } from 'node:fs/promises';

const data = await readFile('./a.mp4');
await writeFile('./b.mp4', data);
```

### 大文件 / 需要控制读取过程 Stream (需要进行数据处理)

- 一边读取一边处理
- 显示复制进度
- 上传的时候同时处理
- 对数据进行转换
- 控制内存占用

```js
import { createReadStream, createWriteStream } from 'node:fs';

const readStream = createReadStream('./a.mp4');
const writeStream = createWriteStream('./b.mp4');

readStream.pipe(writeStream);
```

```text
a.mp4
  ↓
[一小块]
  ↓
[一小块]
  ↓
[一小块]
  ↓
[一小块]
  ↓
b.mp4
```

> Stream不用把整个文件放进内存，可以边读边处理。

## 复制目录

```js
import { cp } from 'node:fs/promises';

await cp('./source', './target', {
  recursive: true
});
```

## 查看文件大小 stat

```js
import { stat } from 'node:fs/promises';

const info = await stat('./test.txt');

console.log(info.size);
```

单位是Bytye，字节。

stat查看的不止是大小，其实就是文件的元数据metadata

```js
const info = await stat('./test.txt');

console.log(info.size);       // 文件大小，Byte
console.log(info.isFile());   // 是否是文件
console.log(info.isDirectory()); // 是否是目录
console.log(info.birthtime);  // 创建时间
console.log(info.mtime);      // 最后修改时间
```

## 文件重命名与移动 fs.rename()

### 重命名(只改名字，不改路径)

```js
import { rename } from 'node:fs/promises';
await rename('./old.txt', './new.txt');
```

### 文件移动(只改路径，不改文件名)

```js
import { rename } from 'node:fs/promises';
await rename('./old.txt', './images/old.txt');
```

### 重命名+移动(同时改路径和文件名)

```js
import { rename } from 'node:fs/promises';
await rename('./old.txt', './images/new.txt');
```

## 文件删除

### unlink

```js
import { unlink } from 'node:fs/promises';
await unlink('./old.txt');
```

> unlink只能删除文件

### rm

```js
import { rm } from 'node:fs/promises';

await rm('./test.txt');

await rm('./images', { recursive: true });
```

> rm可以删除文件、也可以删除目录 

如果希望目标不存在时也不要报错

```js
import { rm } from 'node:fs/promises';

await rm('./images', {
  recursive: true,
  force: true
});
```

> recursive是递归的意思

## 文件夹和文件相关的操作对比

```text
文件：
读取 → readFile
写入 → writeFile
复制 → copyFile
移动 → rename
删除 → unlink / rm

目录：
创建 → mkdir
读取 → readdir
复制 → cp
移动 → rename
删除 → rm
```

## 相对路径不太稳定（用绝对路径）

`__dirname` 所在文件的所在目录绝对路径，创建文件或者目录的时候，可以用这个路径去拼接，形成绝对路径

不过现代 ES Module 中通常没有直接的 __dirname，会用 import.meta.url 配合 fileURLToPath()。