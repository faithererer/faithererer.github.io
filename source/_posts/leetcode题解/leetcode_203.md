---
title: Leetcode_203. 移除链表元素
tags: [算法,链表]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: [Leetcode, 链表]
---

给你一个链表的头节点 $head$ 和一个整数 $val$ ，请你删除链表中所有满足 $Node.val == val$ 的节点，并返回 **新的头节点** 。

**示例 1：**

![](https://assets.leetcode.com/uploads/2021/03/06/removelinked-list.jpg)
```
输入：head = [1,2,6,3,4,5,6], val = 6
输出：[1,2,3,4,5]
```

**示例 2：**

```
输入：head = [], val = 1
输出：[]
```

**示例 3：**

```
输入：head = [7,7,7,7], val = 7
输出：[]
```

**提示：**

*   列表中的节点数目在范围 $[0, 10^{4}]$ 内
*   $1 <= Node.val <= 50$
*   $0 <= val <= 50$


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
    public ListNode removeElements(ListNode head, int val) {
        ListNode p = new ListNode(-1, head);
        ListNode p0 = p;
        while(p.next!=null){
            if(p.next.val==val){
                p.next=p.next.next;
            }
            else{
                p=p.next;
            }
        }

        return p0.next;
    }
}
```

在这里产生了疑惑，对于下面两行代码:
```java
        ListNode p = new ListNode(-1, head);
        ListNode p0 = p;
```
`p`在后续的操作中会改变，但是`p0`不会改变，这是为什么呢？两者是同一对象的引用啊。通过询问chatgpt4，得到了答案:


```chatgpt
这是因为在Java中，引用变量（比如 p 和 p0）实际上存储的是对象在内存中的地址。当我们说 "p 和 p0 是同一个对象的引用" 时，我们的意思是它们存储的地址是一样的，也就是说它们都指向内存中的同一个位置。

然而，当我们在代码中写 p = p.next; 时，我们实际上改变的是 p 存储的地址，而不是这个地址指向的对象本身。这行代码的意思是 "让 p 存储 p.next 当前存储的地址"。这就导致了 p 现在指向了链表中的下一个节点，而 p0 还是指向原来的节点。

因此，p 的改变并不会影响 p0。因为 p 和 p0 是独立的变量，当我们改变 p 存储的地址时，p0 存储的地址并不会改变。这就是为什么在 while 循环后，p 和 p0 的值会不同。

这是Java语言中对引用的处理方式，也是很多其他面向对象语言的通用规则。希望这个解释能帮助你理解。
```

 ---
 2024.2.5

使用c++
```c++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode* dummy = new ListNode();
        dummy->next=head;
        ListNode* cur = head;
        ListNode* t = dummy;
        while(cur!=NULL){
            if(cur->val==val){
                t->next=cur->next;
            }
            else{
                t->next=cur;
                t=t->next;
            }
            cur=cur->next;
        }
        return dummy->next;
    }
};
```
这种方法使用了三个指针，`dummy`负责建立一个空头节点，`cur`负责遍历原链表，`t`负责随着`cur`的遍历而移动以建立新链表。这种方法是自然而然想到的。

还有一种方法，使用两个指针就可以，把`t`优化掉:
```c++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* removeElements(ListNode* head, int val) {
        ListNode* dummy = new ListNode();
        dummy->next=head;
        ListNode* cur=dummy;
        while(cur->next!=NULL){
            if(cur->next->val==val){
                cur->next=cur->next->next;
            }
            else{
                cur=cur->next;
            }
        }
        return dummy->next;
    }
};
```
**为什么使用`cur->next`而不是`cur`?**

我的理解是使用`cur->next`可以使`cur`节点在遍历的**一开始**可以有选择地回避一些不符合要求地节点，`cur`的作用是在遍历的同时穿起一个符合要求的链表。而`dummy`起到一个记录起点的作用。也是因为无法无脑落地的原因,所以使用它的`dummy.next`，
