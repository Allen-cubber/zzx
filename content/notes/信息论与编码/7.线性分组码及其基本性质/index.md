---
title: 七、线性分组码及其基本性质
tags:
  - 大三上
  - 信息论
date: 2025-11-02T08:00:00+08:00
summary: 线性分组码通过引入结构化的冗余（监督位），并利用线性代数的工具，实现了一种高效、可靠的差错检测与纠正机制。
---
#### 🔸 线性分组码的一般表示

线性分组码是一种重要的差错控制编码方式。其核心思想是将$k$个信息比特编为$n$个比特的码字，其中 $n > k$。

- **输入信息码组**: 长度为$k$的向量 $\mathbf{a} = (a_{k-1} \ a_{k-2} \ \dots \ a_0)$
- **输出编码码字**: 长度为$n$的向量 $\mathbf{c} = (c_{n-1} \ c_{n-2} \ \dots \ c_0)$

每个码字中的比特 $c_i$ 都是信息比特 $a_j$ 的<font color="orange">线性组合</font>。
$$
\begin{cases}
    c_{n-1} = m_{k-1,n-1}a_{k-1} + m_{k-2,n-1}a_{k-2} + \dots + m_{0,n-1}a_0 \\\\
    c_{n-2} = m_{k-1,n-2}a_{k-1} + m_{k-2,n-2}a_{k-2} + \dots + m_{0,n-2}a_0 \\\\
    \quad \dots \\\\
    c_0 = m_{k-1,0}a_{k-1} + m_{k-2,0}a_{k-2} + \dots + m_{0,0}a_0
\end{cases}
$$

一个 <font color="orange">线性分组码</font> 通常记为 **$(n, k)$**。
- **$n$**: 码字的长度 (编码后的长度)
- **$k$**: 信息码组的长度 (编码前的长度)
- **$(n-k)$**: 监督位的个数

对于一个$(n, k)$线性分组码，总共存在 $2^k$ 个合法的、许用的码字。

---

#### 🔸 8.5.1 码距的概念

码距是衡量编码检错和纠错能力的关键指标。

1.  **汉明距离 (Hamming Distance)** 📏
    两个等长码字 $\mathbf{w_1}$ 和 $\mathbf{w_2}$ 之间对应位置上不同元素的个数，称为这两个码字之间的汉明距离。
    
    对于码字 $\mathbf{w_1} = (b_{n-1} \ b_{n-2} \ \dots \ b_0)$ 和 $\mathbf{w_2} = (c_{n-1} \ c_{n-2} \ \dots \ c_0)$，其汉明距离为：
    $$
    D(\mathbf{w_1}, \mathbf{w_2}) = \sum_{i=0}^{n-1} (b_i \oplus c_i)
    $$
    这里的 $\oplus$ 表示模2加法（异或）。

2.  **码距的性质** ✨
    - **自反性**: $D(\mathbf{w}, \mathbf{w}) = 0$ (一个码字与自身的距离为0)
    - **对称性**: $D(\mathbf{w_1}, \mathbf{w_2}) = D(\mathbf{w_2}, \mathbf{w_1})$ (A到B的距离等于B到A的距离)
    - **三角不等式**: 
      $$ \boxed{ D(\mathbf{w_1}, \mathbf{w_2}) + D(\mathbf{w_2}, \mathbf{w_3}) \ge D(\mathbf{w_1}, \mathbf{w_3}) } $$
      (从A到B再到C的距离，总会大于等于从A直接到C的距离)

---

#### 🔸 8.5.2 码距与检错、纠错能力的关系

<font color="orange">最小码距</font> ($d_{min}$) 是指一个码集中，任意两个不同码字之间汉明距离的最小值。它是决定一个编码纠错性能的核心参数。

$$
d_{min} = \min_{i \ne j} D(\mathbf{w_i}, \mathbf{w_j})
$$

**重要性质** 💡

1.  **检错能力 (Detecting)**
    若要检测出 **$e$** 个错误，则要求最小码距满足：
    $$ \boxed{ d_{min} \ge e+1 } $$

2.  **纠错能力 (Correcting)**
    若要纠正 **$t$** 个错误，则要求最小码距满足：
    $$ \boxed{ d_{min} \ge 2t+1 } $$

3.  **检错与纠错能力结合**
    若要纠正 **$t$** 个错误，同时检测出 **$e$** 个错误 ($e > t$)，则要求最小码距满足：
    $$ \boxed{ d_{min} \ge e+t+1 } $$

> **注意点** 📌:
> *   $d_{min}$ 越大，码的检错和纠错能力越强。
> *   公式中的 $e$ 和 $t$ 都是指**最多**能检测或纠正的错误位数。

---

#### 🔸 8.5.3 生成矩阵与监督矩阵

这是线性分组码的数学核心工具。

1.  **生成矩阵 G (Generator Matrix)** ⚙️
    一个 $k \times n$ 阶的矩阵，用于将 $k$ 位信息码组 $\mathbf{a}$ 直接生成 $n$ 位码字 $\mathbf{c}$。
    $$ \mathbf{c} = \mathbf{a} \cdot \mathbf{G} $$
    $$
    (c_{n-1} \ c_{n-2} \ \dots \ c_0) = (a_{k-1} \ a_{k-2} \ \dots \ a_0) \begin{bmatrix}
        m_{k-1,n-1} & m_{k-1,n-2} & \dots & m_{k-1,0} \\\\
        m_{k-2,n-1} & m_{k-2,n-2} & \dots & m_{k-2,0} \\\\
        \vdots & \vdots & \ddots & \vdots \\\\
        m_{0,n-1} & m_{0,n-2} & \dots & m_{0,0}
    \end{bmatrix}
    $$
    对于一种特殊的、应用广泛的编码——<font color="orange">系统码</font>，其信息位会原封不动地出现在码字的特定位置。其生成矩阵具有标准形式：$\mathbf{G} =[\mathbf{I}_k | \mathbf{P}\_{k,n-k}] =$
    
	$$
    \begin{bmatrix}
        1 & 0 & \dots & 0 & p_{11} & p_{12} & \dots & p_{1,n-k} \\\\
        0 & 1 & \dots & 0 & p_{21} & p_{22} & \dots & p_{2,n-k} \\\\
        \vdots & \vdots & \ddots & \vdots & \vdots & \vdots & \ddots & \vdots \\\\
        0 & 0 & \dots & 1 & p_{k1} & p_{k2} & \dots & p_{k,n-k}
    \end{bmatrix}
    $$
    其中 $\mathbf{I}_k$ 是 $k$ 阶单位矩阵，$\mathbf{P}$ 是一个 $k \times (n-k)$ 的矩阵。

2.  **监督矩阵 H (Parity-Check Matrix)** 🔍
    一个 $(n-k) \times n$ 阶的矩阵，用于校验一个码字是否为许用码字。其最重要的性质是：**任何一个许用码字 $\mathbf{c}$ 与 $\mathbf{H}$ 的转置相乘，结果为零向量**。
    $$ \boxed{ \mathbf{c} \cdot \mathbf{H}^T = \mathbf{0} } $$
    对于系统码，其监督矩阵与生成矩阵有直接关系：$\mathbf{H} = [\mathbf{P}\_{k,n-k}^T | \mathbf{I}\_{n-k}] =$
    
    $$
    \begin{bmatrix}
        p_{11} & p_{21} & \dots & p_{k1} & 1 & 0 & \dots & 0 \\\\
        p_{12} & p_{22} & \dots & p_{k2} & 0 & 1 & \dots & 0 \\\\
        \vdots & \vdots & \ddots & \vdots & \vdots & \vdots & \ddots & \vdots \\\\
        p_{1,n-k} & p_{2,n-k} & \dots & p_{k,n-k} & 0 & 0 & \dots & 1
    \end{bmatrix}
    $$
    它们之间满足关系：$\mathbf{G} \mathbf{H}^T = \mathbf{0}$。

3.  **错误图样 E 与伴随式 S** ❗️
    - **错误图样 (Error Pattern) E**: 一个 $n$ 位向量，出错位为1，正确位为0。
    - **接收码字 R**: $\mathbf{R} = \mathbf{C} + \mathbf{E}$ (发送码字 $\mathbf{C}$ 与 错误图样 $\mathbf{E}$ 模2加)。
    - **伴随式 (Syndrome) S（校正子）**: 译码端通过计算接收码字 $\mathbf{R}$ 的伴随式来判断是否存在错误。
      $$
      \mathbf{S}^T = \mathbf{R} \cdot \mathbf{H}^T = (\mathbf{C} + \mathbf{E}) \cdot \mathbf{H}^T = \mathbf{C}\mathbf{H}^T + \mathbf{E}\mathbf{H}^T
      $$
      由于 $\mathbf{C}\mathbf{H}^T = \mathbf{0}$，因此：
      $$ \boxed{ \mathbf{S}^T = \mathbf{E} \cdot \mathbf{H}^T } $$
      **核心结论**: <font color="orange">伴随式 S 只与错误图样 E 有关</font>，而与发送的码字 C 无关！
      - 若 $\mathbf{S} = \mathbf{0}$，则认为传输无误。
      - 若 $\mathbf{S} \ne \mathbf{0}$，则说明传输发生了错误，且不同的 $\mathbf{S}$ 值对应不同的错误图样 $\mathbf{E}$。通过预先建立的$\mathbf{S}$-$\mathbf{E}$对应表（或称为标准阵），即可找出错误位置并纠正。

---

#### 🔸 8.5.4 最小码距与最小码重

- **码重 (Weight)**: 一个码字中 "1" 的个数，记为 $W(\mathbf{c})$。
- **最小码重 ($W_{min}$)**: 码集中所有<font color="orange">非零码字</font>的最小码重。

**重要定理** 🌟
对于<font color="orange">线性分组码</font>，其最小码距等于其非零码字的最小码重。
$$
\boxed{ d_{min} = W_{min} }
$$
这个定理极大地方便了最小码距的计算。我们不再需要计算所有码字对之间的距离，只需找出非零码字中 "1" 最少的那一个即可。

---

#### 🔸 8.5.6 汉明码 (Hamming Code)

汉明码是一类非常著名且高效的<font color="orange">完备码</font>（能够用满汉明界的编码），能够纠正单个比特错误。

1.  **基本参数**
    - 码长: $n = 2^r - 1$
    - 信息位长: $k = n - r = 2^r - 1 - r$
    - 监督位长: $r$
    - 最小码距: $d_{min} = 3$

    根据 $d_{min} \ge 2t+1$，汉明码的纠错能力 $t=1$，即能纠正1位错误。

2.  **构造**
    汉明码的监督矩阵 $\mathbf{H}$ 非常有特点：它的 **$n$** 列由所有可能的 **$r$** 位<font color="orange">非零</font>二进制向量构成。

3.  **扩展汉明码 (Extended Hamming Code)**
    在汉明码的基础上增加1位全体监督位（偶校验位），使得所有码字的码重都为偶数。
    - 码长: $n' = n + 1 = 2^r$
    - 信息位长: $k' = k = 2^r - 1 - r$
    - 最小码距: $d_{min}' = 4$

    扩展汉明码的监督矩阵 $\mathbf{H}\_E$ 是在原汉明码监督矩阵 $\mathbf{H}$ 的基础上构造的：
    $$\begin{bmatrix}
        & & & & 0 \\\\
        & & \mathbf{H} & & \vdots \\\\
        & & & & 0 \\\\
        1 & 1 & \dots & 1 & 1
        \end{bmatrix}_{(r+1) \times (n+1)}
    $$

    扩展汉明码的能力提升为：**纠正1位错误，同时检测2位错误**。
    ($d_{min} \ge e+t+1 \implies 4 \ge 2+1+1$)

---

#### 🔸 8.5.7 编码的纠错能力界限

1.  **汉明界 (Hamming Bound)**
    对于任何能够纠正 $t$ 个错误的 $(n,k)$ 分组码，必须满足：
    $$
    \sum_{i=0}^{t} \binom{n}{i} \le 2^{n-k}
    $$
    满足等号的码称为<font color="orange">完备码</font> (Perfect Code)。汉明码就是一种完备码。

2.  **普洛特金界 (Plotkin Bound)**
    提供了最小码距的一个上限：
    $$
    d_{min} \le n \frac{2^{k-1}}{2^k - 1}
    $$
    这个界限可以用来判断某些参数的编码是否存在。

---

### 📝 本章学习总结

本章我们深入学习了<font color="orange">线性分组码</font>，这是差错控制编码的基石。

1.  **核心概念** 🎯: 我们从最基本的<font color="orange">码距</font>和<font color="orange">码重</font>入手，理解了它们是衡量编码性能的关键。特别是 **最小码距 $d_{min}$**，它直接决定了编码的检错和纠错能力。

2.  **数学工具** 🛠️: <font color="orange">生成矩阵 $\mathbf{G}$</font> 和 <font color="orange">监督矩阵 $\mathbf{H}$</font> 是实现编码和译码的强大数学工具。
    - **编码过程**: 简单明了的矩阵乘法 $\mathbf{c} = \mathbf{a} \cdot \mathbf{G}$。
    - **译码核心**: 计算<font color="orange">伴随式</font> $\mathbf{S}^T = \mathbf{R} \cdot \mathbf{H}^T$。伴随式不为零，意味着信道中出现了差错，并且伴随式的值直接对应了特定的<font color="orange">错误图样 $\mathbf{E}$</font>，从而实现了纠错。

3.  **重要性质** 💡: 线性分组码的优良性质——**最小码距等于最小码重**（$d_{min} = W_{min}$），大大简化了性能分析。

4.  **典型编码** 🌟: 我们学习了经典的<font color="orange">汉明码</font>，它是一种高效的单比特纠错码。通过了解其构造和参数，我们更好地理解了编码理论如何应用于实践。其<font color="orange">扩展形式</font>则进一步提升了性能，可以同时检出两位错误。

5.  **理论边界** 🧭: 最后，汉明界和普洛特金界为我们展示了编码能力的理论上限，让我们知道在给定$(n,k)$参数下，我们所能期望的最佳性能是什么。

总而言之，线性分组码通过引入结构化的冗余（监督位），并利用线性代数的工具，实现了一种高效、可靠的差错检测与纠正机制。