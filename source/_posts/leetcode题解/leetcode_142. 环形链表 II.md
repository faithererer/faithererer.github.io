
---
title: leetcode_142. 环形链表 II
tags: [双指针,快慢指针,链表]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: [Leetcode, 链表]

---
# 142. 环形链表 II

给定一个链表的头节点  `head` ，返回链表开始入环的第一个节点。 如果链表无环，则返回 `null`。

如果链表中有某个节点，可以通过连续跟踪 `next` 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 `pos` 来表示链表尾连接到链表中的位置（**索引从 0 开始**）。如果 `pos` 是 `-1`，则在该链表中没有环。**注意：`pos` 不作为参数进行传递**，仅仅是为了标识链表的实际情况。

**不允许修改 **链表。

 

**示例 1：**

![](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist.png)

```
**输入：**head = [3,2,0,-4], pos = 1
**输出：**返回索引为 1 的链表节点
**解释：**链表中有一个环，其尾部连接到第二个节点。
```

**示例 2：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test2.png)

```
**输入：**head = [1,2], pos = 0
**输出：**返回索引为 0 的链表节点
**解释：**链表中有一个环，其尾部连接到第一个节点。
```

**示例 3：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test3.png)

```
**输入：**head = [1], pos = -1
**输出：**返回 null
**解释：**链表中没有环。
```

 

**提示：**
- 链表中节点的数目范围在范围 `[0, 104]` 内
- `-105 &lt;= Node.val &lt;= 105`
- `pos` 的值为 `-1` 或者链表中的一个有效索引

 

**进阶：**你是否可以使用 `O(1)` 空间解决此题？# 142. 环形链表 II
给定一个链表的头节点  `head` ，返回链表开始入环的第一个节点。 如果链表无环，则返回 `null`。

如果链表中有某个节点，可以通过连续跟踪 `next` 指针再次到达，则链表中存在环。 为了表示给定链表中的环，评测系统内部使用整数 `pos` 来表示链表尾连接到链表中的位置（**索引从 0 开始**）。如果 `pos` 是 `-1`，则在该链表中没有环。**注意：`pos` 不作为参数进行传递**，仅仅是为了标识链表的实际情况。

**不允许修改 **链表。

 

**示例 1：**

![](https://assets.leetcode.com/uploads/2018/12/07/circularlinkedlist.png)

```
**输入：**head = [3,2,0,-4], pos = 1
**输出：**返回索引为 1 的链表节点
**解释：**链表中有一个环，其尾部连接到第二个节点。
```

**示例 2：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test2.png)

```
**输入：**head = [1,2], pos = 0
**输出：**返回索引为 0 的链表节点
**解释：**链表中有一个环，其尾部连接到第一个节点。
```

**示例 3：**

![](https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2018/12/07/circularlinkedlist_test3.png)

```
**输入：**head = [1], pos = -1
**输出：**返回 null
**解释：**链表中没有环。
```

 

**提示：**
- 链表中节点的数目范围在范围 `[0, 104]` 内
- `-105 &lt;= Node.val &lt;= 105`
- `pos` 的值为 `-1` 或者链表中的一个有效索引

 

**进阶：**你是否可以使用 `O(1)` 空间解决此题？




# 使用双指针法


## 证明速度$1/次迭代$和速度为$2/次迭代$的双指针，在非完全循环链表中必定相遇

### 使用绝对位置(此法无解析解)

设链表非循环部分长为$a$,循环部分周长为$b$，慢指针命名为$slowP$，快指针命名为$fastP$,起始都位于头部。

假设$fastP$在第$n$次循环后与$slowP$相遇,在$t\ (a\le t\le a+b)$时刻，两者的索引为:
$$
\begin{aligned}
pos_{slow}=(1 \cdot t-a)\ mod \  b +a\\ 
pos_{fast}=(2 \cdot t-a)mod \ b +a
\end{aligned}
$$
解方程:
$$
pos_{slow}=pos_{fast}\\
$$



我发现以我现有的水平，我解不出来。。。这种带`mod`的方程一般都很难求解析解。于是换一种思路。





###  换一个思路：

**首先两个指针必然会进入循环部分，因为非循环部分是有限长的。**

**进入环内的两个指针，必定相遇**。

不信?证明一下:

**证明:两个在环内同向运动的质点，速度不同，必定相遇；且当两者速度比值大于等于2(或者小于等于0.5)时，两者首次相遇于慢的一方的第一圈。**



假设有两个质点$z_1$,$z_2,$速度是$v_1$,$v_2$，且$v_1$>$v_2$。圆环周长为$L$,他们的位置分别为:
$$
\begin{aligned}
X_{z_1}=z_1(t)+x1\\
X_{z_2}=z_2(t)+x2
\end{aligned}
$$


其中$z(t)$表示质点在$t$时刻的位移，$x$表示每个质点的初始位置。

以$z_2$为参照系，$z_1$的速度为$v_1-v_2$，$z_2$的速度为$0$,两者相遇的时间表示为：
$$
t= \frac{|X_{z_1}-X_{z_2}|}{v_1-v_2}
$$


显然$t>0$，可以证明：



**两个在环内同向运动的质点，速度不同，必定相遇**



又因为$0\le |X_{z_1}-X_{z_2}|\le L$

可得:
$$
t\le \frac{L}{v_1-v_2}
$$
在$t$时间内，$z_2$的运动的位移为:
$$
X_{z_2}=v_2 \cdot t \le L \cdot \frac{v_2}{v_1-v_2}
$$


当$v_2\le v_1-v2$时，$\frac{v_2}{v_1-v_2}\le 1$，即$v_1\geq 2v_2$时,
$$
X_{z_2}\le L \cdot \frac{v_2}{v_1-v_2} \le L
$$

即可证明:
**且当两者速度比值大于等于2(或者小于等于0.5)首次相遇于慢的一方的第一圈**。

命题得证。

**因此若想证明相遇于入环点只需要描述慢指针进入循环的第一圈与快指针相遇时的位置关系即可。**

在慢指针第一次进入循环部分并于快指针相遇时，此时快指针已经在循环部分循环了$n$圈$(n\geq1)$:

设链表非循环部分长为$a$,慢指针遍历过的循环节点数为$b$，未遍历的循环节点数为$c$。慢指针命名为$slowP$，快指针命名为$fastP$,起始都位于头部。

两者的路程始终是$2$倍的关系,我们关注的是$a$的值

因此有:
$$
\begin{aligned}
2\cdot path_{slowP}= path_{fastP} \\
2(a+b)=a+n(b+c)+b
\end{aligned}
$$
得:
$$
a=n(b+c)-b
$$
也就是:
$$
a=(n-1)(b+c)+c
$$
这意味着，此时即相遇时再设置一个和$slowP$一样速度的指针$P$，让其在头节点与其一起移动，两者相遇点为入环点。开始运动时关注$slowP$此时距入环点的距离为$c$

设入环点为$x_0$,此时其位移是:
$$
x_0-c
$$


两者相遇时，有:
$$
\begin{aligned}
X_{slowP}
\\&=x_0 - c + a \\&= x_0 - c + (n-1)(b+c) + c \\
&= x_0 + (n-1)(b+c)\\
&=x_0\\
&=a\\
&=X_P
\end{aligned}
$$
其中$(n-1)(b+c)$是周长的整数倍，因此位移是$0$



因此$X_{slowP}=X_P=a$，即相遇于入环点。





# 实现

```c++
/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        ListNode* pSlow=head;
        ListNode* pFast=head;
        // 相遇
        if(head==NULL) return NULL;
        do {
            pFast=(pFast==NULL||pFast->next==NULL)? NULL:pFast->next->next;
            pSlow=pSlow->next;
        } while(pSlow!=pFast);
        if(pSlow==NULL) return NULL;
        // 入环点
        ListNode* p=head;
        while(p!=pSlow){
            pSlow=pSlow->next;
            p=p->next;
        }
        return p;
    }
};
```



