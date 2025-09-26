---
title: 第四章 组合逻辑电路
date: 2025-09-26T10:00:00+08:00
tags:
  - 大三上
  - 数字系统设计
summary: 深入学习了组合逻辑电路，学习了如何描述和实现一系列核心的组合逻辑模块。
---
## 📜 本章目录
-   概述
-   基本逻辑门电路的设计
-   译码器的设计
-   编码器的设计
-   加法器的设计
-   其它组合模块的设计

---

## 1. 概述 🌟

### 1.1 组合逻辑电路与时序逻辑电路
数字电路根据其逻辑功能特点，可以分为两大类：

*   🧠 **<font color="orange">组合逻辑电路</font>**：其特点是任意时刻的输出**仅仅取决于该时刻的输入**，与电路原来的状态无关。它没有记忆功能。
*   ⏳ **<font color="orange">时序逻辑电路</font>**：其特点是任意时刻的输出不仅取决于当时的输入信号，**还取决于电路原来的状态**（或者说，与以前的输入有关）。它具有记忆功能。

**【例子】**
一个3-8译码器，其输出（Y1到Y8）只与当前的输入（A1, A2, A3）和片选信号（S1, S2, S3）有关，而与这些信号之前的状态无关，因此它是一个典型的组合逻辑电路。

### 1.2 组合逻辑电路的结构特点
*   **逻辑上**：电路在任一时刻的输出状态仅由该时刻的输入信号决定，**无记忆功能**。
*   **结构上**：电路都是由逻辑门组成的，且**输出到输入之间不存在反馈路径**。



> **常用的组合逻辑电路**：简单门电路、选择器、译码器、三态门等。

### 1.3 组合逻辑电路的设计方法
#### 1. 传统设计方法 🛠️
采用标准组件进行设计。
1.  **逻辑问题描述**：将设计需求转化为一个逻辑问题。
2.  **逻辑函数简化**：将逻辑问题写成逻辑函数表达式，并进行化简，得到最简表达式。
3.  **逻辑函数转换**：根据所选用的门电路类型（如与非门、或非门），将表达式变换为所需形式。
4.  **画逻辑图**：根据最终的表达式画出电路图，并考虑实际工程问题。

#### 2. EDA设计方法 💻
使用可编程逻辑器件，用硬件描述语言（如VHDL）进行设计。
1.  **逻辑问题描述**：同传统方法。
2.  **硬件语言描述**：根据逻辑问题，用硬件描述语言进行功能描述。
3.  **综合与仿真**：对代码进行综合（转换成电路），并进行仿真测试，验证功能正确性。
4.  **下载到芯片**：生成最终的网表文件，下载到目标芯片中。

#### 3. 两种方法对比
| 特性 | 传统设计方法 | EDA设计方法 |
| :--- | :---: | :---: |
| **设计方式** | 🧑‍🔧 人工为主 | 🖥️ 电脑辅助为主 |
| **设计过程** | 🤯 复杂 | 😊 简单 |
| **可读性** | 📉 低 | 📈 高 |
| **移植性** | 📉 低 | 📈 高 |
| **错误修正** | 😥 麻烦 | 😄 容易 |
| **正确性检验** | 😥 麻烦 | 😄 容易 |

---

## 2. 基本逻辑门电路的设计 💡
数字电路的基本操作包括与、或、非（组合逻辑）以及触发器（时序逻辑）。本节以**二输入与非门**为例，介绍如何用VHDL进行设计。

*   **电路描述**：二输入与非门（NAND）有两个输入端和一个输出端，输出是两个输入信号逻辑“与”之后再“非”的结果。
*   **真值表**：

| A | B | C (Y) |
|:---:|:---:|:---:|
| 0 | 0 | 1 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

#### VHDL代码实现
```vhdl
-- 引入IEEE标准库
Library IEEE;
Use IEEE.std_logic_1164.all;

-- 定义实体（Entity），即电路的接口
Entity nand2 is
    port ( a, b: in std_logic;      -- 两个输入端口 a, b
           y: out std_logic);     -- 一个输出端口 y
End nand2;

-- 定义结构体（Architecture），描述电路的具体行为
Architecture behav of nand2 is
Begin
    -- 并行赋值语句，使用 nand 操作符
    y <= a nand b;
End behav;
```
> **注意点** 📌
> *   VHDL提供了逻辑操作符，如 `nand`。
> *   若要实现二输入或非门（NOR），只需将 `nand` 替换为 `nor` 即可。

---

## 3. 译码器的设计 🔢

### 3.1 什么是译码器 (Decoder)
<font color="orange">译码器</font>是一种多输入、多输出的组合逻辑电路。
*   **功能**：将具有特定含义的输入代码“翻译”成相应的输出信号。
*   **工作方式**：输入为一组二进制代码，输出为一组高低电平信号。对于每一组不同的输入代码，通常只有一个输出呈**有效状态**。

### 3.2 译码器的分类
1.  **变量译码器**：将输入的N位二进制代码翻译成 $2^N$ 个对应的输出信号。
2.  **码制变换译码器**：将一种编码（如BCD码）转换为另一种编码。
3.  **显示译码器**：驱动数码管等显示设备，如七段数码管译码器。
4.  **地址译码器**：在存储器或I/O接口电路中，将地址信号翻译成片选或控制信号。

### 3.3 3-8译码器设计实例 (74LS138)
*   **功能**：将3位二进制输入（a, b, c）译码成8个输出（y0-y7）。
*   **使能端**：有三个选通/使能信号（g1, g2a, g2b）。只有当 **g1='1', g2a='0', g2b='0'** 时，译码器才正常工作。
*   **有效电平**：输出为**<font color="orange">低电平有效</font>**，即选中的那一路输出为'0'，其他为'1'。

#### VHDL代码实现
```vhdl
Library IEEE;
Use IEEE.std_logic_1164.all;

Entity decoder_38 is
    Port ( a, b, c, g1, g2a, g2b: in std_logic;
           y: out std_logic_vector (7 downto 0) );
End decoder_38;

Architecture behav of decoder_38 is
    -- 定义一个内部信号，用于合并输入的a, b, c
    Signal indata : std_logic_vector(2 downto 0);
Begin
    -- 将 c, b, a 合并成一个3位的向量 indata
    -- c是最高位
    indata <= c & b & a;

    -- 进程（Process）语句
    Process( indata, g1, g2a, g2b)
    Begin
        -- 首先判断使能条件
        if (g1='1' and g2a='0' and g2b='0') then
            -- 使用 case 语句根据 indata 的值进行译码
            case indata is
                when "000" => y <= "11111110"; -- y0有效 (低电平)
                when "001" => y <= "11111101"; -- y1有效
                when "010" => y <= "11111011"; -- y2有效
                when "011" => y <= "11110111"; -- y3有效
                when "100" => y <= "11101111"; -- y4有效
                when "101" => y <= "11011111"; -- y5有效
                when "110" => y <= "10111111"; -- y6有效
                when "111" => y <= "01111111"; -- y7有效
                when others => y <= "XXXXXXXX"; -- 其他情况为不关心
            end case;
        else
            -- 如果未使能，所有输出为高电平 (无效)
            y <= "11111111";
        end if;
    End process;
End behav;
```
> **注意点** 📌
> *   `&` 是VHDL中的**位合并**操作符。
> *   `process` 语句的敏感列表 `(indata, g1, g2a, g2b)` 中包含了所有影响输出的信号，当其中任何一个信号变化时，进程都会被触发执行。
> *   `case` 语句也可以用一系列 `if-elsif-else` 语句来改写。

---

## 4. 编码器的设计 ✒️

### 4.1 什么是编码器 (Encoder)
<font color="orange">编码器</font>的功能与译码器相反。
*   **功能**：将输入信号（如一组高低电平）编制、转换成特定格式的输出代码（如二进制码）。
*   **工作方式**：输入是一组高低电平信号，输出是一组二进制代码。

### 4.2 优先级编码器 (Priority Encoder)
当编码器有多个输入同时有效时，普通编码器可能无法工作或输出错误。**<font color="orange">优先级编码器</font>**解决了这个问题。
*   **功能**：它会为所有输入规定一个优先级。当多个输入同时有效时，只对**优先级最高的那个输入**进行编码。
*   **实例**：74LS148是一个8输入、3位输出的优先级编码器，输入低电平有效。输入`input(7)`优先级最高，`input(0)`最低。

#### VHDL代码实现
```vhdl
Library IEEE;
Use IEEE.std_logic_1164.all;

Entity priorityencoder is
    Port ( input : in std_logic_vector (7 downto 0);
           y     : out std_logic_vector(2 downto 0) );
End priorityencoder;

Architecture behav of priorityencoder is
Begin
    Process(input)
    Begin
        -- if-elsif 结构天生就带有优先级
        -- 会从上到下依次判断，第一个满足条件的即执行
        if (input(7)='0') then      -- 最高优先级
            y <= "111";
        elsif (input(6)='0') then
            y <= "110";
        elsif (input(5)='0') then
            y <= "101";
        elsif (input(4)='0') then
            y <= "100";
        elsif (input(3)='0') then
            y <= "011";
        elsif (input(2)='0') then
            y <= "010";
        elsif (input(1)='0') then
            y <= "001";
        elsif (input(0)='0') then  -- 最低优先级
            y <= "000";
        else
            y <= "XXX"; -- 没有有效输入
        end if;
    End process;
End behav;
```
> **易错点** 💥
> `if-elsif` 语句是一种流程控制语句，判断条件有**先后次序**。这使得它非常适合用来描述优先级编码器。例如，当 `input` 为 `"01011111"` 时，`input(7)`和`input(5)`都有效（为'0'），但因为程序先判断 `input(7)`，所以最终输出对应 `input(7)` 的编码 `"111"`。

---

## 5. 加法器的设计 ➕

### 5.1 加法器简介
<font color="orange">加法器</font>是数字系统中最基本的运算单元，用于实现加法运算。减、乘、除等运算最终都可以转换为加法。加法器分为**半加器**和**全加器**。

| 特性 | 半加器 (Half Adder) | 全加器 (Full Adder) |
| :--- | :---: | :---: |
| **功能** | 两个1位数相加 | 两个1位数和来自低位的进位相加 |
| **输入个数** | 2 | 3 |
| **输出个数** | 2 (和, 进位) | 2 (和, 进位) |
| **是否考虑低位进位** | ❌ 不考虑 | ✅ 考虑 |

### 5.2 半加器
*   **功能**：实现两个1位二进制数相加。
*   **输入**：`X`, `Y`
*   **输出**：和 `Sum`, 向高位的进位 `Carry`
*   **逻辑表达式**：
    *   $Sum = X \oplus Y$
    *   $Carry = X \cdot Y$

#### VHDL代码
```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY halfadder IS
    PORT( X,Y : in std_logic;
          Sum,Carry : out std_logic);
END halfadder;

ARCHITECTURE a OF halfadder IS
BEGIN
    Sum <= X xor Y;
    Carry <= X and Y;
END a;
```

### 5.3 全加器
*   **功能**：实现两个1位二进制数与一个来自低位的进位数相加。
*   **输入**：`X`, `Y` (加数), `Z` (或 `Cin`, 低位进位)
*   **输出**：和 `Sum`, 向高位的进位 `Carry`
*   **逻辑表达式**：
    *   $Sum = X \oplus Y \oplus Z$
    *   $Carry = (X \cdot Y) + (Y \cdot Z) + (Z \cdot X)$

#### VHDL代码
```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY full_add IS
    PORT ( X,Y,Z:in bit;
           Sum,Carry:out bit);
END full_add;

ARCHITECTURE a OF full_add IS
BEGIN
    Sum <= X xor Y xor Z;
    Carry <= (X and Y) or (Y and Z) or (Z and X);
END a;
```

### 5.4 多位加法器

#### 1. 串行进位加法器 (Ripple-Carry Adder) 🚶‍♂️➡️➡️➡️

这种加法器通过将多个**1位全加器 (Full Adder)** 级联起来实现。它的结构简单直观，就像一排多米诺骨牌，低位的进位 (`cout`) 会“串行”地传递给高一位的进位输入 (`cin`)。

##### 实现步骤：
1.  首先，我们需要一个1位全加器的基本模块。
2.  然后，在顶层模块中，我们像搭积木一样，将4个1位全加器连接起来。

##### VHDL 代码实现

**模块一：1位全加器 (full_adder.vhd)**
```vhdl
-- 引入IEEE标准库
library ieee;
use ieee.std_logic_1164.all;

-- 定义1位全加器的实体
entity full_adder is
    port (
        a   : in  std_logic; -- 输入a
        b   : in  std_logic; -- 输入b
        cin : in  std_logic; -- 低位进位输入
        s   : out std_logic; -- 本位和输出
        cout: out std_logic  -- 向高位的进位输出
    );
end entity full_adder;

-- 定义1位全加器的行为结构体
architecture behavioral of full_adder is
begin
    -- 计算本位和
    s <= a xor b xor cin;
    -- 计算向高位的进位
    cout <= (a and b) or (a and cin) or (b and cin);
end architecture behavioral;
```

**模块二：4位串行进位加法器 (ripple_carry_adder_4bit.vhd)**
```vhdl
library ieee;
use ieee.std_logic_1164.all;

-- 定义4位串行进位加法器的实体
entity ripple_carry_adder_4bit is
    port (
        a   : in  std_logic_vector(3 downto 0); -- 4位输入a
        b   : in  std_logic_vector(3 downto 0); -- 4位输入b
        cin : in  std_logic;                      -- 初始进位输入
        sum : out std_logic_vector(3 downto 0); -- 4位和输出
        cout: out std_logic                       -- 最终进位输出
    );
end entity ripple_carry_adder_4bit;

-- 定义结构化描述的结构体
architecture structural of ripple_carry_adder_4bit is

    -- 1. 将1位全加器声明为一个元件(Component)
    component full_adder is
        port (
            a   : in  std_logic;
            b   : in  std_logic;
            cin : in  std_logic;
            s   : out std_logic;
            cout: out std_logic
        );
    end component full_adder;

    -- 2. 定义一个内部信号，用于连接各个全加器之间的进位
    signal c_ripple : std_logic_vector(4 downto 0);

begin

    -- 3. 将外部的初始进位连接到内部进位信号的最低位
    c_ripple(0) <= cin;

    -- 4. 使用 for...generate 语句例化4个全加器
    --    这是一种优雅的结构化描述方式
    GEN_FULL_ADDERS: for i in 0 to 3 generate
        -- 例化一个名为 U_FA 的 full_adder 元件
        U_FA: entity work.full_adder(behavioral)
            port map (
                a    => a(i),                -- 当前位的 a
                b    => b(i),                -- 当前位的 b
                cin  => c_ripple(i),         -- 来自上一级的进位
                s    => sum(i),              -- 当前位的和
                cout => c_ripple(i + 1)      -- 向下一级的进位
            );
    end generate GEN_FULL_ADDERS;

    -- 5. 将内部进位信号的最高位连接到最终的进位输出
    cout <= c_ripple(4);

end architecture structural;
```

#### ✨ 代码解析
*   <font color="orange">**结构化描述**</font>：这种方法清晰地展示了电路的物理结构，即由4个 `full_adder` 串联而成。
*   `component`：用于在当前设计中声明一个即将被例化（使用）的、已存在的设计实体。
*   `for...generate`：这是一个强大的语句，可以在编译时自动生成重复的硬件结构。这里它为我们生成了4个全加器的实例，并自动处理了索引 `i`，将它们正确地连接起来。
*   `c_ripple` 信号：这是关键的“链条”，它将第 `i` 位的 `cout` 连接到第 `i+1` 位的 `cin`，实现了进位的串行传递。

---

#### 2. 并行进位加法器 (Carry-Lookahead Adder) 🚀

为了克服串行进位的速度瓶颈，并行进位加法器采用了一种“预判”机制。它不等待低位进位，而是通过专门的**<font color="orange">先行进位逻辑</font>**，根据所有输入位 (`a` 和 `b`) 和初始进位 `cin`，**同时**计算出每一位的进位。

##### 核心逻辑：
1.  **进位产生项 (Generate)**: $G_i = a_i \cdot b_i$。当 $a_i$ 和 $b_i$ 都为1时，本位**必定**产生一个进位。
2.  **进位传递项 (Propagate)**: $P_i = a_i \oplus b_i$。当 $a_i$ 和 $b_i$ 中只有一个为1时，本位是否产生进位，**取决于**低位的进位 $C_{i-1}$ 是否能传递过来。
3.  **进位逻辑表达式**:
    $C_1 = G_0 + P_0C_0$
    $C_2 = G_1 + P_1G_0 + P_1P_0C_0$
    ...
    每一位的进位都可以直接由输入和 $C_0$ 算出。

##### VHDL 代码实现
这里我们使用**数据流/行为描述**的方式，直接实现其逻辑方程。
```vhdl
library ieee;
use ieee.std_logic_1164.all;

-- 实体定义与串行加法器相同
entity carry_lookahead_adder_4bit is
    port (
        a   : in  std_logic_vector(3 downto 0);
        b   : in  std_logic_vector(3 downto 0);
        cin : in  std_logic;
        sum : out std_logic_vector(3 downto 0);
        cout: out std_logic
    );
end entity carry_lookahead_adder_4bit;

architecture behavioral of carry_lookahead_adder_4bit is
    -- 定义进位产生项(G)和进位传递项(P)的内部信号
    signal g, p: std_logic_vector(3 downto 0);
    -- 定义内部的进位信号
    signal c   : std_logic_vector(4 downto 0);
begin
    -- 1. 并行计算所有位的 G 和 P 项
    g <= a and b; -- g(i) <= a(i) and b(i)
    p <= a xor b; -- p(i) <= a(i) xor b(i)

    -- 2. 将初始进位赋给 c(0)
    c(0) <= cin;

    -- 3. 并行计算每一位的进位 (核心先行进位逻辑)
    c(1) <= g(0) or (p(0) and c(0));
    c(2) <= g(1) or (p(1) and g(0)) or (p(1) and p(0) and c(0));
    c(3) <= g(2) or (p(2) and g(1)) or (p(2) and p(1) and g(0)) or (p(2) and p(1) and p(0) and c(0));
    c(4) <= g(3) or (p(3) and g(2)) or (p(3) and p(2) and g(1)) or (p(3) and p(2) and p(1) and g(0)) or (p(3) and p(2) and p(1) and p(0) and c(0));

    -- 4. 并行计算每一位的和
    sum <= p xor c(3 downto 0); -- sum(i) = p(i) xor c(i)

    -- 5. 输出最终的进位
    cout <= c(4);

end architecture behavioral;
```

#### ✨ 代码解析
*   <font color="orange">**行为/数据流描述**</font>：代码直接描述了信号之间的数学和逻辑关系，而不是电路的物理连接结构。
*   **并行性**：VHDL中的所有信号赋值语句都是**并行执行**的。这意味着 `g`, `p` 和所有 `c(i)` 的计算是同时开始的。综合器会根据这些方程生成一个复杂的组合逻辑电路，这个电路没有串行依赖，因此速度非常快。
*   **速度优势**：计算延迟主要取决于最复杂的进位表达式 `c(4)` 的逻辑门延迟，而不是4个全加器的延迟之和。

### 总结对比
| 特性 | 串行进位加法器 (Ripple-Carry) | 并行进位加法器 (Carry-Lookahead) |
| :--- | :--- | :--- |
| **结 构** | 简单，规则，易于扩展 | 复杂，不规则，位数增加时逻辑急剧复杂化 |
| **速 度** | 慢，延迟与位数 N 成正比 | 快，延迟与位数 N 的对数成正比 |
| **资源消耗**| 较少，仅为 N 个全加器 | 较多，需要额外的先行进位逻辑电路 |
| **设计方式** | 常用<font color="orange">结构化描述</font>（例化元件） | 常用<font color="orange">行为/数据流描述</font>（逻辑方程） |


---

## 6. 其它组合逻辑模块的设计 🧩

### 6.1 多路选择器 (Multiplexer, MUX)
*   **功能**：在地址选择信号的控制下，从多路输入数据中选择**一路**作为输出。
*   **实例**：4选1数据选择器，有4路数据输入（`input(3)`-`input(0)`），2个地址选择输入（`a`, `b`），1个输出（`y`）。

#### VHDL代码 (4选1 MUX)
```vhdl
Library IEEE;
Use IEEE.std_logic_1164.all;

Entity mux4 is
    port ( input : in std_logic_vector (3 downto 0); -- 4路数据输入
           a, b: in std_logic;                       -- 2位地址选择
           y: out std_logic );                      -- 1路输出
End mux4;

Architecture behav of mux4 is
    signal sel :std_logic_vector(1 downto 0);
Begin
    sel <= b & a; -- 合并地址信号
    process(input, sel)
    begin
        if (sel="00") then y <= input(0);
        elsif (sel="01") then y <= input(1);
        elsif (sel="10") then y <= input(2);
        elsif (sel="11") then y <= input(3);
        else y <= 'Z'; -- 高阻态
        end if;
    end process;
End behav;
```

### 6.2 求补器 (Two's Complementer)
*   **功能**：将输入信号转换成其**补码**输出。
*   **补码定义** (定点整数)：
    $$
    [x]_{补} = \begin{cases}
    x & x \ge 0 \\
    2^{n+1} + x & x < 0
    \end{cases}
    $$
*   **快捷算法**：对于一个二进制数，其补码等于**<font color="orange">按位取反，再加1</font>**。
*   **VHDL实现**：
    ```vhdl
    -- 假设 a 是8位输入, b 是8位输出
    b <= not a + '1';
    ```

### 6.3 三态门 (Tri-state Gate)
*   **功能**：三态门的输出有三种状态：高电平('1')、低电平('0') 和 **<font color="orange">高阻态('Z')</font>**。高阻态相当于断开，对总线没有影响。
*   **应用**：常用于总线接口电路，允许多个设备共享同一条总线。通过一个使能信号 `EN` 控制门电路的通断。

#### VHDL代码
```vhdl
-- en: 使能信号, din: 输入, dout: 输出
process (din,en)
begin
    if (en='1') then    -- 使能时，正常输出
        dout <= din;
    else                -- 禁能时，输出高阻态
        dout <= 'Z';
    end if;
end process;
```

### 6.4 缓冲器 (Buffer)
*   **功能**：又称缓冲寄存器，在总线传输中起**数据暂存**的作用，用于协调不同速度设备之间的数据传输。
*   **分类**：
    *   **单向缓冲器**：数据只能单向流动。
    *   **双向缓冲器**：在单向缓冲器基础上加入了方向控制端 `dr`，使数据可以双向传输。

#### 双向缓冲器控制逻辑
*   `en`：选通端，`en='0'` 时选通。
*   `dr`：方向控制端。
    *   当 `dr='1'` 时，`a` 作输入，`b` 作输出。
    *   当 `dr='0'` 时，`b` 作输入，`a` 作输出。

---

## 📚 本章学习总结
本章我们深入学习了**组合逻辑电路**，这是数字电路设计的基础。

1.  **核心概念**：我们明确了组合逻辑电路的定义——输出仅取决于当前输入，无记忆功能。并将其与时序逻辑电路进行了区分。
2.  **设计方法**：了解了从传统的手动化简到现代基于EDA和硬件描述语言（VHDL）的设计流程的演变，后者在效率、可读性和可维护性上具有巨大优势。
3.  **基本构建模块**：通过VHDL，我们学习了如何描述和实现一系列核心的组合逻辑模块：
    *   **基本门电路** (与非门、或非门)
    *   **译码器**，特别是带使能和低电平有效输出的3-8译码器。
    *   **编码器**，重点掌握了使用 `if-elsif` 结构实现**优先级编码器**的方法。
    *   **加法器**，从半加器、全加器到多位加法器，理解了串行进位（速度慢、结构简单）和并行进位（速度快、逻辑复杂）两种实现方式及其权衡。
    *   **其他常用模块**，如数据选择器(MUX)、求补器、用于总线控制的三态门和数据缓冲器。
4.  **VHDL关键语法**：通过实例巩固了VHDL中描述组合逻辑的关键语法，如 `entity` 和 `architecture` 的结构，`process` 敏感列表，并行信号赋值，以及 `if`, `case`, `component` 例化等流程控制和结构化设计语句。

总而言之，本章为我们后续学习更复杂的时序逻辑电路和完整的数字系统设计打下了坚实的基础。