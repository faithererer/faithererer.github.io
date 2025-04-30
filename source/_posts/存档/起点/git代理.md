---
title: 给Git添加代理
tags:
  - git
mathjax: true
cover: 'https://vip1.loli.io/2022/05/12/Z746KJUiaulVYsj.jpg'
abbrlink: 40467
date: 2023-06-04 22:00:02
---


```shell
# git config --global 协议.proxy 协议://ip地址:端口号
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy

```

```shell
#只对github.com
git config --global http.https://github.com.proxy http://127.0.0.1:7890
git config --global http.https://github.com.proxy socks5://127.0.0.1:7891

#取消代理
git config --global --unset http.https://github.com.proxy

```


```shell
git config --global --get http.proxy
git config --global --get https.proxy
```

