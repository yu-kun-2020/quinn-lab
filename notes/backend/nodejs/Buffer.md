# Buffer

## 定义
形象：类似于Array的对象
本质：是一段固定长度的字节序列
中文名：缓冲区
用途：处理二进制数据

## 特点
1、大小固定，不能调整（一旦创建，大小固定）
2、每个元素是一个字节（byte）
3、Buffer性能好，可以直接操作计算机内存

## 前置知识
[单位](/notes/基础概念/计算机存储容量单位)

## 创建Buffer
### 1.alloc
![alloc创建](/public/images/buffer1.png)
用alloc方法创建的Buffer每一位都会归0，会初始化内存

### 2.allocUnsafe
allocUnsafe创建Buffer不初始化内存（快，但里面可能残留旧数据）

### 3.from
![from创建](/public/images/buffer2.png)
每一位都是16进制的表示，因为传入的是字符，对应的是Unicode编号，UTF-8编码。from里面传入的不仅可以是字符，也可以是任何可以转换成二进制的数据。

```text
字符
 ↓
编码
 ↓
byte
 ↓
Buffer
```

## Buffer与字符串的转换（默认采取UTF-8编码）
![Buffer转换成字符串](/public/images/buffer3.png)

## Buffer元素的读取和写入
```js
let val = Buffer.from('Hello')
val[0] = 85
console.log(val[0].toString(2)) //转换成二进制
```

### 1.溢出
8个二进制位，最大值只能是265，如果赋值超出265，会舍弃高位的数字
```js
let val = Buffer.from('Hello')
val[0] = 361 // 0001 0110 1001
```
则`val[0]`就会被赋值成`0110 1001`，转换成16进制

### 2.中文
UTF-8的中文，1个中文字符是3个字节
