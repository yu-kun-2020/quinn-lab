# RESTful API

## 本意

按照 REST 这套设计思想来设计的 API。本质上还是 HTTP API，只是接口设计得比较“规范”。

## 具体例子

URL 是名词，HTTP Method 是动作，相应状态码要跟资源的结果保持统一。

```text
GET     /transactions       查询所有账单记录
GET     /transactions/123   查询单条账单记录
POST    /transactions       新增账单
PUT     /transactions/123   修改账单
DELETE  /transactions/123   删除账单
```

## 起源

2000年一个博士的论文 