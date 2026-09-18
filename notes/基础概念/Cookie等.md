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

浏览器如何保存和自动携带数据

### Session

服务端如何保存用户状态

### Token

前后端分离常见身份凭证

### JWT（JSON Web Token）

Token 的一种具体格式

### Access Token

用来访问 API

### Refresh Token

用来刷新 Access Token

### OAuth 2.0

第三方登录，例如微信、Google 登录
