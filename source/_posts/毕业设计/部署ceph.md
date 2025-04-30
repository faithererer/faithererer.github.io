---
title: 部署ceph
mathjax: true
published: false
abbrlink: 3c47b44b
date: 2024-12-20 00:00:00
tags: 
cover: 
categories:
---
## host

对应关系
m 192.168.230.134
w1 192.168.230.133
w2 192.168.230.135
```bash
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
sed -i 's#SELINUX=enforcing#SELINUX=disabled#g' /etc/sysconfig/selinux
cat >> /etc/hosts <<EOF
192.168.230.134 master
192.168.230.133 worker1
192.168.230.135 worker2
EOF
```


```
hostnamectl set-hostname YOURNEME

```
## 配置镜像源
```
[zjc@localhost ~]$ dnf search release-ceph
CentOS Linux 8 - AppStream                                                         0.0  B/s |   0  B     00:00    
Errors during downloading metadata for repository 'appstream':
  - Curl error (6): Couldn't resolve host name for http://mirrorlist.centos.org/?release=8&arch=x86_64&repo=AppStream&infra=stock [Could not resolve host: mirrorlist.centos.org]
Error: Failed to download metadata for repo 'appstream': Cannot prepare internal mirrorlist: Curl error (6): Couldn't resolve host name for http://mirrorlist.centos.org/?release=8&arch=x86_64&repo=AppStream&infra=stock [Could not resolve host: mirrorlist.centos.org]
```
需要更换镜像源
`/etc/yum.repos.d/CentOS-Base.repo`
执行
`curl -o /etc/yum.repos.d/CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-8.repo`
然后执行
```repo
mkdir /root/yum_repos_backup

mv /etc/yum.repos.d/CentOS-Linux-AppStream.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-BaseOS.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-ContinuousRelease.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Debuginfo.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Devel.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Extras.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-FastTrack.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-HighAvailability.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Media.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Plus.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-PowerTools.repo /root/yum_repos_backup/
mv /etc/yum.repos.d/CentOS-Linux-Sources.repo /root/yum_repos_backup/



```


之后执行
```shell
yum clean all
yum makecache
```

## 安装
```
dnf search release-ceph
dnf install --assumeyes centos-release-ceph-pacific
dnf install --assumeyes cephadm
```

如果出错,修改下面内容然后再次执行
```
# CentOS-Ceph-Pacific.repo
# 
# Please see https://wiki.centos.org/SpecialInterestGroup/Storage for more
# information

[centos-ceph-pacific]
name=CentOS-$releasever - Ceph Pacific
#mirrorlist=http://mirrorlist.centos.org/?release=$releasever&arch=$basearch&repo=storage-ceph-pacific
#baseurl=http://mirror.centos.org/$contentdir/$releasever/storage/$basearch/ceph-pacific/
baseurl=https://mirrors.aliyun.com/centos/8/storage/$basearch/ceph-pacific/
gpgcheck=1
enabled=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-SIG-Storage

[centos-ceph-pacific-test]
name=CentOS-$releasever - Ceph Pacific Testing
baseurl=https://buildlogs.centos.org/centos/$releasever/storage/$basearch/ceph-pacific/
gpgcheck=0
enabled=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-SIG-Storage

[centos-ceph-pacific-source]
name=CentOS-$releasever - Ceph Pacific Source
baseurl=http://vault.centos.org/$contentdir/$releasever/storage/Source/ceph-pacific/
gpgcheck=1
enabled=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-SIG-Storage
```

### docker与其他环境（所有机器）
配置docker镜像
```bash
vim /etc/yum.repos.d/CentOS-Base.repo
```

# 创建目录
sudo mkdir -p /etc/docker

# 写入配置文件
sudo tee /etc/docker/daemon.json <<-'EOF'
{
    "registry-mirrors": [
    	"https://docker.unsee.tech",
        "https://dockerpull.org",
        "https://docker.1panel.live",
        "https://dockerhub.icu"
    ]
}
EOF

# 重启docker服务
sudo systemctl daemon-reload && sudo systemctl restart docker



```
[ceph]
name=ceph
baseurl=http://mirrors.aliyun.com/ceph/rpm-pacific/el8/x86_64/
gpgcheck=0
priority =1
[ceph-noarch]
name=cephnoarch
baseurl=http://mirrors.aliyun.com/ceph/rpm-pacific/el8/noarch/
gpgcheck=0
priority =1
[ceph-source]
name=Ceph source packages
baseurl=http://mirrors.aliyun.com/ceph/rpm-pacific/el8/SRPMS
gpgcheck=0
priority=1


[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/$basearch/stable/
enabled=1
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-stable-debuginfo]
name=Docker CE Stable - Debuginfo $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/debug-$basearch/stable/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-stable-source]
name=Docker CE Stable - Sources
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/source/stable/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-test]
name=Docker CE Test - $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/$basearch/test/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-test-debuginfo]
name=Docker CE Test - Debuginfo $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/debug-$basearch/test/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-test-source]
name=Docker CE Test - Sources
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/source/test/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-nightly]
name=Docker CE Nightly - $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/$basearch/nightly/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-nightly-debuginfo]
name=Docker CE Nightly - Debuginfo $basearch
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/debug-$basearch/nightly/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg

[docker-ce-nightly-source]
name=Docker CE Nightly - Sources
baseurl=https://mirrors.aliyun.com/docker-ce/linux/centos/$releasever/source/nightly/
enabled=0
gpgcheck=1
gpgkey=https://mirrors.aliyun.com/docker-ce/linux/centos/gpg
```

```bash
yum install -y yum-utils
```


```bash
yum install -y docker-ce
```

```bash
systemctl start docker
systemctl enable docker
```

```
yum install -y python3  lvm2

```
时间同步
```bash
yum install -y chrony
systemctl start chronyd
systemctl enable chronyd
```
## mon
```
cephadm bootstrap --mon-ip *<mon-ip>*
```

此命令将：

- 在本地主机上为新集群创建一个监视器和一个管理器守护进程。
    
- 为 Ceph 集群生成新的 SSH 密钥并将其添加到 root 用户的`/root/.ssh/authorized_keys`文件中。
    
- 将公钥的副本写入`/etc/ceph/ceph.pub`。
    
- 向 写入一个最小配置文件`/etc/ceph/ceph.conf`。此文件是与 Ceph 守护进程通信所必需的。
    
- `client.admin`将管理（特权！）密钥的副本写入`/etc/ceph/ceph.client.admin.keyring`。
    
- 将标签添加到引导主机。默认情况下，任何具有此标签的主机也将获得和 的 `_admin`副本。`/etc/ceph/ceph.conf``/etc/ceph/ceph.client.admin.keyring`


5、增加节点  
首先进入ceph shell（ceph01上）

```bash
cephadm  shell  ##会进入ceph的shell界面下

Inferring fsid 69e2f148-7005-11ee-8438-00505684afef
Using recent ceph image quay.io/ceph/ceph@sha256:2d92fe9c95e31bba4d9482194544bc3e78cae6c658bad219365203064c3e46e3
```

Copy

生成ssh密钥对儿

```bash
[ceph: root@ceph1 /]# ceph cephadm get-pub-key > ~/ceph.pub
```

Copy

配置到另外两台机器免密登录

```bash
[ceph: root@ceph1 /]# ssh-copy-id -f -i ~/ceph.pub root@ceph02
[ceph: root@ceph1 /]# ssh-copy-id -f -i ~/ceph.pub root@ceph03
```


```
version: '3.8'

services:
  app:
    image: ihmily/douyin-live-recorder:latest
    environment:
      - TERM=xterm-256color
    tty: true
    stdin_open: true
    #build: .
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
      - ./backup_config:/app/backup_config
      - ./downloads:/app/downloads
    restart: always
```

https://cloud.baidu.com/doc/BCC/s/nkg8s52bt