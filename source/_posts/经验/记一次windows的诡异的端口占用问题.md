---
title: 解决windows的诡异的端口占用问题
mathjax: true
abbrlink: 3c47b44b
date: 2025-02-23 00:00:00
tags:
cover:
publish: true
categories:
---
在某天如往常一样我运行了我的nacos，发现报错:
```cmd
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'grpcServerThreadPoolMonitor': Injection of resource dependencies failed; nested exception is org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'grpcSdkServer': Invocation of init method failed; nested exception is java.io.IOException: Failed to bind to address 0.0.0.0/0.0.0.0:9848
```

心想不就是占用了端口嘛，把对应进程kill掉不就行了?
于是执行
```cmd
netstat -ano | findstr "9848"
```
发现没有进程占用，我有使用管理员运行也不行，ps运行也不行。
然后我又搭建了一个vue应用监听到这个端口发现:
```shell
15:49:55 [vite] vite.config.ts changed, restarting server...
Error: listen EACCES: permission denied 0.0.0.0:9848
```
我以为是win的命令有问题，我又使用了微软的tcpview可视化查找，结果仍然没有发现9848这个端口。
此时我急了，问了各种各样的ai，最后只有claude sonnet给了我答案:
 
**端口被系统保留了**
 
执行:
```cmd
netsh interface ipv4 show excludedportrange protocol=tcp
```
结果:
```
C:\Windows\system32>netsh interface ipv4 show excludedportrange protocol=tcp

协议 tcp 端口排除范围

开始端口    结束端口
----------    --------
      5357        5357
      9751        9850
     10100       10199
     10200       10299
     10424       10523
     10524       10623
     10624       10723
     10724       10823
     10853       10952
     14588       14687
     50000       50059     *
     50080       50080
     50443       50443

* - 管理的端口排除。


C:\Windows\system32>
```
这些端口好像都不是什么重要的系统保留端口，留着是隐患:

```
# 0. 先停止 WinNAT 服务
net stop winnat
# 1. 停止 HNS 服务
net stop hns

# 2. 重置 IPv4 配置
netsh int ipv4 reset

# 3. 重启服务
net start hns
net start winnat
```

再次查看:
```shell
C:\Windows\system32>netsh interface ipv4 show excludedportrange protocol=tcp

协议 tcp 端口排除范围

开始端口    结束端口
----------    --------
      5357        5357
     10420       10519
     10520       10619
     10620       10719
     10720       10819
     10820       10919
     10987       11086
     11087       11186
     11187       11286
     11287       11386
     50000       50059     *
     50080       50080
     50443       50443

* - 管理的端口排除。
```
发现9848已经成功释放，这些端口没有释放可能确实有用。