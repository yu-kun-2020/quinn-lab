# Cookie等身份凭证

![认证信息](/public/images/认证信息.png)

## 思维地图

```text
用户登录
   ↓
身份认证 Authentication
   ↓
服务器确认：你是谁？
   ↓
────────────────────────────
Cookie
Session
Token / JWT
OAuth
SSO
Refresh Token
Access Token
────────────────────────────
   ↓
权限控制 Authorization
   ↓
你可以做什么？
```

## 基础认知

### Cookie

HTTP服务器发送到客户端浏览器并保存在本地的一小块数据

cookie是保存在**浏览器端**的一小段数据(key,value键值对)
cookie是按照**域名**(比如wwww.baidu.com)划分保存的

用途：浏览器向服务器发送请求的时候，当前域名下的cookie会自动设置到请求头传递给服务器

cookie是不共享的，如果你在本地用不用的浏览器打开这个网站，一个浏览器的这个网站登录了，另一个也不会自动登录

cookie的生存时间：不关闭浏览器，就会一直存在；关闭浏览器，就会销毁。后端默认设置。
但是如果后端设置了具体的生命周期`res.cookie('name','value', {maxAge: 60000})`maxAge的单位是毫秒，就按照后台给的时间进行销毁，就算关闭浏览器还是不销毁。

我自己的理解：Cookie是一个机制，你发送一个请求，客户端那边接收以后设置Cookie，一些键值对数据，就会通过这个请求告诉浏览器你要保存这些数据，用户不需要自己去接收，浏览器收到通知会自动保存Cookie里面的数据，等下次请求的时候，就自动带上这些Cookie里面的符合条件的数据。

### Session

session是一段保存在**服务器端**的数据

### Token

前后端分离常见身份凭证

### JWT（JSON Web Token）

Token 的一种具体格式
[JWT](/notes/基础概念/JWT.md)

### Access Token

用来访问 API，可以用JWT

### Refresh Token

用来刷新 Access Token，用随机字符串就可以

### OAuth 2.0

第三方登录，例如微信、Google 登录
