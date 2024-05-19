---
title: leetcode_20. 有效的括号
tags: [Leetcode,栈]
mathjax: true
cover: https://vip1.loli.io/2022/05/12/QHnybtXcj93YLNp.jpg
categories: [Leetcode,栈]
---
给定一个只包括 `(`，`)`，`{`，`}`，`[`，`]` 的字符串 $s$ ，判断字符串是否有效。

有效字符串需满足：

1.  左括号必须用相同类型的右括号闭合。
2.  左括号必须以正确的顺序闭合。
3.  每个右括号都有一个对应的相同类型的左括号。

**示例 1：**

```
输入：s = "()"
输出：true
```

**示例 2：**

```
输入：s = "()[]{}"
输出：true
```

**示例 3：**

```
输入：s = "(]"
输出：false
```

**提示：**

*   $1 <= s.length <= 10^{4}$
*   $s$ 仅由括号 $'()[]{}'$ 组成


```java
class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        Map<Character,Character> map = new HashMap<>();
        map.put('(',')');
        map.put('{','}');
        map.put('[',']');
        map.put(')','0');
        map.put('}','0');
        map.put(']','0');
        for(int i=0;i<s.length();i++){
            Character character=s.charAt(i);  
            if(stack.isEmpty()||(!(map.get(stack.peek()).equals(character)))){
                stack.push(character);
            }
            else if(map.get(stack.peek())==character){
                stack.pop();
            }

        }
        if(stack.size()==0){
            return true;
        }
        else{
            return false;
        }
    }
}
```
第一次思路是这样的，就是维护一个栈，遍历字符串获取字符，如果栈空或者两者不匹配直接入栈，否则(即两者匹配)直接弹出栈顶。字符串遍历完毕后，如果栈空则是合法字符串，否则不合法。
我这样做时间和空间都只打败了百分之十几的玩家。想想还有哪里可以优化呢？

尝试把for循环优化一下:
```java
for(char character:s.toCharArray())
```
不行，只提高了一丢丢，急了。。。

把map给优化了，奶奶的用直接if判断：

```java
class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for(char character:s.toCharArray()){
            if(stack.isEmpty()){
                stack.push(character);
            }
            else if(stack.peek()=='('&&character==')'){
                stack.pop();
            }
            else if(stack.peek()=='{'&&character=='}'){
                stack.pop();
            }
            else if(stack.peek()=='['&&character==']'){
                stack.pop();
            }
            else if(character=='}'||character==')'||character==']'){
                return false;
            }
            else{
                stack.push(character);
            }
        }
        if(stack.size()==0){
            return true;
        }
        else{
            return false;
        }
    }
}
```
充分运用了`if-else if`的特性，随之而来的是代码可读性的下降，时空效率超过了50%玩家,满足了。。。

也就是说hashmap的取效率比if判断低，这个也是可以理解的，两者都是常数级$O(1)$的时间复杂度,但是hashmap是要计算hash值的，哈希冲突太多会退化到$O(N)$,而if判断只是简单的比较。