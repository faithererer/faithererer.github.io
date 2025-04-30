---
title: IPv6+域名访问局域网设备
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img288.webp'
published: true
abbrlink: e3da64b5
date: 2025-04-29 00:00:00
tags:
categories:
---

- 安装openwrt
## 安装ddns-go
软件包搜索:`luci-app-ddns-go`
![](软路由/assets/IPv6+域名访问局域网设备/PixPin_2025-03-23_20-37-08.png)

重新退出面板登录，进入ddns-go的面板:
![](软路由/assets/IPv6+域名访问局域网设备/PixPin_2025-03-23_20-38-33.png)

- 配置鉴权信息，确保ddns-go可以创建ipv6的解析记录:
![](软路由/assets/IPv6+域名访问局域网设备/PixPin_2025-03-23_20-44-34.png)

- 启用ipv6解析并添加自己想要解析的域名
![](软路由/assets/IPv6+域名访问局域网设备/PixPin_2025-03-23_20-47-04.png)

2409:8d3c:225:3b2:4adf:2dd0:a639:2b4a
2409:8d3c:225:3b2:bad4:bcff:febc

---
很遗憾，我的随身wifi+软路由方案，外网无法ping通内网，不明原因，暂搁置


 