# JavaScript中的模块系统

## 什么是模块Module？

一块相对独立、可以被其他代码使用的代码。

模块一个非常重要的价值：隔离

## 什么是模块系统Module System？

规定这些代码块如何创建、如何暴露、如何被其他代码使用的一套规则。

## JavaScript为什么需要模块系统？

一开始JS出现，一个文件的内容很简单，但是后来随着项目越来越复杂，代码全写在一起会变得很复杂，使用模块可以让代码结构更清晰、模块之间明确依赖、复用性和可维护性增强。

## JavaScript模块系统发展史

### 1995 JavaScript诞生

没有模块系统

### 1990s末～2000s 需求越来越多，功能越来越复杂

`<script>` 拆文件 -> 全局污染 -> 寻求方案

### 2009 Node.js诞生 ✨

Node.js的作者是Ryan Dahl，他后来又不太满意Node.js，又创建了Deno，并参与Bun(2022)的建设。

采用 CommonJS 模块系统

`require()`导入

`module.exports`导出

### 浏览器JavaScript的模块系统

社区各种方案 AMD、UMD、CommonJS

### 2015 ES6 / ES2015 ✨

JavaScript官方标准加入模块系统 ES Module（ESM）

`import`导入

`export`导出

Node.js逐渐支持ESM，对Node.js来说，CommonJS 和 ES Module并存，因为当时Node.js生态已经有很多工具了，都是用的CommonJS，所以也没有摒弃CommonJS。

## 文件名进行区分模块系统

`.mjs`说明是ESM

`.cjs`说明是CommonJS
