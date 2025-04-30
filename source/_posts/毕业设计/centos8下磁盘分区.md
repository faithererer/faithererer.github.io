---
title: centos8下磁盘分区
mathjax: true
published: true
abbrlink: 5592a65e
date: 2024-12-20 00:00:00
tags: 
cover: https://img.loliapi.cn/i/pc/img54.webp
categories:
---
## 查看磁盘信息
```shell
lsblk
```

```shell
[zjc@worker2 ~]$ lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sr0          11:0    1 1024M  0 rom  
nvme0n1     259:0    0   15G  0 disk 
├─nvme0n1p1 259:1    0  300M  0 part /boot
├─nvme0n1p2 259:2    0  1.5G  0 part [SWAP]
└─nvme0n1p3 259:3    0 13.2G  0 part /
nvme0n2     259:4    0    1G  0 disk 
```


查看占用
```shell
[root@localhost zjc]# df -h
Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        374M     0  374M   0% /dev
tmpfs           391M     0  391M   0% /dev/shm
tmpfs           391M  6.4M  385M   2% /run
tmpfs           391M     0  391M   0% /sys/fs/cgroup
/dev/nvme0n1p3   18G  4.8G   13G  27% /
/dev/nvme0n1p1  295M  193M  103M  66% /boot
tmpfs            79M   36K   79M   1% /run/user/1000
```

## 使用fdisk
挂载到/myminio1
```shell
	mkdir /myminio1
```

```shell
[root@worker2 zjc]# lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sr0          11:0    1 1024M  0 rom  
nvme0n1     259:0    0   15G  0 disk 
├─nvme0n1p1 259:1    0  300M  0 part /boot
├─nvme0n1p2 259:2    0  1.5G  0 part [SWAP]
└─nvme0n1p3 259:3    0 13.2G  0 part /
nvme0n2     259:4    0    1G  0 disk 
[root@worker2 zjc]# mkdir /myminio1
[root@worker2 zjc]# fdisk /dev/nvme0n2

Welcome to fdisk (util-linux 2.32.1).
Changes will remain in memory only, until you decide to write them.
Be careful before using the write command.

Device does not contain a recognized partition table.
Created a new DOS disklabel with disk identifier 0x21103257.

Command (m for help): n
Partition type
   p   primary (0 primary, 0 extended, 4 free)
   e   extended (container for logical partitions)
Select (default p): p
Partition number (1-4, default 1): 
First sector (2048-2097151, default 2048): 
Last sector, +sectors or +size{K,M,G,T,P} (2048-2097151, default 2097151): 

Created a new partition 1 of type 'Linux' and of size 1023 MiB.

Command (m for help): w
The partition table has been altered.
Calling ioctl() to re-read partition table.
Syncing disks.

[root@worker2 zjc]# 
```

结果:
```shell
[root@worker2 zjc]# lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sr0          11:0    1 1024M  0 rom  
nvme0n1     259:0    0   15G  0 disk 
├─nvme0n1p1 259:1    0  300M  0 part /boot
├─nvme0n1p2 259:2    0  1.5G  0 part [SWAP]
└─nvme0n1p3 259:3    0 13.2G  0 part /
nvme0n2     259:4    0    1G  0 disk 
└─nvme0n2p1 259:5    0 1023M  0 part 
```

## 格式化为 XFS 文件系统与善后

首先，确保你已经为 `/dev/nvme0n2` 创建了分区（你已经完成了这一步）。接下来，我们将使用 `mkfs.xfs` 命令将 `/dev/nvme0n2p1` 分区格式化为 XFS 文件系统。

运行以下命令：

```shell
mkfs.xfs /dev/nvme0n2p1
```

该命令会将 `/dev/nvme0n2p1` 格式化为 XFS 文件系统。

### 2. 挂载分区到 `/myminio1`

格式化完成后，你可以将该分区挂载到 `/myminio1` 目录：


```bash
mount /dev/nvme0n2p1 /myminio1
```
### 3. 确认挂载

你可以使用以下命令来确认分区是否成功挂载到 `/myminio1`：

```shell
df -h
```
或使用 `lsblk`：
### 4. 配置开机自动挂载（可选）

如果你希望在每次系统启动时自动挂载该分区，可以编辑 `/etc/fstab` 文件。在 `/etc/fstab` 中添加一行类似下面的内容：
```shell
/dev/nvme0n2p1  /myminio1  xfs  defaults  0  0
```

然后保存文件并退出。接下来，运行以下命令来检查 `/etc/fstab` 配置是否正确：

```bash
mount -a
```

如果没有错误信息，表示 `/etc/fstab` 配置已经正确，系统会在每次启动时自动挂载该分区。



## 重新格式化

删除分区
```
umount /dev/nvme0n2p1

```


