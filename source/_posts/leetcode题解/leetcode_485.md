---
title: Leetcode_485. 最大连续 1 的个数
tags: [算法]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: [Leetcode, 数组]
---



[485. 最大连续 1 的个数](https://leetcode.cn/problems/max-consecutive-ones/)



给定一个二进制数组 $nums$ ， 计算其中最大连续 $1$ 的个数。

**示例 1：**

```
输入：nums = [1,1,0,1,1,1]
输出：3
解释：开头的两位和最后的三位都是连续 1 ，所以最大连续 1 的个数是 3.
```

**示例 2:**

```
输入：nums = [1,0,1,1,0,1]
输出：2
```

**提示：**

*   $1 <= nums.length <= 10^{5}$
*   $nums[i]$ 不是 $0$ 就是 $1$.

```java
class Solution {
    public int findMaxConsecutiveOnes(int[] nums) {
        int max=0, i=0;
        while(i<nums.length){
            int j=0;
            while(i<nums.length&&nums[i++]==1){
                j++;
                
            }
            if(max<j){
                max=j;
            }
        }
        return max;
    }
}
```

这里我遇到了一个问题，就是内循环的条件`i<nums.length&&nums[i++]==1`当我交换位置时，就会报数组越界的错误，我知道原因是因为`i++`的自增导致后面`i<num.length`的判断失误，但是当我改成`nums[i++]==1&&i-1<nums.length`还是会错。。。

直接写一个debug程序追踪一下这些变量打断点逐步观察这些变量，发现`nums[i++]`会越界。

结论就是条件表达式是自左而右依次进行的，第一个条件表达式的相关变量会影响后续表达式的值，对于`&&`，第一个表达式为`false`则后续条件表达式不会执行，这也正是题解所写那样写不会越界的原因。

