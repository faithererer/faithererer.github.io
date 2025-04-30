---
title: 证明：为什么有关hash的数据结构的size往往是2的幂次方
tags:
  - 面经
mathjax: true
cover: https://img.loliapi.cn/i/pc/img313.webp
categories: Java
abbrlink: 44223
---

不管是hashMap的size，还是redis的dict我们会发现他们的扩容机制限制了他们的大小都恰好为$2^n$，为什么呢。根据查阅资料，我发现hash函数的目的是将一个数据尽可能均匀地映射到一个区间，然而这个区间是往往是变化的，因此需要取模运算。而取模运算在底层实际上是对于与或非这种逻辑运算，效率较低。因此为了提高效率，设计者往往将模运算转化为"与"运算。
$$
\begin{array}{l}
\text{when } \log_2{n} \in \mathbb{N} , \\
\quad \text{hash}(x) \% n = \text{hash}(x) \& (n - 1)
\end{array}
$$

## 证明
要证明当 $\log_2{n} \in \mathbb{N}$ 时，
$$
\text{hash}(x) \% n = \text{hash}(x) \& (n - 1)
$$

首先我们来解释这个等式的两边：

1. $\text{hash}(x) \% n$ 表示将 $\text{hash}(x)$ 对 $n$ 取模，即 $\text{hash}(x)$ 除以 $n$ 的余数。

2. $\text{hash}(x) \& (n - 1)$ 表示将 $\text{hash}(x)$ 和 $n - 1$ 进行按位与运算。

这里的 $n$ 是 $2$ 的幂次，即 $n = 2^k$，其中 $k \in \mathbb{N}$。

由于 $n = 2^k$，所以 $n$ 是一个只有一个 1 的二进制数，即 $n - 1$ 是一个全是 1 的二进制数。例如，如果 $n = 8$ (即 $2^3$)，则 $n - 1 = 7$ (即 $2^3 - 1 = 7 = 0111_2$)。

**证明**:

设 $n = 2^k$，其中 $k \in \mathbb{N}$。

$$
\text{hash}(x) \% n = \text{hash}(x) \% 2^k
$$

根据取模运算的定义：

$$
\text{hash}(x) \% 2^k = \text{hash}(x) - \left\lfloor \frac{\text{hash}(x)}{2^k} \right\rfloor \cdot 2^k
$$

注意到 $\left\lfloor \frac{\text{hash}(x)}{2^k} \right\rfloor \cdot 2^k$ 是 $\text{hash}(x)$ 去掉低 $k$ 位的部分，即：

$$
\text{hash}(x) \% 2^k\ \text{正好是}\ \text{hash}(x)\ \text{的低}\ k\ \text{位}
$$

而 $\text{hash}(x) \& (n - 1)$ 则是 $\text{hash}(x)$ 和一个低 $k$ 位全是 1 的数 $2^k - 1$ 进行按位与运算：

$$
\text{hash}(x) \& (2^k - 1) = \text{hash}(x) \& (111\ldots1)_2
$$

由于按位与运算的性质，这个操作会保留 $\text{hash}(x)$ 的低 $k$ 位：

$$
\text{hash}(x) \& (2^k - 1)\ \text{正好是}\ \text{hash}(x)\ \text{的低}\ k\ \text{位}
$$

因此，两者都是 $\text{hash}(x)$ 的低 $k$ 位，所以：

$$
\text{hash}(x) \% 2^k = \text{hash}(x) \& (2^k - 1)
$$

即证明了：

$$
\text{hash}(x) \% n = \text{hash}(x) \& (n - 1)
$$

当且仅当 $n$ 是 $2$ 的幂次。

## 感想
在这里我们可以看出来计算机底层进行一些操作的并不是可读性至上，而是效率至上。但是作为应用层开发者，我觉得两者如果非要取其一抛其一，我更倾向于后者。你费劲心思的业务逻辑，可能还不如编译器的某个语法树剪枝，并且还要花费大量的时间去理解和维护。
