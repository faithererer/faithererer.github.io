---
title: Leetcode_96. 不同的二叉搜索树
tags:
  - 算法
  - 动态规划
  - 二叉搜索树
  - 二叉树
  - dp
mathjax: true
cover: >-
  https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories:
  - Leetcode
  - 动态规划
abbrlink: 53182
---


# 96. 不同的二叉搜索树
给你一个整数 `n` ，求恰由 `n` 个节点组成且节点值从 `1` 到 `n` 互不相同的 **二叉搜索树** 有多少种？返回满足题意的二叉搜索树的种数。

 

**示例 1：**

![](https://assets.leetcode.com/uploads/2021/01/18/uniquebstn3.jpg)
```
**输入：**n = 3
**输出：**5
```

**示例 2：**

```
**输入：**n = 1
**输出：**1
```

 

**提示：**
- `1 &lt;= n &lt;= 19`

# 解析
观察这些树的结构，发现每一个节点都可以作为根节点，由于是排序树，
对于根节点`i`，左子树将有`i-1`个节点，右子树将有`n-i`个节点((i-1)+1+(n-i))=n。所以对于n个节点，每个节点轮流做根节点，然后再分别计算其左右子树组合的可能性，最后再累加再一起就是总个数。这种策略是我们可以很容易分割问题规模，自底向上的重复使用已有的结果。

## 定义
`dp[i]`表示`n`个节点组成且节点值从`1`到`n`互不相同的 二叉搜索树 的个数。
## 初始化
```java
dp[1]=1;
dp[2]=2;
```
## 递推方程
$$
dp[n]=\sum_{i=1}^n({dp[i-1]}*dp[n-i])
$$
## 实现
```java
class Solution {
    public int numTrees(int n) {
        //定义dp[i]->由 i 个节点组成的二叉搜索树 有多少种
        //init
        int[] dp=new int [n+1];
        dp[0]=1;
        dp[1]=1;
        for(int i=2;i<=n;i++){
            for(int j=1;j<=i;j++){
                dp[i]+=dp[j-1]*dp[i-j];
            }
        }
        return dp[n];
    }
}
```