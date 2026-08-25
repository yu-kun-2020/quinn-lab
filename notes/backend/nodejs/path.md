# path

> 这个路径是什么？怎么拼？怎么拆？怎么判断？怎么转换？

## 把多个路径片段拼起来 join

```js
import path from "node:path";

const filePath = path.join("user", "documents", "test.txt");

console.log(filePath);
```

Windows 下:
`user\documents\test.txt`

Linux/macOS 下：
`user/documents/test.txt`

### 实例

```text
project/
├── src/
├── public/
└── images/
    └── logo.png
```

我想获取logo.png的绝对路径

```js
import path from "node:path";
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagePath = path.join(__dirname, 'images', 'logo.png');

console.log(imagePath);
```

## `path.resolve()` 找到文件绝对路径 ✨✨✨✨

> resolve() 最终会给你一个绝对路径。

```js
const filePath = path.resolve('images', 'logo.png');

console.log(filePath);
```

`D:\project\images\logo.png`

## `path.basename()` 获取文件名

```js
const filePath = '/home/user/project/test.txt';

console.log(path.basename(filePath));
```

`test.txt`

### 只想要文件名，不想要扩展名

```js
path.basename(filePath, '.png');
```

## `path.dirname()` —— 获取目录

```js
const filePath = '/home/user/project/test.txt';

console.log(path.dirname(filePath));
```

`/home/user/project`

## `path.extname()` —— 获取扩展名

```js
const filePath = '/home/user/project/test.txt';

console.log(path.extname(filePath));
```

`.txt`

## 其他方法

- `path.parse()` 一次拆开
- `path.isAbsolute()` 判断一个路径是不是绝对路径
- `path.relative()` 计算两个路径之间的相对路径
- `path.normalize()` 规范化路径

## 总览

```text
                 path
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
     拼路径      拆路径      判断/转换
       │          │          │
    join()      dirname()   isAbsolute()
    resolve()   basename()  relative()
                extname()   normalize()
                parse()     format()
```
