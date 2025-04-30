---
title: Mermaid 语法
mathjax: true
cover: 'https://vip2.loli.io/2022/05/11/XJpYtFn59D7PdkC.jpg'
categories: 小工具
abbrlink: 63932
date:
tags:
---

# 介绍
Mermaid是一种基于Javascript的绘图工具，使用类似于Markdown的语法，使用户可以方便快捷地通过代码创建图表。

# 语法

## 流程图

所有流程图均由**节点**、几何形状和**边**、箭头或线组成

### 定义流程图的方向

- LR——从左到右

    ```mermaid
    flowchart LR
        Start --> Stop
    ```

    {% mermaid %}
    flowchart LR
        Start --> Stop
    {% endmermaid %}

- TB——从上到下
    ```mermaid
    flowchart TB	
        Start --> Stop
    ```
    {% mermaid %}
    flowchart TB	
        Start --> Stop
    {% endmermaid %}
    
    
- TD - 自上而下/与TB相同
    ```mermaid
    flowchart TD	
        Start --> Stop
    ```
    {% mermaid %}
    flowchart TD	
        Start --> Stop
    {% endmermaid %}

### 节点形状

-  圆角矩形节点

	```mermaid
	flowchart LR
	    id1(This is the text in the box)
	```
    {% mermaid %}
    flowchart LR
	    id1(This is the text in the box)
    {% endmermaid %}
   
- **体育场形节点**

	```mermaid
	flowchart LR
	    id1([This is the text in the box])
	```
    {% mermaid %}
    flowchart LR
	    id1([This is the text in the box])
    {% endmermaid %}
  
-  **子程序形状的节点**

	```mermaid
	flowchart LR
	    id1[[This is the text in the box]]
	```
    {% mermaid %}
    flowchart LR
	    id1[[This is the text in the box]]
    {% endmermaid %}
   
-  圆柱形节点

	```mermaid
	flowchart LR
	    id1[(Database)]
	```
    {% mermaid %}
    flowchart LR
	    id1[(Database)]
    {% endmermaid %}
   
- **圆圈形式的节点**

	```mermaid
	flowchart LR
	    id1((This is the text in the circle))
	```
    {% mermaid %}
    flowchart LR
	    id1((This is the text in the circle))
    {% endmermaid %}
  
- **不对称形状的节点**

	```mermaid
	flowchart LR
	    id1>This is the text in the box]
	```
    {% mermaid %}
    flowchart LR
	    id1>This is the text in the box]
    {% endmermaid %}
  
- **菱形**

	```mermaid
	flowchart LR
	    id1{This is the text in the box}

	```
    
    {% mermaid %}
    flowchart LR
	    id1{This is the text in the box}
    {% endmermaid %}
	


- **平行四边形**

	```mermaid
	flowchart TD
	    id1[\This is the text in the box\]
	```
    {% mermaid %}
    flowchart TD
	    id1[\This is the text in the box\]
    {% endmermaid %}
	
- **平行四边形 （反向）**

	```mermaid
	flowchart TD
	    id1[/This is the text in the box/]
	```
	
    {% mermaid %}
    flowchart TD
	    id1[/This is the text in the box/]
    {% endmermaid %}
	
- **梯形**

	```mermaid
	flowchart TD
	    A[/Christmas\]
	```
    {% mermaid %}
    flowchart TD
	    A[/Christmas\]
    {% endmermaid %}
	
- **梯形（反向）**

	```mermaid
	flowchart TD
	    B[\Go shopping/]
	```
	
    {% mermaid %}
    flowchart TD
	    B[\Go shopping/]
    {% endmermaid %}	
	
	
	
	
	
### 节点之间的链接

- 基本

	```mermaid
	
	    flowchart LR
	        A-->B
	        C--->D
	        E --- F
	        G-- This is the text! ---H
	        I---|This is the text|J
	        K-- text -->L
	        M-.->N;
	        O-. text .-> P
	        Q ==> R
	        S == text ==> T
	
	```

	 {% mermaid %}
	    flowchart LR
	        A-->B
	        C--->D
	        E --- F
	        G-- This is the text! ---H
	        I---|This is the text|J
	        K-- text -->L
	        M-.->N;
	        O-. text .-> P
	        Q ==> R
	        S == text ==> T
	    {% endmermaid %}




​        

  - 其他用法
  
    ```mermaid
    flowchart LR
       A -- text --> B -- text2 --> C
       a --> b & c--> d
       E & F--> G & H
       I --o J
       K --x L
    ```
      {% mermaid %}
    flowchart LR
       A -- text --> B -- text2 --> C
       a --> b & c--> d
       E & F--> G & H
       I --o J
       K --x L
    {% endmermaid %}
    ```mermaid
    flowchart TD
        A[Start] --> B{Is it?}
        B -->|Yes| C[OK]
        C --> D[Rethink]
        D --> B
        B ---->|No| E[End]
    ```
    {% mermaid %}
    flowchart TD
        A[Start] --> B{Is it?}
        B -->|Yes| C[OK]
        C --> D[Rethink]
        D --> B
        B ---->|No| E[End]
    {% endmermaid %}
    









 







