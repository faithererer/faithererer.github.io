---
title: Window常用命令
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img193.webp'
published: true
abbrlink: d817b1d6
date: 2025-04-29 00:00:00
tags:
categories:
---

## mklink - 节省c盘空间

```cmd
mklink /D "C:\Users\86136\AppData\Local\JetBrains\PyCharm2024.3" "D:\jetbrains\pycharm\local\PyCharm2024.3"
```


## 查看占用某进程的信息

```
Get-Process -Id 44580 | Format-List *
```
## 查找占用某端口的进程

```
netstat -ano | findstr :80

```



找不到的且仍然占用端口（**管理员**运行）:
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

## kill 特定 pid进程
```
taskkill /PID <PID> /F
```

## 删除node_moudles (powershell)
```
Remove-item -Force -Recurse node_modules
```


## nvm root
```
nvm root G:\nvm\nvm
```


