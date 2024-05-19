---
title: leetcode_1_两数之和
tags: Leetcode
mathjax: true
cover: https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg
categories: "Leetcode"
---
# 题目描述
给定一个整数数组 $nums$ 和一个整数目标值 $target$，请你在该数组中找出  **和为目标值**  _$target$_  的那  **两个**  整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。

 **示例 1：** 

```
输入：nums = [2,7,11,15], target = 9
输出：[0,1]
解释：因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。
```

 **示例 2：** 

```
输入：nums = [3,2,4], target = 6
输出：[1,2]
```

 **示例 3：** 

```
输入：nums = [3,3], target = 6
输出：[0,1]
```

 **提示：** 

*   $2 <= nums.length <= 10^{4}$
*   $-10^{9} <= nums[i] <= 10^{9}$
*   $-10^{9} <= target <= 10^{9}$
*    **只会存在一个有效答案** 

 **进阶：** 你可以想出一个时间复杂度小于 $O(n^{2})$ 的算法吗？

# 解析
 定义两个指针`i`,`j`,
 遍历数组求和，当其`nums[i]+num[j]=target`时，记录两个下标的值`[i,j]`，最后返回这个数组。
# 代码实现
```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        int a[]=new int[2];
        for(int i=0;i<nums.length;i++){
            for(int j=i+1;j<nums.length;j++){
                if(nums[i]+nums[j]==target){
                    a[0]=i;a[1]=j;
                    return a;
                }
            }
        }
        return a;
    }
}
```