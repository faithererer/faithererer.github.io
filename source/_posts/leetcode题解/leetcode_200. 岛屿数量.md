---
title: leetcode_200. 岛屿数量
tags:
  - dfs
mathjax: true
cover: 'https://img.loliapi.cn/i/pc/img576.webp'
abbrlink: 43562
date: 2024-06-04 00:00:00
categories:
---
# 题目描述
# 200. 岛屿数量
给你一个由 `'1'`（陆地）和 `'0'`（水）组成的的二维网格，请你计算网格中岛屿的数量。

岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。

此外，你可以假设该网格的四条边均被水包围。

 

**示例 1：**

```
**输入：**grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
**输出：**1
```

**示例 2：**

```
**输入：**grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
**输出：**3
```

 

**提示：**
- `m == grid.length`
- `n == grid[i].length`
- `1 &lt;= m, n &lt;= 300`
- `grid[i][j]` 的值为 `'0'` 或 `'1'`

## 深搜
```java
class Solution {
    char[][] grid;
    int[][] vis;
    int count;
    int[] dy;
    int[] dx;
    public int numIslands(char[][] grid) {
        dx=new int[]{-1,1,0,0};
        dy=new int[]{0,0,-1,1};
        vis = new int[grid.length][grid[0].length];
        this.grid=grid;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (vis[i][j] == 0 && grid[i][j] == '1') {
                    dfs(i,j);
                    count++;
                }
            }
        }
        return count;

    }

    void dfs(int x, int y) {
        // 越界？
        if(x<0||y<0||x>=grid.length||y>=grid[0].length){
            return;
        }
        // 我曾来过
        if(vis[x][y]==1){
            return;
        }
        vis[x][y] = 1;
        if (grid[x][y] == '0') {
            return;
        }
        for (int i = 0; i < 4; i++) {
            // 上下左右
            dfs(x + dx[i], y + dy[i]);
         }
    }
}
```

## 广搜
```java
class Solution {
    int[][] vis;
    Deque<Pair<Integer, Integer>> que;
    // 方向数组，用于控制上下左右移动
    int[] dx = { 1, -1, 0, 0 };
    int[] dy = { 0, 0, 1, -1 };

    public int numIslands(char[][] grid) {

        vis = new int[grid.length][grid[0].length];
        que = new LinkedList<>();
        int num = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (vis[i][j] == 0 && grid[i][j] == '1') {
                    bfs(i, j, que,grid);
                    num++;
                }
            }
        }
        return num;
    }

    void bfs(int x, int y, Deque<Pair<Integer, Integer>> que,char[][] grid) {

        Pair<Integer, Integer> pair = new Pair<>(x, y);
        que.push(new Pair<>(x, y));
        vis[x][y] = 1;
        while (!que.isEmpty()) {
            pair = que.poll();
            int nX = pair.getKey();
            int nY = pair.getValue();

            for (int i = 0; i < 4; i++) {
                int adjX = nX + dx[i];
                int adjY = nY + dy[i];
                if (adjX >= 0 && adjX < vis.length && adjY >= 0 && adjY < vis[0].length && vis[adjX][adjY] == 0
                        && grid[adjX][adjY] == '1') {
                    que.add(new Pair<>(adjX, adjY));
                    vis[adjX][adjY] = 1;
                }
            }

        }
    }
}
```