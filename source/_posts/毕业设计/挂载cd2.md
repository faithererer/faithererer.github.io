---
title: 挂载cd2
mathjax: true
published: true
abbrlink: cab7ced6
date: 2025-01-13 00:00:00
tags: 
cover: https://img.loliapi.cn/i/pc/img115.webp
categories:
---
 


```shell
mkdir -p /opt/clouddrive2
mkdir -p /opt/clouddrive2/cloudmounts    # 用于存放云挂载数据
mkdir -p /opt/clouddrive2/config         # 用于存放配置文件
mkdir -p /opt/clouddrive2/media          # 可选，用于存放媒体文件
```


docker-compose.yml

```yaml
version: "2.1"
services:
  cloudnas:
    image: cloudnas/clouddrive2
    container_name: clouddrive2
    environment:
      - TZ=Asia/Shanghai
      - CLOUDDRIVE_HOME=/Config
    volumes:
      - /opt/clouddrive2/cloudmounts:/CloudNAS:shared        # 将云挂载目录挂载到容器
      - /opt/clouddrive2/config:/Config                      # 将配置文件目录挂载到容器
      - /opt/clouddrive2/media:/media:shared                 # 可选：将媒体目录挂载到容器
    devices:
      - /dev/fuse:/dev/fuse                                  # FUSE 支持，允许挂载云存储
    restart: unless-stopped
    pid: "host"
    privileged: true
    network_mode: "host"                                     # 使用宿主机网络模式

```

```
sudo docker run \ -itd \ --name bilive_docker \ -p 22333:2233 \ -v /opt/clouddrive2/cloudmounts/CloudDrive/115/records/哔哩哔哩:/app/Videos \  timerring/bilive:0.2.9
```