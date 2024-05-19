---
title: Leetcode_283. 移动零
tags: [算法]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/

categories: [Leetcode,数组]
---

给定一个数组 $nums$，编写一个函数将所有 $0$ 移动到数组的末尾，同时保持非零元素的相对顺序。

**请注意** ，必须在不复制数组的情况下原地对数组进行操作。

**示例 1:**

```
输入: nums = [0,1,0,3,12]
输出: [1,3,12,0,0]
```

**示例 2:**

```
输入: nums = [0]
输出: [0]
```

**提示**:

*   $1 <= nums.length <= 10^{4}$
*   $-2^{31} <= nums[i] <= 2^{31} - 1$

**进阶：**你能尽量减少完成的操作次数吗？


```java
class Solution {
    public void moveZeroes(int[] nums) {
        int ok=0;
        for(int i=0;i<nums.length-ok;i++){
            if(nums[i]==0){
                for(int j=i;j<nums.length-1;j++){
                    nums[j]=nums[j+1];    
                }
                ok++;
                nums[nums.length-1]=0;
                i--;
            }
        }
    }
}
```

第二次迭代

```java	
class Solution {
    public void moveZeroes(int[] nums) {
        int idx=0;
        for(int i=0;i<nums.length;i++){
            if(nums[i]!=0){
                nums[idx++]=nums[i];
            }
        }
        for(int i=idx;i<nums.length;i++){
            nums[i]=0;
        }
    }
}
```

双指针: