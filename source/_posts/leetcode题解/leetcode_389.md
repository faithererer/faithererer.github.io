---
title: leetcode_389. 找不同
tags: [Leetcode,哈希表,异或]
mathjax: true
cover: https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg
categories: [Leetcode,哈希表]
---
# 题目描述
给定两个字符串 $s$ 和 $t$ ，它们只包含小写字母。

字符串 $t$ 由字符串 $s$ 随机重排，然后在随机位置添加一个字母。

请找出在 $t$ 中被添加的字母。

**示例 1：**

```
输入：s = "abcd", t = "abcde"
输出："e"
解释：'e' 是那个被添加的字母。
```

**示例 2：**

```
输入：s = "", t = "y"
输出："y"
```

**提示：**

*   $0 <= s.length <= 1000$
*   $t.length == s.length + 1$
*   $s$ 和 $t$ 只包含小写字母

# 方法一:哈希表
## 思路
遍历`s`，使用`map`记录每个字符出现的次数，然后遍历`t`,遍历字符，若在`map`中没有出现返回该字符，若出现该字符其出现次数-1，如果出现次数减为0则说明该字符比`s`中多，返回该字符。
## 实现
```java
class Solution {
    public char findTheDifference(String s, String t) {
        Map<Character,Integer> map = new HashMap<>();
        for(int i=0;i<s.length();i++){
            char ch = s.charAt(i);
            int cnt = map.containsKey(ch) ? map.get(ch) : 0 ;
            map.put(ch,++cnt);
        }
        for(int i=0;i<t.length();i++){
            char ch = t.charAt(i);
            if(!map.containsKey(ch)){
                return ch;               
            }
            int cnt = map.get(ch);
            if(cnt==0){
                return ch;
            }
            map.put(ch,--cnt);
        }
        return '0';
    }
}
```
# 方法二:ascii码相加
## 思路
初始化变量`sum=0`,遍历`s`和`t`,将`t`中每个字符的ascii码相加，然后将`s`中每个字符的ascii码相减，最后返回`sum`+`t`中最后一个字符的ascii码。
## 实现
```java
class Solution {
    public char findTheDifference(String s, String t) {
        char sum=0;
        for(int i=0;i<t.length();i++){
            sum+=t.charAt(i);
        }
        for(int i=0;i<s.length();i++){
            sum-=s.charAt(i);
        }
        return sum;
    }
}
```
# 方法三:异或
## 思路
依次遍历`s`和`t`,将`s`和`t`中每个字符进行异或，最后返回异或的结果。
因为两个相同的字符异或操作的结果是0，所以最后剩下的字符就是`t`中多出来的字符。
## 实现
```java
class Solution {
    public char findTheDifference(String s, String t) {
        char sum=0;
        for(int i=0;i<t.length();i++){
            sum^=t.charAt(i);
        }
        for(int i=0;i<s.length();i++){
            sum^=s.charAt(i);
        }
        return sum;
    }
}
```
