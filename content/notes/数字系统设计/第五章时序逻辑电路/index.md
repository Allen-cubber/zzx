---
title: 第五章 时序逻辑电路
tags:
  - 大三上
  - 数字系统设计
date: 2025-09-30T10:00:00+08:00
summary: 本章将深入探讨数字电路中具有记忆功能的关键部分——时序逻辑电路。
---
### 📜 本章内容

*    📜 **概述**
*    🔒 **锁存器的设计**
*    ⏰ **触发器的设计**
*    📦 **寄存器的设计**
*    🔢 **计数器的设计**
*    ✖️ **乘法器的设计**

---

## 一、概述 🧐

数字电路根据其逻辑功能特点，可以分为两大类：组合逻辑电路和时序逻辑电路。

### 什么是时序逻辑电路？

时序逻辑电路是一种其<font color="orange">**输出不仅取决于当前的输入，还与电路之前的状态（原始状态）有关**</font>的电路。

*   **结构上**：它由<font color="orange">**组合逻辑电路**</font>和<font color="orange">**存储电路**</font>两部分组成。存储电路的输出会作为反馈信号，再次输入到组合逻辑电路中，从而实现了“记忆”功能。
*   **逻辑上**：它引入了**现态**（当前状态）和**次态**（下一个状态）的概念。



#### 逻辑关系表达式

时序逻辑电路的行为可以通过一组方程来描述：

$$
\boxed{
    \begin{cases}
        z_m = f_m(x_1, \dots, x_n, q_1^n, \dots, q_j^n) & \text{-- 输出方程} \\\\\\
        y_k = g_k(x_1, \dots, x_n, q_1^n, \dots, q_j^n) & \text{-- 驱动方程} \\\\\\
        q_j^{n+1} = h_j(y_1, \dots, y_k, q_1^n, \dots, q_j^n) & \text{-- 状态方程}
    \end{cases}
}
$$

其中，$x$ 是输入，$z$ 是输出，$q^n$ 是现态，$q^{n+1}$ 是次态，$y$ 是存储电路的激励（驱动信号）。

### 时序电路的分类

#### 1. 按触发器动作特点分

*   **同步时序逻辑电路** ⏱️
    *   所有存储元件（触发器）的状态变化都在**同一个时钟信号**的有效边沿同步发生。
    *   这是目前绝大多数数字系统采用的设计方式。
*   **异步时序逻辑电路** 🌊
    *   没有统一的时钟信号，各个存储元件的状态变化有先有后，不是同时发生的。
    *   设计复杂，通常只用于小型、特定的应用。

#### 2. 按输出信号的特点分

*   **米里 (Mealy) 型**
    *   输出不仅与存储电路的**当前状态 (Q)** 有关，还与**外部输入 (X)** 直接相关。
*   **摩尔 (Moore) 型**
    *   输出**仅**与存储电路的**当前状态 (Q)** 有关，与当前输入无直接关系。

### 同步时序逻辑电路详解

*   **优点** 👍：
    *   设计简单、可靠。电路中的所有运算必须在一个时钟周期内完成。
*   **缺点** 👎：
    *   **功耗大**：时钟信号需要驱动电路中所有的触发器，无论其是否需要更新状态。
    *   **频率受限**：最高工作频率由电路中<font color="orange">最慢的逻辑路径（关键路径）</font>决定。

---

## 二、锁存器的设计 🔒

<font color="orange">**锁存器 (Latch)**</font> 是一种对**电平敏感**的存储元件。当使能信号有效时，输出会跟随输入变化；当使能信号无效时，输出保持不变。

### 1. RS锁存器

由两个交叉耦合的与非门构成。

*   **电路结构图**


*   **真值表**

| S | R | Q | Q' | 状态 |
| :-: | :-: | :-: | :-: | :--- |
| 0 | 0 | 1 | 1 | **禁用** |
| 0 | 1 | 1 | 0 | 置位 (Set) |
| 1 | 0 | 0 | 1 | 复位 (Reset) |
| 1 | 1 | Q | Q' | **保持** |

*   **VHDL描述**
    ```vhdl
    -- 注意: 这里的VHDL代码与上图电路的逻辑行为(与非门)略有不同
    -- 它是基于行为描述的，并且(0,0)是无效态。
    -- 实际电路中，与非门RS锁存器是低电平有效。
    case rs is
        when "00" => Q<='1'; Qbar<='1'; -- 无效态
        when "01" => Q<='1'; Qbar<='0'; -- 置位
        when "10" => Q<='0'; Qbar<='1'; -- 复位
        when others=>null;              -- 保持 (R&S = "11")
    end case;
    ```
    💡 **注意点**：在顺序结构的 `case` 或 `if` 语句中，`null` 状态会指示综合器生成存储元件（锁存器或触发器），它等同于并行结构中的 `unaffected` 关键字。

### 2. D锁存器

D锁存器解决的RS锁存器输入不确定的问题。

*   **功能**：当使能端 `Enable` 为高电平时，输出 `Q` 跟随输入 `D` 的值；当 `Enable` 为低电平时，`Q` 保持之前的值不变。

*   **VHDL描述**
    ```vhdl
    library ieee;
    use ieee.std_logic_1164.all;

    entity D_latch is
        port ( D, Enable: in  std_logic;
               Q:         out std_logic);
    end D_latch;

    architecture behav of D_latch is
    begin
        process(D, Enable)
        begin
            if (Enable='1') then
                Q <= D;
            end if;
            -- 此处没有 else 分支
        end process;
    end behav;
    ```
    ⚠️ **注意点**：
    *   在VHDL中，一个<font color="orange">不完整的 `if` 语句</font>（即缺少 `else` 分支）会综合成一个锁存器，因为当条件不满足时，信号需要保持原来的值。
    *   该进程的**敏感参数列表**中包含了 `D` 和 `Enable`，综合后会形成一个电平敏感的锁存器。

*   **仿真波形**：从仿真波形可以看出，只要 `Enable` 是高电平，`Q` 就会像一根导线一样直通 `D` 的值。

---

## 三、触发器的设计 ⏰

<font color="orange">**触发器 (Flip-Flop)**</font> 是一种对**时钟边沿敏感**的存储元件。数据的锁存只在时钟的上升沿或下降沿的瞬间发生。

### 1. D触发器

D触发器是最常用、最基本的触发器。

*   **功能**：在时钟 `clk` 的**上升沿**（或下降沿）到来时，将输入 `D` 的值锁存到输出 `Q`，并在下一个有效的时钟沿到来之前保持不变。

*   **VHDL描述 (上升沿触发)**

    有多种等效的描述方法：

    **方法一：使用 `event` 属性 (最标准)**
    ```vhdl
    process(clk)
    begin
        if (clk'event and clk='1') then
            Q <= D;
        end if;
    end process;
    ```
    **方法二：使用 `rising_edge` 函数 (推荐)**
    ```vhdl
    -- 需要 use ieee.std_logic_1164.all;
    process(clk)
    begin
        if rising_edge(clk) then
            Q <= D;
        end if;
    end process;
    ```
    **方法三：使用 `wait until` (多用于测试平台)**
    ```vhdl
    process
    begin
        wait until rising_edge(clk);
        Q <= D;
    end process;
    ```

*   **仿真波形**：从仿真波形可以看出，`Q` 的值只在 `clk` 的上升沿发生跳变，去采样当时 `D` 的值。在时钟的其他时刻，无论 `D` 如何变化，`Q` 都保持不变。

### 2. 带有Q非和异步复位的D触发器

在实际应用中，触发器通常还带有反向输出 `Qbar` 和异步复位 `reset` 信号。

🚨 **易错点：如何正确描述Q和Qbar？**

**错误描述** ❌
```vhdl
IF rising_edge(clock) THEN
    Q    <= D;
    Qbar <= NOT D; -- 错误！
END IF;
```
这样描述会被综合器认为是两个独立的寄存器，一个输出 `D`，一个输出 `NOT D`，浪费资源且不符合原意。

**正确描述（信号法）** ✅
使用一个内部信号 `state` 来存储状态，然后在进程外将 `state` 和 `NOT state` 分别赋给 `Q` 和 `Qbar`。
```vhdl
architecture sig of D_FF is
    signal state: std_logic;
begin
    process(clock, reset)
    begin
        if (reset='0') then
            state <= '0';
        elsif rising_edge(clock) then
            state <= D;
        end if;
    end process;

    Q    <= state;
    Qbar <= not state;
end sig;
```

**正确描述（变量法）** ✅
使用一个进程内的变量 `state` 存储状态，并在进程结束前将值赋给输出端口。
```vhdl
architecture var of D_FF is
begin
    process(clock, reset)
        variable state: std_logic;
    begin
        if (reset='0') then
            state := '0';
        elsif rising_edge(clock) then
            state := D;
        end if;
        Q <= state;
        Qbar <= not state;
    end process;
end var;
```
💡 **点评**：当 `state` 定义为<font color="orange">变量</font>时，其有效范围仅在 `process` 内部，因此对 `Q` 和 `Qbar` 的赋值语句也必须放在 `process` 内部。

### 3. JK触发器和T触发器

*   **JK触发器**：功能比D触发器更丰富，可以实现保持、置位、复位和**翻转**功能。
*   **T触发器**：功能最简单，当输入 `T=1` 时，每个时钟有效沿输出状态**翻转**一次；当 `T=0` 时，输出保持不变。常用于计数器和分频器。

它们的VHDL描述与带异步复位的D触发器类似，只是在 `elsif rising_edge(clock)` 分支内部根据其各自的真值表逻辑进行赋值。

⚠️ **注意点**：在VHDL中，`CASE` 语句必须是完备的。对于JK触发器，其输入 `jk` 组合有四种情况(`"00"`, `"01"`, `"10"`, `"11"`)，因此在描述时需要加上 `when others => null;` 来覆盖所有可能，以确保逻辑的严谨性。

---

## 四、寄存器的设计 📦

<font color="orange">**寄存器**</font>用于存储一组（多位）二进制数据。一个N位寄存器可以由N个触发器构成。

### 1. 多位寄存器

一个D触发器就是一位寄存器。多位寄存器由多个D触发器并联，并共享同一个时钟和复位信号。

*   **VHDL描述**：
    使用 `std_logic_vector` 类型来定义多位数据端口。使用 `generic` 参数可以方便地定义寄存器的位宽。
    ```vhdl
    entity reg is
        generic( n: natural := 4 ); -- 定义一个4位的泛型参数
        port ( D     : in  std_logic_vector(n-1 downto 0);
               clock, reset : in  std_logic;
               Q     : out std_logic_vector(n-1 downto 0));
    end reg;

    -- 结构体描述
    if (reset='0') then
        Q <= (others => '0'); -- 将Q的所有位赋为'0'
    elsif rising_edge(clock) then
        Q <= D;
    end if;
    ```

### 2. 移位寄存器

移位寄存器中的数据可以在时钟脉冲的作用下，逐位向左或向右移动。

*   **串进并出 (SIPO) 移位寄存器**
    数据从串行输入端 `a` 一位一位地移入，同时所有位的数据可以从并行输出端 `q` 读出。
*   **VHDL描述 (左移)**
    使用**并置操作符 `&`** 来实现数据的移位和拼接。
    ```vhdl
    -- 在时钟上升沿
    -- reg 的低 (n-2) downto 0 位接收之前的高 n-1 位
    -- reg 的最高位接收新的串行输入 a
    reg := reg(n-2 downto 0) & a; -- 左移
    -- reg := a & reg(n-1 downto 1); -- 右移
    ```

---

## 五、计数器的设计 🔢

<font color="orange">**计数器**</font>是实现计数、分频和定时等功能的基本时序电路。

### 计数器的实现

#### 1. 使用 “+” 运算符 (行为描述)
这是最简单直观的方法。需要包含 `ieee.std_logic_unsigned.all` 库。
```vhdl
-- 在进程中定义一个内部信号或变量 temp_count
process (clk, reset)
begin
    if reset = '0' then
        temp_count <= (others => '0');
    elsif rising_edge(clk) then
        temp_count <= temp_count + 1;
    end if;
end process;
count <= temp_count; -- 输出
```
#### 2. 结构化描述 (使用T触发器级联)
使用T触发器（置T=1时为翻转模式）可以构成一个二进制计数器。前一级的输出作为后一级的时钟（异步）或时钟使能（同步）。课件中展示的是一个**异步纹波计数器**。

*   **VHDL描述 (使用 `generate` 语句)**
    ```vhdl
    -- g0 是循环标签
    g0: for i in 0 to n-1 generate
        -- T1 是元件例化标签
        -- 将T触发器元件T_FF例化n次
        T1: T_FF port map ('1', carry(i), reset, count(i), carry(i+1));
    end generate g0;
    ```

⚠️ **注意点：纹波计数器的延迟**
在异步（串行进位）计数器中，进位信号是逐级传递的，这会产生延迟。例如，当计数器从 `011` 变为 `100` 时，状态变化不是瞬时的，中间可能会短暂出现 `010` 等毛刺状态。这是异步设计的固有缺点。

---

## 六、乘法器的设计 ✖️

### 无符号数乘法器

采用“<font color="orange">**移位相加**</font>”的算法。
*   **过程**：逐位检查乘数的每一位。如果当前位为 `1`，则将被乘数加到部分积累加器上。然后，被乘数左移一位（或累加器右移一位），乘数右移一位。循环此过程直到乘数的所有位都被检查完毕。
*   **硬件结构**：通常由一个加法器、一个存放部分积的累加寄存器和一个存放乘数的移位寄存器组成。
```vhdl
-- 引入标准库和数值库
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all; -- 使用此库进行算术运算，是VHDL-2008标准推荐的

--================================================================
-- 实体（Entity）定义了模块的接口
--================================================================
entity unsigned_multiplier is
    generic (
        N : integer := 8 -- 定义数据位宽为8位，可以轻松修改
    );
    port (
        -- 控制信号
        clk             : in  std_logic; -- 时钟信号
        reset           : in  std_logic; -- 异步复位信号，高电平有效
        start           : in  std_logic; -- 开始信号，启动一次乘法运算

        -- 数据输入
        multiplicand_in : in  std_logic_vector(N - 1 downto 0); -- 被乘数 A
        multiplier_in   : in  std_logic_vector(N - 1 downto 0); -- 乘数 B

        -- 数据输出
        product_out     : out std_logic_vector(2 * N - 1 downto 0); -- 乘积结果 (2N位)
        done_out        : out std_logic -- 运算完成标志
    );
end entity unsigned_multiplier;

--================================================================
-- 结构体（Architecture）定义了模块的内部逻辑
--================================================================
architecture fsm_arch of unsigned_multiplier is

    -- 1. 定义状态机的状态
    type state_type is (IDLE, CALCULATING, DONE);

    -- 2. 定义内部信号（寄存器）
    signal fsm_state        : state_type;                                   -- FSM 当前状态寄存器
    signal cycle_counter    : integer range 0 to N;                         -- 循环计数器
    signal multiplicand_reg : unsigned(N - 1 downto 0);                     -- 锁存被乘数A
    signal acc_mult_reg     : unsigned(2 * N - 1 downto 0);                 -- 2N位的累加器+乘数联合寄存器

begin

    -- 3. 主进程：实现状态机的时序逻辑
    main_process: process(clk, reset)
    begin
        -- 异步复位逻辑
        if reset = '1' then
            fsm_state        <= IDLE;
            cycle_counter    <= 0;
            multiplicand_reg <= (others => '0');
            acc_mult_reg     <= (others => '0');
            done_out         <= '0';

        -- 时钟上升沿触发的逻辑
        elsif rising_edge(clk) then
            case fsm_state is
                
                --=============== IDLE 状态 ===============--
                -- 等待开始信号，准备下一次运算
                when IDLE =>
                    done_out <= '0'; -- 拉低完成标志
                    if start = '1' then
                        -- 锁存输入数据
                        multiplicand_reg <= unsigned(multiplicand_in);
                        
                        -- 初始化联合寄存器：高位(累加器)清零，低位装载乘数
                        acc_mult_reg <= resize(unsigned(multiplier_in), 2 * N);
                        
                        -- 初始化计数器
                        cycle_counter <= 0;
                        
                        -- 跳转到计算状态
                        fsm_state <= CALCULATING;
                    end if;

                --=============== CALCULATING 状态 ===============--
                -- 执行N次移位相加
                when CALCULATING =>
                    -- 检查乘数最低位 acc_mult_reg(0)
                    if acc_mult_reg(0) = '1' then
                        -- 如果是 '1', 则执行加法: P <= P + A
                        -- P 是 acc_mult_reg 的高N位
                        acc_mult_reg(2 * N - 1 downto N) <= acc_mult_reg(2 * N - 1 downto N) + multiplicand_reg;
                    end if;
                    acc_mult_reg <= '0' & acc_mult_reg(2 * N - 1 downto 1);
                    
                    -- 计数器递增
                    cycle_counter <= cycle_counter + 1;

                    -- 检查是否完成了N次循环
                    if cycle_counter = N - 1 then
                        fsm_state <= DONE; -- 跳转到完成状态
                    end if;

                --=============== DONE 状态 ===============--
                -- 输出结果，置位完成标志
                when DONE =>
                    done_out  <= '1'; -- 置位完成标志
                    fsm_state <= IDLE;  -- 直接返回IDLE，准备下一次
                    -- 或者可以等待start信号变低再返回IDLE
                    -- if start = '0' then
                    --     fsm_state <= IDLE;
                    -- end if;
            end case;
        end if;
    end process main_process;

    -- 4. 输出逻辑（组合逻辑）
    -- 将最终的计算结果持续地输出到端口
    product_out <= std_logic_vector(acc_mult_reg);

end architecture fsm_arch;
```
---

## 七、本章总结 🎓

1.  **锁存器 vs 触发器** 🔍
    *   **D锁存器**是<font color="orange">电平敏感</font>的。VHDL中，不完整的 `if` 语句且敏感列表中包含数据输入 `D` 时，会综合成锁存器。
    *   **D触发器**是<font color="orange">边沿敏感</font>的。VHDL中，不完整的 `if` 语句，但敏感列表中**不包含**数据输入 `D`（只包含时钟和异步控制信号）时，会综合成触发器。

2.  **时钟上升沿检测** 🕒
    *   标准方法：`Clock'event and clock='1'`
    *   函数方法：`rising_edge(clock)` (推荐)
    *   `wait` 语句：`wait until rising_edge(clock)`

3.  **VHDL设计技巧** ✨
    *   为了避免无意中生成多余的寄存器（例如同时对 `Q` 和 `Qbar` 在时钟边沿下赋值），推荐使用一个内部的**信号 (signal)** 或**变量 (variable)** 来代表触发器的状态。
    *   **信号**的赋值在进程外，是并行语句。
    *   **变量**的有效范围在进程内，其赋值语句也必须在进程内。