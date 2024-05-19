---
title: leetcode_496. 下一个更大元素 I
tags: [Leetcode,单调栈]
mathjax: true
cover: https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg
categories: [Leetcode,栈]
---
$nums1$ 中数字 $x$ 的 **下一个更大元素** 是指 $x$ 在 $nums2$ 中对应位置 **右侧** 的 **第一个** 比 $x$ 大的元素。

给你两个 **没有重复元素** 的数组 $nums1$ 和 $nums2$ ，下标从 **0** 开始计数，其中$nums1$ 是 $nums2$ 的子集。

对于每个 $0 <= i < nums1.length$ ，找出满足 $nums1[i] == nums2[j]$ 的下标 $j$ ，并且在 $nums2$ 确定 $nums2[j]$ 的 **下一个更大元素** 。如果不存在下一个更大元素，那么本次查询的答案是 $-1$ 。

返回一个长度为 $nums1.length$ 的数组 $ans$ 作为答案，满足 $ans[i]$ 是如上所述的 **下一个更大元素** 。

**示例 1：**

```
输入：nums1 = [4,1,2], nums2 = [1,3,4,2].
输出：[-1,3,-1]
解释：nums1 中每个值的下一个更大元素如下所述：
- 4 ，用加粗斜体标识，nums2 = [1,3,4,2]。不存在下一个更大元素，所以答案是 -1 。
- 1 ，用加粗斜体标识，nums2 = [1,3,4,2]。下一个更大元素是 3 。
- 2 ，用加粗斜体标识，nums2 = [1,3,4,2]。不存在下一个更大元素，所以答案是 -1 。
```

**示例 2：**

```
输入：nums1 = [2,4], nums2 = [1,2,3,4].
输出：[3,-1]
解释：nums1 中每个值的下一个更大元素如下所述：
- 2 ，用加粗斜体标识，nums2 = [1,2,3,4]。下一个更大元素是 3 。
- 4 ，用加粗斜体标识，nums2 = [1,2,3,4]。不存在下一个更大元素，所以答案是 -1 。
```

**提示：**

*   $1 <= nums1.length <= nums2.length <= 1000$
*   $0 <= nums1[i], nums2[i] <= 10^{4}$
*   $nums1$和$nums2$中所有整数 **互不相同**
*   $nums1$ 中的所有整数同样出现在 $nums2$ 中

**进阶：**你可以设计一个时间复杂度为 $O(nums1.length + nums2.length)$ 的解决方案吗？

首先暴力写一下:
```java
class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        int flag=0;
        for(int i=0;i<nums1.length;i++){
            for(int j=0;j<nums2.length;j++){
                if(j==nums2.length-1){
                    nums1[i]=-1;
                    break;
                }
                if(nums2[j]==nums1[i]){
                    for(int k=j+1;k<nums2.length;k++){
                        if(nums2[k]>nums1[i]){
                            nums1[i]=nums2[k];
                            flag=1;
                            break;
                        }
                        if(k==nums2.length-1){
                            nums1[i]=-1;
                            flag=1;
                            break;
                        }
                    }
                }
                if(flag==1){
                    flag=0;
                    break;
                }
            }
        }
        return nums1;
    }
}
```
$O(N^3)$的时间复杂度，有点哈人，想想还有什么好方法？

看了题解，发现可以用栈来做，我实在想不出这道题和栈有什么关系？

看了看官方题解，发现和单调栈有关系。单调栈是啥？已经忘了，复习一下。

## 单调栈

[来自OiWiki的定义](https://oi-wiki.org/ds/monotonous-stack/)

不学了，累了，明天再写。

---

9.5更新:

单调栈内的元素是是按照一定的大小来排列的。**由栈顶到栈底为序**分为单调递增栈和单调递减栈。

对于一组数字序列，入单调递增栈，遍历：

- 如果此时栈为空或者当前入栈元素>栈顶元素，则入栈
- 如果入栈元素<栈顶元素，则将当前栈顶元素弹出，继续进行此步骤，直到满足条件一

这个过程，有什么作用呢？最典型的例子，我们可以通过此种方式找到某个数右边比它大的第一个数。

为什么？

## 证明

### $proof1:$在原序列中，证明栈顶$b$的左边最小数是它所压的元素$a$

首先对于单调递减栈内，$b$上面压着$a$，在原序列中,有以下的事实:
$$
\begin{aligned}
&0.\ b在a的右边\\
&1.\ b>a(满足规则1)\\
&2.\ b和a之间的数字nums都有:nums>a(如果nums<a，意味着a将被弹出，ab无法相遇)\\
&3.\ 考察nums和b由于b需要与a相遇，意味着b需要使nums弹出，此时应该满足:b<nums
\end{aligned}
$$
因此对于序列$[...a...nums...b...]$有

- $a<b$
- $nums>a$
- $nums>b$

也就是说$b$左边最小的数就是$a$.

### $proof2:$在原序列中,证明新来元素$c$是当前栈顶$b$的右边最小元素

在$proof1$基础上，我们继续遍历序列此时遇到一个待考察入栈元素$c$,他有以下两种情况:

- 允许直接入栈,此时$c>b$,相关证明已经在$proof1$阐述。
- 不允许直接入栈,此时$c<b$

如果触发第二种条件，对于$[...b...nums...c...]$,说明:

- $nums>b$，否则b将会在$c$到来之前弹出
- $nums>c$，否则nums不会弹出，$c$也不会和$b$相遇

也就是说$b$右边最小的数就是$c$

## 结论

**对于序列$[...a...nums1...b...nums2...c...]$,当使用单调递减栈对其遍历时，对于栈顶$b$,其所压元素$a$和代入考察入栈元素$c$有:**

- **$b$的最左边最小元素是$a$**
- **如果$c$入栈使$b$弹出，则$b$右边最小元素是$c$**.

对于临界条件,比如遍历完成后剩余的栈元素，下面压着的是其左边最小的元素，右边最小的元素都不存在。

---

回到这个题他说找下一个更大的数，我直接用单调递增栈来做好吧，既然是"下一个"也就是说我不用关系$proof1$中的相关结论。

直接写代码好吧:

```java
class Solution {
    public int[] nextGreaterElement(int[] nums1, int[] nums2) {
        Stack<Integer> stack =new Stack<>();
        Map<Integer,Integer> map=new HashMap<>(); 
        for(int i=0;i<nums2.length;i++){
            if(stack.isEmpty()||stack.peek()>nums2[i]){
                stack.add(nums2[i]);
            }
            else{
                while(!stack.isEmpty()){
                    int num = stack.peek();
                    if(num<nums2[i]){
                        map.put(stack.pop(),nums2[i]);
                    }
                    if(num>nums2[i]||stack.isEmpty()){
                        stack.add(nums2[i]);
                        break;
                    }
                }
            }
        }
        int[] answers = new int[nums1.length];
        for(int i=0;i<nums1.length;i++){
            answers[i]=map.getOrDefault(nums1[i],-1);
        }
        return answers;
    }
}

```

这段代码也是调试了一个小时才通好吧。