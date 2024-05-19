---
title: 常见算法模板
tags: [算法]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: 日常
date: 2023-07-09 20:31:11 
---

## 快速排序

```java
static void qsort(int[] a, int l,int r){
    if(l>=r)return;
    int i=l-1,j=r+1,x=a[l+r>>1];
    while(i<j){
        do i++; while(a[i]<x);
        do j--;while(x<a[j]);
        if(i<j){
            swap(a,i,j);
        }
    }
    qsort(a,l,j);
    qsort(a,j+1,r);
}
```

它的思想很简单，但是它的边界处理真的很傻x，稍不留神就会无限递归或无线循环。

**我曾如是写道:**

```java
static void qsort(int[] arr, int begin, int end){
    if(begin>=end) return;
    int i=begin,j=end,x=arr[begin+end>>1];
    while(i<j){
        while(arr[i]<x) i++;
        while(x<arr[j]) j--;
        if(i<j) {
            swap(arr,i,j);
        }
    }
    qsort(arr,begin, i-1);
    qsort(arr, i+1,end);
}
```

当它在以下测试用例会无限循环

```
2
1 1
```

它会进入**无限循环**，`i`,`j`指针连动都不带动的！！！

而`do while`则会一言不合先动指针，然后再判断，这样指针就不会停滞下来。

**我曾如是写道:**：

```java
static void qsort(int[] a, int l,int r){
    if(l>=r)return;
    int i=l-1,j=r+1,x=a[l+r>>1];
    while(i<j){
        do i++; while(a[i]<x);
        do j--;while(x<a[j]);
        if(i<j){
            swap(a,i,j);
        }
    }
    qsort(a,l,i-1);
    qsort(a,i+1,r);
}
```

这种情况会造成**无限递归**的问题，实际上`x=a[l+r>>1]`和`    qsort(a,l,j); qsort(a,j+1,r);`是相关联的，你也许会对分界点`j`的处理感到困扰。

且看**证明**：

**1.**进行边界分析是为了避免分治时出现被分为0和n的情况，造成无限分治内存超限问题。
**2**.若以j为分界点，对于`quick_sort(q, l, j)`, `quick_sort(q, j + 1, r)`，`j`有可能取`l~r`的任何一个值，若`j`取`l`，则`quick_sort(q, l + 1, r)`执行时会产生分割，不会出现`0`和`n`的情况；若`j`取`r`，则`quick_sort(q, l, r)`执行时会分割为`n`，会导致无限分治。**本条结论：若在递归分治前保持`j = r`，那么就会出现无限分治的情况**
**3**.所以只要在进入分治前不要让`j`取到`r`就可以了。那什么时候会取到r呢？初始化完毕时，`j`的值为`r + 1`，当执行过一次`do j--; while(q[j] > x)`后，`j`变为`r`，并且恰好在此之后j都不会发生改变，即`do j--; while(q[j] > x)`只会执行一次，如果保持`j = r`不变的话，那么`i`会在此之前一直自增到`i = r`，此时`j = r`; `i = r`不满足`i < j`循环结束，此时，整个`while(i < j) {}`循环只进行了`1`轮，分治，从而导致分治出了`0`和`n`两个情况。**本条结论：若要在递归分治前保持`j = r`，那么`while(i < j) {}`只能执行一次**
**4**.现在把焦点转移到`x`的取值上，第3点说到，若出现无限分治问题，`i`会一直自增到`i = r`，若出现这种情况，那么`x`的取值一定是`q[r]`，因为如果`x`的值不为`q[r]`，那么一定会在x处存在`q[i] == x`，而`q[i] == x`会导致i自增暂时停止，那么就会往下执行，执行`do j--;`，判断后进入第二轮`while(i < j) {}`循环，进入第二轮循环会使j自减至少两次，而他的初值为`r + 1`，也就是说，j的值不会一直保持在`j = r`上，也就不会导致无限分治。**本条结论：若`x`的取值不为`q[r]`，那么`while(i < j) {}`会至少执行两次，因此在进行递归分治前，`j`的值是一定小于`r`的。**
**5**.`l + r >> 1`的值一定是小于r的，不会取到r，而`l + r + 1 >> 1`的值一定是大于`l`的，不会取到l
所以综合2、3、4、5的结论就得出了**若以j为分界点，x取`q[l + r >> 1]`，此时不会出现无限分治的情况；若以`i`为分界点，`x`取`q[l + r + 1 >> 1]`，此时不会出现无限分治的情况**



> 坑是真的多



## 归并排序

# 二分查找

```java
class Solution {

    public int binary_search(int low, int high, int[] nums, int target){  
        if(low>high) return -1;
        else{
            int mid = (low+high)/2;
            if(nums[mid]<target){
                return binary_search(mid+1, high, nums, target);
            }
            else if(nums[mid]>target){
                return binary_search(low, mid-1, nums, target);
            }
            else
                return mid;
        }
        
    }
    public int search(int[] nums, int target) {
        return binary_search(0, nums.length-1, nums, target);
    }
}
```

