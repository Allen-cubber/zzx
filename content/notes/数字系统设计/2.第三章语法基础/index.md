---
title: 第三章 VHDL语言基础
tags:
  - 大三上
  - 数字系统设计
date: 2025-09-15T10:00:00+08:00
summary: 本章学习VHDL语言的基础知识，构成了进行数字逻辑设计的基础框架。
---
### 1. VHDL 概述 📜

#### 1.1 什么是VHDL？

VHDL是 **<font color="orange">V</font>ery-<font color="orange">H</font>igh-<font color="orange">S</font>peed <font color="orange">I</font>ntegrated <font color="orange">C</font>ircuit <font color="orange">H</font>ardware <font color="orange">D</font>escription <font color="orange">L</font>anguage** 的缩写，中文全称为 **超高速集成电路硬件描述语言**。它是一种用于描述、设计、仿真电子系统的语言。

#### 1.2 起源与发展 📈

*   **80年代初**：由美国国防部在实施 **超高速集成电路 (VHSIC)** 项目时开发。
*   **1987年**：被IEEE协会批准为工业标准，称为 **IEEE1076-1987**。
*   **1993年**：更新为93标准，即 **IEEE1076.93**。
*   **1996年**：**IEEE1076.3** 成为综合标准。

#### 1.3 学习VHDL的目的与用途 🎯

*   **目的**：以文字或文件的形式保存电子电路的<font color="orange">设计意图</font>，方便他人理解和复用。
*   **用途**：主要用于描述数字系统的 **结构、行为、功能和接口**。

#### 1.4 VHDL与Verilog HDL的比较 🔄

*   **✅ 相同点**：
    *   都是主流的硬件描述语言。
    *   都能以文本形式抽象地表示电路的行为和结构。
    *   都可以从 **系统行为级、寄存器传输级(RTL)和门级** 等多个层次对电路进行描述。

*   **❌ 不同点**：
    *   **语法差异**：Verilog语法类似C语言，简单易用；VHDL语句较为严格和晦涩，学习难度稍大。
    *   **侧重点**：VHDL侧重于<font color="orange">系统级描述</font>，更适合进行系统级设计；Verilog侧重于<font color="orange">电路级描述</font>，更适合具体的电路设计。

#### 1.5 VHDL的特点 ✨

*   **系统硬件描述能力强**：能够描述复杂的数字系统。
*   **与器件和工艺无关**：设计的代码可移植性好，不依赖于特定的芯片厂家或制造工艺。
*   **IEEE工业标准**：具有权威性和通用性。
*   **方法灵活，技术齐全**：支持多种设计方法和层次。
*   **可读性好**：代码结构清晰，易于理解和维护。

> 💡 **核心特征**：VHDL描述的电路具有硬件特征，其语句在默认情况下是 **<font color="orange">并行执行</font>** 的，这与软件语言的顺序执行有本质区别。

#### 1.6 举例：二路选择器的描述演变

这是一个很好的例子，展示了从传统电路设计到使用VHDL描述的进步。

*   **传统描述方式**
    *   **方法**：使用与门、非门、或门等底层逻辑门，通过图形输入法绘制电路图。
    *   **逻辑**：
        *   当 `sel=0` 时, `q=d0`
        *   当 `sel=1` 时, `q=d1`
    *   **缺点**：对于复杂电路，设计过程繁琐，需要先写出逻辑表达式或真值表，并进行手动化简。

*   **VHDL描述方式**
    *   **方法**：使用文本输入法编写代码来描述电路的功能和行为。
    *   **优点**：可读性好，设计简单，具体的电路实现由<font color="orange">综合工具</font>自动优化完成。

---

### 2. VHDL程序的基本结构 🏗️

一个完整的VHDL程序主要由 **4个部分** 构成，有时还包括第5个部分——配置。

*   **① 库的调用 (Library)** 📚
    *   **说明**：相当于操作系统中的“目录”，用来存放预编译好的程序包等。
*   **② 程序包的调用 (Package)** 📦
    *   **说明**：类似于C语言中的 `#include` 语句，用来声明设计中将要用到的数据类型、函数等。
*   **③ 实体 (Entity)** 🖼️
    *   **说明**：用于描述设计单元的<font color="orange">外部接口</font>，即输入输出端口。一个设计只有一个实体。
*   **④ 结构体 (Architecture)** 🧠
    *   **说明**：用于描述实体的<font color="orange">内部行为、功能或电路结构</font>。一个实体可以有多个结构体。
*   **⑤ 配置 (Configuration)** ⚙️
    *   **说明**：当一个实体有多个结构体时，用于指定具体使用哪一个结构体进行编译或仿真。

#### 示例：二路选择器的结构剖析

**完整的VHDL代码如下：**
```vhdl
-- 第1部分：库的调用
LIBRARY IEEE;
-- 第2部分：程序包的调用
USE IEEE.std_logic_1164.all;

-- 第3部分：实体 (Entity)
ENTITY MUX2 IS
    PORT (
        d0, d1: IN  std_logic;
        sel   : IN  std_logic;
        q     : OUT std_logic
    );
END ENTITY;

-- 第4部分：结构体 (Architecture)
ARCHITECTURE behav OF MUX2 IS
BEGIN
    PROCESS (d0, d1, sel)
    BEGIN
        IF sel = '0' THEN
            q <= d0;
        ELSIF sel = '1' THEN
            q <= d1;
        ELSE
            q <= 'Z'; -- 高阻态
        END IF;
    END PROCESS;
END behav;
```

---

**下面是对这四部分的详细解读：**

*   **① 库的调用 (Library Declaration)** 📚
    ```vhdl
    LIBRARY IEEE;
    ```
    *   **作用**：这行代码声明了我们将要使用 `IEEE` 这个库。它告诉编译器或仿真器，后续可能会引用到这个库中已经编译好的资源。`IEEE` 库是VHDL设计中最常用的标准库。

*   **② 程序包的调用 (Package Usage)** 📦
    ```vhdl
    USE IEEE.std_logic_1164.all;
    ```
    *   **作用**：这行代码具体指明了我们要使用 `IEEE` 库中的 `std_logic_1164` 这个程序包，并且 `all` 关键字表示我们要使用该包中<font color="orange">所有</font>的定义。这个包为我们提供了 `std_logic` 和 `std_logic_vector` 等多值逻辑数据类型，这是现代VHDL设计的基石。没有这一行，编译器将不认识 `std_logic` 是什么。

*   **③ 实体 (Entity)** 🖼️
    ```vhdl
    ENTITY MUX2 IS
        PORT (
            d0, d1: IN  std_logic;
            sel   : IN  std_logic;
            q     : OUT std_logic
        );
    END ENTITY;
    ```
    *   **作用**：这部分是设计的 **“外壳”** 或 **“黑盒”**。
    *   `ENTITY MUX2 IS ... END ENTITY;` 定义了一个名为 `MUX2` 的设计单元。
    *   `PORT(...)` 子句是实体的核心，它定义了该设计单元与外部世界交互的<font color="orange">所有接口（引脚）</font>。
    *   在这里，我们定义了三个输入端口 (`IN`)：`d0`, `d1`, `sel`，以及一个输出端口 (`OUT`)：`q`。所有这些端口的数据类型都是 `std_logic`。实体只关心接口，不关心内部如何实现。

*   **④ 结构体 (Architecture)** 🧠
    ```vhdl
    ARCHITECTURE behav OF MUX2 IS
    BEGIN
        -- 并行语句
        PROCESS (d0, d1, sel)
        BEGIN
            -- 顺序语句
            IF sel = '0' THEN
                q <= d0;
            ELSIF sel = '1' THEN
                q <= d1;
            ELSE
                q <= 'Z';
            END IF;
        END PROCESS;
    END behav;
    ```
    *   **作用**：这部分是设计的 **“内核”** 或 **“白盒”**，它描述了实体 `MUX2` 的具体功能和内部行为。
    *   `ARCHITECTURE behav OF MUX2 IS` 表明这是一个名为 `behav` 的结构体，它用于描述实体 `MUX2`。
    *   `BEGIN` 和 `END behav;` 之间的代码实现了选择器的逻辑。
    *   `PROCESS` 语句是描述行为的核心。`(d0, d1, sel)` 是它的 **敏感列表**，意味着只要这三个输入信号中任何一个发生变化，进程就会被触发执行一次。
    *   进程内部的 `IF-ELSIF-ELSE` 语句是 **顺序执行** 的，它根据 `sel` 的值，将 `d0` 或 `d1` 赋值给输出信号 `q`，从而实现了二路选择器的功能。

这四个部分紧密配合，共同构成了一个完整、清晰、可综合的VHDL设计单元。

---

### 3. VHDL程序的主要构件 🧩

VHDL程序的基本构件包括：**库、包、配置、实体、结构体、块、子程序（函数和过程）**。其中最主要的是前五个。

#### 3.1 库 (Library)

库是存放预先编译好的程序包和数据集合的仓库。

*   **使用格式**：
    ```vhdl
    LIBRARY "库名";
    ```
*   **常用库**：
    *   **STD库 (默认库)**：VHDL语言标准库，包含 `standard` 程序包，定义了`Bit`, `Integer`, `Boolean`等基本数据类型。使用时无需显式声明。
    *   **IEEE库**：最常用的库，但其程序包并非VHDL语言标准，因此<font color="orange">必须显式声明</font>。
    *   **WORK库 (默认库)**：用户当前工作库，用于存放当前设计的编译结果。无需显式声明。

*   **IEEE库的常用程序包**：
    *   `std_logic_1164`：定义了 `std_logic` 和 `std_logic_vector` 九值逻辑系统及相关函数。
    *   `std_logic_arith`：定义了基于 `std_logic` 的算术运算，如 `UNSIGNED`, `SIGNED` 类型。
    *   `std_logic_signed` 和 `std_logic_unsigned`：重载了运算符，支持 `std_logic_vector` 和 `INTEGER` 等类型的混合运算。

#### 3.2 程序包 (Package)

程序包（或称包集合）用来罗列VHDL语言中所要用到的信号、常数、数据类型、函数、过程等定义。

*   **使用格式**：
    ```vhdl
    USE "库名"."包名"."项目名";
    ```
    *   `项目名` 可以是 `ALL`，表示使用该包中的所有定义。
*   **示例**：
    ```vhdl
    USE IEEE.STD_LOGIC_1164.ALL; -- 表示要使用IEEE库中STD_LOGIC_1164包的所有定义
    ```
*   ⚠️ **易错点**：使用不同的程序包，即使VHDL代码相同，生成的电路也可能不同。例如，`STD.STD_ttl.ALL` 和 `STD.STD_ttloc.ALL` 分别会生成普通的与非门和集电极开路的与非门。

#### 3.3 实体 (Entity)

实体定义了设计单元的<font color="orange">输入输出接口</font>，是设计的“外壳”。

*   **使用格式**：
    ```vhdl
    ENTITY "实体名" IS
        [ GENERIC ( -- 类属参数说明 ); ]
        [ PORT ( -- 端口说明 ); ]
    END [ENTITY] "实体名";
    ```
*   **组成部分**：
    *   **类属参数 (GENERIC)**：用于传递静态信息，如器件延迟、总线宽度等。
        *   `GENERIC (常数名: 数据类型 := 设定值);`
    *   **端口 (PORT)**：定义输入、输出、双向等引脚。
        *   `PORT (端口名: 端口方向 数据类型);`

*   ⚠️ **注意点**：
    *   实体名不能以数字开头，不能是VHDL保留字。
    *   实体名应有功能含义，便于理解。
    *   实体结束语句可以是 `END ENTITY;` 或 `END 实体名;`。

*   **示例：定义一个复杂器件的实体**
    ```vhdl
    ENTITY my_design IS
        PORT (
            d      : IN  std_logic_vector(15 DOWNTO 0);
            clk    : IN  std_logic;
            reset  : IN  std_logic;
            oe     : IN  std_logic;
            q      : OUT std_logic_vector(15 DOWNTO 0);
            ad     : INOUT std_logic_vector(15 DOWNTO 0); -- 双向端口
            int    : BUFFER std_logic; -- 缓冲端口
            as     : OUT std_logic
        );
    END my_design;
    ```
##### 1. `IN` (Input) - 输入端口

- **代码对应：** `d`, `clk`, `reset`, `oe`
    
- **含义：** 信号**从外部流入**该模块。
    
- **读写权限：**
    
    - **只读**：在模块内部，你只能读取它的值（放在赋值号右边），不能改变它的值（不能放在赋值号左边）。
        
- **典型用途：** 时钟信号、复位信号、控制开关、外部数据输入。
    

##### 2. `OUT` (Output) - 输出端口

- **代码对应：** `q`, `as`
    
- **含义：** 信号**从模块内部流向外部**。
    
- **读写权限：**
    
    - **只写**：在模块内部，你只能给它赋值。
        
    - **不可读**（重要）：在标准的 VHDL（VHDL-2008 之前）中，你不能在模块内部读取 `OUT` 端口的值（例如不能写 `q <= q + 1;`，因为这需要读取当前的 `q`）。
        
- **典型用途：** 计算结果、状态指示灯、控制外部设备的信号。
    

##### 3. `INOUT` - 双向端口

- **代码对应：** `ad`
    
- **含义：** 信号既可以输入也可以输出，是**双向**的。
    
- **读写权限：**
    
    - **可读可写**：你可以读取外部传来的值，也可以向外驱动数值。
        
- **关键机制（三态门）：** 为了实现双向，必须使用**三态逻辑（Tri-state Logic）**。
    
    - 当你想要**输入**（读取）数据时，必须将该端口设置为 **高阻态 ('Z')**，以防止内部逻辑与外部驱动发生短路冲突。
        
    - 当你想要**输出**数据时，才给它赋具体的 '0' 或 '1'。
        
- **典型用途：** 数据总线（如 I2C 的 SDA 线，或内存的数据总线），既要发数据也要收数据。
    

##### 4. `BUFFER` (Buffer) - 缓冲端口

- **代码对应：** `int`
    
- **含义：** 这是一个特殊的输出端口。
    
- **读写权限：**
    
    - **可读可写**：它本质上是一个输出端口（信号流向外部），但允许你在模块内部**读取**它当前的值。
        
- **用途：** 当你需要输出一个信号，同时该信号的当前值又是计算下一个值所需的条件时（例如计数器的输出）。
    
- **注意：** 虽然 `BUFFER` 看起来很方便，但在现代设计规范中**通常不推荐使用**，因为它在复杂的层次化设计中可能会导致连接限制。更推荐的做法是定义一个内部信号（Signal）来读写，最后把内部信号赋值给 `OUT` 端口。
    

|**端口模式**|**方向**|**内部操作权限**|**典型应用**|
|---|---|---|---|
|**IN**|外部 $\to$ 内部|**只读**|时钟、复位、数据源|
|**OUT**|内部 $\to$ 外部|**只写** (不可回读*)|结果输出、LED|
|**INOUT**|双向 $\leftrightarrow$|**可读可写** (需处理高阻态 'Z')|内存总线、通信总线|
|**BUFFER**|内部 $\to$ 外部|**可读可写** (带反馈)|需要回读状态的输出 (旧式写法)|

> *注：VHDL-2008 标准放宽了 `OUT` 的限制，允许回读，但很多老旧的工具或教程仍遵循旧标准。

#### 3.4 结构体 (Architecture)

结构体描述了实体的<font color="orange">内部具体实现</font>，是设计的“内核”。

*   **使用格式**：
    ```vhdl
    ARCHITECTURE "结构体名" OF "实体名" IS
        -- [ 定义语句 (信号, 常量, 类型等); ]
    BEGIN
        -- [ 并行处理语句; ]
    END "结构体名";
    ```
*   **定义语句**：在此部分声明的信号、常数、类型等只在本结构体内部有效。
*   **并行处理语句**：`BEGIN` 和 `END` 之间的所有语句都是并行执行的。

*   **结构体的三种描述方法**：
    1.  **行为描述 (Behavioral)**：用 `PROCESS` 语句等描述算法行为，不关心具体电路结构，抽象层次最高。通常命名为 `behav`。
    2.  **数据流描述 (Dataflow / RTL)**：用并行信号赋值语句描述数据在寄存器之间的流动和处理，体现了数据的流动路径。通常命名为 `dataflow`。
    3.  **结构描述 (Structural)**：通过实例化底层元件（`COMPONENT`）并描述它们之间的连接关系来构建电路，类似电路图。通常命名为 `stru`。

*   **示例：全加器的三种描述方法**
    1.  **行为描述**：通过计算输入'1'的个数来决定输出。
        ```vhdl
        ARCHITECTURE behav OF FA IS
            -- ... 定义常量 ...
        BEGIN
            PROCESS (x, y, ci)
                VARIABLE n: integer;
            BEGIN
                n := 0;
                IF x='1' THEN n := n+1; END IF;
                IF y='1' THEN n := n+1; END IF;
                IF ci='1' THEN n := n+1; END IF;
                s <= sum_vector(n);
                co <= carry_vector(n);
            END PROCESS;
        END behav;
        ```
    2.  **数据流(RTL)描述**：使用逻辑表达式。
        ```vhdl
        ARCHITECTURE dataflow OF FA IS
        BEGIN
            s <= x XOR y XOR ci;
            co <= (x AND y) OR (x AND ci) OR (y AND ci);
        END dataflow;
        ```
    3.  **结构描述**：由两个半加器和一个或门构成，体现了<font color="orange">层次化设计</font>思想。
        ```vhdl
        ARCHITECTURE structure OF full_adder IS
            -- 定义内部连接线
            SIGNAL temp_sum, temp_carry1, temp_carry2: bit;
            -- 声明要用到的元件
            COMPONENT half_adder ... END COMPONENT;
            COMPONENT or_gate ... END COMPONENT;
        BEGIN
            -- 实例化元件并连接端口
            U0: half_adder PORT MAP (X=>A, Y=>B, sum=>temp_sum, carry=>temp_carry1);
            U1: half_adder PORT MAP (X=>temp_sum, Y=>carry_in, sum=>AB, carry=>temp_carry2);
            U2: or_gate PORT MAP (in1=>temp_carry1, in2=>temp_carry2, out1=>carry_out);
        END structure;
        ```

**结构化描述方法总结对比**

| 描述方法                | 核心思想     | 抽象层次   | 主要应用场景            |
| :------------------ | :------- | :----- | :---------------- |
| **行为 (Behavioral)** | 功能和算法    | **最高** | 系统级建模、仿真、测试平台     |
| **数据流 (Dataflow)**  | 数据的流动与转换 | **中等** | **最常用**的电路设计和逻辑综合 |
| **结构 (Structural)** | 元件的连接与组装 | **最低** | 大型系统的顶层集成、模块化设计   |
#### 3.5 配置 (Configuration)

配置语句用于将一个实体与其对应的某个结构体<font color="orange">绑定</font>起来。

*   **作用**：在仿真或综合时，如果一个实体有多个结构体（例如一个行为模型，一个RTL模型），可以通过配置来选择使用哪一个。
*   **使用格式**：
    ```vhdl
    CONFIGURATION "配置名" OF "实体名" IS
        FOR "结构体名"
            -- 可选的更深层次的配置
        END FOR;
    END 配置名;
    ```
*   **示例**：
    假设实体 `example` 有三个结构体 `and2_arc`, `or2_arc`, `xor2_arc`。
    ```vhdl
    -- 将example配置成与门
    CONFIGURATION and2_cfg OF example IS
        FOR and2_arc
        END FOR;
    END and2_cfg;

    -- 将example配置成或门
    CONFIGURATION or2_cfg OF example IS
        FOR or2_arc
        END FOR;
    END or2_cfg;
    ```

---

### 4. VHDL数据类型及运算符 🧮

#### 4.1 标准数据类型

VHDL预定义了10种标准数据类型。

| 数据类型        | 含义与用途                                              | 示例                   |
| ----------- | -------------------------------------------------- | -------------------- |
| **整数**      | 32位有符号整数，常用于表示总线宽度或计数。                             | `123`, `-5`          |
| **实数**      | 浮点数，主要用于仿真中的高级建模，<font color="orange">不可综合</font>。 | `1.25`, `3.14E2`     |
| **自然数/正整数** | 整数的子集，定义时需约束范围。                                    | `NATURAL` `POSITIVE` |
| **位**       | `BIT`类型，值为 `'0'` 或 `'1'`，用单引号。                     | `'1'`                |
| **位串**      | `BIT_VECTOR`类型，位的数组，用双引号。                          | `"1011"`             |
| **字符**      | `CHARACTER`类型，ASCII字符，区分大小写。                       | `'A'`, `'z'`         |
| **字符串**     | `STRING`类型，字符的数组。                                  | `"Hello"`            |
| **布尔量**     | `BOOLEAN`类型，值为 `TRUE` 或 `FALSE`。                   | `TRUE`               |
| **时间**      | `TIME`类型，用于仿真中的延时，不可综合。                            | `10 ns`, `5 us`      |
| **错误等级**    | `SEVERITY LEVEL`，用于仿真时报告信息，不可综合。                   | `NOTE`, `WARNING`    |

#### 4.2 用户自定义数据类型

可以根据设计需求自定义数据类型。

*   **枚举类型**：列出所有可能的值，常用于状态机设计。
    *   `TYPE state IS (idle, s1, s2, s3);`
*   **子类型**：基于现有类型定义一个有范围约束的子集。
    *   `SUBTYPE my_byte IS integer RANGE 0 TO 255;`
*   **数组类型**：相同数据类型元素的集合。
    *   `TYPE matrix IS ARRAY(0 TO 3, 0 TO 3) OF std_logic;`
*   **记录类型**：不同数据类型元素的集合。
    *   `TYPE instruction IS RECORD opcode: bit_vector(3 DOWNTO 0); addr: bit_vector(11 DOWNTO 0); END RECORD;`

#### 4.3 数据类型转换 🔄

不同数据类型之间通常不能直接运算，需要使用IEEE库中提供的<font color="orange">类型转换函数</font>。

| 程序包                  | 函数名                           | 功能                                |
| -------------------- | ----------------------------- | --------------------------------- |
| `STD_LOGIC_1164`     | `TO_STDLOGICVECTOR(A)`        | `BIT_VECTOR` 转 `STD_LOGIC_VECTOR` |
| `STD_LOGIC_1164`     | `TO_BITVECTOR(A)`             | `STD_LOGIC_VECTOR` 转 `BIT_VECTOR` |
| `STD_LOGIC_ARITH`    | `CONV_INTEGER(A)`             | `UNSIGNED`或`SIGNED` 转 `INTEGER`   |
| `STD_LOGIC_UNSIGNED` | `CONV_INTEGER(A)`             | `STD_LOGIC_VECTOR` 转 `INTEGER`    |
| `STD_LOGIC_ARITH`    | `CONV_STD_LOGIC_VECTOR(A, n)` | `INTEGER`等 转 `STD_LOGIC_VECTOR`   |

#### 4.4 运算符与优先级

VHDL的运算符有严格的优先级，从低到高排列如下：

| 优先级 ⬇️ | 运算符类型   | 运算符                                    |
| :-------: | ------------ | ----------------------------------------- |
| **最低**  | 逻辑运算符   | `AND`, `OR`, `NAND`, `NOR`, `XOR`         |
| ...       | 关系运算符   | `=`, `/=`, `<`, `>`, `<=`, `>=`           |
| ...       | 加法/并置    | `+`, `-`, `&`                             |
| ...       | 符号运算符   | `+`, `-`                                  |
| **最高**  | 乘法及其他   | `*`, `/`, `MOD`, `REM`, `**`, `ABS`, `NOT` |

> 💡 **建议**：当不确定运算符优先级时，多使用括号 `()` 来明确运算顺序，避免出错。

---

### 5. VHDL的数据对象 📦

在VHDL中，可以被赋值的客体称为数据对象，主要有三类：

*   **常量 (CONSTANT)** 💎：在设计中值<font color="orange">不会改变</font>的量，是一个全局量。几乎任何可以声明的地方都可以，具体位置取决于希望这个“规定”在多大范围内有效。
    *   `CONSTANT PI: real := 3.14159;`
*   **变量 (VARIABLE)** 📝：定义在<font color="orange">进程或子程序</font>中的临时存储量，是一个局部量。**必须** 声明在 **进程（PROCESS）、函数（FUNCTION）或过程（PROCEDURE）的声明区域**。也就是 `PROCESS ... IS` 和 `BEGIN` 之间的那部分。
    *   **赋值**：使用 `:=`，赋值<font color="orange">立即生效</font>。
    *   `VARIABLE temp: integer := 0;`
*   **信号 (SIGNAL)** 🔌：对应硬件电路中<font color="orange">实际的连线或存储单元</font>（如触发器）。**必须** 声明在 **结构体（ARCHITECTURE）的声明区域**。也就是 `ARCHITECTURE ... IS` 和 `BEGIN` 之间的那部分。
    *   **赋值**：使用 `<=`，赋值存在一个极小的<font color="orange">delta延迟</font>，不是立即生效。
    *   `SIGNAL clk: std_logic;`

#### 信号与变量的比较 🔥

这是VHDL学习中的一个关键点和易错点！

| 特性     | 信号 (SIGNAL)                                      | 变量 (VARIABLE)                                |
| -------- | -------------------------------------------------- | ---------------------------------------------- |
| **物理意义** | 对应硬件连线或寄存器                               | 软件行为，用于临时计算，综合后无实体           |
| **作用域**   | 结构体内全局可见，用于模块间通信                   | 进程或子程序内局部可见                         |
| **赋值符号** | `<=`                                               | `:=`                                           |
| **生效时间** | 存在delta延迟，在当前仿真周期末尾更新              | 立即生效                                       |
| **敏感性**   | 进程对信号敏感（可在敏感列表中）                   | 进程对变量不敏感                               |

#### 示例：六分频器

*   **使用变量**：计数器 `time` 的值在 `time:=time+1;` 后立即更新，所以在同一时钟周期内，可以判断 `if time=6`。
    ```vhdl
    PROCESS(clk)
        VARIABLE time: integer RANGE 0 TO 6;
    BEGIN
        IF rising_edge(clk) THEN
            time := time + 1;
            IF time = 6 THEN
                q <= '1';
                time := 0;
            ELSE
                q <= '0';
            END IF;
        END IF;
    END PROCESS;
    ```
*   **使用信号**：计数器 `time` 的值在 `time<=time+1;` 后不会立即更新，它的值仍是上一个时钟周期的值。因此，判断条件需要变为 `if time=5`，因为当 `time` 为5时，下一个时钟沿 `time<=time+1` 被调度，再下一个时钟沿时 `time` 的值才变为6。
    ```vhdl
    -- 在ARCHITECTURE的定义区
    SIGNAL time: integer RANGE 0 TO 5;
    -- ...
    PROCESS(clk)
    BEGIN
        IF rising_edge(clk) THEN
            IF time = 5 THEN
                q <= '1';
                time <= 0;
            ELSE
                q <= '0';
                time <= time + 1;
            END IF;
        END IF;
    END PROCESS;
    ```
    从仿真结果看，两种方法最终实现了相同的功能，但内部逻辑和编码方式有本质区别。

---

### 6. VHDL基本语句 ✍️

VHDL语句分为 **并行语句** 和 **顺序语句**。

> 💡 **核心区别**：并行语句的位置可以任意调换而不影响结果，它们在同一时间“同时”执行。顺序语句必须按书写顺序执行，且只能出现在 `PROCESS` 语句、函数或过程中。

#### 6.1 并行语句

##### **信号赋值语句**：
`目标信号 <= 表达式;`
##### **条件信号赋值语句** (WHEN...ELSE)：
`z <= a WHEN sel = '1' ELSE b;`
##### **选择信号赋值语句** (WITH...SELECT)：
```vhdl
    WITH sel SELECT
        q <= d0 WHEN "00",
             d1 WHEN "01",
             d2 WHEN "10",
             d3 WHEN OTHERS;
```
##### **进程语句 (PROCESS)**：它本身是一个并行语句，但其内部包含的是顺序语句。
##### 元件例化语句 (Component Instantiation)

元件例化是VHDL中实现<font color="orange">层次化</font>和<font color="orange">结构化</font>设计的关键机制。它允许在一个设计实体（顶层模块）中，调用一个或多个已存在的其他设计实体（底层模块）作为其子电路。

实现元件例化通常包含以下三个步骤：

1.  **元件声明 (Component Declaration)**：在顶层模块的结构体声明区，使用 `COMPONENT` 关键字声明将要引用的子模块的接口原型。该声明必须与子模块的 `ENTITY` 定义完全匹配。
2.  **信号声明 (Signal Declaration)**：在结构体声明区，声明用于连接例化的各个元件之间以及元件与顶层端口之间连线的内部信号（`SIGNAL`）。
3.  **元件例化 (Component Instantiation)**：在结构体的主体部分（`BEGIN`之后），为每个需要调用的子模块编写例化语句，通过 `PORT MAP` 将子模块的端口映射到顶层的端口或内部信号上。

**示例：使用基本门电路构造一个2选1多路选择器**

假设已存在 `AND_GATE`, `OR_GATE`, `NOT_GATE` 三个基础元件的设计文件。以下为顶层模块 `Mux2_to_1.vhd` 的结构化描述：

```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY Mux2_to_1 IS
    PORT (
        i0, i1 : IN  STD_LOGIC;
        sel    : IN  STD_LOGIC;
        o      : OUT STD_LOGIC
    );
END ENTITY Mux2_to_1;

ARCHITECTURE structural OF Mux2_to_1 IS
    -- 步骤1: 元件声明
    COMPONENT AND_GATE IS
        PORT (a, b : IN  STD_LOGIC; c : OUT STD_LOGIC);
    END COMPONENT;

    COMPONENT OR_GATE IS
        PORT (a, b : IN  STD_LOGIC; c : OUT STD_LOGIC);
    END COMPONENT;

    COMPONENT NOT_GATE IS
        PORT (a : IN  STD_LOGIC; c : OUT STD_LOGIC);
    END COMPONENT;

    -- 步骤2: 声明用于内部连接的信号
    SIGNAL sel_n, w1, w2 : STD_LOGIC;

BEGIN
    -- 步骤3: 元件例化
    -- 例化一个非门，实例标号为 U_NOT
    U_NOT: NOT_GATE PORT MAP (
        a => sel,      -- 元件端口a 连接到 顶层端口sel
        c => sel_n     -- 元件端口c 连接到 内部信号sel_n
    );

    -- 例化第一个与门，实例标号为 U_AND1
    U_AND1: AND_GATE PORT MAP (
        a => i0,
        b => sel_n,
        c => w1
    );

    -- 例化第二个与门，实例标号为 U_AND2
    U_AND2: AND_GATE PORT MAP (
        a => i1,
        b => sel,
        c => w2
    );
    
    -- 例化一个或门，实例标号为 U_OR
    U_OR: OR_GATE PORT MAP (
        a => w1,
        b => w2,
        c => o         -- 元件端口c 连接到 顶层端口o
    );

END ARCHITECTURE structural;
```
**注意点**：
*   每个例化语句都必须有一个唯一的**实例标号**（如 `U_NOT`）。
*   `PORT MAP` 建立了子模块端口（`=>`左侧）与当前级别信号/端口（`=>`右侧）之间的连接关系。

---

##### 生成语句 (Generate Statement)

生成语句是VHDL提供的一种强大的功能，用于根据特定规则自动地、重复地创建一组<font color="orange">并行语句</font>，最常见的应用是重复例化元件。它常用于构建具有规则性、重复性结构的电路，如总线操作、寄存器阵列、存储单元等，极大地简化了代码编写并提高了可维护性。

最常用的生成语句形式是 `FOR...GENERATE`。

**示例：构建一个8位的与门阵列**

该电路对两个8位的输入总线 `a_bus` 和 `b_bus` 的对应位执行逻辑与操作，生成一个8位的输出总线 `c_bus`。

```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY And_Array_8bit IS
    PORT (
        a_bus, b_bus : IN  STD_LOGIC_VECTOR(7 DOWNTO 0);
        c_bus        : OUT STD_LOGIC_VECTOR(7 DOWNTO 0)
    );
END ENTITY And_Array_8bit;

ARCHITECTURE structural_generate OF And_Array_8bit IS

    -- 声明将被重复例化的元件原型
    COMPONENT AND_GATE IS
        PORT (a, b : IN  STD_LOGIC; c : OUT STD_LOGIC);
    END COMPONENT;

BEGIN
    -- 使用 FOR...GENERATE 语句批量例化8个与门
    -- G_AndLoop 是生成语句的标号
    G_AndLoop: FOR i IN 0 TO 7 GENERATE
        -- 在循环体内部，是一个标准的元件例化语句
        -- 通过循环变量 i 来索引总线的不同位
        U_AND_i: AND_GATE PORT MAP (
            a => a_bus(i),
            b => b_bus(i),
            c => c_bus(i)
        );
    END GENERATE G_AndLoop;

END ARCHITECTURE structural_generate;
```

**要点总结**：
*   `GENERATE` 语句本身并不直接生成硬件，它是一种给综合工具的指令，指示其在综合过程中**展开循环**，并根据循环变量的值创建多个独立的并行硬件实例。
*   `GENERATE` 语句的循环体内部**只能包含并行语句**（如元件例化、进程语句、并行信号赋值等）。
*   循环变量 `i` 无需预先声明，它由 `FOR` 循环隐式定义，其作用域仅限于 `GENERATE` 语句内部。

#### 6.2 顺序语句

只能出现在进程、函数或过程中。

*   **变量赋值语句**：`目标变量 := 表达式;`
*   **IF 语句**：
    ```vhdl
    IF "条件" THEN
        -- 顺序语句
    ELSIF "条件" THEN
        -- 顺序语句
    ELSE
        -- 顺序语句
    END IF;
    ```
    > ⚠️ **注意**：IF语句具有优先级，会生成<font color="orange">优先级编码器</font>电路。

*   **CASE 语句**：
    ```vhdl
    CASE "表达式" IS
        WHEN "选择值" => -- 顺序语句
        WHEN "选择值" => -- 顺序语句
        WHEN OTHERS => -- 顺序语句
    END CASE;
    ```
    > ⚠️ **注意**：CASE语句的各个分支是平等的，会生成<font color="orange">多路选择器</font>，没有优先级。所有可能的情况必须被完全覆盖，否则需要使用 `OTHERS` 子句。

*   **LOOP 语句**：用于实现循环。
    *   `FOR...LOOP`: 循环固定次数。
    *   `WHILE...LOOP`: 当条件满足时循环。
    *   `LOOP`: 无限循环，需要用 `EXIT` 语句退出。
*   **WAIT 语句**：使进程暂停，直到满足特定条件。例如 `WAIT UNTIL rising_edge(clk);`。
    > ⚠️ **注意**：一个进程中不能同时使用<font color="orange">敏感列表</font>和 `WAIT` 语句。

| 分类                         | 有优先级 (Priority)<br>也就是 "如果不满足A，再看B..." | 无优先级 (Parallel)<br>也就是 "直接看值是A还是B..." |
| -------------------------- | -------------------------------------- | ------------------------------------- |
| 顺序语句<br>(必须在 PROCESS 内)    | IF 语句                                  | CASE 语句                               |
| 并行语句<br>(在 ARCHITECTURE 内) | 条件信号赋值(WHEN ... ELSE)                  | 选择信号赋值(WITH ... SELECT)               |

---

### 7. VHDL程序的其他构件 🔧

*   **块 (BLOCK)**：一种划分机制，可以将结构体内部的并行语句组织成块，但它<font color="orange">不增加硬件的层次结构</font>，仅为组织代码。
*   **函数 (FUNCTION)**：一个返回<font color="orange">单个值</font>的子程序。内部只能有顺序语句，不能包含 `WAIT` 语句。常用于类型转换或重复的计算。
*   **过程 (PROCEDURE)**：一个可以返回<font color="orange">多个值</font>（通过 `OUT` 或 `INOUT` 模式的参数）的子程序。内部只能有顺序语句。

#### 函数与过程的异同点

| 特性           | 函数 (FUNCTION)                              | 过程 (PROCEDURE)                                     |
| -------------- | -------------------------------------------- | ---------------------------------------------------- |
| **返回值**     | 有且仅有1个                                  | 可以有0个或多个 (通过参数)                           |
| **调用方式**   | 作为表达式的一部分                           | 作为一个独立的语句                                   |
| **WAIT语句**   | 不允许                                       | 允许 (但多数综合工具不支持)                          |
| **参数模式**   | 只能是输入 (IN)                              | 可以是 IN, OUT, INOUT                                |

#### 示例描述

假设我们有一个4位的输入总线 `data_in`，我们需要对其进行以下操作：
1.  **奇偶校验**：计算 `data_in` 中'1'的个数是奇数还是偶数。
2.  **优先级编码**：找出最高位为'1'的位置。
3.  将这两个结果输出。

---

##### 🧱 块 (BLOCK) 的例子

**用途**：在这个场景中，块的作用并不明显，因为它主要用于组织大型的并行结构。但为了演示，我们可以用它来将奇偶校验和优先级编码的逻辑在代码中进行**逻辑分区**。

```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY data_processor_block_example IS
    PORT (
        data_in     : IN  STD_LOGIC_VECTOR(3 DOWNTO 0);
        parity_out  : OUT STD_LOGIC; -- '1' for odd, '0' for even
        encoded_out : OUT STD_LOGIC_VECTOR(1 DOWNTO 0)
    );
END ENTITY;

ARCHITECTURE structural OF data_processor_block_example IS
BEGIN

    -- =======================================================
    -- >> 使用 BLOCK 进行逻辑分区 <<
    -- =======================================================

    -- 分区1：专门负责奇偶校验逻辑
    Parity_Check_Block: BLOCK
        -- 这个块内部没有局部声明，因为逻辑很简单
    BEGIN
        parity_out <= data_in(3) XOR data_in(2) XOR data_in(1) XOR data_in(0);
    END BLOCK Parity_Check_Block;


    -- 分区2：专门负责优先级编码逻辑
    Priority_Encoder_Block: BLOCK
        -- 这个块内部也没有局部声明
    BEGIN
        PROCESS (data_in)
        BEGIN
            IF data_in(3) = '1' THEN
                encoded_out <= "11";
            ELSIF data_in(2) = '1' THEN
                encoded_out <= "10";
            ELSIF data_in(1) = '1' THEN
                encoded_out <= "01";
            ELSE
                encoded_out <= "00";
            END IF;
        END PROCESS;
    END BLOCK Priority_Encoder_Block;

END ARCHITECTURE structural;
```
**分析**：
*   `Parity_Check_Block` 和 `Priority_Encoder_Block` 将两部分功能在代码上分开了，使得结构更清晰。
*   在综合时，这两个 `BLOCK` 会被“看穿”，最终的电路和不使用 `BLOCK` 的版本完全一样。它纯粹是一种**代码组织技巧**。

---

##### 🛠️ 函数 (FUNCTION) 的例子

**用途**：奇偶校验是一个纯粹的计算，接收一个输入，返回一个结果。这非常适合用**函数**来封装，以便将来在其他地方重用。

```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY data_processor_func_example IS
    PORT (
        data_in     : IN  STD_LOGIC_VECTOR(3 DOWNTO 0);
        parity_out  : OUT STD_LOGIC;
        encoded_out : OUT STD_LOGIC_VECTOR(1 DOWNTO 0)
    );
END ENTITY;

ARCHITECTURE behavioral OF data_processor_func_example IS

    -- =======================================================
    -- >> 定义一个用于计算奇校验的 FUNCTION <<
    -- =======================================================
    FUNCTION calculate_odd_parity (vec: STD_LOGIC_VECTOR) RETURN STD_LOGIC IS
        VARIABLE parity : STD_LOGIC := '0'; -- 初始为偶校验
    BEGIN
        FOR i IN vec'RANGE LOOP
            parity := parity XOR vec(i);
        END LOOP;
        RETURN parity; -- 返回单个计算结果
    END FUNCTION calculate_odd_parity;

BEGIN

    -- 在并行语句中像调用数学函数一样使用它
    parity_out <= calculate_odd_parity(data_in);

    -- 优先级编码逻辑保持不变
    PROCESS (data_in)
    BEGIN
        IF data_in(3) = '1' THEN
            encoded_out <= "11";
        ELSIF data_in(2) = '1' THEN
            encoded_out <= "10";
        ELSIF data_in(1) = '1' THEN
            encoded_out <= "01";
        ELSE
            encoded_out <= "00";
        END IF;
    END PROCESS;

END ARCHITECTURE behavioral;
```
**分析**：
*   `calculate_odd_parity` 函数封装了奇偶校验的算法。它接收一个 `STD_LOGIC_VECTOR` 类型的输入，返回一个 `STD_LOGIC` 结果。
*   在主代码中，我们通过 `parity_out <= calculate_odd_parity(data_in);` 这样一行简洁的代码就完成了调用。
*   如果其他模块也需要4位奇偶校验，我们就可以把这个函数放到一个公共的`PACKAGE`中，实现**代码复用**。

---

##### ⚙️ 过程 (PROCEDURE) 的例子

**用途**：假设我们想将奇偶校验和优先级编码这两个操作**捆绑**在一起，作为一个完整的“数据分析”步骤。因为需要返回两个不同类型的结果 (`STD_LOGIC` 和 `STD_LOGIC_VECTOR`)，所以必须使用**过程**。

```vhdl
LIBRARY ieee;
USE ieee.std_logic_1164.all;

ENTITY data_processor_proc_example IS
    PORT (
        data_in     : IN  STD_LOGIC_VECTOR(3 DOWNTO 0);
        parity_out  : OUT STD_LOGIC;
        encoded_out : OUT STD_LOGIC_VECTOR(1 DOWNTO 0)
    );
END ENTITY;

ARCHITECTURE behavioral OF data_processor_proc_example IS

    -- ===============================================================
    -- >> 定义一个同时处理两项任务的 PROCEDURE <<
    -- ===============================================================
    PROCEDURE analyze_data (
        SIGNAL din    : IN  STD_LOGIC_VECTOR(3 DOWNTO 0);
        SIGNAL parity : OUT STD_LOGIC;
        SIGNAL encode : OUT STD_LOGIC_VECTOR(1 DOWNTO 0)
    ) IS
    BEGIN
        -- 计算奇偶校验并赋值给第一个输出参数
        parity <= din(3) XOR din(2) XOR din(1) XOR din(0);

        -- 计算优先级编码并赋值给第二个输出参数
        IF din(3) = '1' THEN
            encode <= "11";
        ELSIF din(2) = '1' THEN
            encode <= "10";
        ELSIF din(1) = '1' THEN
            encode <= "01";
        ELSE
            encode <= "00";
        END IF;
    END PROCEDURE analyze_data;

BEGIN

    -- 在一个进程中，像调用一个命令一样调用它
    PROCESS(data_in)
    BEGIN
        -- 调用过程，它会同时驱动 parity_out 和 encoded_out 两个信号
        analyze_data(data_in, parity_out, encoded_out);
    END PROCESS;
    
END ARCHITECTURE behavioral;
```
**分析**：
*   `analyze_data` 过程接收一个输入信号 `din`，并定义了两个**输出参数** `parity` 和 `encode`。
*   在过程内部，它完成了两项任务，并将结果分别赋值给了这两个输出参数。
*   在主代码中，我们通过 `analyze_data(data_in, parity_out, encoded_out);` 这一句独立的语句来调用它，就像执行一个**标准操作流程**。
*   这种方式将一个复杂的操作序列封装起来，使得主进程的逻辑变得非常简单和清晰。
---

### 🌟 本章学习总结

本章我们系统学习了VHDL语言的基础知识，为后续的数字电路设计打下了坚实的基础。

1.  **VHDL程序结构** 🏢：一个完整的VHDL程序由 **库调用、包调用、实体、结构体** 四个基本部分组成。实体描述“是什么”（接口），结构体描述“怎么做”（实现）。
2.  **实体与结构体关系** 🤝：一个实体可以有多个结构体，但一个结构体只能属于一个实体。这种机制使得我们可以用不同的方式（行为、数据流、结构）实现同一个功能接口。
3.  **数据类型** 🔢：掌握了标准数据类型（如 `std_logic`）和用户自定义类型（如枚举类型用于状态机）的应用。
4.  **核心概念：信号、变量、常量** ⚡️：
    *   **常量** `CONSTANT`：全局不变的值。
    *   **变量** `VARIABLE`：进程内的临时存储，赋值 `:=` 立即生效。
    *   **信号** `SIGNAL`：代表物理连线，赋值 `<=` 存在延时，是模块间通信的桥梁。
5.  **核心思想：并行与顺序** 🚦：
    *   VHDL的本质是描述硬件，所以语句默认为 **并行执行**。
    *   **顺序语句** 只能存在于 **进程(PROCESS)**、函数和过程中，用于描述算法流程。
6.  **常用语句** 📝：掌握了 `IF` (带优先级)、`CASE` (不带优先级) 等流程控制语句，以及元件例化等结构化设计方法。
7.  **子程序** 🛠️：理解了 **函数(Function)** 和 **过程(Procedure)** 的区别与应用场景，它们是代码复用和模块化的重要工具。

通过本章的学习，我们应能独立编写出结构完整、语法正确的简单VHDL程序，并能清晰地辨别不同描述方式和数据对象带来的差异。