---
title: 部署基于docker部署 minio集群两节点
mathjax: true
abbrlink: 3c47b44b
date: 2025-01-13
tags: 
cover: https://img.loliapi.cn/i/pc/img608.webp
categories: 
published: false
---
服务器详细信息

| 主机  | ip              | 挂载目录      |
| --- | --------------- | --------- |
| 主机1 | 192.168.230.136 | /myminio1 |
| 主机2 | 192.168.230.135 | /myminio1 |
使用docker部署

```shell
rm -rf /myminio1/data

docker stop minio1
docker rm minio1
docker stop minio2
docker rm minio2
```

主机1：
```js
docker run -d --name minio1 \
  -p 9000:9000 \
  -p 9001:9001 \
  -v /myminio1/data:/data \
  -e MINIO_ROOT_USER=minio_root_user \
  -e MINIO_ROOT_PASSWORD=minio_root_password \
  -e MINIO_DISTRIBUTED_MODE_ENABLED=yes \
  -e MINIO_DISTRIBUTED_NODES="192.168.230.136:9000,192.168.230.135:9000" \
  minio/minio server /data --console-address ":9001"


```

主机2
```
docker run -d --name minio2 \
  -p 9000:9000 \
  -p 9001:9001 \
  -v /myminio1/data:/data \
  -e MINIO_ROOT_USER=minio_root_user \
  -e MINIO_ROOT_PASSWORD=minio_root_password \
  -e MINIO_DISTRIBUTED_MODE_ENABLED=yes \
  -e MINIO_DISTRIBUTED_NODES="192.168.230.136:9000,192.168.230.135:9000" \
  minio/minio server /data --console-address ":9001"


```

普通
```
docker run -d --name minio1 \
  -p 9000:9000 \
  -p 9001:9001 \
  -v /myminio1/data:/data \
  -e MINIO_ROOT_USER=minio_root_user \
  -e MINIO_ROOT_PASSWORD=minio_root_password \
  minio/minio server /data --console-address ":9001"


```


```
# 将宿主机的 9000 端口流量转发到容器的 9000 端口
sudo iptables -t nat -A PREROUTING -p tcp --dport 9000 -j DNAT --to-destination 192.168.231.136:9000
sudo iptables -A FORWARD -d 192.168.231.136 -p tcp --dport 9000 -j ACCEPT

# 将宿主机的 9001 端口流量转发到容器的 9001 端口
sudo iptables -t nat -A PREROUTING -p tcp --dport 9001 -j DNAT --to-destination 192.168.231.136:9001
sudo iptables -A FORWARD -d 192.168.231.136 -p tcp --dport 9001 -j ACCEPT

```