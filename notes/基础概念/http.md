# HTTP ✨✨✨✨✨

## HTTP是什么？

Hypertext Transfer Protocol 超文本传输协议

什么是协议？协议是“双方”必须遵守的一组“约定”

那HTTP的“双方”是什么？浏览器和服务器

浏览器（客户端）向服务器发送信息的过程称为请求（Request），发送的数据称为请求报文（Request Message）。服务器接收到请求并进行处理后，会向浏览器返回结果，这个过程称为响应（Response），返回的数据称为响应报文（Response Message）

## HTTP报文

### 请求报文

![http请求体](/public/images/http请求体.png)

#### 请求行

##### 请求方法

GET POST PUT DELETE...

##### URL

![URL](/public/images/URL.png)

[URL](/notes/基础概念/URL.md)

URL全称：Uniform Resource Locator

中文名：统一资源定位符

本质：一个字符串

功能：定位服务器上的资源

> 当端口号时协议的默认端口号就可以省略。使用的HTTP，默认端口号为80；使用HTTPS，默认端口号为443。

##### HTTP版本号

| 版本 | 年份 | 特征 | 使用状态 |
| --- | --- | --- | --- |
| 1 | 1996 | 引入 Header、状态码、Content-Type 等 | 基本废弃 |
| 1.1 | 1997 | 持久连接、Host、缓存、分块传输 等 | 大量存在✨ |
| 2 | 2015 | 二进制帧、多路复用、Header 压缩、Server Push | 现代 Web 主力之一 |
| 3 | 2015 | 基于 QUIC + UDP，解决 TCP 层面的队头阻塞等问题 | 现代 Web 的新一代协议 |

::: tip
HTTPS = HTTP + TLS，其中TLS（Transport Layer Security传输层安全协议） 是“怎么把通信保护起来”的安全协议，最初使用的是SSL（Secure Sockets Layer安全套接字层）
:::

#### 请求头

是一组键值对

```http
Host: example.com //我要访问哪个主机
User-Agent: Mozilla/5.0 //我是谁
Accept: text/html //我能接受什么格式
Accept-Language: zh-CN //我的语言偏好
Accept-Encoding: gzip, deflate, br //我支持什么压缩格式
Connection: keep-alive
Cookie: sessionId=123456
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json //我的请求体是什么格式
```

请求头遇到一个空行，就结束了。

> GET请求，`/api/users?page=1&limit=10`，中的`?page=1&limit=10`叫做Query String请求参数，不是请求体

#### 请求体(可有可无)

格式灵活

### 响应报文

```text
HTTP 响应报文
│
├── 响应行（Status Line）
│
├── 响应头（Response Headers）
│
├── 空行
│
└── 响应体（Response Body，可选）
```

#### 响应行

`HTTP/1.1 200 OK`，HTTP版本 + 状态码 + 状态描述

##### 状态码

- 1XX 信息性响应

- 2XX 请求成功

- 3XX 重定向

- 4XX 客户端错误

  401你没有登录 / 身份认证失败；
  403你已经知道是谁，但你没有权限

- 5XX 服务器端错误

#### 响应头

```http
Content-Type: application/json ← 返回 JSON
Content-Length: 58             ← 有多少字节
Content-Encoding: gzip         ← 压缩方式
Cache-Control: no-cache        ← 缓存规则
Set-Cookie: ...                ← 保存 Cookie
```

#### 响应体

HTML、CSS、JavaScript、JSON、图片、视频...

::: tip
为什么需要Cookie、Session、Token / JWT、OAuth、SSO、Refresh Token、Access Token？
因为HTTP本身是*无状态*的，我们需要告诉服务器我们是谁
:::
