---
title: leetcode_797. 所有可能的路径
tags:
  - dfs
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img294.webp'
abbrlink: 45176
date: 2024-06-02 00:00:00
categories:
---
## 题目描述
# 797. 所有可能的路径
给你一个有 `n` 个节点的 **有向无环图（DAG）**，请你找出所有从节点 `0` 到节点 `n-1` 的路径并输出（**不要求按特定顺序**）

 `graph[i]` 是一个从节点 `i` 可以访问的所有节点的列表（即从节点 `i` 到节点 `graph[i][j]`存在一条有向边）。

 

**示例 1：**

![](https://assets.leetcode.com/uploads/2020/09/28/all_1.jpg)

```
**输入：**graph = [[1,2],[3],[3],[]]
**输出：**[[0,1,3],[0,2,3]]
**解释：**有两条路径 0 -&gt; 1 -&gt; 3 和 0 -&gt; 2 -&gt; 3
```

**示例 2：**

![](https://assets.leetcode.com/uploads/2020/09/28/all_2.jpg)

```
**输入：**graph = [[4,3,1],[3,2,4],[3],[4],[]]
**输出：**[[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]]
```

 

**提示：**
- `n == graph.length`
- `2 &lt;= n &lt;= 15`
- `0 &lt;= graph[i][j] &lt; n`
- `graph[i][j] != i`（即不存在自环）
- `graph[i]` 中的所有元素 **互不相同**
- 保证输入为 **有向无环图（DAG）**
## 解析


## code
```java
class Solution {
    int[][] graph;
    List<List<Integer>> res;
    Integer n;
    public List<List<Integer>> allPathsSourceTarget(int[][] graph) {
        this.graph=graph;
        this.n = graph.length;
        this.res = new ArrayList<>();
        List<Integer> path = new ArrayList<>();
        dfs(0,path);
        return res;

    }

    void dfs(int cur, List<Integer> path){
        path.add(cur);
        if(cur==n-1){
            // 保存路径;
            res.add(new ArrayList<>(path));
            return;
        }
        for(int i=0;i<graph[cur].length;i++){
            dfs(graph[cur][i],path);
            path.remove(path.size()-1);
        }
    }
}
```