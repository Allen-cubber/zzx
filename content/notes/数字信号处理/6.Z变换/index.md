---
title: 第六章 Z变换
tags:
  - 大三上
  - 数字信号处理
date: 2025-09-30T10:00:00+08:00
summary: 本章我们学习了Z变换，它是分析离散时间信号与系统的强大工具。
---
### 一、 Z变换的基本概念 ✨

#### 1. 什么是Z变换？
Z变换可以看作是离散时间信号与系统领域的“<font color="orange">拉普拉斯变换</font>”。它是一种分析工具，将复杂的时域<font color="orange">卷积运算</font>转换为Z域中简单的<font color="orange">乘积运算</font>。

#### 2. Z变换的定义
对于一个离散时间序列 $x[n]$，其双边Z变换定义为：
$$
\boxed{X(z) = \sum_{n=-\infty}^{\infty} x[n]z^{-n}}
$$
其中，$z$ 是一个复变量，可以表示为 $z = re^{j\omega}$。

#### 3. Z变换与傅里叶变换（DTFT）的关系 🤝
- 当复变量 $z$ 的模 $r=1$ 时，即 $z = e^{j\omega}$，Z变换就退化为了离散时间傅里叶变换（DTFT）。
- Z变换的定义式可以改写为：
  $$
  X(re^{j\omega}) = \sum_{n=-\infty}^{\infty} (x[n]r^{-n})e^{-j\omega n}
  $$
- 这表明，序列 $x[n]$ 的Z变换，可以看作是另一个序列 $(x[n]r^{-n})$ 的傅里叶变换。
- 因此，Z变换是DTFT的<font color="orange">推广</font>，DTFT就是在Z平面的<font color="orange">单位圆</font>上进行的Z变换。

---

### 二、 Z变换的收敛域 (ROC) 🗺️

#### 1. 为什么需要收敛域？
Z变换是一个无穷级数，这个级数不一定对所有的复变量 $z$ 都收敛。只有当级数收敛时，Z变换才有意义。

#### 2. 收敛域的定义
<font color="orange">收敛域 (Region of Convergence, ROC)</font> 是指在Z平面上，能够使Z变换级数和收敛的所有点 $z$ 的集合。

#### 3. 常见序列的ROC
一个Z变换必须由其<font color="orange">代数表达式</font>和<font color="orange">收敛域</font>共同唯一确定。

- **右边序列 (因果序列)**: $x[n] = a^n u[n]$
  - Z变换: $X(z) = \frac{1}{1-az^{-1}}$
  - ROC: $|z| > |a|$ (极点 $|a|$ 之外的区域)

- **左边序列 (反因果序列)**: $x[n] = -a^n u[-n-1]$
  - Z变换: $X(z) = \frac{1}{1-az^{-1}}$
  - ROC: $|z| < |a|$ (极点 $|a|$ 之内的区域)

> **⚠️ 易错点**: 仅仅给出代数表达式 $X(z)=\frac{1}{1-az^{-1}}$ 是不够的！必须结合ROC才能唯一确定对应的时域序列 $x[n]$。

#### 4. ROC的性质总结
1.  ROC在Z平面上是一个<font color="orange">圆环</font>区域，其边界由极点决定。
2.  对于<font color="orange">有限长序列</font>，ROC是整个Z平面（可能除去 $z=0$ 或 $z=\infty$）。
3.  对于<font color="orange">右边序列</font>，ROC位于最外层极点的外部。
4.  对于<font color="orange">左边序列</font>，ROC位于最内层非零极点的内部。
5.  对于<font color="orange">双边序列</font>，ROC是一个环状区域，位于两个极点之间。
6.  ROC<font color="orange">不能包含任何极点</font>。

---

### 三、 逆Z变换 ↩️

逆Z变换是将Z域的表达式转换回时域序列的过程。

#### 1. 部分分式展开法 🛠️
这是求解有理函数逆Z变换最常用的方法。
**步骤**:
1.  **求极点**: 找到 $X(z)$ 的所有极点 $a_i$。
2.  **展开**: 将 $X(z)$ 展开为部分分式之和的形式：
    $$
    X(z) = \sum_{i} \frac{A_i}{1-a_i z^{-1}}
    $$
3.  **确定各项ROC**: 根据总的ROC，判断每一个分项是对应右边序列还是左边序列。
4.  **查表反变换**: 利用常用变换对（如上面的因果/反因果序列）求出每一项的反变换，再相加得到最终结果。

> **🔔 注意点**: 在确定每一项的ROC时要特别小心。如果总ROC是 $|z|>R_{max}$，则所有项都是右边序列；如果总ROC是 $|z|<R_{min}$，则所有项都是左边序列；如果总ROC是环状，则需要根据极点位置判断。

#### 2. 长除法
通过对 $X(z)$ 的分子分母进行长除法，可以直接得到时域序列的各项系数值。
- 若ROC为 $|z|>R$ (对应右边序列)，则按 $z^{-1}$ 的<font color="orange">降幂</font>排列进行长除。
- 若ROC为 $|z|<R$ (对应左边序列)，则按 $z^{-1}$ 的<font color="orange">升幂</font>（即 $z$ 的降幂）排列进行长除。

---

### 四、 Z变换的性质 🚀

Z变换的性质是进行系统分析的核心。

1.  **线性性质**:
    $a x_1[n] + b x_2[n] \leftrightarrow a X_1(z) + b X_2(z)$
    - **ROC**: 至少是 $R_1 \cap R_2$。如果发生零极点抵消，ROC可能会扩大。

2.  **时移性质**:
    $x[n-n_0] \leftrightarrow z^{-n_0} X(z)$
    - **ROC**: 与原ROC相同，但可能增加或删除 $z=0$ 或 $z=\infty$。

3.  **Z域尺度变换**:
    $a^n x[n] \leftrightarrow X(z/a)$
    - **ROC**: $|a|R_x$ (原ROC被缩放 $|a|$ 倍)。

4.  **时域反转**:
    $x[-n] \leftrightarrow X(z^{-1})$
    - **ROC**: $1/R_x$ (原ROC取倒数)。

5.  **卷积性质 ⭐ (最重要!)**:
    时域卷积等于Z域乘积。
    $$
    \boxed{x_1[n] * x_2[n] \leftrightarrow X_1(z) X_2(z)}
    $$
    - **ROC**: 至少是 $R_1 \cap R_2$。

6.  **Z域微分性质**:
    $n x[n] \leftrightarrow -z \frac{dX(z)}{dz}$
    - **ROC**: 与原ROC相同。
    - 这个性质对于求解包含对数或高阶极点的函数的反变换非常有用。

---

### 五、 LTI系统分析与Z变换 🔬

#### 1. 系统函数 (传输函数)
LTI系统的<font color="orange">系统函数</font> $H(z)$ 是其单位冲激响应 $h[n]$ 的Z变换。
$$
H(z) = \sum_{n=-\infty}^{\infty} h[n]z^{-n}
$$
对于任意输入 $x[n]$ 和输出 $y[n]$，它们在Z域的关系为：
$$
\boxed{Y(z) = H(z)X(z)}
$$

#### 2. 因果性与稳定性判断
这是Z变换在系统分析中最核心的应用。

- **因果性 (Causality)** 🕰️:
  - 一个LTI系统是因果的 $\iff$ 其系统函数 $H(z)$ 的ROC是<font color="orange">某个圆的外部</font>，并且<font color="orange">包含 $z=\infty$</font>。
  - 对于有理系统函数，这意味着分子的最高阶次不能大于分母的最高阶次。

- **稳定性 (Stability)** ⚖️:
  - 一个LTI系统是BIBO稳定的 $\iff$ 其系统函数 $H(z)$ 的ROC<font color="orange">包含单位圆</font> ($|z|=1$)。

- **因果且稳定的系统** ✅:
  - 一个LTI系统是因果且稳定的 $\iff$ $H(z)$ 的<font color="orange">所有极点都在单位圆内部</font>。

#### 3. 从系统函数求频率响应
如果系统是稳定的（ROC包含单位圆），那么其频率响应 $H(e^{j\omega})$ 可以通过将 $H(z)$ 在单位圆上求值得到：
$$
H(e^{j\omega}) = H(z)|_{z=e^{j\omega}}
$$

#### 4. 从零极点图看频率响应 📈
- **极点**靠近单位圆，会在其对应的频率处产生<font color="orange">峰值</font>（谐振）。极点越靠近单位圆，峰值越尖锐。
- **零点**靠近单位圆，会在其对应的频率处产生<font color="orange">谷值</font>（衰减）。如果零点在单位圆上，则该频率处响应为零。
- 这种几何方法提供了一种直观理解滤波器（如低通、高通、带通）特性的方式。

---

### 六、 本章学习总结 💡

1.  **核心定义**: Z变换是离散序列的“复频域”表示，是DTFT的推广。
2.  **ROC的重要性**: Z变换由其<font color="orange">代数表达式</font>和<font color="orange">收敛域</font>共同定义。ROC的形状（内圆、外圆、圆环）决定了时域序列的类型（左边、右边、双边）。
3.  **卷积定理**: 这是Z变换的“杀手级应用”，它将复杂的时域卷积变成了简单的Z域乘法，是LTI系统分析的基石。
4.  **系统分析**:
    - **系统函数 $H(z)$** 是连接输入和输出的桥梁。
    - 系统的<font color="orange">因果性</font>和<font color="orange">稳定性</font>这两个物理特性，可以完全由 $H(z)$ 的ROC或者极点位置来判断。
      - **因果性** $\leftrightarrow$ ROC向外延伸至无穷。
      - **稳定性** $\leftrightarrow$ ROC包含单位圆。
      - **因果稳定** $\leftrightarrow$ 所有极点都在单位圆内。
5.  **几何视角**: 零极点图不仅给出了系统的数学描述，还提供了一种强大的<font color="orange">几何直觉</font>，帮助我们直观地理解和设计系统的频率响应。