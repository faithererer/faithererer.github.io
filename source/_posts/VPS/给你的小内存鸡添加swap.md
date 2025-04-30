---
title: 给你的小内存鸡添加swap
tags:
  - Linux
  - VPS
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img642.webp'
published: true
abbrlink: 9d2f3d05
date: 2025-04-29 00:00:00
categories:
---
 
 
## Linux Swap 交换空间详解

在 Linux 系统中，**Swap 交换空间**是一种虚拟内存技术，用于在物理内存不足时提供额外的内存支持。本文将详细介绍 Swap 的作用、配置方法以及注意事项。

---

## 什么是 Swap？

**Swap** 是 Linux 系统中的一种虚拟内存机制。当物理内存（RAM）不足时，系统会将不活跃的内存页移到硬盘上的 Swap 空间中，从而释放物理内存供其他进程使用。

### **Swap 的作用**
1. **防止内存不足导致系统崩溃**：当物理内存耗尽时，Swap 提供了额外的缓冲。
2. **支持内存密集型任务**：如运行虚拟机、大型数据库或编译大型项目。
3. **性能保障**：虽然 Swap 的性能远低于物理内存，但在资源紧张时，它是一个重要的补充。

---

## 配置 Swap 空间

以下是创建和配置 Swap 空间的完整步骤：

### **1. 查看当前 Swap 配置**
运行以下命令查看系统中已启用的 Swap 空间：
```bash
sudo swapon --show
````

输出示例：

```javascript
NAME      TYPE      SIZE   USED   PRIO
/swapfile file      2G     0B     -2
```

如果没有任何输出，说明当前系统没有启用 Swap。

---

### **2. 创建 Swap 文件**

使用 `fallocate` 命令创建一个指定大小的 Swap 文件。例如，创建一个 2GB 的 Swap 文件：

```bash
sudo fallocate -l 2G /swapfile
```

- `-l 2G`：指定文件大小为 2GB。
- `/swapfile`：Swap 文件的路径。

---

### **3. 设置文件权限**

为了安全性，确保只有 root 用户可以访问该文件：

```bash
sudo chmod 600 /swapfile
```

这会将文件权限设置为仅允许文件拥有者（root）读写。

---

### **4. 格式化为 Swap 空间**

将文件格式化为 Swap 空间，使其可以被系统识别：


```bash
sudo mkswap /swapfile
```

输出示例：


```javascript
Setting up swapspace version 1, size = 2 GiB (2147483648 bytes)
no label, UUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### **5. 启用 Swap 文件**

启用刚创建的 Swap 文件：


```bash
sudo swapon /swapfile
```

此时，系统会开始使用该文件作为 Swap 空间。可以再次运行 `sudo swapon --show` 查看是否生效。

---

### **6. 固化配置（重启后自动启用）**

为了确保 Swap 文件在系统重启后仍然生效，需要将其配置写入 `/etc/fstab` 文件：


```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

- `/swapfile`：Swap 文件的路径。
- `none`：表示没有挂载点。
- `swap`：文件系统类型。
- `sw`：挂载选项，表示启用 Swap。
- `0 0`：表示不需要 `dump` 和 `fsck` 检查。

---

## 注意事项

1. **Swap 文件会占用磁盘空间**：
    - 创建的 Swap 文件会在磁盘上占用与其大小相等的空间。例如，2GB 的 Swap 文件会占用 2GB 的硬盘空间。
    - 可以使用以下命令查看 Swap 文件的大小和实际占用空间：
        ```bash
        ls -lh /swapfile
        du -h /swapfile
        ```
        
2. **Swap 空间大小建议**：
    - 对于大多数系统，Swap 空间的大小建议为物理内存的 1-2 倍。
    - 如果物理内存较大（如 16GB 或以上），Swap 空间可以适当减少。
3. **性能影响**：
    - Swap 空间位于硬盘上，读写速度远低于物理内存。
    - 频繁使用 Swap 会导致性能下降，因此建议在物理内存不足时才使用。
4. **安全性**：
    - 确保 Swap 文件的权限设置正确（`chmod 600`），以防止其他用户访问敏感数据。
docker run \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=6665:8080 \
  --detach=true \
  --name=cadvisor \
  gcr.io/cadvisor/cadvisor:latest

 
