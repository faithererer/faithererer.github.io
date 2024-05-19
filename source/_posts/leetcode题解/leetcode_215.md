---
title: leetcode_215. 数组中的第K个最大元素
tags: [数据结构,堆，二叉树]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: [Leetcode,堆]
---
# 题目
给定整数数组 $nums$ 和整数 $k$，请返回数组中第 $**k**$ 个最大的元素。

请注意，你需要找的是数组排序后的第 $k$ 个最大的元素，而不是第 $k$ 个不同的元素。

你必须设计并实现时间复杂度为 $O(n)$ 的算法解决此问题。

**示例 1:**

```
输入: [3,2,1,5,6,4], k = 2
输出: 5
```

**示例 2:**

```
输入: [3,2,3,1,2,4,5,5,6], k = 4
输出: 4
```

**提示：**

*   $1 <= k <= nums.length <= 10^{5}$
*   $-10^{4} <= nums[i] <= 10^{4}$

# 解析
见[堆的java实现](https://faithererer.github.io/2023/09/30/%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84/%E6%89%8B%E5%86%99%E5%A0%86/)

# 实现
```java
class Solution {
    public class MaxHeap{
        private int size;
        private ArrayList<Integer> data;
        public MaxHeap(){
            data = new ArrayList<>();
        }
        public MaxHeap(int[] arr){
            data = new ArrayList<>();
            for(int i=0;i<arr.length;i++){
                data.add(arr[i]);
            }
            int lastP = getParent(data.size()-1);
            for(int i=lastP;i>=0;i--){
                siftDown(i);
            }
        }
        public int size(){
            return this.data.size();
        }
        public boolean isEmpty(){
            return this.data.isEmpty();
        }
        public int getParent(int idx){
            return (idx-1)/2; 
        }
        public int getLeftChild(int idx){
            return idx*2+1;
        }
        public int getRightChild(int idx){
            return idx*2+2;
        }
        public void swap(int i,int j){
            Integer temp = data.get(i);
            data.set(i,data.get(j));
            data.set(j,temp);
        }
        public void siftUp(int k){
            while(k>0&&data.get(getParent(k))<data.get(k)){
                swap(k,getParent(k));
                k = getParent(k);
            }
        }
        public void siftDown(int k){
            while(getLeftChild(k)<data.size()){
                int j = getLeftChild(k);
                if(getRightChild(k)<data.size()){
                    if(data.get(j)<data.get(getRightChild(k))){
                        j = getRightChild(k);
                    }
                }
                if(data.get(j)>data.get(k)){
                    swap(j,k);
                    k = j;
                }
                else{
                    break;
                }
            }
        }
        public Integer poll(){
            Integer res = data.get(0);
            data.set(0,data.get(data.size()-1));
            data.remove(data.size()-1);
            siftDown(0);
            return res;
        }
        public Integer peek(){
            return data.get(0);
        }
        public void add(Integer element){
            data.add(element);
            siftUp(data.size()-1);
        }
    }
    public int findKthLargest(int[] nums, int k) {
        MaxHeap heap = new MaxHeap(nums);
        for(int i=0;i<k-1;i++){
            heap.poll();
        }
        return heap.peek();
    }
}
```