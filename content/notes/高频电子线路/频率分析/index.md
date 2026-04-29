---
date: 2026-04-24T08:00:00+08:00
title: 混频器的简单频率分析
tags:
  - 大二下
  - 通信电子线路
summary: 混频器的简单频率分析
---
### 1. 积化和差公式 (用于分析理想混频与交叉项)

在混频器中，本振信号（$\omega_{LO}$）和射频信号（$\omega_{RF}$）相乘时，会直接用到这些公式来剥离出我们需要的差频（中频 IF）或和频成分。

设 $\alpha = \omega_{LO}t$ 且 $\beta = \omega_{RF}t$：

$$\sin(\alpha)\cos(\beta) = \frac{1}{2}[\sin(\alpha+\beta) + \sin(\alpha-\beta)]$$

$$\cos(\alpha)\sin(\beta) = \frac{1}{2}[\sin(\alpha+\beta) - \sin(\alpha-\beta)]$$

$$\cos(\alpha)\cos(\beta) = \frac{1}{2}[\cos(\alpha+\beta) + \cos(\alpha-\beta)]$$

$$\sin(\alpha)\sin(\beta) = -\frac{1}{2}[\cos(\alpha+\beta) - \cos(\alpha-\beta)]$$

### 2. 平方项 / 降幂公式 (用于分析二阶非线性/二阶谐波)

当混频器存在二阶非线性（通常由泰勒级数展开的二阶项 $v^2(t)$ 引起），信号自身的平方会产生直流偏置（DC offset）和二阶谐波。

$$\cos^2(\alpha) = \frac{1+\cos(2\alpha)}{2}$$

$$\sin^2(\alpha) = \frac{1-\cos(2\alpha)}{2}$$

**工程意义**：平方项表明，如果输入一个频率为 $\omega$ 的信号，输出会产生直流分量（$0\text{Hz}$）以及 $2\omega$ 的二次谐波成分。如果是双音输入，还会产生偶数阶互调。

### 3. 三次方项公式 (用于分析三阶非线性/三阶互调)

这是射频系统中最关注的非线性部分（由泰勒级数的三阶项 $v^3(t)$ 引起）。因为三阶互调产物（如 $2\omega_1 - \omega_2$）在频域上通常离所需的主信号非常近，很难通过滤波器滤除。

$$\cos^3(\alpha) = \frac{3\cos(\alpha) + \cos(3\alpha)}{4}$$

$$\sin^3(\alpha) = \frac{3\sin(\alpha) - \sin(3\alpha)}{4}$$

**工程意义**：三次方项表明，输入频率为 $\omega$ 的信号经过三阶非线性器件后，不仅会产生 $3\omega$ 的三次谐波，还会将部分能量按 $\frac{3}{4}$ 的比例“倒灌”回基频 $\omega$，这就是导致**增益压缩（Gain Compression）**的数学本质。

---

### 💡 混频器双音测试 (Two-Tone Test) 中的三阶展开速查

在实际的混频器互调分析中，通常会输入双音信号 $v_{in}(t) = A\cos(\omega_1 t) + A\cos(\omega_2 t)$。当它经过三阶非线性项 $v_{in}^3(t)$ 时，展开后最致命的成分是：

$$\frac{3}{4}A^3 [\cos((2\omega_1 - \omega_2)t) + \cos((2\omega_2 - \omega_1)t)]$$

这部分频率 ($2\omega_1 - \omega_2$ 和 $2\omega_2 - \omega_1$) 就是我们需要重点计算交调截点（IIP3/OIP3）的位置。