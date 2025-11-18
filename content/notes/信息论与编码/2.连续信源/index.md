---
title: 二、连续信源、信道及容量
date: 2025-09-20T10:00:00+08:00
tags:
  - 信息论
  - 大三上
summary: 通过离散化和取极限的方法，将熵的概念从离散信源推广到连续信源。
---
本节旨在将信息论的基本概念从离散域扩展至连续域，重点讨论<font color="orange">连续信源</font>的熵、<font color="orange">连续信道</font>的互信息，并最终推导高斯信道的<font color="orange">容量</font>公式。

### **1. 连续信源的熵** 📈

#### **1.1 概率密度函数的离散化**

对于由概率密度函数 (PDF) $p(x)$ 描述的连续信源 $X$，为了应用离散熵的定义，首先对其进行离散化处理。

假设信号 $X(t)$ 的取值范围为区间 $[a, b]$。

1.  **区间分割**：将区间 $[a, b]$ 等分为 $n$ 个微小区间，每个区间的宽度为 $\Delta = (b - a) / n$。
2.  **概率近似**：第 $i$ 个子区间为 $[a + (i-1)\Delta, a + i\Delta]$。随机变量取值落入此区间的概率 $P(x_i)$ 可由积分计算。当 $\Delta \to 0$ 时，该概率可近似为：

    $P(x_i) = \int_{a+(i-1)\Delta}^{a+i\Delta} p(x)dx \approx p(x_i)\Delta$

    其中，$x_i$ 为该区间内的一个代表点。

通过此方法，一个连续信源 $X$ 被近似为一个具有 $N$ 个可能取值的离散信源 $X_N$。

*   **原始连续信源 X**:
    $\begin{bmatrix} X \\ p(x) \end{bmatrix} = \begin{bmatrix} (a,b) \\ p(x) \end{bmatrix} \quad \text{其中} \quad \int_a^b p(x)dx = 1$

*   **近似离散信源 X_N**:
    $\begin{bmatrix} X_N \\ P(x) \end{bmatrix} = \begin{bmatrix} x_1, x_2, \dots, x_N \\ p(x_1)\Delta, p(x_2)\Delta, \dots, p(x_N)\Delta \end{bmatrix}$

    所有离散概率之和满足归一化条件：
    $\sum_{i=1}^{N} p(x_i)\Delta = \sum_{i=1}^{N} \int_{a+(i-1)\Delta}^{a+i\Delta} p(x)dx = \int_a^b p(x)dx = 1$

#### **1.2 连续信源的绝对熵**

基于上述离散化模型，计算其信息熵：

$H(X_N) = -\sum_{i=1}^{N} P_i \log P_i = -\sum_{i=1}^{N} p(x_i)\Delta \log[p(x_i)\Delta]$

利用对数运算法则 $\log(ab) = \log(a) + \log(b)$，上式可分解为：

$H(X_N) = -\sum_{i=1}^{N} p(x_i)\Delta \log p(x_i) - \sum_{i=1}^{N} p(x_i)\Delta \log \Delta$

由于 $\sum_{i=1}^{N} p(x_i)\Delta = 1$，表达式可简化为：

$H(X_N) = -\sum_{i=1}^{N} p(x_i)\Delta \log p(x_i) - \log \Delta$

为求得连续信源的精确熵，令 $\Delta \to 0$ ($n \to \infty$) 取极限：

$H(X) = \lim_{\Delta \to 0, n \to \infty} H(X_N) = \lim_{\Delta \to 0, n \to \infty} \left( -\sum_{i=1}^{n} p(x_i)\log p(x_i) \Delta \right) - \lim_{\Delta \to 0} \log \Delta$

在极限条件下：
*   第一项收敛于积分形式：$-\int_a^b p(x)\log p(x)dx$
*   第二项 $-\log \Delta \to +\infty$

最终得到：

$H(X) = -\int_a^b p(x)\log p(x)dx + \infty$

**❗️ 注意事项**：此结果表明，连续信源的<font color="orange">绝对熵</font>值为无穷大。这在物理上对应于精确描述一个连续变量需要无限的信息量。因此，绝对熵在实践中无法确切定义和使用。

---

### **2. 连续信源的相对熵 (差熵)** 📐

尽管绝对熵发散，但其表达式中的有限部分具有重要意义，该部分被定义为<font color="orange">相对熵</font>或<font color="orange">差熵 (Differential Entropy)</font>。

> **定义 4.4.1：连续信源的相对熵**
>
> $\boxed{h(X) = -\int_a^b p(x)\log p(x)dx}$

**❗️ 重要说明**：相对熵 $h(X)$ **不再具备**信源平均信息量的物理内涵。它是一个相对度量，其绝对值意义有限，主要价值体现在计算信息量的差值（如互信息）时。

---

### **3. 连续信源的条件熵与互信息** 🤝

#### **3.1 相对条件熵**

与绝对熵类似，连续信源的<font color="orange">条件熵 H(X/Y)</font> 亦为无穷大。我们取其有限部分，定义为<font color="orange">相对条件熵</font>。

> **定义 4.4.3：连续信源的相对条件熵**
>
> $h(X/Y) = -\iint p(x,y) \log p(x|y) dx dy$

#### **3.2 平均互信息**

在计算平均互信息 $I(X;Y)$ 时，绝对熵中的无穷大项可以被抵消：

$I(X;Y) = H(X) - H(X/Y)$

代入含有无穷项的表达式：

$I(X;Y) = \left[h(X) - \lim_{\Delta\to 0} \log \Delta\right] - \left[h(X/Y) - \lim_{\Delta\to 0} \log \Delta\right]$

$I(X;Y) = h(X) - h(X/Y)$

**结论**：尽管连续信源的熵和条件熵是发散的，但它们的差值——<font color="orange">平均互信息</font>——是一个有限值。它依然准确地度量了一个随机变量包含另一个随机变量的信息量。

互信息的其他等价形式依然成立：
*   $I(X;Y) = h(Y) - h(Y/X)$
*   $I(X;Y) = h(X) + h(Y) - h(XY)$

---

### **4. 相对熵的最大化** 🏆

在特定约束条件下，存在使相对熵 $h(X)$ 达到最大值的概率分布。

1.  **峰值功率受限**：当信号幅度 $|x| \le A$ 时，<font color="orange">均匀分布</font>使相对熵最大。
    *   $p(x) = \frac{1}{2A}, \quad -A \le x \le A$
    *   $h_{max}(X) = \log(2A)$

2.  **均值受限**：当信号均值固定时，<font color="orange">指数分布</font>使相对熵最大。
    *   $p(x) = \frac{1}{a} e^{-x/a}, \quad x > 0$
    *   $h_{max}(X) = \log a$

3.  **平均功率受限**：当信号平均功率（方差）$\sigma^2$ 固定时，<font color="orange">高斯分布</font>使相对熵最大。
    *   $p(x) = \frac{1}{\sqrt{2\pi}\sigma} e^{-\frac{(x-m)^2}{2\sigma^2}}$
    *   $\boxed{h_{max}(X) = \log_2(\sqrt{2\pi e}\sigma)}$
    *   此结论是推导高斯信道容量的基础。

#### **核心方法：变分法与拉格朗日乘子法**

该问题属于约束下的泛函极值问题。我们的目标是找到一个函数 $p(x)$，使得泛函（一个函数的函数）$h(X)$ 取得最大值，同时该函数 $p(x)$ 还需要满足一些积分形式的约束条件。解决此类问题的标准数学工具是**变分法**中的**拉格朗日乘子法**。

**基本步骤：**
1.  **定义目标泛函**:
    $h(X) = -\int_S p(x) \ln p(x) dx$
    (为方便求导，我们使用自然对数 $\ln$，最终结果可以转换回 $\log_2$)
2.  **定义约束条件**: 所有概率分布都必须满足归一化条件，此外还有题目给定的其他约束。
    *   归一化约束: $\int_S p(x) dx = 1$
    *   其他约束 (一般形式): $\int_S g_k(x) p(x) dx = C_k$
3.  **构造拉格朗日泛函**:
    $J[p(x)] = -\int_S p(x) \ln p(x) dx - (\lambda_0 - 1)\left(\int_S p(x) dx - 1\right) - \sum_{k=1}^{m} \lambda_k \left(\int_S g_k(x) p(x) dx - C_k\right)$
    (将归一化约束的乘子写成 $\lambda_0-1$ 是一种惯例，可以使最终结果形式更简洁)
4.  **应用欧拉-拉格朗日方程**: 为了使 $J[p(x)]$ 取极值，其被积函数 $L$ 对 $p(x)$ 的偏导数必须为零。
    $L = -p(x) \ln p(x) - (\lambda_0 - 1)p(x) - \sum_{k=1}^{m} \lambda_k g_k(x) p(x)$
    $\frac{\partial L}{\partial p(x)} = -(\ln p(x) + 1) - (\lambda_0 - 1) - \sum_{k=1}^{m} \lambda_k g_k(x) = 0$
5.  **求解 $p(x)$**:
    $-\ln p(x) - \lambda_0 - \sum_{k=1}^{m} \lambda_k g_k(x) = 0$
    $\ln p(x) = -\lambda_0 - \sum_{k=1}^{m} \lambda_k g_k(x)$
    $p(x) = \exp\left(-\lambda_0 - \sum_{k=1}^{m} \lambda_k g_k(x)\right)$

这是一个通用的解形式。接下来我们将其应用于三种具体情况。

---

#### **1. 峰值功率受限 → 均匀分布**

**问题陈述**: 当随机变量 $X$ 的取值范围被严格限制在区间 $[a, b]$ 内时，求使 $h(X)$ 最大的 $p(x)$。

*   **约束条件**:
    1.  **归一化**: $\int_a^b p(x) dx = 1$
    2.  **支撑集**: $p(x) = 0$ for $x \notin [a, b]$

*   **推导**:
    该情况下，除了归一化之外没有其他形如 $\int g(x)p(x)dx=C$ 的约束。因此，通用解中的求和项为零 ($m=0$)。
    $p(x) = \exp(-\lambda_0)$

    这表明 $p(x)$ 是一个常数。我们设 $p(x) = K$。现在利用归一化约束来求解 $K$：
    $\int_a^b K dx = 1$
    $K \cdot [x]_a^b = 1$
    $K(b-a) = 1 \implies K = \frac{1}{b-a}$

*   **结论**:
    使熵最大的概率密度函数为：
    $p(x) = \begin{cases} \frac{1}{b-a} & a \le x \le b \\ 0 & \text{otherwise} \end{cases}$
    这正是**均匀分布**的定义。

---

#### **2. 均值受限 → 指数分布**

**问题陈述**: 当非负随机变量 $X$ ($x \ge 0$) 的均值 $E[X]$ 固定为 $\mu$ 时，求使 $h(X)$ 最大的 $p(x)$。

*   **约束条件**:
    1.  **归一化**: $\int_0^\infty p(x) dx = 1$
    2.  **固定均值**: $\int_0^\infty x \cdot p(x) dx = \mu$

*   **推导**:
    这里我们有两个约束，对应的 $g_0(x)=1$ 和 $g_1(x)=x$。根据通用解形式：
    $p(x) = \exp(-\lambda_0 - \lambda_1 x)$

    接下来，我们利用两个约束条件求解拉格朗日乘子 $\lambda_0$ 和 $\lambda_1$。
    1.  **代入归一化约束**:
        $\int_0^\infty \exp(-\lambda_0 - \lambda_1 x) dx = 1$
        $e^{-\lambda_0} \int_0^\infty e^{-\lambda_1 x} dx = 1$
        $e^{-\lambda_0} \left[ -\frac{1}{\lambda_1} e^{-\lambda_1 x} \right]_0^\infty = 1$
        为了使积分收敛，必须有 $\lambda_1 > 0$。此时 $e^{-\lambda_1 \infty} \to 0$。
        $e^{-\lambda_0} \left( 0 - (-\frac{1}{\lambda_1}) \right) = 1 \implies e^{-\lambda_0} \frac{1}{\lambda_1} = 1 \implies e^{-\lambda_0} = \lambda_1$

    2.  **代入均值约束**:
        $\int_0^\infty x \cdot p(x) dx = \mu$
        $\int_0^\infty x \cdot \exp(-\lambda_0 - \lambda_1 x) dx = \mu$
        $e^{-\lambda_0} \int_0^\infty x e^{-\lambda_1 x} dx = \mu$
        这是一个标准的伽马函数积分，可以通过分部积分法求解，结果为 $1/\lambda_1^2$。
        $e^{-\lambda_0} \cdot \frac{1}{\lambda_1^2} = \mu$

    3.  **联立求解**:
        将 $e^{-\lambda_0} = \lambda_1$ 代入第二个方程：
        $\lambda_1 \cdot \frac{1}{\lambda_1^2} = \mu \implies \frac{1}{\lambda_1} = \mu \implies \lambda_1 = \frac{1}{\mu}$
        进而得到 $e^{-\lambda_0} = \frac{1}{\mu}$。

    将求得的参数代回 $p(x)$ 的表达式：
    $p(x) = e^{-\lambda_0} e^{-\lambda_1 x} = \frac{1}{\mu} e^{-x/\mu}$

*   **结论**:
    使熵最大的概率密度函数为：
    $p(x) = \begin{cases} \frac{1}{\mu} e^{-x/\mu} & x \ge 0 \\ 0 & x < 0 \end{cases}$
    这正是**指数分布**的定义。

---

#### **3. 平均功率受限 → 高斯分布**

**问题陈述**: 当随机变量 $X$ 的均值为 $m$，方差（平均功率，假设直流分量为0）为 $\sigma^2$ 时，求使 $h(X)$ 最大的 $p(x)$。为简化推导，我们先假设均值为0。

*   **约束条件 (均值为0)**:
    1.  **归一化**: $\int_{-\infty}^\infty p(x) dx = 1$
    2.  **固定方差**: $\int_{-\infty}^\infty x^2 \cdot p(x) dx = \sigma^2$
    (均值为0的约束 $\int x \cdot p(x) dx = 0$ 会自然满足)

*   **推导**:
    这里有两个主要约束，对应的 $g_0(x)=1$ 和 $g_1(x)=x^2$。根据通用解形式：
    $p(x) = \exp(-\lambda_0 - \lambda_2 x^2)$
    (如果加入均值约束 $\int x p(x)dx=0$，则通用解为 $p(x) = \exp(-\lambda_0 - \lambda_1 x - \lambda_2 x^2)$。但由于 $\int x \exp(-\lambda_0 - \lambda_1 x - \lambda_2 x^2) dx = 0$ 要求被积函数为奇函数或对称中心在0，这会迫使 $\lambda_1=0$。因此可以直接从简化形式开始。)

    利用两个约束求解 $\lambda_0$ 和 $\lambda_2$。
    1.  **代入归一化约束**:
        $\int_{-\infty}^\infty \exp(-\lambda_0 - \lambda_2 x^2) dx = 1$
        $e^{-\lambda_0} \int_{-\infty}^\infty e^{-\lambda_2 x^2} dx = 1$
        这是一个高斯积分，其值为 $\sqrt{\pi/\lambda_2}$。为了积分收敛，必须有 $\lambda_2 > 0$。
        $e^{-\lambda_0} \sqrt{\frac{\pi}{\lambda_2}} = 1 \implies e^{-\lambda_0} = \sqrt{\frac{\lambda_2}{\pi}}$

    2.  **代入方差约束**:
        $\int_{-\infty}^\infty x^2 \cdot p(x) dx = \sigma^2$
        $e^{-\lambda_0} \int_{-\infty}^\infty x^2 e^{-\lambda_2 x^2} dx = \sigma^2$
        这也是一个标准的高斯积分，其值为 $\frac{1}{2\lambda_2}\sqrt{\frac{\pi}{\lambda_2}}$。
        $e^{-\lambda_0} \cdot \frac{1}{2\lambda_2}\sqrt{\frac{\pi}{\lambda_2}} = \sigma^2$

    3.  **联立求解**:
        将 $e^{-\lambda_0} = \sqrt{\lambda_2/\pi}$ 代入第二个方程：
        $\sqrt{\frac{\lambda_2}{\pi}} \cdot \frac{1}{2\lambda_2}\sqrt{\frac{\pi}{\lambda_2}} = \sigma^2$
        $\frac{\lambda_2}{\pi} \cdot \frac{\pi}{2\lambda_2^2} = \sigma^2 \implies \frac{1}{2\lambda_2} = \sigma^2 \implies \lambda_2 = \frac{1}{2\sigma^2}$
        进而得到 $e^{-\lambda_0} = \sqrt{\frac{1/(2\sigma^2)}{\pi}} = \frac{1}{\sqrt{2\pi\sigma^2}}$

    将求得的参数代回 $p(x)$ 的表达式：
    $p(x) = e^{-\lambda_0} e^{-\lambda_2 x^2} = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{x^2}{2\sigma^2}\right)$

*   **结论**:
    使熵最大的概率密度函数为**高斯（正态）分布**。如果均值不为0，而是固定为 $m$，则分布形式为：
    $p(x) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{(x-m)^2}{2\sigma^2}\right)$

---

### **5. 加性高斯白噪声 (AWGN) 信道容量** 📡

AWGN信道是通信系统中最基本和重要的模型。

**信道模型**: $Y = X + N$
*   $X$: 输入信号，平均功率为 $S = \sigma_x^2$
*   $N$: 高斯白噪声，均值为0，平均功率为 $N_{pwr} = \sigma_n^2$
*   $Y$: 输出信号
*   假设 $X$ 与 $N$ 统计独立。

**信道容量**定义为在所有可能的输入分布 $p(x)$ 下，平均互信息的最大值：

$C = \max_{p(x)} I(X;Y)$

#### **推导过程**

1.  **互信息表达式**: $I(X;Y) = h(Y) - h(Y|X)$
2.  **条件熵简化**: 由于 $Y=X+N$ 且 $X, N$ 独立，在给定 $X=x$ 的条件下，$Y$ 的不确定性完全来源于噪声 $N$。因此，$h(Y|X) = h(N)$。该值是与输入分布 $p(x)$ 无关的常数。
3.  **容量公式**: $C = \max_{p(x)} [h(Y) - h(N)] = \max_{p(x)} h(Y) - h(N)$
4.  **最大化 $h(Y)$**: 输出信号 $Y$ 的平均功率为 $\sigma_y^2 = \sigma_x^2 + \sigma_n^2 = S + N_{pwr}$。根据熵最大化原理，在平均功率固定的条件下，当 $Y$ 服从高斯分布时，其相对熵 $h(Y)$ 达到最大值。由于 $N$ 是高斯分布，当输入 $X$ 也服从高斯分布时，$Y=X+N$ 亦为高斯分布。
5.  **计算容量**:
    *   最大输出熵: $h_{max}(Y) = \frac{1}{2} \log_2(2\pi e \sigma_y^2) = \frac{1}{2} \log_2(2\pi e (S+N_{pwr}))$
    *   噪声熵: $h(N) = \frac{1}{2} \log_2(2\pi e \sigma_n^2) = \frac{1}{2} \log_2(2\pi e N_{pwr})$
    *   每个样本的最大互信息: $C_{sample} = h_{max}(Y) - h(N) = \frac{1}{2} \log_2\left(\frac{S+N_{pwr}}{N_{pwr}}\right) = \frac{1}{2} \log_2\left(1 + \frac{S}{N_{pwr}}\right)$
    *   对于带宽为 $W$ 的信道，根据采样定理，每秒最多可传输 $2W$ 个独立样本。因此，信道容量 $C$ (单位: bit/s) 为：
    $C = 2W \times C_{sample}$

最终得到<font color="orange">香农-哈特利定理 (Shannon-Hartley Theorem)</font>：

> **香农公式**
>
> $\boxed{C = W \log_2\left(1 + \frac{S}{N}\right)}$
>
> *   $C$: 信道容量 (bit/s)
> *   $W$: 信道带宽 (Hz)
> *   $S/N$: 信号与噪声的平均功率比 (信噪比)

---

### **6. 信道容量分析与香农限** 📊

#### **6.1 归一化分析**
![](content/notes/信息论与编码/2。连续信源/Pastedimage20250920115955.png)
![](content/notes/信息论与编码/2。连续信源/Pastedimage20250920120034.png)
![](content/notes/信息论与编码/2。连续信源/Pastedimage20250920120054.png)
*   **归一化信道容量 (频谱效率)**： $\frac{C}{W} = \log_2\left(1 + \frac{S}{N}\right)$
    该指标衡量单位带宽内可达到的最大信息速率，单位为 (bit/s)/Hz。

#### **6.2 香农限**

*   **$E_b$ (Energy per bit - 每比特能量)**：如果信号功率是 $S$ (能量/秒)，信息速率是 $C$ (比特/秒)，那么传输每个比特所消耗的平均能量就是：
    $E_b = \frac{S}{C}$ (单位: Joules/bit)
    反过来，我们可以得到一个至关重要的关系：$S = C \cdot E_b$

*   **$N_0$ (Noise power spectral density - 噪声功率谱密度)**：在AWGN信道模型中，噪声均匀分布在所有频率上。$N_0$ 定义为单位带宽内的噪声功率。因此，在带宽 $W$ 内的总噪声功率 $N$ 就是：
    $N = N_0 \cdot W$ (单位: Watts)

将 $S = C \cdot E_b$ 和 $N = N_0 \cdot W$ 代入原始的香农公式：
$C = W \log_2\left(1 + \frac{C \cdot E_b}{N_0 \cdot W}\right)$

为了分离出我们关心的比值 $E_b/N_0$，我们对上式进行整理：
$\frac{C}{W} = \log_2\left(1 + \frac{E_b}{N_0} \cdot \frac{C}{W}\right)$

这个公式建立了**频谱效率 ($C/W$)** 和**归一化信噪比 ($E_b/N_0$)** 之间的直接关系。它告诉我们，为了达到一定的频谱效率，我们必须付出相应的 $E_b/N_0$ 代价。

香农公式告诉我们，带宽 $W$ 和信噪比 $S/N$ 是可以互换的。为了找到能量的绝对下限，我们可以假设我们拥有最理想的、最奢侈的资源——**无限的带宽** ($W \to \infty$)。这意味着我们可以用极宽的频带来传输极低功率的信号。

当 $W \to \infty$ 时，频谱效率 $C/W \to 0$。我们令 $x = \frac{E_b}{N_0} \cdot \frac{C}{W}$。
原方程变为：
$\frac{C}{W} = \log_2(1+x)$

由于 $x = \frac{E_b}{N_0} \cdot \frac{C}{W}$，我们可以写出：
$\frac{x}{E_b/N_0} = \log_2(1+x)$

整理得到：
$\frac{E_b}{N_0} = \frac{x}{\log_2(1+x)} = \frac{x \ln 2}{\ln(1+x)}$ (使用换底公式 $\log_2 A = \frac{\ln A}{\ln 2}$)

现在我们考察当 $W \to \infty$ 时会发生什么。此时 $C/W \to 0$，进而 $x = \frac{E_b}{N_0} \cdot \frac{C}{W} \to 0$。我们需要计算 $x \to 0$ 时的极限：
$\lim_{x \to 0} \frac{E_b}{N_0} = \lim_{x \to 0} \frac{x \ln 2}{\ln(1+x)}$

这是一个 $0/0$ 型的极限，我们可以使用洛必达法则，或者使用一个更基本的极限 $\lim_{x \to 0} \frac{\ln(1+x)}{x} = 1$。
因此：
$\lim_{x \to 0} \frac{E_b}{N_0} = \ln 2 \cdot \lim_{x \to 0} \frac{x}{\ln(1+x)} = \ln 2 \cdot 1 = \ln 2$

这个极限计算告诉我们：
$\frac{E_b}{N_0} \ge \ln 2 \approx 0.693$

换算成 dB：
$10 \log_{10}(\ln 2) \approx -1.59 \text{ dB}$

这就是**香农限**。这个推导过程表明，无论你如何设计通信系统，只要你想实现可靠的（错误率可以任意小）通信，你传输的每比特能量与噪声功率谱密度之比，**最低也必须是 $\ln 2$**。这是一个不可逾越的物理常数。

$\frac{E_b}{N_0} \ge \ln 2 \approx 0.693 \implies -1.59 \text{ dB}$

> **香农限 (Shannon Limit)**
> 在带宽不受限的 AWGN 信道中，为实现无差错通信，每比特信号能量与噪声功率谱密度之比 $E_b/N_0$ 必须不低于 **-1.6 dB**。此值为所有编码和调制方式所能达到的理论性能极限。

---

### **7. 例题解析** ✍️

#### **例题 1**
*   **问题**: $R_s = 5.6$ kbit/s, $N_0 = 5 \times 10^{-6}$ mW/Hz, $B = 4$ kHz。求无差错传输的最小输入功率 $P$。
*   **解**: 无差错传输条件为 $C \ge R_s$。
    $B \log_e(1 + \frac{P}{N_0 B}) \ge R_s$
    $P \ge N_0 B (e^{R_s/B} - 1)$
    $P \ge (5 \times 10^{-6}) \times (4 \times 10^3) \times (e^{5.6/4} - 1) \approx 6.1 \times 10^{-2} \text{ mW}$

#### **例题 2**
*   **问题**: $2.25 \times 10^5$ 像素/帧, 16个等概亮度电平, 30 帧/秒, SNR = 30 dB。求所需带宽 $B$。
*   **解**:
    1.  **计算信息速率 $C_t$**:
        *   $H(X) = \log_2 16 = 4$ bit/像素
        *   $I_{frame} = (2.25 \times 10^5) \times 4 = 9 \times 10^5$ bit/帧
        *   $C_t = 30 \times (9 \times 10^5) = 2.7 \times 10^7$ bit/s
    2.  **计算带宽 $B$**:
        *   $S/N = 10^{30/10} = 1000$
        *   $B = \frac{C_t}{\log_2(1 + S/N)} = \frac{2.7 \times 10^7}{\log_2(1001)} \approx \frac{2.7 \times 10^7}{9.97} \approx 2.7 \text{ MHz}$

---

### **🌟 本章总结**

1.  **熵的扩展**: 通过离散化和极限逼近的方法，将熵的概念从离散域扩展至连续域，并引入了<font color="orange">相对熵（差熵）</font>的概念以处理绝对熵发散的问题。
2.  **互信息的普适性**: 证明了对于连续信源，尽管熵是无穷的，但<font color="orange">平均互信息</font>依然是有限的、有意义的物理量，其计算公式与离散形式一致。
3.  **熵最大化原理**: 明确了在不同约束条件下使相对熵最大的概率分布。其中，平均功率受限下<font color="orange">高斯分布</font>熵最大的结论，是推导信道容量的核心。
4.  **香农-哈特利定理**: 推导了通信理论的基石——<font color="orange">AWGN信道容量公式</font> $C = W \log_2(1 + S/N)$，它定量地揭示了信道容量、带宽和信噪比三者之间的制约关系。
5.  **通信的理论极限**: 引入了<font color="orange">香农限</font>的概念，指出了在AWGN信道中实现可靠通信所需的最小 $E_b/N_0$ (约为-1.6 dB)，为通信系统设计提供了最终的性能基准。