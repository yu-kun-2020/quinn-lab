# JWT

## 全称

JSON Web Token，是一种把用户身份等信息放入Token，并通过数字签名保证内容未被篡改的Token格式。JWT是当前最流行的跨域认证解决方案，JWT使token的生成和校验更加规范。

## 本质

一个由两个`·`连接的字符串
一共由3个部分组成，分别是`Header·Payload·Signature`

### Header

这个 JWT 使用什么方式生成/验证？Header里面保存的是JWT的元信息

```js
{
  "alg": "HS256",
  "typ": "JWT"
}
```

其中`alg`是指算法，表示签名使用什么算法；`typ`表示`token`的类型是`JWT`

### Payload

Payload是JWT携带的数据

```json
{
  "userId": 10001,
  "username": "quinn",
  "role": "admin",
  "exp": 1790000000
}
```

你可以在里面放入“用户ID”、“用户名”、“角色”、“Token签发时间”、“Token过期时间”等，但是这些信息都不是加密的，它只是经过Base64URL编码，因此不要把“密码”、“银行卡密码”、“身份证敏感信息”等放进 Payload。

### Signature

服务器给 JWT 盖的一个“防伪印章”

## 如何生成？（以Node.js为例）

1.安装`jsonwebtoken`包
`npm i jsonwebtoken`

2.创建

```js
const jwt = require('jsonwebtoken')
//创建token
const token = jwt.sign(
  { userId: 1001, username: 'quinn' },
  'my-secret-key',
  { expiresIn: '2h' } //生命周期，token有效期
)
```

sign方法的三个参数分别是，参数1-数据，参数2-加密字符串，参数3-配置对象

3.校验

```js
jwt.verify(token, 'my-secret-key', (err,data)=>{
  if(err){
    console.log(err,"校验失败")
    return
  }

  console.log(data)
})

```

## 登录体系

