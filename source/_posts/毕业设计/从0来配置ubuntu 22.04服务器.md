---
title: 从0来配置ubuntu 22.04服务器
mathjax: true
published: false
abbrlink: b32df34d
date: 2025-01-10 00:00:00
tags:
cover:
categories:
---
# 需要完成的配置
- 更换软件源为国内
- 安装宝塔

# 更换软件源
[清华源](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/)(强制安全更新使用镜像)

```sh
# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-backports main restricted universe multiverse

# 以下安全更新软件源包含了官方源与镜像站配置，如有需要可自行修改注释切换
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-security main restricted universe multiverse
# deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-security main restricted universe multiverse

# 预发布软件源，不建议启用
# deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-proposed main restricted universe multiverse
# # deb-src https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ jammy-proposed main restricted universe multiverse
```



```sh
cd /etc/apt/
cp sources.list sources.list.bak
vim sources.list

```

生效
```sh
sudo apt - clean
sudo apt-get update
```


# 安装宝塔
[宝塔安装脚本地址](https://www.bt.cn/new/download.html)
```sh
url=https://download.bt.cn/install/install_lts.sh;if [ -f /usr/bin/curl ];then curl -sSO $url;else wget -O install_lts.sh $url;fi;bash install_lts.sh ed8484bec
```



# 安装docker

执行以下命令卸载所有冲突的软件包。
```
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt-get remove $pkg; done
```

 Docker 的 [一键脚本](https://mirrors.tuna.tsinghua.edu.cn/help/docker-ce/)
```sh
export DOWNLOAD_URL="https://mirrors.tuna.tsinghua.edu.cn/docker-ce"
# 如您使用 curl
curl -fsSL https://raw.githubusercontent.com/docker/docker-install/master/install.sh | sh
```

