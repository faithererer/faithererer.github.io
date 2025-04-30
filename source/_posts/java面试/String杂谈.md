---
title: 为什么String是线程安全的?
tags:
  - JavaSE
mathjax: true
cover: https://api.boxmoe.com/random.php?3
categories: Java
abbrlink: 5663
published: false
---
人们都说String是线程安全的，为什么呢？
今日探究一下。
# 线程安全
**定义**：
维基百科中，线程安全如下定义
> 线程安全是程序设计中的术语，指某个函数、函数库在多线程环境中被调用时，能够正确地处理多个线程之间的**公用变量**，使程序功能正确完成。

线程安全就是多个线程访问同一资源，线程间依照某种方式访问资源时，访问的结果总是能获取到正确的结果，运行得到正确得结果。
线程安全的关键是正确的访问共享变量。
