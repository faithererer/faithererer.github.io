---
title: leetcode_217. 存在重复元素
tags:
  - Leetcode
  - 哈希表
mathjax: true
cover: 'https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg'
categories:
  - Leetcode
  - 哈希表
abbrlink: 4098
---
# 题目描述
给你一个整数数组 $nums$ 。如果任一值在数组中出现 **至少两次** ，返回 $true$ ；如果数组中每个元素互不相同，返回 $false$ 。

**示例 1：**

```
输入：nums = [1,2,3,1]
输出：true
```

**示例 2：**

```
输入：nums = [1,2,3,4]
输出：false
```

**示例 3：**

```
输入：nums = [1,1,1,3,3,4,3,2,4,2]
输出：true
```

**提示：**

*   $1 <= nums.length <= 10^{5}$
*   $-10^{9} <= nums[i] <= 10^{9}$


```java
// class Solution {
//     public boolean containsDuplicate(int[] nums) {
//         Map<Integer,Integer> map = new HashMap<>();
//         for(int i=0;i<nums.length;i++){
//             if(map.containsKey(nums[i])){
//                 return true;
//             }
//             map.put(nums[i],1);
//         }
//         return false;
//     }
// }

class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> set = new HashSet<>();
        for(int i=0;i<nums.length;i++){
            if(set.contains(nums[i])){
                return true;
            }
            set.add(nums[i]);
        }
        return false;
    }
}
```

## 注意
HashSet 基于 HashMap 来实现的，是一个不允许有重复元素的集合。插入和搜索时间复杂度为 $O(1)$