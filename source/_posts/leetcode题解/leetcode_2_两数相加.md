---
title: leetcode_2_两数相加
tags:
  - Leetcode
  - 链表
mathjax: true
cover: 'https://vip1.loli.io/2022/05/11/uy7K692mcrLOXNR.jpg'
categories: Leetcode
abbrlink: 10994
---

# 题目描述
给你两个  **非空**  的链表，表示两个非负的整数。它们每位数字都是按照  **逆序**  的方式存储的，并且每个节点只能存储  **一位**  数字。

请你将两个数相加，并以相同形式返回一个表示和的链表。

你可以假设除了数字 0 之外，这两个数都不会以 0 开头。

 **示例 1：** 

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2021/01/02/addtwonumber1.jpg)
```
输入：l1 = [2,4,3], l2 = [5,6,4]
输出：[7,0,8]
解释：342 + 465 = 807.
```

 **示例 2：** 

```
输入：l1 = [0], l2 = [0]
输出：[0]
```

 **示例 3：** 

```
输入：l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]
输出：[8,9,9,9,0,0,0,1]
```

 **提示：** 

*   每个链表中的节点数在范围 $[1, 100]$ 内
*   $0 <= Node.val <= 9$
*   题目数据保证列表表示的数字不含前导零

# 解析
题目给出两个链表，由头节点顺序遍历得到的序列是一个数的逆序列，求两个链表所表示的两数之和。

我们可以新建一个结果链表`res`,并设置一个工作指针`last`。初始化，指向`res`头节点。设置`carry`记录当前进位数,初始化为0.

循环。遍历`l1` ,`l2`两个链表

分为以下种种情况

- `l1!=null&&l2!=null`

	此时`l1.val`和`l2.val`和`carry`相加，`(l1.val+l2.val+carry)%10`是当前位的数,`(l1.val+l2.val+carry)/10`是当前进位的数。两者顺序不能变。

	`l1`,`l2`,`last`,后移

- `l1!=null&&l2==null`

	`(l1.val+carry)%10`是当前位的数,`(l1.val+carry)/10`是当前进位的数

	`l1`,`last`,后移

- `l1==null&&l2!=null`

	`(l2.val+carry)%10`是当前位的数,`(l2.val+carry)/10`是当前进位的数

	`l2`,`last`,后移

- `l1==null&&l2==null`

	这步是收尾工作，判断当前位carry是否为0，是则last.next==null,否则last.next.val=carry
    这里仅需判断carry而无需判断高位的情况，因为不存在高位为0的情况

# 代码实现

```java
/*
 * @lc app=leetcode.cn id=2 lang=java
 *
 * [2] 两数相加
 */

// @lc code=start
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
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode res=new ListNode(0);
        int carry=0;
        ListNode last=res;
        while(l1!=null||l2!=null){
            if(l1!=null&&l2!=null){
                last.next=new ListNode(0);
                last.next.val=(l1.val+l2.val+carry)%10;
                carry=(l1.val+l2.val+carry)/10;
                l1=l1.next;
                l2=l2.next;
                last=last.next;
            }
            else if(l2==null){
                last.next=new ListNode(0);
                last.next.val=(l1.val+carry)%10;
                carry=(l1.val+carry)/10;
                l1=l1.next;
                last=last.next;
            }
            else if(l1==null){
                last.next=new ListNode(0);
                last.next.val=(l2.val+carry)%10;
                carry=(l2.val+carry)/10;
                l2=l2.next;
                last=last.next;
            }
            if(l1==null&&l2==null){
                if(carry==0){
                    last.next=null;
                }
                else if(carry!=0){
                    last.next=new ListNode(carry);
                }
            }
            
        }
        return res.next;
    }
   

}
// @lc code=end
```