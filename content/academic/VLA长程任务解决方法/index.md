---
title: VLA 模型长程任务解决方法综述
tags:
  - VLA
  - 具身智能
  - 论文研读
  - 长程任务
date: 2026-07-05T00:00:00+08:00
summary: 从原子技能拆分、组合泛化机制到数据采集范式，系统梳理 VLA 模型应对长程、多步骤机器人操作任务的前沿方法，涵盖 AtomicVLA、LiLo-VLA、Long-VLA、AtomSkill、SCaR 等代表性工作，以及强化学习与世界模型的最新融合进展。
---
## **引言：长程操作的理论瓶颈与VLA模型的演进**

视觉-语言-动作（Vision-Language-Action, VLA）模型近年来在具身智能领域确立了核心范式地位。通过吸收互联网规模的视觉-语言模型（VLM）预训练权重，并利用真实机器人的轨迹数据进行微调，VLA系统在语义推理、指令遵循以及短程操作（如抓取、推拉）中展现出了前所未有的泛化能力1。然而，当这些模型被部署于真实物理世界中执行长程（Long-Horizon）、多步骤的复杂接触式任务（例如清理厨房、装配复杂零件或多楼层导航）时，其可靠性往往面临断崖式下跌3。  
长程机器人操作之所以困难，根本原因在于其暴露了端到端模仿学习的两个致命理论缺陷。其一是“复合误差”（Compounding Errors）与状态分布偏移（Out-of-Distribution, OOD）。在连续的物理交互中，任何微小的执行偏差（例如未完全对准的抓取、碰撞导致的物体位移）都会随着时间步的推移被非线性放大。这种微小的错误会将机器人推向训练数据中从未见过的状态空间，导致策略彻底崩溃5。其二是“技能链接”（Skill Chaining）问题。复杂的长程任务由多个存在逻辑和物理依赖关系的子任务构成，但传统的单体VLA动作解码器缺乏对子任务边界和状态转移的显式建模能力，无法保证前置动作的终止状态能够平滑衔接后置动作的初始要求2。  
针对当前VLA模型在长程任务中遭遇的挑战，本报告将深入剖析最新的学术研究与工业实践，系统性地回答关于任务原子化拆分的必要性、少样本下的组合泛化机制，以及数据采集与训练范式的演进路径等核心问题。

## **一、 把长程任务拆分成原子技能的重要意义与实证评估**

在当前的具身智能研究中，将长程任务拆分为诸如“打开（open）”、“抓取（pick）”、“放置（place）”和“关闭（close）”等原子技能，不仅是一项重要的工程优化手段，更是克服复合误差、实现策略可解释性与容错恢复的**必要前提**。

### **缓解状态空间爆炸与过拟合灾难**

端到端（End-to-End）模型在处理长程任务时，本质上试图拟合一条包含数百甚至数千个时间步的极长联合状态-动作映射。这种尝试在理论上面临维度诅咒，且极易导致模型过拟合于特定的全局视觉特征或空间布局。一旦场景中出现与任务无关的视觉干扰（Visual Distractors），或者背景中的某个物体发生位移（即观察空间偏移，Observation Space Shift），策略的注意力机制便会失效，从而引发级联故障（Cascading Failures）8。  
通过将长程任务分解为一系列具有明确语义和物理边界的原子技能，研究人员能够有效降低局部学习的复杂性。模块化的架构使得每个原子策略只需关注当前特定操作的局部动态映射。例如，在LiLo-VLA（Linked Local VLA）框架中，研究表明原子化拆分允许系统实施严格的视觉掩码（Visual Masking）和腕部视角感知，强制策略在执行“抓取”或“放置”时忽略全局背景干扰，从而获得了极强的空间配置不变性9。

### **ATOM-Bench基准下的实证分析与失败归因**

为了定量回答原子技能拆分的重要性，研究界提出了专门针对长程操作组合泛化能力的真机测试基准ATOM-Bench。该基准将桌面操作严格因子化为“运动原子”（Motor Atoms，如抓取、倒水、推拉等描述物理操作的单元）与“指令原子”（Instruction Atoms，如计数、逻辑排他等描述语义约束的单元）11。  
ATOM-Bench的设计哲学揭示了一个关键问题：如果在评估阶段不进行原子化拆解，研究人员将无法诊断长程任务的失败根源。一个模型在长程任务中失败，究竟是因为它没有理解高层语义规划，还是因为它缺乏底层的物理运动控制能力？通过在单臂（Franka Panda）和双臂（Cobot Magic）平台上收集3000次人类演示并进行2700次真机回放，ATOM-Bench引入了“原子得分”（Atomic Score, AS）与“组合失败份额”（Compositional Failure Share, CFS）两个核心指标11。测试结果表明，当前主流的VLA模型（如Pi0.5、OpenVLA等）虽然能够掌握简单的指令落地技能，但在精细的运动原子（如倒水、重定向）以及逻辑过滤上依然挣扎；更为关键的是，即便模型在单一原子技能上表现优异，其性能在未见过的组合任务中也会急剧下降11。这一实证研究无可辩驳地证明了：脱离原子技能的独立验证而空谈长程泛化是毫无意义的，原子技能的稳固性是长程操作的基石。

### **架构层面的支撑机制与闭环容错**

从系统部署的角度来看，原子技能拆分赋予了机器人闭环恢复（Closed-Loop Recovery）的能力。在未拆分的系统中，一旦某一步出错，模型只能盲目地继续输出动作，导致更严重的破坏。而在原子化架构下，每个技能都有明确的前提条件和完成验证标准（VerifyCondition）。当原子技能执行失败时，系统可以触发语义回溯。例如，在LiLo-VLA的设计中，如果机器人未抓稳物体导致掉落，系统不会继续执行后续的“放置”指令，而是调用运动规划模块重置机械臂的接近姿态，并重新调用“抓取”原子技能8。这种基于原子模块的重试机制，是应对现实世界高度不确定性的关键。  
此外，原子拆分催生了更为高效的网络架构设计。AtomicVLA框架提出了一种“技能引导的专家混合”（Skill-Guided Mixture-of-Experts, SG-MoE）架构，为长程任务构建了可扩展的原子技能库。在该框架下，每种原子技能的抽象都被映射为固定的嵌入向量，路由模块（Routing Encoder）据此为不同的技能动态分配专用的网络专家3。这种设计的巨大优势在于终身学习（Continual Learning）：当机器人需要掌握新的原子操作时，只需训练对应的路由参数和新专家，而不会干扰（避免灾难性遗忘）既有技能的权重。在模拟环境（如LIBERO-LONG基准）和真实世界任务中，这种基于原子拆分的MoE架构使得长程任务的成功率提升了18.3%至21%14。

| 评估维度 | 单体端到端模型（未拆分） | 原子技能拆分模型（模块化/专家化） |
| :---- | :---- | :---- |
| **错误容忍度** | 极低。微小偏差导致状态分布外移，任务全面崩溃。 | 高。可通过子目标验证触发闭环重规划，进行局部重试。 |
| **可解释性与诊断** | 黑盒。难以区分是语言理解失败还是物理动作执行失败。 | 清晰。借助AS和CFS等指标，可精确定位失败的原子节点。 |
| **技能复用与扩展** | 需针对新任务重新训练整体网络，容易发生遗忘。 | 可插拔。新任务仅需组合现有原子，新技能可分配独立网络专家。 |
| **应对视觉干扰** | 易受全局背景和未见过的物品摆放位置影响。 | 强。允许应用对象为中心的局部视场与视觉掩码技术。 |

## **二、 少量真机数据下的组合泛化：从原子技能到长程结构的构建**

在真实的机器人工程实践中，由于硬件磨损、人力成本以及操作耗时等因素，收集海量且覆盖所有长程任务排列组合的真机数据是不现实的。这就提出了一个核心技术命题：如何利用有限的真机数据，让机器人从基础的原子技能中学习到可组合的结构，并“零样本”（Zero-shot）泛化到未见过的长程任务序列中。前沿研究通过以下几种深度的机制创新解决了这一问题。

### **空间与功能解耦：全局移动与局部交互的隔离**

长程任务往往包含大范围的空间跨度与精细的局部接触。如果让一个统一的注意力机制同时处理全局寻路与局部力控，模型极易产生表征冲突。因此，功能解耦成为泛化的首要机制。  
**LiLo-VLA（Linked Local VLA）** 提供了一种极端但高效的空间解耦方案。它将操作严格划分为“到达模块”（Reaching Module）与“交互模块”（Interaction Module）。在全局移动阶段，系统彻底摒弃了神经网络的端到端预测，转而采用经典的无碰撞运动规划库（如MPLib），负责将机械臂从当前位姿运送到目标物体的上方附近。只有在接近目标后，系统才将控制权移交给基于对象的交互VLA模块。为了确保交互VLA在未见过的组合场景中不发生分布偏移，该模型仅使用腕部摄像头的局部视角，并应用随机擦除和视觉掩码彻底屏蔽非目标物体9。通过这种方式，原子技能变得对全局场景完全免疫，从而在顺序被打乱或物体堆叠的极端测试中（如包含16个步骤的Ultra-Long桌面整理任务）依然维持了44%的成功率，而传统基线模型在此类测试中的表现均为0%9。  
**Long-VLA** 则从网络输入的角度实现了更加平滑的解耦。该模型提出了一种“相位感知输入掩码”（Phase-Aware Input Masking）策略，自适应地将每个子任务分割为“移动相位”与“交互相位”。在移动相位，掩码机制引导模型将注意力集中于第三人称的全局视觉线索；在交互相位，模型则切换焦点，主要关注第一人称视觉中的精细操作特征2。通过统一的评分匹配损失（Score Matching Loss）联合监督这两个相位，Long-VLA在不改变预训练骨干网络结构的前提下，大幅减少了表征漂移，解决了技能拼接（Skill Chaining）时的不兼容问题，并在L-CALVIN长程基准上确立了新的SOTA性能2。

### **时间与语义对齐：关键姿态想象与离散技能空间**

为了使单独学习的原子技能能够像链条一样紧密咬合，模型必须具备对“未来状态”的预测能力，以确保前一个技能的终止状态符合下一个技能的初始先决条件。  
**AtomSkill** 框架在此方向上取得了突破性进展，其核心创新在于“关键姿态想象”（Keypose Imagination）模块与语义驱动的原子技能库构建。在利用少量数据训练时，AtomSkill首先通过检测机械爪开合状态的跳变点（Gripper-state Keyframe Detection），将原始的长轨迹切分为变长的原子片段，并利用大型视觉语言模型（如Qwen2-VL）对每个片段进行高精度的语义标注。随后，通过VQ-VAE风格的对比聚类，系统强制提取出既具备语义一致性、又具备时间连贯性的离散技能嵌入代码本（Codebook）17。  
在动作生成阶段，AtomSkill的交叉注意力解码器接收当前观测和选定的技能嵌入，并**联合预测两个输出**：一个是用于即时控制的短期动作块（Action Chunk, ![][image1]），另一个是该原子技能完成时应达到的长期终端关键姿态（Terminal Keypose, ![][image2]）。这个想象出的关键姿态在推理时扮演了自主进度监控器的角色——当机器人的实际位姿逐渐逼近该关键姿态（误差小于设定的空间阈值 ![][image3]）时，系统会自动判定当前原子技能已完成，并触发向下一个原子技能的平滑过渡19。这种机制使得策略不仅理解“当下的力控”，更把握了“宏观的运动意图”，有效消除了技能切换时的生硬卡顿或位置偏离。

### **动力学约束与双重正则化**

技能链接失败的另一个常见原因是局部技能的优化目标过于短视，导致累积的位姿误差使得后续技能无法启动。为了解决这一问题，**SCaR**（Skill Chaining via Dual Regularization）框架提出，在少样本的原子技能微调阶段，必须引入双重正则化机制。该机制一方面强化单个原子技能内部连续动作之间的动态依赖（Intra-skill dependencies），另一方面严格约束相邻原子技能之间的状态对齐（Inter-skill dependencies），即强制前一个技能的终止状态分布必须落在后一个技能的合法初始状态分布域内21。实验证明，在包含多个接触式物理操作的厨房整理仿真任务中，SCaR极大地提升了技能链的稳定性与抗干扰性22。  
进一步地，在高度复杂的连续动作空间中，**PAMAE**（Phase-Aware Mixture-of-Action-Experts）针对流匹配（Flow-matching）VLA模型提出了一种相位感知的动作生成框架。在长程操作的“接近、接触、运输”等不同阶段，所需的控制频率和速度场是截然不同的。若采用共享参数的单一生成器，容易导致相位特异性特征被模糊化。PAMAE在保持预训练VLA骨干冻结的情况下，引入了一个轻量级的相位预测头和稀疏专家混合模块。路由器根据当前执行的微观相位自动分配计算资源给最合适的动作专家模块，这一即插即用的机制显著增强了模型对多阶段动力学特征的捕获能力，使其在多阶段操作中的成功率提升了9.2%24。

| 组合泛化核心机制 | 代表性框架/模型 | 解决的关键长程挑战 | 核心技术实现路径 |
| :---- | :---- | :---- | :---- |
| **空间视场与功能解耦** | LiLo-VLA, Long-VLA | 消除背景干扰与全局位姿分布偏移 | MPLib运动规划结合腕部视觉掩码；相位感知输入掩码自适应切换注意力。 |
| **意图推理与关键姿态预测** | AtomSkill | 解决技能过渡生硬、缺乏统一进度判断标准 | 联合预测短期动作块与长期终端关键姿态，基于空间误差阈值自主触发切换。 |
| **动力学对齐与正则化** | SCaR, PAMAE | 消除技能间的初始/终止状态不匹配（State Mismatch） | 双重正则化约束状态转移；流匹配模型中的相位感知专家路由。 |
| **分层递归规划** | Anticipation-VLA, AtomicVLA | 跨任务逻辑重组（零样本新序列泛化） | 高层VLM递归生成子目标抽象，底层根据语义映射激活对应控制专家。 |

## **三、 数据采集与训练范式：拆分、拼接与人在环路纠错的抉择**

在确定了原子技能的重要性及泛化机制后，整个系统工程的核心矛盾转移到了数据基础设施（Data Infrastructure）上：在数据采集与训练阶段，究竟应该是先单独采集海量原子技能然后再尝试拼接（Collect Atomic, Compose Later），还是直接采集连贯的长程任务轨迹然后再利用算法进行拆分与训练（Collect Long, Split Later）？  
大量的工业实践和超过千篇VLA论文的荟萃分析（Meta-analysis）表明，单纯的“大力出奇迹”式收集正常轨迹数据已经遭遇了缩放定律（Scaling Laws）的平台期。异构机器人数据集的简单混合甚至会引发负向迁移（Negative Transfer）25。针对采集顺序的争论，业界目前已经进化出第三种更加高效的混合范式。以下是对这三种路线的详细对比与前沿动态剖析。

### **路线一：“先合后分”（Collect Long, Split Later）——追求自然过渡的代价**

该路线主张由人类操作员通过遥操作完整、顺畅地执行长程任务，从而将物理过渡（如抓取完立刻转身放置的连贯动能）完整记录在数据分布中，随后在离线阶段利用算法对轨迹进行切割。  
在技术实现上，**STITCH**（Sliding-memory Trajectory Inference and Task Chunking Heuristic）框架采用了轨迹为中心的切割逻辑。它将长序列决策数据分解为有相互重叠（Overlapping）的上下文连贯块，通过滑动记忆机制让每个分块在去噪扩散（Denoising Diffusion）过程中不仅依赖自身状态，还条件化于前一个生成块的终态。这种双向通信确保了即使数据被切分，长程的全局一致性也不会丢失26。另外，**TREAD** 等框架则借助大型视觉语言模型强大的时空推理能力，自动识别视频中的运动特征变化和语义子目标转换，将长轨迹精准切割并打上阶段性语言标签，从而极大丰富了视觉-语言-动作映射的多样性28。  
**优势**：人类在连续操作中自然产生的“协同发音（Co-articulation）”效应得以保留，模型能够学习到技能之间最平滑的物理衔接方式。 **劣势**：高昂的沉默成本与数据稀释。长程任务的容错率极低，如果操作员在第15步发生失误，长达数分钟的记录可能完全报废。此外，轨迹过长会导致“图像-动作帧”相对于单一指令的比例失调，稀释了关键操作节点的数据密度25。

### **路线二：“先分后合”（Collect Atomic, Compose Later）——集中火力突破高难度原子**

针对长程采集效率低下的痛点，许多团队转向专门构建孤立的原子技能数据集，旨在夯实机器人的底层基础能力，然后再通过算法或仿真平台进行组合。  
**HD-Space**（Hierarchical Data Collection Space，分层数据采集空间）明确指出了天真长序列采集的缺陷：在长程任务的后半段，模型往往因为累积误差而面临严重的数据匮乏。因此，HD-Space提倡在采集前就从高层视角将任务切割，并为每个原子子任务设计独立的状态/动作空间。例如，对于“将茶杯放入盒子”这一任务，系统会要求操作员在特定的茶杯空间内单独演示上百次“抓取”，在盒子空间内单独演示上百次“放置”29。这种主动探索（Proactive）的策略使得模型能够密集覆盖那些最容易导致轨迹预测失败的局部空间边缘，用极少量的定向数据实现了超越全轨迹采集的策略性能31。  
而在仿真领域，**InternData-A1** 和 **RoboTwin** 等大型项目完全依赖于合成数据。它们在虚拟引擎中生成超过数十万条原子技能轨迹（涵盖刚体、铰接物体及流体），并在仿真环境下自由组装这些原子模块。这种极端彻底的“先分后合”甚至在零真机数据（Zero-shot Sim-to-Real）的情况下，也能在物理世界的未知场景中取得显著进展32。  
**优势**：极大降低了认知负荷与数据获取成本；能够定向爆破高难度的物理接触任务（如精密插拔、柔性物体形变），提升原子技能在边缘情况下的鲁棒性。**劣势**：物理失配（State Mismatch）。独立录制的原子技能在真实物理世界中直接拼接时，前一个动作的停止姿态往往不符合下一个动作的最优起始位置，导致机器人动作僵硬甚至卡死。

### **路线三：前沿共识——“基础原子采集 \+ 人在环路（HIL）的恢复与纠错微调”**

鉴于路线一成本过高，而路线二衔接生硬，当前机器人学习领域正在快速向一种混合的闭环策略收敛：即在预训练阶段使用“先分后合”或仿真数据构建强大的基础原子模型；而在真实场景部署和长程任务精调阶段，不再盲目采集成功的专家轨迹，而是专门采集“恢复与纠正”（Recovery and Correction）数据。  
这一范式的理论基础在于：传统的纯成功演示数据缺乏关于“如何从失败边缘自救”的信息。当模型在长程任务中遇到复合误差导致的分布外状态时，它无法做出合理反应。

1. **RaC（Recovery and Correction）框架**：这是一种基于人在环路（Human-in-the-Loop, HIL）的标准化接管协议。其核心规则是“先恢复，后纠正”（Recover then Correct）。当观察到机器人的自主策略即将失败（例如即将撞倒杯子或抓空）时，人类操作员按下暂停键接管控制权。操作员**并不是立刻替机器人完成任务**，而是首先将机器人的机械臂倒退（Rewind）回一个模型熟悉的、处于分布内（In-distribution）的安全状态；随后，再向模型演示从该安全状态出发，如何通过正确的纠正动作完成当前子任务。实验表明，通过这种特殊的数据构成微调策略，模型不仅学会了主任务，更扩充了重试与自适应的技能储备，在衣物悬挂、密封盒打包等长程双臂协作任务中，用少了一个数量级的时间和样本便超越了原有的SOTA性能34。  
2. **HandITL与灵巧手的纠错挑战**：在高自由度（DoF）的灵巧手长程操作中，简单的接管会导致严重的“姿态跳跃”（Gesture Jump）——即人类手套与机械手当前状态不匹配，接管瞬间会导致被抓物体直接掉落。针对此，HandITL提出了一种无缝干预技术，通过基于优化的相对指尖重定向和基于速度的共享控制，使得人类能够在线向正在运行的VLA策略中注入微小的残差纠正扭矩，而不破坏当前的稳定接触，从而成功收集到长程灵巧手操作的高质量纠错数据，使得平均成功率提升了19%38。  
3. **FAR（Failure-Aware Retry）测试时适应**：在部署阶段，当故障不可避免地发生时，FAR框架允许保留当前的场景物理状态并将机器人退回初始姿态进行多轮重试。系统利用这些由于复合误差导致的失败轨迹构建对比对（Contrastive Pairs），在测试时进行在线梯度更新。这些失败轨迹由于直接暴露了当前策略的失效边界，提供了离线专家演示中绝对缺乏的负向监督信号，使得机器人在几次尝试后就能自主掌握该长程任务40。

**结论与实施建议**： 在采集数据-训练阶段，最佳实践不应是单选题。系统级的最优解是：**首先采用“先分后合”（如HD-Space或仿真环境）的低成本模式获取广泛的原子技能覆盖度，建立基础模型（Base Policy）；随后将模型部署于真实长程任务中，直接采用“人在环路”（如RaC、HandITL协议）针对其失败和卡顿节点，专门收集干预、倒退与纠正的数据并进行微调。** 这种数据混合策略直接对症下药解决了复合误差问题，是目前突破长程VLA模型性能天花板的核心路径。

## **四、 延伸动态：强化学习与世界模型的深度融合**

超越模仿学习与数据采集协议，目前最前沿的工业级VLA系统正在向强化学习微调（RL Fine-Tuning）和预测性世界模型方向演进，以解决长程任务中最棘手的“信用分配”与“模糊性决策”问题。  
**强化学习主导的长程鲁棒性**： 单纯依靠监督微调（SFT）的系统在遇到物理环境的模糊性时极易崩溃。在波士顿动力前核心成员创立的 Flexion AI 推出的 Reflect v1.0 机器人智能平台报告中指出，当双足人形机器人需要自主定位纸箱并导航穿越多楼层建筑、操作电梯、使用工具开箱等超长程任务时，纯SFT模型的端到端成功率仅有38%。然而，通过引入接触式全身交互的强化学习微调，模型通过在广泛的场景分布中不断试错与修正，学会了在计划偏离时如何进行局部调整与重规划，最终将成功率大幅提升至90%41。  
相似地，针对长程操作中的“信用分配”（Credit Assignment）难题，**π0.6 (Recap)** 模型提出了极具启发性的价值函数（Value Function）更新机制。在长程组装（如制作浓缩咖啡）中，如果机器人无法将手柄插入咖啡机，原因往往不在于插入动作本身，而是由于几步之前的初始抓取姿态就错了。Recap利用机器人的自我探索经验训练价值函数，根据状态价值的变化来判定哪一步动作真正带来了优势（Action Advantage），并将这种信号作为后续微调的指导。这种允许VLA模型在物理世界中进行自我实践与反思的能力，被证明是消除累积错误的杀手锏6。  
**生成式评估与认知-运动协同**： 在模型评估领域，由于传统重要性采样在长程高维问题中方差爆炸，研究者提出了**STITCH-OPE**。该框架利用生成式扩散模型进行离线策略评估（Off-policy evaluation），它不直接生成整条轨迹，而是端到端地拼接条件化生成的短子轨迹，并在去噪过程中减去行为策略的得分函数，极大地防止了模型对次优数据的过度正则化，首次在长程高维任务中实现了鲁棒的离线评估27。此外，在架构演进上，**PI-VLA** 提出的认知-运动协同（Cognitive-Motor Synergy）在单次前向传播中同时生成动作块和预测性世界模型特征，利用状态预测损失强制模型在长程偏离出现时进行自适应的对称性破缺（Symmetry breaking），进一步从表征层面强化了模型对任务相关变换的鲁棒性1。

## **结语**

综上所述，应对VLA模型在长程任务中的挑战，需要从任务表征、模型架构和数据基建三个维度进行系统性重构。明确进行**原子技能的拆分**是诊断失败根源并进行局部闭环容错的基础；在有限数据下，通过**空间视场隔离、关键姿态联合预测以及相位感知的专家路由**，系统能够建立起抵御分布偏移的组合泛化能力；而在数据工程层面，摒弃单纯的长轨迹堆砌，转向“仿真原子技能 \+ 真实环境人在环路（RaC）倒退纠错”的混合采集范式，已成为当前最高效的技术路径。随着强化学习信用分配机制和扩散世界模型的不断融入，VLA模型正逐步实现从“死记硬背”的轨迹模仿器向具备自我反思和长程规划能力的通用具身智能体的跨越。

#### **引用的著作**

1. PI-VLA: Adaptive Symmetry-Aware Decision-Making for Long-Horizon Vision–Language–Action Manipulation \- MDPI, [https://www.mdpi.com/2073-8994/18/3/394](https://www.mdpi.com/2073-8994/18/3/394)  
2. Unleashing Long-Horizon Capability of Vision Language Action Model for Robot Manipulation \- GitHub, [https://raw.githubusercontent.com/mlresearch/v305/main/assets/fan25a/fan25a.pdf](https://raw.githubusercontent.com/mlresearch/v305/main/assets/fan25a/fan25a.pdf)  
3. AtomicVLA: Unlocking the Potential of Atomic Skill Learning in Robots \- arXiv, [https://arxiv.org/html/2603.07648v1](https://arxiv.org/html/2603.07648v1)  
4. AtomicVLA: Unlocking the Potential of Atomic Skill Learning in Robots \- CVF Open Access, [https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang\_AtomicVLA\_Unlocking\_the\_Potential\_of\_Atomic\_Skill\_Learning\_in\_Robots\_CVPR\_2026\_paper.pdf](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_AtomicVLA_Unlocking_the_Potential_of_Atomic_Skill_Learning_in_Robots_CVPR_2026_paper.pdf)  
5. \[2605.01772\] Anticipation-VLA: Solving Long-Horizon Embodied Tasks via Anticipation-based Subgoal Generation \- arXiv, [https://arxiv.org/abs/2605.01772](https://arxiv.org/abs/2605.01772)  
6. A VLA that Learns from Experience \- Physical Intelligence, [https://www.pi.website/blog/pistar06](https://www.pi.website/blog/pistar06)  
7. AtomicVLA: Unlocking the Potential of Atomic Skill Learning in Robots \- CVPR 2026, [https://cvpr.thecvf.com/virtual/2026/poster/39361](https://cvpr.thecvf.com/virtual/2026/poster/39361)  
8. LiLo-VLA: Compositional Long-Horizon Manipulation via Linked Object-Centric Policies, [https://arxiv.org/html/2602.21531v1](https://arxiv.org/html/2602.21531v1)  
9. LiLo-VLA: Compositional Long-Horizon Manipulation via Linked Object-Centric Policies, [https://www.wispaper.ai/zh/user-blog/lilo-vla-compositional-long-horizon-manipulation-linked-object-centric-policies-20260302/eng](https://www.wispaper.ai/zh/user-blog/lilo-vla-compositional-long-horizon-manipulation-linked-object-centric-policies-20260302/eng)  
10. LiLo-VLA: Compositional Long-Horizon Manipulation via Linked Object-Centric Policies, [https://yy-gx.github.io/LiLo-VLA/](https://yy-gx.github.io/LiLo-VLA/)  
11. A Real-World Benchmark for Atomic Skills and Compositional Generalization in Manipulation Policies \- arXiv, [https://arxiv.org/html/2606.16826v1](https://arxiv.org/html/2606.16826v1)  
12. (PDF) ATOM-Bench: A Real-World Benchmark for Atomic Skills and Compositional Generalization in Manipulation Policies \- ResearchGate, [https://www.researchgate.net/publication/407114786\_ATOM-Bench\_A\_Real-World\_Benchmark\_for\_Atomic\_Skills\_and\_Compositional\_Generalization\_in\_Manipulation\_Policies](https://www.researchgate.net/publication/407114786_ATOM-Bench_A_Real-World_Benchmark_for_Atomic_Skills_and_Compositional_Generalization_in_Manipulation_Policies)  
13. \[2606.16826\] ATOM-Bench: A Real-World Benchmark for Atomic Skills and Compositional Generalization in Manipulation Policies \- arXiv, [https://arxiv.org/abs/2606.16826](https://arxiv.org/abs/2606.16826)  
14. AtomicVLA: Unlocking the Potential of Atomic Skill Learning in Robots \- CVPR 2026 Open Access Repository, [https://openaccess.thecvf.com/content/CVPR2026/html/Zhang\_AtomicVLA\_Unlocking\_the\_Potential\_of\_Atomic\_Skill\_Learning\_in\_Robots\_CVPR\_2026\_paper.html](https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_AtomicVLA_Unlocking_the_Potential_of_Atomic_Skill_Learning_in_Robots_CVPR_2026_paper.html)  
15. \[Literature Review\] Long-VLA: Unleashing Long-Horizon Capability of Vision Language Action Model for Robot Manipulation \- Moonlight, [https://www.themoonlight.io/en/review/long-vla-unleashing-long-horizon-capability-of-vision-language-action-model-for-robot-manipulation](https://www.themoonlight.io/en/review/long-vla-unleashing-long-horizon-capability-of-vision-language-action-model-for-robot-manipulation)  
16. Long-VLA, [https://long-vla.github.io/](https://long-vla.github.io/)  
17. AtomSkill Framework for Robotic Manipulation \- Emergent Mind, [https://www.emergentmind.com/topics/atomskill-framework](https://www.emergentmind.com/topics/atomskill-framework)  
18. (PDF) Learning Semantic Atomic Skills for Multi-Task Robotic Manipulation \- ResearchGate, [https://www.researchgate.net/publication/398979327\_Learning\_Semantic\_Atomic\_Skills\_for\_Multi-Task\_Robotic\_Manipulation](https://www.researchgate.net/publication/398979327_Learning_Semantic_Atomic_Skills_for_Multi-Task_Robotic_Manipulation)  
19. Atomic Skill Space in Robotic Manipulation \- Emergent Mind, [https://www.emergentmind.com/topics/atomic-skill-space](https://www.emergentmind.com/topics/atomic-skill-space)  
20. Learning Semantic Atomic Skills for Multi-Task Robotic Manipulation \- arXiv, [https://arxiv.org/html/2512.18368v2](https://arxiv.org/html/2512.18368v2)  
21. NeurIPS Poster SCaR: Refining Skill Chaining for Long-Horizon Robotic Manipulation via Dual Regularization, [https://neurips.cc/virtual/2024/poster/95151](https://neurips.cc/virtual/2024/poster/95151)  
22. SCaR: Refining Skill Chaining for Long-Horizon Robotic Manipulation via Dual Regularization \- NIPS, [https://proceedings.neurips.cc/paper\_files/paper/2024/file/ca92ff06d973ece92cecc561757d500e-Paper-Conference.pdf](https://proceedings.neurips.cc/paper_files/paper/2024/file/ca92ff06d973ece92cecc561757d500e-Paper-Conference.pdf)  
23. SCaR: Refining Skill Chaining for Long-Horizon Robotic Manipulation via Dual Regularization | OpenReview, [https://openreview.net/forum?id=RnxJc4vTVi\&referrer=%5Bthe%20profile%20of%20Zixuan%20Chen%5D(%2Fprofile%3Fid%3D\~Zixuan\_Chen3)](https://openreview.net/forum?id=RnxJc4vTVi&referrer=%5Bthe+profile+of+Zixuan+Chen%5D\(/profile?id%3D~Zixuan_Chen3\))  
24. PAMAE: Phase-Aware-MoE Action Experts Towards Reliable Flow-Matching Vision-Language-Action Policies \- arXiv, [https://arxiv.org/pdf/2606.27144](https://arxiv.org/pdf/2606.27144)  
25. What 1228 Vision-Language-Action Papers Say About the Robot Data Problem, [https://labelstud.io/blog/vla-robot-data-problem/](https://labelstud.io/blog/vla-robot-data-problem/)  
26. STITCH: Sliding-memory Trajectory Inference \- Emergent Mind, [https://www.emergentmind.com/topics/stitch-sliding-memory-trajectory-inference-and-task-chunking-heuristic](https://www.emergentmind.com/topics/stitch-sliding-memory-trajectory-inference-and-task-chunking-heuristic)  
27. STITCH-OPE: Trajectory Stitching with Guided Diffusion for Off-Policy Evaluation \- NIPS, [https://papers.nips.cc/paper\_files/paper/2025/file/0a85f2414e354f9d61ffea5705a8bbf4-Paper-Conference.pdf](https://papers.nips.cc/paper_files/paper/2025/file/0a85f2414e354f9d61ffea5705a8bbf4-Paper-Conference.pdf)  
28. Task Robustness via Re-Labelling Vision-Action Robot Data \- arXiv, [https://arxiv.org/html/2606.10918v1](https://arxiv.org/html/2606.10918v1)  
29. \[2505.17389\] Bootstrapping Imitation Learning for Long-horizon Manipulation via Hierarchical Data Collection Space \- arXiv, [https://arxiv.org/abs/2505.17389](https://arxiv.org/abs/2505.17389)  
30. HD-Space, [https://hd-space-robotics.github.io/](https://hd-space-robotics.github.io/)  
31. Bootstrapping Imitation Learning for Long-horizon Manipulation via Hierarchical Data Collection Space \- arXiv, [https://arxiv.org/html/2505.17389v1](https://arxiv.org/html/2505.17389v1)  
32. InternData-A1: Pioneering High-Fidelity Synthetic Data for Pre-training Generalist Policy, [https://arxiv.org/html/2511.16651](https://arxiv.org/html/2511.16651)  
33. Daily Papers \- Hugging Face, [https://huggingface.co/papers?q=bimanual%20robot](https://huggingface.co/papers?q=bimanual+robot)  
34. RaC: Robot Learning for Long-Horizon Tasks by Scaling Recovery and Correction, [https://openreview.net/forum?id=y8wskVS7BV\&referrer=%5Bthe%20profile%20of%20Aviral%20Kumar%5D(%2Fprofile%3Fid%3D\~Aviral\_Kumar2)](https://openreview.net/forum?id=y8wskVS7BV&referrer=%5Bthe+profile+of+Aviral+Kumar%5D\(/profile?id%3D~Aviral_Kumar2\))  
35. RaC: Robot Learning for Long-Horizon Tasks by Scaling Recovery and Correction \- arXiv, [https://arxiv.org/html/2509.07953v1](https://arxiv.org/html/2509.07953v1)  
36. RaC: Robot Learning for Long-Horizon Tasks by Scaling Recovery and Correction \- OpenReview, [https://openreview.net/pdf/feab55a93896284be020bbaf9d02c91fb99a4a49.pdf](https://openreview.net/pdf/feab55a93896284be020bbaf9d02c91fb99a4a49.pdf)  
37. lerobot/docs/source/hil\_data\_collection.mdx at main \- GitHub, [https://github.com/huggingface/lerobot/blob/main/docs/source/hil\_data\_collection.mdx](https://github.com/huggingface/lerobot/blob/main/docs/source/hil_data_collection.mdx)  
38. Hand-in-the-Loop: Improving VLA Policies for Dexterous Manipulation via Seamless Hand-Arm Intervention \- arXiv, [https://arxiv.org/html/2605.15157v2](https://arxiv.org/html/2605.15157v2)  
39. Hand-in-the-Loop: Improving VLA Policies for Dexterous Manipulation via Seamless Hand-Arm Intervention \- Robotics Center, [https://www.roboticscenter.ai/research/papers/hand-in-the-loop-improving-vla-policies-for-dexterous-manipulation-via-seamless-hand-arm-i-2605](https://www.roboticscenter.ai/research/papers/hand-in-the-loop-improving-vla-policies-for-dexterous-manipulation-via-seamless-hand-arm-i-2605)  
40. FAR: Failure-Aware Retry for Test-Time Recovery and Continual Policy Improvement \- arXiv, [https://arxiv.org/html/2607.01111v1](https://arxiv.org/html/2607.01111v1)  
41. Flexion Reflect v1.0 \- The Path Towards Long-Horizon Autonomous Humanoid Work, [https://flexion.ai/news/flexion-reflect-v1.0](https://flexion.ai/news/flexion-reflect-v1.0)  
42. Publications | Toyota Research Institute, [https://www.tri.global/publications?block\_config\_key=block\_2%3A\_F-R6DDD5XeQFNkLYZmsh1BHj4Qx1rjFa1fHF0yRgOU\&page=1](https://www.tri.global/publications?block_config_key=block_2:_F-R6DDD5XeQFNkLYZmsh1BHj4Qx1rjFa1fHF0yRgOU&page=1)
