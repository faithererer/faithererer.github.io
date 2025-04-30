---
title: Linux常用命令
tags:
  - Linux
mathjax: true
cover: 'https://vip1.loli.io/2022'
abbrlink: 48230
---





- 登录

    ```shell
    ssh USERNAME@IP
    ```

 - 列出当前文件目录

	```shell
	ls 
	```

	以列表形式显示文件信息:

	```shell
	ls -l
	```

	显示隐藏文件

	```shell
	ls -a
	```

 - 显示用户当前工作目录路径

	```shell
	pwd
	```

 - 跳转目录

	```shell
	cd /PATH
	```

	返回上一级

	```shell
	cd ..
	```

	返回`/root`

	```shell
	cd 
	```

 - 创建文件

	```shell
	touch a.txt
	```

	创建一堆文件

	```shell
	touch a.x1 b.x2 c.x3
	```

	创建一堆文件格式化

	```
	touch a{1..3}.txt
	```

	> 结果:
	>
	> ```shell
	> [root@iZ2zei66vqqa9mhaqwtqyxZ my]# ls
	> a1.txt  a2.txt  a3.txt
	> ```

 -  输出

	```shell
	echo "hello"
	```

	> 这将输出`hello`到终端

	输出字符串到a.txt

	```
	echo "hello" > a.txt
	```

 - 快速查看文件内容

	```shell
	cat file.txt
	```

 - 安全删除

	```shell
	shred a.txt
	```

 - 创建文件夹

	```shell
	mkdir newDir
	```

 - 复制文件

	```
	cp source.file /target
	```

	> 可以是`cp source.file /target/source.file`

- 移动文件

	```shell
	mv source.file /target
	```

	>  可以是`cp source.file /target/source.file`

- 删除文件

	```shell
	rm a.txt
	```

	删除文件夹(递归删除,会提醒)

	```shell
	rm -r dir
	```

	删除文件夹(不提醒)

	```shell
	rm -r -f dir
	```

- 建立软链接

	>Linux ln（英文全拼：link files）命令是一个非常重要命令，它的功能是为某一个文件在**另外一个位置建立一个同步的链接**。
	>
	>当我们需要在不同的目录，用到相同的文件时，我们不需要在每一个需要的目录下都放一个必须相同的文件，我们只要在某个固定的目录，放上该文件，然后在 其它的目录下用ln命令链接（link）它就可以，不必重复的占用磁盘空间。
	>
	>**软链接**：
	>
	>- 1.软链接，以路径的形式存在。类似于Windows操作系统中的快捷方式
	>- 2.软链接可以 跨文件系统 ，硬链接不可以
	>- 3.软链接可以对一个不存在的文件名进行链接
	>- 4.软链接可以对目录进行链接
	>
	>**硬链接**：
	>
	>- 1.硬链接，以文件副本的形式存在。但不占用实际空间。
	>- 2.不允许给目录创建硬链接
	>- 3.硬链接只有在同一个文件系统中才能创建

	创建软链接

	```shell
	ln -s /sourceFilePath newLink 
	```

	此时`newLink`已经指向源文件，访问`newLink`相当于访问`/sourceFilePath`

 - 清空终端

	```shell
	clear
	```

 - 显示自身用户名称

	```shell
	whoami
	```

 - 添加用户

	```shell
	adduser username
	```

 - 删除用户

	```shell
	userdel username
	```

 - 查看所有用户

	```shell
	cat /etc/passwd
	```

 - 设置用户密码

	```shell
	passwd username
	```

 - 切换用户

	```shell
	su username
	```

 - 以root身份执行命令

	```shell
	sudo command
	```

 - 压缩(递归地)

	```shell
	zip -r html.zip /home/html
	```

 - 解压(并且查看解压信息)

	```shell
	unzip -l a.zip
	```


- 随意浏览文件，支持翻页和搜索

	```shell
	less file.txt
	```

	

