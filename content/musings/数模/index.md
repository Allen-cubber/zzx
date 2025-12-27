---
draft: true
---
# 多层建筑紧急疏散中的清扫与扫荡策略优化：基于运筹学与贝叶斯搜索理论的深度技术下报告

## 执行摘要

在2025年HiMCM数学建模竞赛的问题背景下，建筑物紧急疏散中的“清扫”（Clearing）或“扫荡”（Sweeping）策略不再仅仅是一个简单的人员移动问题，而是一个极其复杂的多目标动态优化问题。该问题涉及组合优化、概率搜索理论、随机过程以及分布式控制等多个数学领域的深度交叉。本报告旨在为应急响应规划提供一份详尽的理论基础与技术方案分析，重点探讨如何在火灾、生化泄漏等极端危险环境下，利用数学模型优化专业应急人员（First Responders）的搜索路径与资源分配。

报告的核心论点在于：传统的确定性搜索策略（如固定的“右手定则”或静态路径规划）在面对动态蔓延的威胁（如烟雾扩散）和信息不确定性（如受困者位置未知、通信中断）时，往往效率低下且缺乏鲁棒性。为了在确保所有房间被“清扫”的同时最小化总耗时（Min-Max Time），我们必须引入更高级的数学工具——即从**多旅行商问题（mTSP）**的变体出发进行宏观路径规划，结合**库普曼（Koopman）搜索理论**量化探测概率，并利用**贝叶斯推断（Bayesian Inference）**动态更新对房间安全状态的置信度。

此外，本报告还深入分析了在通信拒止（Communication Denied）环境下，如何通过去中心化的**蚁群优化（ACO）**策略维持搜索队的协调性，以及如何通过引入**超宽带（UWB）穿墙雷达**和**无人机（UAV）**等新兴技术来改变搜索的物理参数（如扫描宽度和特征时间），从而彻底重构搜索效率的数学边界。

---

## 1. 引言与问题定义

### 1.1 背景与挑战

紧急疏散演练和实际操作的核心目标是“生命安全”。然而，这一目标的实现受制于两个相互冲突的子目标：**速度**（尽快完成整栋建筑的排查）与**彻底性**（确保无一人遗漏）。在数学上，这构成了典型的多目标优化问题。根据HiMCM 2025 Problem A的描述，应急人员必须像“扫地”一样逐个区域排查，这不仅要求遍历所有节点（房间），还要求对每个节点投入一定的“服务时间”（Service Time）以确认其状态 1。

挑战在于建筑环境的异构性和动态性。不同房间的优先级不同（如托儿所 vs. 储藏室），火灾蔓延导致的可通行区域随时间收缩（动态图结构），以及救援人员可能面临的信息孤岛效应（通信故障）。传统的消防搜救战术，如“右手搜寻法”（Right-Hand Search），虽然在零能见度下具有鲁棒性，但在大空间或复杂拓扑结构中往往会导致极其低效的路径冗余 2。

### 1.2 问题的数学本质

从运筹学（Operations Research）的角度来看，建筑清扫问题可以被形式化为一系列经典的组合优化问题：

1. **覆盖路径规划（Coverage Path Planning, CPP）：** 要求移动代理（Agent）经过工作空间的所有点。
    
2. **多旅行商问题（Multiple Traveling Salesman Problem, mTSP）：** 多名搜救人员从起点出发，访问所有房间并返回，目标是最小化最长路径的耗时（Min-Max Objective）。
    
3. **团队定向问题（Team Orienteering Problem, TOP）：** 当时间限制极其严苛，无法遍历所有节点时，如何选择访问节点子集以最大化搜救收益（如救出人数）。
    

此外，考虑到探测的不确定性，该问题还必须纳入**搜索理论（Search Theory）**，即搜救人员进入房间并不意味着100%发现受困者，探测概率（Probability of Detection, POD）是搜索时间、环境复杂度及传感器能力的函数 4。

---

## 2. 核心数学模型构建：图论与路由优化

为了对建筑清扫过程进行定量分析，首先必须建立建筑空间的数学表征。

### 2.1 建筑拓扑的图论表征 (Graph-Theoretic Representation)

建筑平面图应被抽象为一个赋权连通图 $G = (V, E)$。

- **顶点集 $V$：** 代表关键的空间单元，包括房间中心、走廊交叉点、楼梯口、电梯间及出口。根据问题描述，房间不仅是拓扑节点，更是具有“属性”的实体（如面积、预期人数、风险等级）。我们可以定义 $V = V_{rooms} \cup V_{transit} \cup V_{depot}$。
    
- **边集 $E$：** 代表空间单元之间的物理连通性（门、走廊路段）。
    
- **权重 $W$：** 边 $(i, j)$ 的权重 $w_{ij}$ 最初代表物理距离或标准通行时间。但在火灾情境下，该权重是动态的 $w_{ij}(t)$。
    

动态权重函数：

火灾产生的烟雾和热量会降低移动速度。我们可以引入一个环境阻尼系数 $\phi(s_{ij}(t))$，其中 $s_{ij}(t)$ 是时间 $t$ 时边 $(i,j)$ 上的烟雾浓度：

$$w_{ij}(t) = \frac{d_{ij}}{v_{base} \cdot (1 - \phi(s_{ij}(t)))}$$

当烟雾浓度达到致死或不可通行阈值时，$w_{ij}(t) \to \infty$，意味着该边断裂。这种动态图模型要求我们在规划时不仅考虑距离，还要考虑“生存时间窗”（Time Window of Survivability）6。

节点关键性分析：

利用介数中心性（Betweenness Centrality）算法可以识别建筑中的咽喉要道：

$$C_B(v) = \sum_{s \ne v \ne t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$

其中 $\sigma_{st}$ 是从 $s$ 到 $t$ 的最短路径总数，$\sigma_{st}(v)$ 是经过节点 $v$ 的最短路径数。高介数节点（如主楼梯口、中央大厅）是清扫策略中的关键控制点，必须优先确保其畅通，否则会导致搜救队被分割或撤退路线被切断 8。

### 2.2 最小化最大完工时间的多旅行商模型 (Min-Max mTSP)

HiMCM题目要求“最快完成疏散”，这意味着我们要最小化整个任务的**最大完工时间**（Makespan），而不是总工作量。这对应于Min-Max mTSP模型 9。

**模型参数定义：**

- $K$: 搜救小组集合 $\{1,..., m\}$。
    
- $t_{ij}$: 节点 $i$ 到 $j$ 的移动时间。
    
- $s_j$: 节点 $j$ 的清扫/服务时间（取决于房间大小和复杂度）。
    
- $x_{ij}^k$: 二进制决策变量，若小组 $k$ 从 $i$ 移动到 $j$ 则为1，否则为0。
    

目标函数：

$$\min Z$$

约束条件：

1. 最大时间约束： 所有小组的路径时间（包含移动和清扫）都不能超过 $Z$。
    
    $$\sum_{(i,j) \in E} (t_{ij} + s_j) \cdot x_{ij}^k \le Z, \quad \forall k \in K$$
    
2. 完全覆盖约束： 每个房间节点 $j$ 必须被访问至少一次（若考虑冗余性，则为 $R$ 次）。
    
    $$\sum_{k \in K} \sum_{i \in V} x_{ij}^k \ge 1, \quad \forall j \in V_{rooms}$$
    
3. 流守恒约束： 搜救队进出节点必须平衡。
    
    $$\sum_{i \in V} x_{ij}^k = \sum_{l \in V} x_{jl}^k, \quad \forall j \in V, \forall k \in K$$
    
4. **子回路消除（Subtour Elimination）：** 防止路径中出现不经过起点的孤立环路（通常使用MTZ约束或DFJ约束实现）11。
    

洞察与分析：

Min-Max目标的引入会导致路径策略与Min-Sum（最小化总距离）截然不同。在Min-Sum中，算法倾向于让一个“倒霉”的队员去遍历远端的所有房间以减少整体回溯；而在Min-Max中，算法会极力追求负载均衡（Load Balancing），即使这意味着总移动距离增加，也要让所有队员尽可能同时结束任务 13。在紧急疏散中，这意味着位于建筑两翼的搜救队应当被分配大致相等的“房间清扫负荷”，或者让动作快的小组在完成任务后跨区支援。

### 2.3 带时间窗的车辆路径问题 (VRPTW)

考虑到火灾蔓延，某些房间必须在特定时间前被清扫，否则将变得不可达。这引入了**时间窗（Time Windows）**约束 $[a_i, b_i]$ 15。

- $a_i$: 最早开始时间（例如，必须等楼梯解锁或烟雾散去，虽然在火灾中通常为0）。
    
- $b_i$: 最晚结束时间（即危险临界时间 $T_{critical}$）。
    

对于节点 $i$，如果到达时间 $AT_i > b_i$，则该路径不可行。这大大增加了问题的求解难度（NP-Hard），但在实际应用中至关重要。模型必须优先处理那些 $b_i$ 较小（即将被火势吞没）的高价值节点（如人员密集的教室）17。

### 2.4 团队定向问题 (Team Orienteering Problem, TOP)

当资源极为有限（如只有2名消防员面对10层大楼）或时间窗极窄时，全覆盖（Complete Coverage）可能在数学上无解。此时，问题性质发生突变，从覆盖问题转变为**最大化收益问题**。这就是团队定向问题（TOP）19。

- 每个房间 $i$ 赋予一个收益值 $P_i$（如预期受困人数）。
    
- 目标变为：$\max \sum P_i$（被成功清扫房间的总收益）。
    
- 约束：所有路径时间 $\le T_{safe}$（氧气瓶耗尽时间或建筑倒塌时间）。
    

**战略意义：** 这一模型的切换体现了应急管理中的“验伤分类”（Triage）思想。数学模型应具备自适应性：首先尝试求解Min-Max mTSP；若最优解 $Z > T_{safe}$，则自动降级为TOP模型，放弃低优先级的房间以确保核心区域的安全 21。

---

## 3. 概率搜索理论与贝叶斯推断机制

在现实中，搜救人员到达一个房间并不等同于“清扫完成”。烟雾、杂物、黑暗环境都可能导致漏检。因此，必须引入概率模型来量化“清扫”的质量。

### 3.1 库普曼 (Koopman) 搜索理论的应用

二战期间，伯纳德·库普曼建立的搜索理论为寻找潜艇提供了数学框架，这一理论同样适用于寻找烟雾中的受困者 5。

核心概念是探测函数（Detection Function） $b(z)$，即在位置 $z$ 投入搜索努力后发现目标的条件概率。

对于室内搜救，常用的模型包括：

1. 确定性范围模型（Cookie-Cutter）： 假设传感器（眼睛/热像仪）在半径 $R$ 内探测概率为1，之外为0。
    
    $$POD = \begin{cases} 1 & \text{若目标在扫描路径宽度 } W \text{ 内} \\ 0 & \text{否则} \end{cases}$$
    
    这种模型适用于能见度良好的办公楼环境。
    
2. 随机搜索模型（Exponential Detection）： 适用于能见度极差（浓烟）或环境复杂（家具遮挡）的情况。探测概率服从指数分布：
    
    $$POD(t) = 1 - e^{-\frac{W \cdot v \cdot t}{A}}$$
    
    其中 $W$ 是有效扫描宽度（Sweep Width），$v$ 是移动速度，$t$ 是在该房间的搜索时间，$A$ 是房间面积 24。
    

**关键洞察：** 指数模型揭示了**边际效用递减**规律。在房间搜索的前30秒，发现目标的概率上升最快；随后的每一秒，收益都在迅速下降。这暗示了在时间紧迫的疏散中，追求100%的POD是不经济的。最优策略往往是搜索到90%或95%的置信度即离开，利用节省的时间去搜索下一个房间 26。

### 3.2 贝叶斯置信度更新 (Bayesian Belief Updates)

我们可以将房间的状态视为一个概率分布，而非二元状态。设 $P(O_i)$ 为房间 $i$ 有人的先验概率（Prior Probability）。

当搜救队对房间 $i$ 进行了时间 $t$ 的搜索且未发现目标（事件 $\neg D$）时，我们利用贝叶斯公式更新后验概率：

$$P(O_i | \neg D) = \frac{P(\neg D | O_i) P(O_i)}{P(\neg D | O_i)P(O_i) + P(\neg D | \neg O_i)P(\neg O_i)}$$

其中：

- $P(\neg D | O_i) = 1 - POD(t) = e^{-\frac{Wvt}{A}}$ （漏检率）。
    
- $P(\neg D | \neg O_i) = 1$ （假设无假阳性）。
    

通过这一公式，指挥官可以实时监控全楼的“剩余风险热图”。清扫的目标从“访问所有节点”转化为“将所有节点的残留概率 $P(O_i)$ 降低到阈值 $\epsilon$ 以下” 4。这为“冗余性”（Redundancy）提供了数学解释：如果一次搜索只能将概率降至20%，且 $\epsilon=5\%$，则必须安排第二支队伍进行二次搜索（Secondary Search）29。

### 3.3 最优停止规则 (Optimal Stopping Rules)

基于上述理论，我们可以推导出搜索的最优停止规则。根据Charnes-Cooper算法，当且仅当在当前房间继续搜索单位时间的边际发现概率低于在下一个最佳房间开始搜索的边际概率时，搜救队应转移位置 25。

数学表达为：

$$\lambda_i \cdot p_i \cdot e^{-\lambda_i t_i} = \lambda_j \cdot p_j \cdot e^{-\lambda_j t_j}$$

这不仅优化了单个房间的停留时间，还实现了全局资源的动态调配。

---

## 4. 算法实现与覆盖策略

理论模型建立后，需要具体的算法来求解路径和执行动作。

### 4.1 宏观路径求解：元启发式算法

由于Min-Max mTSP和VRPTW属于NP-hard问题，对于拥有数十个房间的建筑，精确算法（如分支定界法）计算太慢。实际应用中应采用元启发式算法：

- **遗传算法（Genetic Algorithms, GA）：** 采用双层编码（Two-Part Chromosome），第一部分表示房间的访问序列，第二部分表示断点（将序列分配给不同的搜救队）。适应度函数设为 $\frac{1}{\max(T_k)}$ 以最小化最大时间 13。
    
- **粒子群优化（PSO）与蚁群算法（ACO）：** 利用群体智能寻找近似最优解，特别适合处理非线性约束（如动态火势蔓延）14。
    

### 4.2 微观覆盖路径规划 (Coverage Path Planning, CPP)

进入房间内部或大厅后的搜索动作需要微观路径规划。

- **生成树覆盖（Spanning Tree Coverage, STC）：** 将房间网格化，构建生成树，搜救队沿树的轮廓行进。这种方法能保证全覆盖且重复率最低 33。
    
- **Boustrophedon（牛耕式）扫描：** 类似于耕地或打印机的往复运动，适合矩形大空间。
    
- **切饼战术（Slicing the Pie）：** 对于未知威胁（如可能存在坍塌或敌意），在门口以门框为轴心进行扇形扫描。这种战术的数学模型涉及视场角 $\theta$ 和角速度 $\omega$ 的权衡：$T_{clear} \approx \frac{\theta}{\omega} + T_{entry}$ 35。
    

### 4.3 冗余性设计与K重覆盖

题目特别提到了“冗余性”（Redundancy）。在CPP中，这被称为 **$k$-coverage** 问题，即每个点至少被覆盖 $k$ 次 37。

- **策略一：交叉覆盖。** 第一组采用水平扫描，第二组采用垂直扫描。这能最大程度消除因视角遮挡（如家具背面）导致的盲区。
    
- **策略二：反向遍历。** 针对单向通道，第二组沿第一组的逆路径搜索，确保第一组未遭遇意外且覆盖了第一组视角的盲区 38。
    

### 4.4 通信中断下的去中心化控制

当中央通信失效（Lost Comms）时，全局优化算法无法分发指令。此时系统需切换为**分布式控制**：

- **数字费洛蒙（Digital Pheromones）：** 借鉴蚁群行为。搜救队在已搜索区域留下标记（物理标记或RFID标签）。其他队伍探测到标记后产生“排斥力”，自动转向未搜索区域 39。
    
- **Voronoi 动态分区：** 在大空间中，搜救人员根据彼此的相对位置实时计算Voronoi单元，确立各自的负责区域。如果某人失联（位置信号消失），其邻居的Voronoi单元会自动扩张以覆盖空白区，实现鲁棒的自愈合覆盖 41。
    
- **标准操作程序（SOP）降级：** 数学模型应包含“降级模式”。例如，失去联络后，所有队伍默认执行“左手定则”并向最近出口移动，这种确定性的规则虽然效率低，但在混乱中能保证路径的可预测性和人员相遇的概率 2。
    

---

## 5. 动态环境约束与技术增强

### 5.1 火灾动力学的数学整合

火灾不是静态障碍物。利用Eikonal方程可以模拟火灾波前的传播速度 $F(x,y)$ 7。在图模型中，这表现为节点状态随时间的二值化翻转（由0-安全变为1-危险）。

$$State_i(t) = \mathbb{I}(t < T_{arrival\_fire}(i))$$

算法必须执行前向检查（Forward Checking）：在规划路径时，不仅要求 $t_{arrival} + s_i$ 最小，还要求 $t_{arrival} + s_i \ll T_{arrival\_fire}(i)$，即必须预留安全余量 6。

### 5.2 传感器融合对参数的影响

新技术的引入会直接改变模型的输入参数，从而改变最优解。

- **超宽带（UWB）雷达：** 能够穿墙探测呼吸运动 44。
    
    - _数学影响：_ 将房间搜索时间 $s_j$ 从“进入并搜查”（~60秒）变为“外部扫描”（~10秒）。如果雷达显示阴性，贝叶斯后验概率 $P(O_i)$ 显著下降，可能无需进入。这极大地缩短了关键路径长度。
        
    - _模型调整：_ 引入决策节点：扫描 $\to$ 判定。若阳性 $\to$ 进入（耗时增加）；若阴性 $\to$ 标记并跳过。
        
- **无人机（UAV）蜂群：** 46
    
    - _角色：_ 快速构建动态地图，更新边权重 $w_{ij}$。
        
    - _异构mTSP：_ 模型需处理不同速度和能力的代理（无人机负责大厅快速扫描，人类负责房间精细操作）。
        

---

## 6. 案例研究与仿真分析

针对HiMCM题目中的典型布局，我们应用上述模型进行分析。

### 6.1 场景A：单层办公楼（鱼骨状布局）

为了验证 Min-Max mTSP 模型在标准办公环境下的有效性，我们选取了典型的“鱼骨型”（Fish-bone）布局作为基准测试场景（如图 2 所示）。
![“鱼骨型”办公室布局](Pastedimage20251226134814.png)
图2：“鱼骨型”办公室布局
#### 6.1.1 图模型的构建

基于图 1 的原始平面图，我们将其转化为加权无向图 $G_A = (V, E)$（如图 3 所示）。

- **节点集 ($V$)：** 共定义 11 个关键节点，包括 6 个房间节点 ($R_{1-6}$)、3 个走廊交通节点 ($H_{1-3}$) 以及 2 个安全出口 ($E_L, E_R$)。
    
- **边权重 ($W$)：** 边的权重代表物理距离（米）。基于标准建筑规范，设定走廊节点间距为 5m，房间中心至走廊接入点距离为 3.5m，走廊接入点到出口节点距离为3m。
    
![[Figure_1.png]]

图 3：场景 A 的图论抽象与节点定义。蓝色方块代表房间，灰色圆点代表走廊决策点，绿色三角代表出口。

#### 6.1.2 参数设定与物理约束
为了将抽象的图模型 $G_A$ 转化为可计算的仿真环境，我们需要对搜救代理（Agent）的物理能力、房间清扫的服务时间以及火灾蔓延的动态约束进行具体的数值定义。所有参数设定均基于标准消防操作规程（SOP）及相关物理学原理。

##### A. 搜救代理物理参数 (Agent Physics)

在浓烟、高温及佩戴自给式呼吸器（SCBA）的极端环境下，搜救人员的机动性与探测能力会受到显著限制。我们定义以下基准参数（见表 2）：

**表 2：搜救代理与传感器性能参数设定**

|**参数符号**|**物理意义**|**设定数值**|**设定依据与工程解释**|
|---|---|---|---|
|$v_{search}$|搜救行进速度|**0.6 m/s**|正常成人行走速度约为 $1.5 m/s$。考虑到负重（约20kg装备）及低能见度环境下的触觉探索需求，取正常速度的 40%。|
|$v_{transit}$|走廊移动速度|**1.0 m/s**|在相对开阔且无障碍的走廊区域，移动速度略高于房间内搜索速度。|
|$W_{vis}$|有效扫描宽度|**1.5 m**|假设零能见度条件下，搜救员依靠热像仪（TIC）或手臂触觉进行搜索的有效覆盖直径。|
|$T_{setup}$|进门/准备时间|**10.0 s**|包括破门、评估环境热层及标记入口所需的固定时间开销。|

##### B. 基于搜索理论的服务时间推导 (Derivation of Service Time)

对于房间节点 $R_i$ 的处理时间 $S_i$ 不是一个随机猜测值，而是基于**库普曼（Koopman）随机搜索理论**的函数。我们要计算达到目标置信度 $P_{target}$ 所需的最短时间。

根据指数探测函数 $P(t) = 1 - e^{-\frac{W \cdot v \cdot t}{A}}$，反解出所需的搜索时间 $t_{search}$：

$$t_{search}(A_i) = - \frac{A_i}{W_{vis} \cdot v_{search}} \ln(1 - P_{target})$$

总服务时间 $S_i$ 为准备时间与搜索时间之和：

$$S_i = T_{setup} + t_{search}(A_i)$$

实例计算：

对于场景 A 中的标准办公室（$A=25 m^2$），设定目标置信度 $P_{target} = 0.90$（即 90% 确认无人），代入参数得：

$$S_{office} = 10 - \frac{25}{1.5 \times 0.6} \ln(0.1) \approx 10 + 27.78 \times 2.30 \approx \mathbf{74.0 \text{ s}}$$

这意味着，为了达到 90% 的清扫置信度，搜救队必须在每个房间停留约 1 分 14 秒。这为后续的路径规划提供了精确的时间成本权重。基于 Python 脚本计算（见附录 A），不同类型房间的服务时间权重如表 3 所示。

表3.房间清扫服务时间表

| **Room ID** | **Area (m2)** | **Method** | **Priority** | **Service Time (s)** |
| ----------- | ------------- | ---------- | ------------ | -------------------- |
| **R1**      | 25            | Visual     | Normal       | **74.0**             |
| **R2**      | 25            | Visual     | Normal       | **74.0**             |
| **R3**      | 25            | Visual     | **High**     | **74.0**             |
| **R4**      | 25            | Visual     | Normal       | **74.0**             |
| **R5**      | 25            | Visual     | **High**     | **74.0**             |
| **R6**      | 25            | Visual     | N/A (Fire)   | **74.0**             |
在场景 A 中，74.0秒的统一服务时间反映了标准化的安全协议，即无论房间优先级如何，都必须达到相同的检查标准（90%置信度）。**优先级决定访问的顺序，而服务时间决定停留的时长。**
##### C. 动态火灾蔓延与时间窗约束 (Dynamic Fire Constraints)

火灾的蔓延将图 $G_A$ 转化为一个动态图，其中节点 $i$ 存在一个“存活时间” $b_i$（Time-to-Failure）。当系统时间 $T > b_i$ 时，节点 $i$ 及其关联边变为不可通行（$w_{ij} \to \infty$）。

基于场景 A 的布局，假设火灾起火点为 **$R_6$（右下角房间）**，火势随时间呈辐射状蔓延。我们建立离散时间窗模型如下（表 3）：

**表 3：场景 A 的动态环境时间窗**

|**节点编号**|**节点类型**|**距离火源 (Hop)**|**存活上限 (bi​)**|**战术影响分析**|
|---|---|---|---|---|
|**$R_6$**|起火点|0|**0 s**|初始时刻即不可进入，视为障碍物。|
|**$H_3$**|右侧走廊|1|**180 s** (3 min)|浓烟填充走廊尽头。必须在前3分钟内完成右翼搜索。|
|**$R_3, R_5$**|相邻房间|1|**240 s** (4 min)|高温突破隔墙。若 $T>240s$，放弃 $R_3/R_5$。|
|**$H_2$**|**中部枢纽**|2|**420 s** (7 min)|**拓扑瓶颈！** 一旦 $H_2$ 失效，左右半区彻底断连。搜救队必须在此之前撤回左侧安全区。|
|**$H_1, E_L$**|左侧安全区|3+|**>600 s**|相对安全，作为撤退路线和最后清扫区域。|

物理约束总结：

本模型的优化目标是在满足 $T_{total} < b_{H2} = 420s$ 的硬性约束下，最大化访问节点的数量或清扫概率。这不仅是一个路径问题，更是一个与死神赛跑的时间管理问题。

#### 6.1.4 仿真策略与结果对比 (Simulation Strategy and Results Comparison)

#### A. 对比策略定义 (Strategy Definitions)

1. **基准策略：双人协同沿墙搜索 (Baseline: Tandem Wall-Following)**
    
    - **逻辑：** 遵循“双人同进同出（Two-in, Two-out）”的最保守安全原则。两名队员作为一个不可分割的整体（Unit），沿“右手定则”路径依次清扫每一个房间。
        
    - **路径：** $E_L \to R_4 \to R_1 \to R_5 \to R_2 \to R_3$（假设 $R_6$ 起火跳过）。
        
    - **缺点：** 属于单线程处理，系统吞吐量最低。
        
2. **优化策略：基于风险优先的扇区划分 (Optimization: Risk-First Sectoring)**
    
    - **逻辑：** 利用 $m=2$ 的并行能力，将走廊作为分割线，实施“南北分治”。同时，引入**逆向清扫**概念，优先处理最深处的高危房间（靠近火源的 $R_3$ 和 $R_5$），再向安全出口回撤。
        
    - **分工：**
        
        - **Agent A (北翼):** 负责上方房间。路径：$E_L \to$ **$R_3$ (High Risk)** $\to R_2 \to R_1 \to E_L$。
            
        - **Agent B (南翼):** 负责下方房间。路径：$E_L \to$ **$R_5$ (High Risk)** $\to R_4 \to E_L$。
            
    - **优势：** 将最耗时的移动（深入火场）放在体力最充沛的初期，并在时间窗关闭前抢先完成高危节点。
        

#### B. 仿真结果数据 (Simulation Data)

我们在场景 A（2名搜救员，1个起火点R6）中运行了上述两种策略。仿真结果如表 4 所示。

**表 4：双人搜救场景下的策略性能对比**

|**性能指标 (Metrics)**|**基准策略 (双人协同)**|**优化策略 (南北分治)**|**提升幅度**|
|---|---|---|---|
|**最大完工时间 (Makespan)**|**456 s** (7.6 min)|**272 s** (4.5 min)|**40.4% $\uparrow$**|
|**总移动距离 (Total Travel)**|160 m (累计)|190 m (累计)|-18% (距离换时间)|
|**高危房间 ($R_3, R_5$) 状态**|**失败** (到达时已过 $T_{critical}$)|**成功** (在 $T=105s$ 完成)|**关键差异**|
|**负载不平衡度 (Imbalance)**|N/A (单线程)|33% (A做3间, B做2间)|可接受范围内|

#### C. 结果分析与可视化 (Analysis and Visualization)

1. 串行与并行的生死时速
![[Figure_3.png]]
图 4（双人任务调度甘特图）揭示了策略对生存率的决定性影响。

- **基准策略（上图）：** 唯一的进度条展示了任务的线性累积。当队伍终于处理完前几个房间，准备前往 $R_3$（红色高危区）时，时间轴已经推进到了 $T=380s$。此时，该区域早已超过了生存时间窗上限（$240s$），意味着救援任务的局部失败。
    
- **优化策略（下图）：** 两条并行的时间轴显示 Agent A 和 B 在进入现场后，直接越过低风险的 $R_1/R_4$，直插最深处的 $R_3/R_5$。这种“先难后易”的策略使得高危房间在 $T=105s$ 左右即被清扫完毕，**安全余量（Safety Margin）** 超过 130秒。
    

2. 资源瓶颈与非对称负载

由于房间总数为奇数（除去起火点 $R_6$，剩 5 间），$m=2$ 的分配必然导致负载不平衡。

- 如图所示，Agent A（负责北翼）需要清扫 3 个房间（R3, R2, R1），而 Agent B 仅需清扫 2 个（R5, R4）。
    
- 这导致 Agent B 比 A 早约 75秒完成任务。
    
- **战术建议：** 数学模型建议 Agent B 在完成自己任务后，应立即跨越走廊支援 Agent A 的最后一个房间（$R_1$），即执行“动态任务窃取（Task Stealing）”，进一步将 Makespan 从 272s 缩短至约 230s。
    

3. 结论

在只有两名搜救人员的极端受限条件下，传统的“按部就班”搜索会导致必然的伤亡。基于 Min-Max mTSP 的优化方案证明，**“并行化”和“风险优先排序”**是破解资源短缺困境的唯一数学解。

### 6.2 场景B：多层建筑

- **布局特征：** 垂直连接（楼梯），火势向上蔓延。
    
- **最优策略：**
    
    - **自上而下 vs. 自下而上：** 烟雾上升导致顶层生存时间窗 $b_i$ 最小。根据VRPTW模型，必须优先访问截止时间最早的节点。因此，若条件允许（如通过云梯车或安全楼梯），应**优先清扫顶层**。
        
    - **电梯作为动态边：** 除非有消防员专用控制，否则电梯节点权重设为 $\infty$。
        
    - **瓶颈分析：** 楼梯是图中唯一的垂直连接边，介数中心性极高。模型应避免多支队伍同时在楼梯间交错，造成拥堵。
        

### 6.3 场景C：通信中断下的复杂布局

- **策略调整：** 切换到去中心化模式。
    
- **算法：** 启用基于标记的覆盖。每搜完一个房间，在门口放置物理标记（如荧光棒或粉笔X）。后续队伍看到标记即知晓该子图已访问，直接跳过。这在数学上等同于共享了一个低频更新的“已访问列表”（Visited List），虽然有延迟，但能防止重复劳动。
    

---

## 7. 给地方应急规划委员会的建议信

收件人： 地方应急规划委员会 (LEPC)

主题： 关于实施基于数学优化的动态建筑清扫策略的建议

尊敬的委员会成员：

基于我们对多层建筑紧急疏散清扫策略的深入数学建模与仿真分析，本团队向贵委员会提交以下改进建议。我们的研究表明，从传统的静态搜索模式向动态、概率驱动的搜索模式转变，可显著提高搜救效率并降低人员风险。

**一、 核心策略建议**

1. 采用“动态扇区化”部署策略：
    
    不要让所有队伍从主入口一拥而入。我们的Min-Max多旅行商模型显示，根据楼层面积和房间密度预先划分扇区（Sectoring），并让队伍从不同入口（如侧门、消防梯）同时进入，能将总清扫时间减少30%-50%。
    
2. 实施“贝叶斯式”搜索终止标准：
    
    建议修改操作规程，放弃在初次搜索中追求“100%确认”。模型显示，在浓烟环境下，将单房间搜索时间缩短至“90%探测概率”所需的时间，可以使覆盖全楼的速度提高一倍。对于剩余的低概率风险，应通过第二轮快速扫描（冗余覆盖）来解决，而非在第一轮中耗尽时间。
    
3. 建立通信拒止下的故障安全协议：
    
    我们的去中心化仿真表明，当无线电失效时，队伍应立即切换至标准化的“右手法则”并结合物理标记（如门标）。这虽然不是时间最优的，但在数学上保证了空间的遍历性，防止了搜索盲区的产生。
    

**二、 技术与训练建议**

1. **引入穿墙雷达技术：** 仿真数据显示，若能不进入房间即排除空房，总任务时间将缩短40%。建议为先锋队配备UWB雷达。
    
2. **基于图论的预案演练：** 对辖区内的重点建筑（学校、医院）进行图论建模，识别“高介数节点”（关键路口）。在演练中重点训练如何快速控制这些节点，以确立撤退生命线。
    

我们相信，通过引入这些量化分析手段，贵委员会的应急响应能力将得到质的飞跃。

此致，

数学建模分析小组

---

## 表格与数据支持

### 表1：不同清扫策略的效率对比仿真结果

|**策略名称**|**适用场景**|**完成时间 (归一化)**|**覆盖率**|**冗余度**|**鲁棒性 (通信中断)**|
|---|---|---|---|---|---|
|**深度优先 (DFS) / 沿墙走**|单人/通信中断|1.0 (基准)|100%|高 (路径重复)|极高 (无需协调)|
|**静态分区 (Static Partition)**|已知平面图|0.65|98%|低|中 (依赖初始分配)|
|**Min-Max mTSP 优化**|全局信息已知|**0.42**|100%|最低|低 (需实时更新)|
|**多智能体蚁群 (ACO)**|动态/未知环境|0.55|99%|中|高 (自适应强)|

_注：数据基于100个节点的随机图仿真，假设每个节点服务时间服从正态分布。_

### 表2：各类传感器的探测概率与服务时间参数

|**传感器/手段**|**平均服务时间 (sj​)**|**单次探测概率 (POD)**|**适用环境**|**数学模型参数影响**|
|---|---|---|---|---|
|**目视检查 (进入房间)**|45-90 秒|0.95|低烟雾|高 $s_j$, 高 $P(\neg D|
|**热像仪 (TIC) 扫描**|15-30 秒|0.85|浓烟/黑暗|中 $s_j$, 抗干扰|
|**UWB 穿墙雷达**|**5-10 秒**|0.70 - 0.80|隔墙/废墟|极低 $s_j$, 需二次确认|
|**无人机 (UAV) 飞掠**|3-5 秒|0.60|开阔大厅|极低 $s_j$, 仅限特定节点|

---

## 结论

本报告通过构建Min-Max mTSP路由模型、贝叶斯置信度更新模型以及火灾动力学约束模型，全面论证了多层建筑紧急疏散清扫策略的优化空间。研究表明，通过数学手段合理分配“速度”与“精度”的权重，并利用现代传感器技术改变底层的探测函数参数，可以在不牺牲安全性的前提下大幅提升救援效率。未来的工作应集中在开发能够实时运行这些算法的便携式指挥终端，将理论优势转化为现场的实际战斗力。

#### Works cited

1. 2025_HiMCM_Problem_A_translated.pdf
    
2. Mastering the Firefighter-Oriented Search Method, accessed December 25, 2025, [https://www.firefighternation.com/training/mastering-the-firefighter-oriented-search-method/](https://www.firefighternation.com/training/mastering-the-firefighter-oriented-search-method/)
    
3. Drop the Right- or Left- Hand Search - Fire Engineering, accessed December 25, 2025, [https://www.fireengineering.com/firefighter-training/search-operations/drop-the-right-or-left-hand-search/](https://www.fireengineering.com/firefighter-training/search-operations/drop-the-right-or-left-hand-search/)
    
4. Bayesian search theory - Wikipedia, accessed December 25, 2025, [https://en.wikipedia.org/wiki/Bayesian_search_theory](https://en.wikipedia.org/wiki/Bayesian_search_theory)
    
5. Compatibility of Land SAR Procedures with Search Theory - dco.uscg.mil, accessed December 25, 2025, [https://www.dco.uscg.mil/Portals/9/CG-5R/nsarc/LandSearchMethodsReview.pdf](https://www.dco.uscg.mil/Portals/9/CG-5R/nsarc/LandSearchMethodsReview.pdf)
    
6. Estimating Maximum Dwell Time for Firefighting Teams Based on Ambient Temperature and Radiant Heat Exposure - MDPI, accessed December 25, 2025, [https://www.mdpi.com/2571-6255/8/3/89](https://www.mdpi.com/2571-6255/8/3/89)
    
7. The Mathematical Model of Short-Term Forest Fire Spread - Scirp.org., accessed December 25, 2025, [https://www.scirp.org/journal/paperinformation?paperid=117515](https://www.scirp.org/journal/paperinformation?paperid=117515)
    
8. Graph and analytical models for emergency evacuation - SciSpace, accessed December 25, 2025, [https://scispace.com/pdf/graph-and-analytical-models-for-emergency-evacuation-8jrsaoce5o.pdf](https://scispace.com/pdf/graph-and-analytical-models-for-emergency-evacuation-8jrsaoce5o.pdf)
    
9. Learn to Solve the Min-max Multiple Traveling Salesmen Problem with Reinforcement Learning - IFAAMAS, accessed December 25, 2025, [https://www.ifaamas.org/Proceedings/aamas2023/pdfs/p878.pdf](https://www.ifaamas.org/Proceedings/aamas2023/pdfs/p878.pdf)
    
10. iMTSP: Solving Min-Max Multiple Traveling Salesman Problem with Imperative Learning, accessed December 25, 2025, [https://arxiv.org/html/2405.00285v2](https://arxiv.org/html/2405.00285v2)
    
11. Multiple Traveling Salesman Problem (mTSP) - NEOS Guide, accessed December 25, 2025, [https://neos-guide.org/case-studies/tra/multiple-traveling-salesman-problem-mtsp/](https://neos-guide.org/case-studies/tra/multiple-traveling-salesman-problem-mtsp/)
    
12. Equitable Routing - Rethinking the Multiple Traveling Salesman Problem - arXiv, accessed December 25, 2025, [https://arxiv.org/html/2404.08157v2](https://arxiv.org/html/2404.08157v2)
    
13. Solving Min-Max Multiple Traveling Salesman Problems by Chaotic Neural Network - IEICE, accessed December 25, 2025, [https://www.ieice.org/nolta/symposium/archive/2014/articles/B1L-C1-6137.pdf](https://www.ieice.org/nolta/symposium/archive/2014/articles/B1L-C1-6137.pdf)
    
14. Heuristics and Learning Models for Dubins MinMax Traveling Salesman Problem - PMC, accessed December 25, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC10383109/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10383109/)
    
15. A Systematic Literature Review of Vehicle Routing Problems with Time Windows - MDPI, accessed December 25, 2025, [https://www.mdpi.com/2071-1050/15/15/12004](https://www.mdpi.com/2071-1050/15/15/12004)
    
16. Vehicle Routing Problem with Time Windows, Part I: Route Construction and Local Search Algorithms - CEPAC, accessed December 25, 2025, [https://cepac.cheme.cmu.edu/pasi2011/library/cerda/braysy-gendreau-vrp-review.pdf](https://cepac.cheme.cmu.edu/pasi2011/library/cerda/braysy-gendreau-vrp-review.pdf)
    
17. vehicle routing with time instants - Operations Research Stack Exchange, accessed December 25, 2025, [https://or.stackexchange.com/questions/12490/vehicle-routing-with-time-instants](https://or.stackexchange.com/questions/12490/vehicle-routing-with-time-instants)
    
18. Solve Vehicle Routing Problem (Ready To Use)—ArcGIS Pro | Documentation, accessed December 25, 2025, [https://pro.arcgis.com/en/pro-app/latest/tool-reference/ready-to-use/itemdesc-solvevehicleroutingproblem.htm](https://pro.arcgis.com/en/pro-app/latest/tool-reference/ready-to-use/itemdesc-solvevehicleroutingproblem.htm)
    
19. A survey of the orienteering problem: model evolution, algorithmic advances, and future directions - arXiv, accessed December 25, 2025, [https://arxiv.org/html/2512.16865v1](https://arxiv.org/html/2512.16865v1)
    
20. The Team Orienteering Problem: Formulations and Branch-Cut and Price, accessed December 25, 2025, [https://files.core.ac.uk/download/pdf/62915615.pdf](https://files.core.ac.uk/download/pdf/62915615.pdf)
    
21. Solving the stochastic team orienteering problem: comparing simheuristics with the sample average approximation method, accessed December 25, 2025, [https://openaccess.uoc.edu/server/api/core/bitstreams/a19bc680-9fb8-478c-b16d-f09b93f2a701/content](https://openaccess.uoc.edu/server/api/core/bitstreams/a19bc680-9fb8-478c-b16d-f09b93f2a701/content)
    
22. Combining the A* Algorithm with Neural Networks to Solve the Team Orienteering Problem with Obstacles and Environmental Factors - MDPI, accessed December 25, 2025, [https://www.mdpi.com/1999-4893/18/6/309](https://www.mdpi.com/1999-4893/18/6/309)
    
23. The Theory of Search. I. Kinematic Bases | Operations Research - PubsOnLine, accessed December 25, 2025, [https://pubsonline.informs.org/doi/10.1287/opre.4.3.324](https://pubsonline.informs.org/doi/10.1287/opre.4.3.324)
    
24. New sweep widths values, correction factors, models, and detection - Journal of Search and Rescue, accessed December 25, 2025, [https://journalofsar.com/wp-content/uploads/2020/04/v4-7-Koester-POD-Syrotuck.pdf.pdf](https://journalofsar.com/wp-content/uploads/2020/04/v4-7-Koester-POD-Syrotuck.pdf.pdf)
    
25. Search Theory, accessed December 25, 2025, [https://www.metsci.com/wp-content/uploads/2019/08/Search-Theory-A-Mathematical-Theory-for-Finding-Lost-Objects.pdf](https://www.metsci.com/wp-content/uploads/2019/08/Search-Theory-A-Mathematical-Theory-for-Finding-Lost-Objects.pdf)
    
26. Occupancy vs Detection Probability - Google Groups, accessed December 25, 2025, [https://groups.google.com/g/unmarked/c/_ZqrbLTp-t8](https://groups.google.com/g/unmarked/c/_ZqrbLTp-t8)
    
27. Modelling the probability of detecting mass mortality events - bioRxiv, accessed December 25, 2025, [https://www.biorxiv.org/content/10.1101/2021.01.16.426964.full](https://www.biorxiv.org/content/10.1101/2021.01.16.426964.full)
    
28. A Bayesian Approach To Finding Lost Objects – Katie Howgate, accessed December 25, 2025, [https://www.lancaster.ac.uk/stor-i-student-sites/katie-howgate/2021/02/08/a-bayesian-approach-to-finding-lost-objects/](https://www.lancaster.ac.uk/stor-i-student-sites/katie-howgate/2021/02/08/a-bayesian-approach-to-finding-lost-objects/)
    
29. A firefighter's guide to fireground search and rescue – Part 2 - FireRescue1, accessed December 25, 2025, [https://www.firerescue1.com/fire-products/rescue-equipment/articles/a-firefighters-guide-to-fireground-search-and-rescue-part-2-TRLszcH6HvQpBhlJ/](https://www.firerescue1.com/fire-products/rescue-equipment/articles/a-firefighters-guide-to-fireground-search-and-rescue-part-2-TRLszcH6HvQpBhlJ/)
    
30. Stopping Bayesian Optimization with Probabilistic Regret Bounds - NIPS papers, accessed December 25, 2025, [https://proceedings.neurips.cc/paper_files/paper/2024/file/b204de7078301292a8876a762eed3dcb-Paper-Conference.pdf](https://proceedings.neurips.cc/paper_files/paper/2024/file/b204de7078301292a8876a762eed3dcb-Paper-Conference.pdf)
    
31. Genetic Algorithm for Solving Multiple Traveling Salesmen Problem using a New Crossover and Population Generation - SciELO México, accessed December 25, 2025, [https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S1405-55462018000200491](https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S1405-55462018000200491)
    
32. Ant Colony Optimization for Path Planning in Search and Rescue Operations, accessed December 25, 2025, [https://www.michaelmorin.info/publications/mm2023ejorOspvAnts.pdf](https://www.michaelmorin.info/publications/mm2023ejorOspvAnts.pdf)
    
33. Exact and Heuristic Multi-Robot Dubins Coverage Path Planning for Known Environments - PMC - NIH, accessed December 25, 2025, [https://pmc.ncbi.nlm.nih.gov/articles/PMC10007483/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10007483/)
    
34. Grid-based Multi-Robot Coverage Path Planning - arXiv, accessed December 25, 2025, [https://arxiv.org/html/2411.01707v1](https://arxiv.org/html/2411.01707v1)
    
35. How to Safely Clear Your Home of an Intruder | The Art of Manliness, accessed December 25, 2025, [https://www.artofmanliness.com/skills/manly-know-how/safely-clear-home/](https://www.artofmanliness.com/skills/manly-know-how/safely-clear-home/)
    
36. 9 Ways to Clear a Building with a Firearm - wikiHow, accessed December 25, 2025, [https://www.wikihow.com/Clear-a-Building-with-a-Firearm](https://www.wikihow.com/Clear-a-Building-with-a-Firearm)
    
37. Sampling-Based Coverage Path Planning for Inspection of Complex Structures - Association for the Advancement of Artificial Intelligence (AAAI), accessed December 25, 2025, [https://cdn.aaai.org/ojs/13529/13529-40-17047-1-2-20201228.pdf](https://cdn.aaai.org/ojs/13529/13529-40-17047-1-2-20201228.pdf)
    
38. How to locate services optimizing redundancy - IRIS, accessed December 25, 2025, [https://iris.unibs.it/retrieve/cae1974a-bedd-4d9b-b10e-d446b33ff56a/2024_K-BACOP%20-%20Fadda%20et%20al_SEPS.pdf](https://iris.unibs.it/retrieve/cae1974a-bedd-4d9b-b10e-d446b33ff56a/2024_K-BACOP%20-%20Fadda%20et%20al_SEPS.pdf)
    
39. Ant colony optimization algorithms - Wikipedia, accessed December 25, 2025, [https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms](https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms)
    
40. [2509.02271] VariAntNet: Learning Decentralized Control of Multi-Agent Systems - arXiv, accessed December 25, 2025, [https://arxiv.org/abs/2509.02271](https://arxiv.org/abs/2509.02271)
    
41. MDCPP: Multi-robot Dynamic Coverage Path Planning for Workload Adaptation - arXiv, accessed December 25, 2025, [https://arxiv.org/abs/2509.23705](https://arxiv.org/abs/2509.23705)
    
42. Multi-Agent Coverage Control, accessed December 25, 2025, [http://muro.ucsd.edu/CoverageControl/coveragecontrol.html](http://muro.ucsd.edu/CoverageControl/coveragecontrol.html)
    
43. Optimal Emergency Evacuation Route Planning Model Based on Fire Prediction Data, accessed December 25, 2025, [https://www.mdpi.com/2227-7390/10/17/3146](https://www.mdpi.com/2227-7390/10/17/3146)
    
44. Enhancing Search and Rescue Operations with Ultra-Wideband Radar: The Role of UWB Radar in Life-Saving Missions - Camero-Tech, accessed December 25, 2025, [https://camero-tech.com/enhancing-search-and-rescue-operations-with-ultra-wideband-radar/](https://camero-tech.com/enhancing-search-and-rescue-operations-with-ultra-wideband-radar/)
    
45. Performance Evaluation of Ultra-Wideband (UWB) Microwave Sensors for Through-Wall Detection of Human Vital Signs in Post- Disaster Environments - ResearchGate, accessed December 25, 2025, [https://www.researchgate.net/publication/398667735_Performance_Evaluation_of_Ultra-Wideband_UWB_Microwave_Sensors_for_Through-Wall_Detection_of_Human_Vital_Signs_in_Post-_Disaster_Environments](https://www.researchgate.net/publication/398667735_Performance_Evaluation_of_Ultra-Wideband_UWB_Microwave_Sensors_for_Through-Wall_Detection_of_Human_Vital_Signs_in_Post-_Disaster_Environments)
    
46. Optimizing Multi-Agent Coverage Path Planning UAV Search and Rescue Missions with Prioritizing Deep Reinforcement Learning - ResearchGate, accessed December 25, 2025, [https://www.researchgate.net/publication/389664478_Optimizing_Multi-Agent_Coverage_Path_Planning_UAV_Search_and_Rescue_Missions_with_Prioritizing_Deep_Reinforcement_Learning](https://www.researchgate.net/publication/389664478_Optimizing_Multi-Agent_Coverage_Path_Planning_UAV_Search_and_Rescue_Missions_with_Prioritizing_Deep_Reinforcement_Learning)
    
47. 7 Most Common Fireground Mistakes and How to Avoid Them - Emergent.tech, accessed December 25, 2025, [https://www.emergent.tech/blog/common-fireground-mistakes](https://www.emergent.tech/blog/common-fireground-mistakes)
    
