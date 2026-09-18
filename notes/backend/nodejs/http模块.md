# http模块

前置：[HTTP](/notes/基础概念/http.md)、[端口](/notes/基础概念/端口.md)、[GET 和 POST](/notes/基础概念/GET和POST不同.md)

`node:http` 用来创建 HTTP 服务：接收浏览器发来的请求报文，再返回响应报文。

## 创建http服务端

```js
// 导入http模块
import http from 'node:http'

// 创建服务对象
const server = http.createServer((req, res) => {
  res.end('Hello Node.js')
})

// 让服务器监听3000端口号
server.listen(3000, () => {
  console.log('服务器启动：http://localhost:3000')
})
```

启动这个脚本，终端就会打印“服务器启动：http://localhost:3000”，打开浏览器 `http://localhost:3000` 这个地址，页面上就会出现 `Hello Node.js`

`createServer` 的回调参数：

- `req`：请求对象 IncomingMessage，里面是这次请求的信息
- `res`：响应对象 ServerResponse，用来往回写响应

## http服务的注意事项

1. 停止服务的方法 `ctrl + C`

2. 更新代码以后要重启服务。可以用 `node --watch 文件名.js`，改完代码会自动重启

3. 如果响应的内容是中文，需要设置响应头的 Content-Type 和字符编码，否则会出现乱码

  ```js
  import http from 'node:http'

  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('你好，Node.js!')
  })

  server.listen(3000, () => {
    console.log('服务器启动：http://localhost:3000')
  })
  ```

4. 如果返回的是 HTML，响应头设置为 `res.setHeader('Content-Type', 'text/html; charset=utf-8')`

5. http 的默认端口号是 80，https 的默认端口是 443

6. 如果端口号被占用，可以通过*资源监视器*找到占用端口号的程序，然后使用*任务管理器*关闭对应的程序

![资源监视器](/public/images/资源监视器.png)

## 浏览器查看HTTP报文

### 响应报文

在“标头”-“响应标头”里面查看响应头，如果要看“响应行”，需要点击“查看源代码”

在“响应”标签里面看“响应体”

### 请求报文

在“标头”-“请求标头”里面查看

GET 请求没有请求体

POST 请求有请求体，请求体在“载荷”Payload 里面查看

## 获取请求行和请求头

请求行里常见的三件事：方法、URL、HTTP 版本。请求头是一组键值对。

```js
import http from 'node:http'

const server = http.createServer((req, res) => {
  // 请求行
  console.log(req.method)      // GET、POST ...
  console.log(req.url)         // /api/user?id=1  路径 + 查询参数
  console.log(req.httpVersion) // 1.1

  // 请求头（全部小写）
  console.log(req.headers)
  console.log(req.headers.host)
  console.log(req.headers['user-agent'])
  console.log(req.headers['content-type'])

  res.end('ok')
})

server.listen(3000)
```

注意：

1. `req.url` 只有路径和查询字符串，没有协议和主机名。主机名在请求头 `host` 里
2. `req.headers` 的键全部是小写。带连字符的头（如 `content-type`、`user-agent`）要用方括号取值
3. GET 的参数在 URL 上，不是请求体。详见 [GET 和 POST](/notes/基础概念/GET和POST不同.md)

### 拆开路径和查询参数

`req.url` 经常长这样：`/api/user?id=1&name=quinn`

可以用内置的 `URL` 拆开。因为 `req.url` 不是完整地址，要自己补一个基地址：

```js
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  console.log(url.pathname)                 // /api/user
  console.log(url.search)                   // ?id=1&name=quinn
  console.log(url.searchParams.get('id'))   // 1
  console.log(url.searchParams.get('name')) // quinn

  res.end('ok')
})
```

## 获取请求体

`req` 是一个可读流。请求体可能分多次到达，所以要先收集 chunk，等 `end` 再拼起来。

```js
import http from 'node:http'

const server = http.createServer((req, res) => {
  const chunks = []

  req.on('data', (chunk) => {
    chunks.push(chunk)
  })

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString()
    console.log(body)

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('收到了')
  })
})

server.listen(3000)
```

常见请求体格式：

| Content-Type | 请求体长什么样 | 服务端怎么处理 |
| --- | --- | --- |
| `application/json` | `{"username":"quinn"}` | `JSON.parse(body)` |
| `application/x-www-form-urlencoded` | `username=quinn&age=18` | `URLSearchParams` |
| `text/plain` | 普通文本 | 直接当字符串用 |

JSON 示例：

```js
req.on('end', () => {
  const body = Buffer.concat(chunks).toString()
  const data = JSON.parse(body)
  console.log(data.username)
})
```

表单示例：

```js
req.on('end', () => {
  const body = Buffer.concat(chunks).toString()
  const form = new URLSearchParams(body)
  console.log(form.get('username'))
})
```

注意：

1. GET 通常没有请求体，不用读 `data`
2. `data` 可能触发 0 次、1 次或多次。没有请求体时，只会触发 `end`
3. `chunk` 一般是 [Buffer](/notes/backend/nodejs/Buffer.md)，所以最后用 `Buffer.concat` 再转字符串
4. 真实项目会限制请求体大小，避免把内存撑爆。这里先知道流程即可

## 写响应

响应报文也是三块：响应行、响应头、响应体。

```js
const server = http.createServer((req, res) => {
  // 响应行：状态码
  res.statusCode = 200

  // 响应头
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  // 响应体（end 写完就会结束这次响应）
  res.end(JSON.stringify({ message: '你好' }))
})
```

也可以一次写完：

```js
res.writeHead(200, {
  'Content-Type': 'text/html; charset=utf-8'
})
res.end('<h1>你好</h1>')
```

`res.write()` 可以分多次写响应体，最后必须 `res.end()`，否则浏览器会一直等。

常见状态码：`200` 成功、`404` 找不到、`400` 客户端参数有问题、`500` 服务器出错。

## 简单路由

根据方法和路径决定返回什么：

```js
import http from 'node:http'

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const { method } = req
  const { pathname } = url

  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (method === 'GET' && pathname === '/') {
    res.end(JSON.stringify({ message: '首页' }))
    return
  }

  if (method === 'GET' && pathname === '/user') {
    const id = url.searchParams.get('id')
    res.end(JSON.stringify({ id }))
    return
  }

  if (method === 'POST' && pathname === '/login') {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const data = JSON.parse(Buffer.concat(chunks).toString() || '{}')
      res.end(JSON.stringify({ username: data.username }))
    })
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ message: '找不到这个地址' }))
})

server.listen(3000, () => {
  console.log('服务器启动：http://localhost:3000')
})
```

原生 `http` 适合把请求/响应摸清楚。路径一多、中间件一多，后面会用 Express / Fastify 这类框架。
