---
title: leetcode_3_无重复字符的最长子串
tags:
  - Leetcode
  - 滑动窗口
mathjax: true
cover: 'https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg'
categories: Leetcode
abbrlink: 11029
---

# 题目描述
给定一个字符串 $s$ ，请你找出其中不含有重复字符的  **最长子串**  的长度。

 **示例 1:** 

```
输入: s = "abcabcbb"
输出: 3 
解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。
```

 **示例 2:** 

```
输入: s = "bbbbb"
输出: 1
解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。
```

 **示例 3:** 

```
输入: s = "pwwkew"
输出: 3
解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
     请注意，你的答案必须是 子串 的长度，"pwke" 是一个子序列，不是子串。
```

 **提示：** 

*   $0 <= s.length <= 5 * 10^{4}$
*   $s$ 由英文字母、数字、符号和空格组成

# 分析

朴素的思想就是设置双重循环，外循环`i`根据字符串长度确定循环次数，内循环指针`j`指向，外循环当前的指针`i`，从`j`向后遍历一个字符，根据map的特性来得到本轮的最大无重复字串的长度，存储到`temp`，每轮内循环结束，就比较和`max`的大小，更新`max`.

# 流程图

{% mermaid %}
flowchart TD
	A[初始化map,temp=0,max=0]-->B[设置双循环,遍历字符串]-->E[外循环 i 从头遍历字符串]-->C[内循环指针j指向外循环变量i,并向	后遍历]-->D{当前指针所指\n字符是否已在\nmap的key中?}--是-->F[比较temp与max更新max,打破内循环]-->E
	D--否-->G[temp++,\n当前字符加入map]-->H{当前字符是\n否到达最后一位?}--是-->I[比较temp和max\n更新max]
	I-->S{j指到到字符串末尾?}--是-->E
	S--否-->C
{% endmermaid %}
# 代码实现
```java
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int max=0; //存储最大无重复子串长度
        int temp=0;
        Map<Character,Integer> map=new HashMap<>();
        for(int i=0;i<s.length();i++){
            temp=0;
            for(int j=i;j<s.length();j++){
                if(map.containsKey(s.charAt(j))){
                    if(temp>max){
                        max=temp;
                    }
                    break;
                }
                else{
                    map.put(s.charAt(j), 1);
                    temp++;
                }
                if(s.length()-1==j){
                    if(temp>max){
                        max=temp;
                    }
                }
            }
            map.clear();
        }

        return max;

    }
}
```
# 进一步分析
其实这是一道滑动窗口问题
## 基本概念
滑动窗口是一种基于双指针的一种思想，两个指针指向的元素之间形成一个窗口。

分类：窗口有两类，一种是固定大小类的窗口，一类是大小动态变化的窗口。

## 应用：

- 利用滑动窗口获取平滑的数据，如一段连续时间的数据平均值，能够有更好的稳定性，如温度监测。

什么情况可以用滑动窗口来解决实际问题呢？

- 一般给出的数据结构是数组或者字符串
- 求取某个子串或者子序列最长最短等最值问题或者求某个目标值时
- 该问题本身可以通过暴力求解
