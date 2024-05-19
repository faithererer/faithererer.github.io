---
title: KMP
tags: [算法,KMP]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: 算法
date: 2023-07-09 20:31:11 
---
# 关键概念:

- **前缀**：指除了最后一个字符以外，一个字符串的全部头部组合。

- **后缀**：指除了第一个字符以外，一个字符串的全部尾部组合。

- **部分匹配值**："前缀"和"后缀"的最长的共有元素的长度。

# BF算法

```c++
    int strStr(string haystack, string needle) {
        int i=0,j=0;
        while(i<haystack.size()&&j<needle.size()){
            if(haystack[i]==needle[j]){
                i++;j++;
            }
            else{
                i=i-j+1;j=0;
            }
            if(j==needle.size()){
                return i-j;
            }
        }
        return -1;
    }
```



# KMP

```
    int strStr(string haystack, string needle) {
        int i=0,j=0;
        while(i<haystack.size()&&j<needle.size()){
            if(j==-1||haystack[i]==needle[j]){//两个条件可合并
                i++;j++;
            }
            else{
                j=next[j];
            }
            if(j==needle.size()){
                return i-j;
            }
        }
        return -1;
    }
```



# 生成next数组

## 背景

给出字符串`aabaaf`,求其next数组。

next数组记录的是模式串的最大相等前后缀的情况。`next[i]`表示的是，字符串从`i`(包括`i`)往前的最大相等前后缀长度。

## 实现思路

使用双指针`i`,`j`

### 初始化

数组初始化:

```
next[0]=-1 //因为一个字符的最大相等前后缀长度=0
```

指针初始化:

```
i=0; //前缀
j=-1 //后缀
```

>对于`j`将会利用接下来的`for`循环特性进行初始化。

### 求解

```
// while(i<s.size()){//不能这么写，size_t是无符号整数
int n = s.size();
while(i<n)
	if(j==-1||s[i]=s[j]){
		i++;j++;
		next[i]=j
	}
	else{
		j=next[j];
	}
}

```



