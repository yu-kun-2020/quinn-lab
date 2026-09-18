# URL

## 全称

Uniform Resource Locator 统一资源定位符

## 相关的概念

DNS - Domain Name System（域名系统）

把人容易记的域名，转换成计算机通信需要的IP地址。

DNS 就负责查询到输入浏览器的域名对应的IP地址。

```txt
www.baidu.com
      ↓
DNS(数据库) 查询
      ↓
IP 地址
      ↓
xxx.xxx.xxx.xxx
```

找到以后服务器以后，要建立TCP连接（通信的通道）

TCP建立连接的方式（3次握手）1.客户端发端SYN数据包表示请求连接（敲门） 2.服务器响应SYN和ACK数据包来表示同意建立连接（同意） 3.客户端再次发送ACK数据库表示成功连接

## URL构成

![URL2](/public/images/URL2.png)
