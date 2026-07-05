# Plug-and-Play 原子技能组合泛化方案整合笔记

本文是在 `plug_and_play_skill_composition_notes.md` 的基础上整理的整合版。主线仍然是：

> 面向 pi0.5 / Wall-OSS-0.5 / OpenVLA-OFT 等已有开源 VLA，设计一个轻量、可插拔的 skill composition layer，使模型在少量真机数据下能把已学原子技能组合到未见长程任务。

本版新增整合：

- **SeqVLA**：completion head / done head 的直接先例，尤其是 head 接 action expert feature。
- **AtomSkill / Learning Semantic Atomic Skills**：semantic skill alignment、keypose imagination、keypose-based skill transition。
- 后续讨论结论：数据采集结构、done head 输入来源、skill embedding 与 hidden 表示区别、novelty 边界、最小可实现版本和增强版本。

## 1. 核心定位

相比 AtomicVLA 这类需要深度改造 VLA 内部结构的方法，本方案希望做一个轻量、可插拔的 skill composition layer：

```text
已有 VLM + flow-matching action head/action expert 的 VLA
        ↓
冻结或少量微调 backbone
        ↓
外挂 skill-conditioned adapter / LoRA
        ↓
外挂 completion/progress/keypose head
        ↓
给定 skill plan 下自动切换技能
        ↓
提升 held-out atomic skill recombination
```

一句话定位：

```text
AtomicVLA 是“重新设计一个会原子技能的 VLA”；
本方案是“让已有开源 VLA 快速获得原子技能组合能力的即插即用模块”。
```

适配目标：

```text
Wall-OSS-0.5
pi0.5 / openpi
OpenVLA-OFT
其他 VLM + flow matching action head 的 VLA
```

核心卖点：

```text
1. 不大改 VLA backbone
2. 不要求重新训练 foundation VLA
3. 模块主要加在 action head / action expert 侧
4. 可以快速迁移到不同开源 VLA
5. 专门提升 few-shot real-robot atomic skill recombination
```

推荐贡献表述：

```text
We propose a plug-and-play skill composition layer for VLM + flow-matching VLA policies. Instead of redesigning the VLA architecture, our method freezes the pretrained backbone and attaches skill-conditioned action adapters and a multimodal completion/keypose head to the action generation side, enabling few-demo real-robot atomic skill recombination under a predefined high-level skill plan.
```

## 2. 当前方案属于哪个版本

可以把长程技能组合分成四个版本：

```text
V0 Oracle boundary:
  人工给 current_skill 和切换时刻，只测每个 skill adapter 的执行能力。

V1 Plan + learned done:
  给定 skill plan，模型自己判断当前 skill 是否完成，完成后按 plan 切到下一个。

V2 Plan + learned router:
  给定 skill plan，模型判断 done，也允许局部选择、重复或融合 skill adapter。

V3 Full planner:
  模型自己生成 skill plan、判断当前进度，并决定下一步 skill。
```

第一篇文章建议主做 **V1**：

```text
任务的原子技能序列预先给定或提前生成。
执行过程中，模型不自由规划下一步是什么。
新增模块主要判断当前原子技能是否完成。
完成后按预设 skill plan 顺序切换。
```

示例：

```text
Task: put the red block into the box and close it

skill plan:
  [open, grasp, insert, close]

execution:
  current_skill = open
  done(open) -> current_skill = grasp
  done(grasp) -> current_skill = insert
  done(insert) -> current_skill = close
```

不建议把“模型自己生成 task chain / atomic skill abstraction”作为第一篇主方法。1k 真机数据更适合训练：

```text
per-skill adapter
skill-conditioned action head
current skill classifier
done/progress/keypose head
固定技能集合下的轻量 router
```

不太适合训练：

```text
VLA 自己生成完整 task chain
通用 atomic skill abstraction
自由 next-skill planning
错误恢复式 long-horizon planner
```

## 3. 相对 AtomicVLA 的差异

AtomicVLA 更接近模型内部 full skill reasoning：

```text
observation + language + state
        ↓
Think-Act mechanism
        ↓
模型生成 task chain / progress / atomic skill abstraction
        ↓
skill-guided MoE router
        ↓
atomic skill expert
        ↓
action
```

本方案更轻：

```text
observation + language + skill plan
        ↓
原 VLA backbone
        ↓
completion/progress/keypose head 判断当前 skill 是否完成
        ↓
按预设 skill plan 切到下一个 skill
        ↓
激活对应 skill adapter
        ↓
原 action head / action expert 输出动作
```

对比：

```text
AtomicVLA:
  model-internal planning
  Think/Act switching
  skill abstraction generation
  SG-MoE action decoder
  架构改动重

本方案:
  external/predefined skill plan
  learned completion/progress/keypose switching
  action-side skill adapter
  插件式接入 flow action expert
  架构改动轻
```

AtomicVLA 中“当前原子任务是否完成”不是一个显式 done head，而是通过：

```text
learned [think]/[act] 切换
+ progress generation
+ atomic skill abstraction update
```

隐式处理。我们的方案不做 Think-Act，而是把该问题显式化为 completion/progress/keypose prediction，更容易落地到开源 VLA。

## 4. SeqVLA 对本方案的直接启发

SeqVLA 是 `Plan + Learned Completion` 路线的直接先例。它基于 π0 风格 VLA，在 action expert feature 上接一个 completion detection head。

SeqVLA 架构：

```text
multi-view images
+ joint states
+ subtask language prompt
        ↓
π0 VLA backbone
        ↓
action expert feature
        ├── action head -> continuous action
        └── completion detection head -> completion probability
```

关键点：

```text
completion head 接在 action expert feature 上，
不是接在 VLM 生成文本后面。
```

这支持本方案的设计判断：

```text
done/progress head 优先从 action expert hidden 引出，
而不是只从 VLM hidden 引出。
```

SeqVLA 的子任务来自人工预定义的固定长程任务序列，不是模型自己生成。它采两类数据：

```text
1. subtask-level demonstrations:
   每个子任务单独采，每个子任务一个唯一 prompt。
   用于训练 SeqVLA 的 action 和 completion head。

2. complete long-horizon demonstrations:
   完整长程任务轨迹。
   主要用于训练 baseline VLA。
```

Completion label：

```text
label = 1:
  当前 frame 仍然在推进这个 subtask

label = 0:
  当前 subtask 已经完成，后续动作不再对该 subtask 有贡献
```

典型形式：

```text
1111110000
```

SeqVLA 的重要结论：

```text
action loss + completion loss 联合训练优于先训 action 再训 completion；
completion head 接 action expert feature 更贴近动作进度；
单独 completion head 已不是首创点。
```

因此本方案的 novelty 不能写成“首次提出 done head”，而应写成：

```text
completion-aware switching
+ per-skill action adapters
+ held-out atomic skill recombination
+ plug-and-play VLA adaptation
```

## 5. AtomSkill 对本方案的新增启发

AtomSkill / Learning Semantic Atomic Skills 不是 VLA plug-in，而是多任务模仿学习框架。它的三个核心模块是：

```text
1. Semantic Skill Discovery with VLM
   从 demonstration 中切分 variable-length atomic skill segments，
   并用 VLM 给每个 segment 生成语义 skill label。

2. Atomic Skill Learning with Semantic Contrastive Alignment
   用 VQ-VAE 学离散 skill codebook，
   再用 temporal contrastive loss 和 semantic contrastive loss 组织 skill space。

3. Inference with Atomic Skill Priors
   用 diffusion sampler 采样高层 skill embedding，
   action decoder 执行 action chunk，
   keypose prediction 判断何时切换到下一个 skill。
```

### 5.1 Semantic skill alignment

AtomSkill 的关键判断是：

```text
机器人动作片段虽然看起来不一样，但语义上可能是同一个技能。
如果只按动作轨迹聚类，skill token 会很碎、很难复用。
```

例子：

```text
grasp cup
grasp pen
grasp flower
```

低层轨迹不同，但语义都是 `grasp`。AtomSkill 用 supervised contrastive learning 让同语义技能靠近。

对本方案的轻量转化：

```text
h_segment = pool(action_expert_hidden over a skill segment)

positive:
  same current_skill across different tasks

negative:
  different current_skill

L_skill_align:
  supervised contrastive loss
```

注意：

```text
skill embedding e_skill 是输入条件向量；
h_segment 是模型处理真实 observation/action segment 后产生的内部动作表示。
```

二者不同：

```text
e_skill:
  skill.current_id -> Embedding table
  用来告诉模型当前执行哪个 skill

h_segment:
  VLA/action expert 在一段 skill trajectory 上产生的 hidden representation
  用于 semantic alignment
```

推荐第一版做：

```text
L_align = SupCon(h_segment, skill.current_id)
```

可选增强：

```text
L_match = contrast(h_segment, e_skill)
```

### 5.2 Keypose imagination

AtomSkill 不用 binary done head，而是预测当前 skill 的 terminal keypose：

```text
keypose_pred = KeyposeHead(h_action, e_skill)
```

推理时：

```text
当当前/预测动作足够接近 predicted keypose
触发下一 skill
```

这给本方案一个比纯 done head 更结构化的增强：

```text
p_done = DoneHead(...)
keypose_pred = KeyposeHead(...)

switch if:
  p_done high
  and action/keypose distance small
```

优点：

```text
done head 是二分类，容易受边界标注噪声影响；
keypose 是连续目标，更适合空间定位和物理解释；
对于 place / insert / open / close 尤其有帮助。
```

第一版可做：

```text
L = L_action
  + λ_done L_done
  + λ_keypose L_keypose
  + λ_align L_skill_align
```

如果实现压力大，`L_keypose` 和 `L_align` 可以作为 ablation 或增强版。

## 6. 最终推荐模块设计

以 pi0.5 / openpi 为例，基础数据流：

```text
image observations
+ proprio/state
+ language instruction
        ↓
VLM backbone
        ↓
condition hidden h
        ↓
flow-matching action expert
        ↓
action chunk
```

本方案不破坏主链路，增加四类模块：

```text
1. Skill/Plan Input Adapter
2. Skill Embedding Module
3. Completion / Progress / Keypose Head
4. Skill-Conditioned Action Adapter
```

## 7. 模块 1：Skill/Plan Input Adapter

作用：

```text
把 LeRobot 中的 skill metadata 转成 VLA 可用的 prompt 和结构化 id。
```

输入：

```text
observation.images.*
observation.state
action
task.instruction
task.skill_sequence
skill.current_id
skill.phase_id
skill.done 或 skill.continue
skill.progress optional
skill.keypose optional
object.active_name optional
object.target_name optional
```

输出：

```text
1. prompt text
2. structured skill ids
```

prompt 示例：

```text
Task: put the red block into the box and close it.
Plan: open -> grasp -> insert -> close.
Current skill: grasp.
Phase: approach.
Active object: red block.
Target: box.
```

接入位置：

```text
LeRobot sample
        ↓
Skill/Plan Input Adapter
        ↓
pi0.5/openpi 原始输入格式
```

## 8. 模块 2：Skill Embedding Module

作用：

```text
把离散 skill id / phase id / plan id 变成连续向量，作为 action expert 和 completion head 的条件变量。
```

输入：

```text
skill.current_id
skill.phase_id
task.skill_sequence
```

输出：

```text
e_skill ∈ R^d
e_phase ∈ R^d
e_plan ∈ R^d optional
```

接入方式：

```text
h_skill = h + W_skill e_skill
```

或：

```text
gamma, beta = MLP(e_skill)
h_skill = gamma * h + beta
```

它不替代 VLM，也不替代 action expert，只提供“当前执行哪个原子技能”的控制信号。

## 9. 模块 3：Completion / Progress / Keypose Head

### 9.1 输入来源选择

对“是否完成”的判断，最推荐从 action expert hidden 引出，而不是只用 VLM hidden。

原因：

```text
skill completion 既依赖语义状态变化，
也依赖低层控制进度。
```

输入优先级：

```text
首选:
  action expert hidden feature
  + current skill embedding
  + proprio / gripper state
  + recent action history

增强:
  + pooled VLM hidden
  + phase embedding
  + object/target features
```

推荐主方法：

```text
Hybrid-Done:
  VLM semantic context
  + action-expert control features
  + skill embedding
  + proprio/history
```

结构：

```text
observation + instruction + current_skill
        ↓
VLM backbone
        ↓
h_vlm ─────────────┐
                   ↓
             Completion Head → p_done / progress / keypose
                   ↑
flow action expert ↓
        ↓
h_action ──────────┘
```

### 9.2 输出

最小版：

```text
p_done(current_skill) ∈ [0, 1]
```

SeqVLA 风格也可定义：

```text
p_continue = 1 表示继续
p_continue = 0 表示完成
```

推荐扩展：

```text
progress ∈ [0, 1]
keypose_pred
```

切换逻辑：

```text
if p_done > threshold for M consecutive chunks:
    current_skill = next_skill_in_plan
```

增强版：

```text
if p_done > threshold
and ||predicted_next_action - predicted_keypose|| < δ:
    current_skill = next_skill_in_plan
```

### 9.3 Loss

```text
L_done = BCE(p_done, skill.done)
L_progress = MSE(progress, progress_gt)
L_keypose = L1(keypose_pred, keypose_gt)
```

推荐联合训练：

```text
L_total = L_action
  + λ_done L_done
  + λ_progress L_progress
  + λ_keypose L_keypose
  + λ_align L_skill_align
```

SeqVLA 表明 action 和 completion 联合训练比先后训练更好，因此不建议第一版把 adapter 和 completion 完全分开训。

## 10. 模块 4：Skill-Conditioned Action Adapter

作用：

```text
让一个共享 action expert 在不同原子技能下表现出不同动作偏置。
```

基本形式：

```text
base action expert
+ grasp adapter
+ place adapter
+ insert adapter
+ open adapter
...
```

当前执行什么 skill，就激活对应 adapter。

### 10.1 Hidden residual 形式

```text
h = VLA_backbone(obs, lang)
Δh = Adapter_skill(h)
h' = h + Δh
v_t = ActionExpert(z_t, t, h')
```

### 10.2 Flow residual 形式

```text
v_base = ActionExpert_base(z_t, t, h)
Δv = Adapter_skill(z_t, t, h, e_skill)
v = v_base + Δv
```

这个形式最贴近 pi0.5 / Wall-OSS-0.5 的 flow matching action head。

### 10.3 LoRA 形式

对 action expert 内部线性层加 skill-specific LoRA：

```text
W' = W + B_skill A_skill
```

当前 skill 是 grasp：

```text
activate LoRA_grasp
```

当前 skill 是 insert：

```text
activate LoRA_insert
```

推荐优先级：

```text
第一优先：flow matching action expert 内部 FFN / projection LoRA
第二优先：action expert 输出层 LoRA
第三优先：VLM-to-action condition projector LoRA
不建议第一版：大范围 VLM backbone LoRA
```

## 11. 完整前向流程

训练时：

```text
LeRobot sample
  images, state, instruction
  skill_sequence, current_skill, phase, done, progress/keypose optional
        ↓
Skill/Plan Input Adapter
        ↓
prompt + skill ids
        ↓
VLA backbone
        ↓
h_vlm
        ↓
Skill Embedding
        ↓
h_skill
        ↓
flow-matching action expert
        ↓
h_action
        ├── selected skill LoRA / adapter -> action chunk
        ├── completion/progress head -> p_done / progress
        └── keypose head optional -> keypose_pred
```

推理时：

```text
instruction: put red block into box and close it
skill plan: [open, grasp, insert, close]
current_skill = open

while not task done:
    obs = robot.get_obs()
    h_vlm, h_action = VLA(obs, instruction, plan, current_skill)

    p_done, progress, keypose = completion_module(h_vlm, h_action, current_skill)

    if switch_condition_met:
        current_skill = next(plan)

    activate Adapter[current_skill]
    action = flow_action_expert(...)
    robot.step(action)
```

## 12. 数据采集与训练数据结构

训练数据不应只采单个原子任务，也不应只采完整长程任务。建议：

```text
训练数据 = 原子技能 episode + 已见组合 episode + transition/boundary samples
测试数据 = 未见组合 episode
```

原因：

```text
原子数据:
  教会每个 skill 怎么做。

已见组合数据:
  教会技能之间的状态衔接、切换边界和长程状态分布。

transition/boundary 数据:
  强化 done/progress/keypose head 对边界附近状态的判断。

未见组合数据:
  只用于测试组合泛化。
```

1k demos 推荐分配：

```text
400 条：单个原子技能
350 条：已见组合任务
100 条：关键 transition / boundary 强化
50 条：validation
100 条：held-out 未见组合测试
```

LeRobot 最小字段：

```text
observation.images
observation.state
action
task.instruction
task.skill_sequence
skill.current_id
skill.segment_start
skill.segment_end
skill.done 或 skill.continue
```

推荐增加：

```text
skill.phase_id
skill.progress
skill.keypose
object.active_name
object.target_name
object.active_bbox optional
object.target_bbox optional
```

训练使用方式：

```text
1. 训练 skill adapter:
   atomic episode 和组合 episode 都按 skill boundary 切成 segment。
   每个 segment 带 current_skill。

2. 训练 completion/progress/keypose:
   主要用完整组合 episode 和 boundary samples。
   强化快完成、刚完成、未完成、误完成状态。

3. 训练 semantic alignment:
   对 action expert hidden 做 segment-level pooling。
   same skill across tasks 为 positive。
```

## 13. Done 判断风险与解决

如果输入只有：

```text
总共有几个阶段
当前阶段 id
```

模型不能可靠判断当前阶段是否完成。阶段 id 只能告诉它“现在应该做什么”，不能告诉它“是否已经做完”。

done/progress/head 必须看状态证据：

```text
1. 当前视觉 observation
2. proprio / gripper / ee pose
3. 当前 skill id
4. 最近若干帧历史
5. previous action chunk
6. active object / target object
7. object-target relation
8. action expert hidden feature
```

推荐：

```text
if p_done > 0.7 for 3 consecutive chunks:
    switch skill
```

或者：

```text
if progress > 0.9 for 3 consecutive chunks:
    switch skill
```

如果加入 keypose：

```text
if p_done high and distance_to_keypose < δ:
    switch skill
```

可选外部安全机制：

```text
低频 VLM completion checker
简单规则 checker
```

但主方法不要依赖慢速 VLM 每步判断。

## 14. Long-VLA 与 phase 设计

Long-VLA 的核心不是 skill adapter，而是 phase-aware input masking。它把长程任务拆成多个子任务，并把每个子任务拆成：

```text
moving phase
interaction phase
```

不同 phase 关注不同输入：

```text
moving phase:
  关注目标位置、全局空间关系、移动路径

interaction phase:
  关注局部物体、夹爪、接触状态、当前操作目标
```

对本方案的轻量借鉴：

```text
LeRobot 增加:
  skill.phase_id

Prompt 增加:
  Current skill: grasp
  Phase: interaction

Completion head 输入:
  h_context
  skill embedding
  phase embedding
  proprio
  recent action history
```

一句话：

```text
Long-VLA 解决“不同阶段该看什么”；
本方案解决“不同原子技能该用什么动作 adapter，以及什么时候切换”。
```

## 15. 与 InSight 的关系

InSight: Self-Guided Skill Acquisition via Steerable VLAs 进一步做的是：

```text
VLM 发现 primitive gap
机器人自主尝试 rollout
VLM oracle 检查成功
成功 rollout 加回训练集
重新 fine-tune VLA
```

它的重点是 autonomous skill acquisition，而本方案重点是 known atomic skills 的 held-out recombination。

可借鉴：

```text
1. primitive-level steerability
2. automatic primitive segmentation
3. progress channel
4. VLM completion check
5. successful rollout -> retraining data flywheel
```

不建议第一版完整照搬：

```text
自主找 primitive gap
自动试错采新技能
VLM oracle 验收
反复 retrain
```

因为真机安全和工程复杂度较高。

## 16. 最小可实现版本

第一版建议：

```text
1. LeRobot 增加:
   skill.current_id
   skill.phase_id
   skill.done / skill.continue
   task.skill_sequence

2. Prompt 增加:
   Plan / Current skill / Phase

3. VLA action expert 加:
   per-skill LoRA adapter

4. action expert hidden 后加:
   completion/progress head

5. 推理:
   给定 skill plan
   completion/progress 判断切换
   current_skill 决定激活哪个 adapter
```

不建议第一版加入：

```text
复杂 scene graph
完整 planner
自由预测 next skill
大范围 VLM backbone finetune
复杂 soft MoE
skill diffusion sampler
完整 VQ-VAE skill codebook
```

## 17. 增强版本

在最小版本跑通后，按优先级增加：

```text
1. Keypose head
   从 skill segment 最后一帧提取 keypose label。
   用 keypose 辅助切换。

2. Semantic skill alignment
   对 h_segment 做 supervised contrastive loss。

3. Object-centric input
   加 active object / target object / bbox / crop。

4. Adapter fusion
   在 skill transition 附近融合前后两个 adapters。

5. VLM completion checker
   只在不确定或 OOD 状态下低频调用。
```

## 18. 推荐实验对照

必须比较：

```text
1. Direct VLA fine-tuning
2. Skill-token only
3. Shared LoRA + skill embedding
4. Per-skill LoRA with oracle skill boundary
5. Per-skill LoRA + learned completion/progress head
```

增强 ablation：

```text
6. + keypose head
7. + semantic skill alignment
8. + object/phase-conditioned completion head
9. + adapter fusion at skill transitions
10. VLM hidden only vs action hidden only vs hybrid done head
```

其中 done head 输入来源建议作为重点 ablation：

```text
VLM-Done:
  只用 VLM hidden

Action-Done:
  只用 action expert hidden

Hybrid-Done:
  VLM hidden + action expert hidden + skill/proprio/history
```

主方法推荐：

```text
Hybrid-Done
```

## 19. 推荐指标

```text
Atomic Success Rate
Seen Composition Success Rate
Held-out Composition Success Rate
Composition Gap
Completed Prefix Length
Done Prediction F1
Progress MAE
Keypose Error
Skill Transition Accuracy
Failure Position Distribution
Compositional Failure Share
Atomic Score
Average Task Progress
```

失败类型建议人工或半自动标注：

```text
manipulation failure
transition failure
wrong-order failure
repeat-subtask failure
premature-switch failure
late-switch failure
object selection failure
timeout / safety abort
```

## 20. Novelty 边界

已经有人做过的点：

```text
done/completion head:
  SeqVLA 已经做过。

skill-guided expert:
  AtomicVLA 已经做过重架构版本。

semantic skill library:
  AtomSkill 已经做过 VQ + contrastive skill alignment。

keypose-based skill transition:
  AtomSkill 已经做过 keypose imagination。
```

因此不能写成：

```text
首次提出 done head
首次提出原子技能专家
首次提出 keypose
```

应该写成：

```text
我们提出一个面向开源 VLM + flow-matching VLA 的 plug-and-play skill composition layer，
把 completion-aware switching、skill-conditioned action adapters、可选 keypose/progress/semantic alignment 组合起来，
在少量真机数据下提升 known atomic skills 的 held-out long-horizon recombination。
```

建议英文表述：

```text
SeqVLA demonstrates that completion-aware switching is crucial for long-horizon VLA execution. Building on this insight, we study a different problem: whether pretrained VLAs can recombine known atomic skills under unseen long-horizon compositions. To this end, we couple completion-aware switching with skill-conditioned action adapters attached to the flow-matching action expert, enabling plug-and-play compositional adaptation without redesigning the VLA backbone.
```

再加上 AtomSkill：

```text
Inspired by semantic skill alignment and keypose imagination in AtomSkill, we further regularize action-expert segment representations by skill labels and optionally predict skill terminal keyposes, while avoiding the need to train a full VQ skill codebook or diffusion skill sampler.
```

## 21. 推荐论文故事线

```text
直接微调 VLA:
  可以学会 seen long-horizon tasks，
  但 held-out skill recombination 掉点明显。

Skill token:
  告诉模型当前技能，有帮助但不稳定。

Per-skill action adapter:
  降低不同技能之间的动作干扰。

Completion/progress head:
  让模型能基于多模态状态判断技能完成，并按 plan 切换。

Keypose/semantic alignment:
  进一步让切换更物理可解释，让 skill hidden 更语义一致。

Plug-and-play:
  模块主要挂在 action expert/action head，
  可迁移到 pi0.5、Wall-OSS-0.5、OpenVLA-OFT。
```

最小故事：

```text
Direct VLA fine-tuning learns seen compositions but fails to recombine known atomic skills.
Skill-conditioned adapters reduce skill interference.
Completion-aware switching enables plan-conditioned long-horizon execution.
Keypose/progress and semantic alignment further improve robust transitions and held-out composition.
```

