---
title: Leetcode_705. 设计哈希集合
tags: [算法,哈希表]
mathjax: true
cover: https://steamuserimages-a.akamaihd.net/ugc/1709666070115424150/BC49D4781E37934E3E7AEE94662022A8FADBED19/
categories: [Leetcode, 哈希表]
---


不使用任何内建的哈希表库设计一个哈希集合（HashSet）。

实现 $MyHashSet$ 类：

*   $void add(key)$ 向哈希集合中插入值 $key$ 。
*   $bool contains(key)$ 返回哈希集合中是否存在这个值 $key$ 。
*   $void remove(key)$ 将给定值 $key$ 从哈希集合中删除。如果哈希集合中没有这个值，什么也不做。

 

**示例：**

```
输入：
["MyHashSet", "add", "add", "contains", "contains", "add", "contains", "remove", "contains"]
[[], [1], [2], [1], [3], [2], [2], [2], [2]]
输出：
[null, null, null, true, false, null, true, null, false]

解释：
MyHashSet myHashSet = new MyHashSet();
myHashSet.add(1);      // set = [1]
myHashSet.add(2);      // set = [1, 2]
myHashSet.contains(1); // 返回 True
myHashSet.contains(3); // 返回 False ，（未找到）
myHashSet.add(2);      // set = [1, 2]
myHashSet.contains(2); // 返回 True
myHashSet.remove(2);   // set = [1]
myHashSet.contains(2); // 返回 False ，（已移除）
```

**提示：**

*   $0 <= key <= 10^{6}$
*   最多调用 $10^{4}$ 次 $add$、$remove$ 和 $contains$


# 方法一:链地址法
## 描述
哈希表长度最好为素数，这样可以减少哈希冲突，这里取857，然后使用链地址法解决哈希冲突，即使用链表存储哈希冲突的元素。
## 实现
```java
class MyHashSet {
    private final int BASE=857;
    private LinkedList[] data;
    public MyHashSet() {
        data = new LinkedList[BASE];
        for(int i=0; i<BASE; i++){
            data[i]=new LinkedList<Integer>();
        }
    }
    
    public void add(int key) {
        int loc = hash(key);
        Iterator<Integer> iterator = data[loc].iterator();
        while(iterator.hasNext()){
            Integer element = iterator.next();
            if(element==key){
                return;
            }
        }
        data[loc].offerLast(key);
    }
    
    public void remove(int key) {
        int loc = hash(key);
        Iterator<Integer> iterator = data[loc].iterator();
        while(iterator.hasNext()){
            Integer element = iterator.next();
            if(element==key){
                data[loc].remove(element);
                return;
            }
        }
    }
    
    public boolean contains(int key) {
        int loc = hash(key);
        Iterator<Integer> iterator = data[loc].iterator();
        while(iterator.hasNext()){
            Integer element = iterator.next();
            if(element==key){
                return true;
            }
        }
        return false;     
    }
    public int hash(int key){
        return key%BASE;
    }
}
```

