---
title: Leetcode_206. 反转链表
tags:
  - 算法
  - 链表
mathjax: true
cover: >-
  https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories:
  - Leetcode
  - 链表
abbrlink: 39001
---


给你单链表的头节点 $head$ ，请你反转链表，并返回反转后的链表。

**示例 1：**

![](https://assets.leetcode.com/uploads/2021/02/19/rev1ex1.jpg)
```
输入：head = [1,2,3,4,5]
输出：[5,4,3,2,1]
```

**示例 2：**

![](https://assets.leetcode.com/uploads/2021/02/19/rev1ex2.jpg)
```
输入：head = [1,2]
输出：[2,1]
```

**示例 3：**

```
输入：head = []
输出：[]
```

**提示：**

*   链表中节点的数目范围是 $[0, 5000]$
*   $-5000 <= Node.val <= 5000$

**进阶：**链表可以选用迭代或递归方式完成反转。你能否用两种方法解决这道题？


```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode pre = null;
        ListNode p = head;
        while(p!=null){
            ListNode next = p.next;
            p.next=pre;
            pre=p;
            p=next;
        }
        return pre;
    }
}
```

这个我一开始没做出来，看了题解才会，呜呜呜。