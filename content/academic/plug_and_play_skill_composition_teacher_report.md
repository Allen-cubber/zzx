# Plug-and-Play 原子技能组合泛化方案汇报稿

## 1. 研究问题

长程机器人任务本质上不是一个连续动作预测问题，而是：

```text
长程任务 = 子任务划分 + 子任务执行 + 子任务切换 + 失败恢复
```

例如：

```text
open box → grasp object → insert object → close box
```

所以如果想让 VLA 完成长程任务，必须解决两个层次：

```text
1. 知道当前应该执行哪个 subtask / atomic skill
2. 知道当前 subtask 是否完成，什么时候切到下一个
```

当前我们关注的是：**少量真机数据下，已有开源 VLA 如何从已学原子技能组合泛化到未见长程组合。**

## 2. 路线一：VLA 自己预测 Subtask

理想方案是让 VLA 自己具备：

```text
task chain generation
current subtask prediction
atomic skill abstraction
skill transition reasoning
```

也就是用户给一个长程指令，VLA 内部自动判断：

```text
现在该做 open
open 完成后该做 grasp
grasp 完成后该做 insert
...
```

这个方向更接近真正意义上的组合泛化，因为模型不仅执行技能，还能自己理解任务结构。

代表工作是 **AtomicVLA**。它用 Think-Act 架构：模型在 `think` 阶段生成 task chain、current progress 和 atomic skill abstraction，在 `act` 阶段根据 skill abstraction 路由到对应 atomic skill expert。

优点：

```text
1. 更接近真正自主长程推理
2. 不依赖外部 planner 给定 skill plan
3. 可以学习内部 atomic skill abstraction
4. 论文创新性更强
```

缺点：

```text
1. 对数据和训练要求高
2. 需要大量 task chain / progress / skill abstraction 监督
3. 对 pi0.5 / Wall-OSS-0.5 这类开源模型接口不友好
4. 1k 条真机数据很难稳定训练出可靠 task-chain generation
5. 失败时难判断是规划错、切换错，还是动作执行错
```

结合当前实验条件，直接让模型自己学会生成完整 subtask plan 风险较高。1k 真机数据更适合训练 action adapter、done/progress head，而不是训练完整内部 planner。

## 3. 路线二：外部给定 Skill Plan

我们目前讨论的方法属于这个方向。

基本假设是：

```text
原子技能库是已知的
每个原子技能都在训练中见过
测试时是未见过的新组合
```

用户输入长程指令后，先由一个轻量 LLM planner 或规则模板分解成 skill plan：

```text
instruction:
  put the block into the box and close it

planner output:
  [open, grasp, insert, close]
```

这里的每个子任务都必须属于已学习的 atomic skill library。

然后模型执行：

```text
current_skill = open
执行 open adapter
completion/progress/keypose head 判断是否完成
完成后 current_skill = grasp
执行 grasp adapter
...
```

也就是说，我们不要求 VLA 自己发明 task chain，而是研究：

```text
给定 skill plan 后，如何让已有 VLA 稳定执行、切换并组合已学原子技能？
```

## 4. 当前方案设计

### 4.1 版本定位

长程技能组合可以分成四个版本：

```text
V0 Oracle boundary:
  人工给 current_skill 和切换时刻，只测每个 skill adapter 执行能力。

V1 Plan + learned done:
  给定 skill plan，模型自己判断当前 skill 是否完成，完成后按 plan 切到下一个。

V2 Plan + learned router:
  给定 skill plan，模型判断 done，也允许局部选择、重复或融合 skill adapter。

V3 Full planner:
  模型自己生成 skill plan、判断当前进度，并决定下一步 skill。
```

**第一篇文章建议主做 V1**。1k 真机数据适合训练 per-skill adapter、completion/progress head 和少量组合切换，不适合训练完整内部 planner。

### 4.2 整体架构

基于 pi0.5 / Wall-OSS-0.5 这种 VLM + flow-matching action expert 的架构，不破坏主链路，增加四类即插即用模块：

```text
instruction
  → LLM/rule planner
  → skill plan: [open, grasp, insert, close]
  → Skill/Plan Input Adapter
  → prompt + skill ids
  → VLA backbone (冻结或少量微调)
  → h_vlm
  → Skill Embedding → h_skill
  → flow-matching action expert
      ├── Skill-Conditioned Adapter → action chunk
      ├── Completion/Progress Head → p_done / progress
      └── Keypose Head (可选) → keypose_pred
  → completion 判断 → current_skill = next_skill
```

### 4.3 模块 1：Skill/Plan Input Adapter

把 LeRobot 中的 skill metadata 转成 VLA 可用的 prompt 和结构化 id。

```text
prompt 示例：
  Task: put the red block into the box and close it.
  Plan: open -> grasp -> insert -> close.
  Current skill: grasp.
  Phase: approach.
  Active object: red block.
  Target: box.
```

LeRobot 最小字段：

```text
task.instruction
task.skill_sequence
skill.current_id
skill.segment_start / segment_end
skill.done 或 skill.continue
```

推荐增加：

```text
skill.phase_id         ← 技能内部阶段，如 approach / contact / lift，用于 phase embedding 和细粒度 completion 判断
skill.progress         ← 当前技能完成进度 [0, 1]，比 binary done 更平滑，用于训练 progress head
skill.keypose          ← 当前技能的终止关键姿态，用于训练 keypose head 和辅助切换
object.active_name     ← 当前技能操作的主体物体名称，喂给 prompt 和 completion head
object.target_name     ← 当前技能的目标位置/容器名称
```

### 4.4 模块 2：Skill Embedding Module

把离散 skill id / phase id 变成连续向量，作为 action expert 和 completion head 的条件变量：

```text
e_skill ∈ R^d  ← skill.current_id → Embedding table
e_phase ∈ R^d  ← skill.phase_id  → Embedding table
```

接入方式（AdaLN 或加法残差）：

```text
h_skill = h + W_skill · e_skill
```

注意：`e_skill` 是输入条件向量，告诉模型"当前执行哪个 skill"；`h_segment`（见模块 3）是模型处理真实 observation/action 后产生的内部动作表示，二者功能不同。

### 4.5 模块 3：Completion / Progress / Keypose Head

**输入来源**：done/progress 判断既依赖语义状态变化，也依赖低层控制进度，推荐 Hybrid-Done：

```text
首选输入：
  action expert hidden feature
  + current skill embedding
  + proprio / gripper state
  + recent action history

增强输入：
  + pooled VLM hidden
  + phase embedding
  + object/target features
```

结构：

```text
h_vlm  ──────────────┐
                     ↓
               Completion Head → p_done / progress / keypose_pred
                     ↑
h_action ────────────┘
```

**切换逻辑**：

```text
最小版：
  if p_done > 0.7 for 3 consecutive chunks:
      current_skill = next_skill_in_plan

增强版：
  if p_done > threshold
  and ||predicted_action - predicted_keypose|| < δ:
      current_skill = next_skill_in_plan
```

**Loss**：

```text
L_total = L_action
        + λ_done     · L_done        (BCE)
        + λ_progress · L_progress    (MSE，可选)
        + λ_keypose  · L_keypose     (L1，可选)
        + λ_align    · L_skill_align (SupCon，可选)
```

SeqVLA 已表明 action + completion **联合训练**优于先后训练，不建议把 adapter 和 completion 完全分开训。

### 4.6 模块 4：Skill-Conditioned Action Adapter

让一个共享 action expert 在不同原子技能下表现出不同动作偏置，推荐使用 **flow residual** 形式（最贴近 pi0.5/Wall-OSS-0.5）：

```text
v_base = ActionExpert_base(z_t, t, h)
Δv     = Adapter_skill(z_t, t, h, e_skill)
v      = v_base + Δv
```

或 action expert 内部 FFN/projection **LoRA** 形式：

```text
W' = W + B_skill · A_skill

当前 skill = grasp  → activate LoRA_grasp
当前 skill = insert → activate LoRA_insert
```

推荐优先级：

```text
第一优先：flow matching action expert 内部 FFN / projection LoRA
第二优先：action expert 输出层 LoRA
第三优先：VLM-to-action condition projector LoRA
不建议第一版：大范围 VLM backbone LoRA
```

## 5. 最相关已有工作

### SeqVLA

SeqVLA 是最贴近 `given plan + completion head` 的工作。它基于 π0，在 action expert feature 上加 completion detection head。子任务序列是人工预定义的，模型不生成子任务，只判断当前 subtask 是否完成，然后切换 prompt。

架构：

```text
multi-view images + joint states + subtask language prompt
        ↓
π0 VLA backbone
        ↓
action expert feature
  ├── action head → continuous action
  └── completion detection head → completion probability
```

completion label 格式（`1` = 继续，`0` = 完成）：

```text
1111110000
```

关键结论：

```text
completion head 接在 action expert feature 上，而不是 VLM 生成文本后面
action + completion 联合训练优于先后训练
subtask-level demos + completion labels 可以训练有效切换
```

但 SeqVLA 没有做 per-skill adapter，也没有主打未见原子技能组合泛化。**单独 completion head 不是首创点**，我们的 novelty 在于把它与 per-skill adapter、keypose/semantic alignment 组合成 plug-and-play 层。

### AtomicVLA

AtomicVLA 是更重的路线。它让模型自己 Think-Act，生成 task chain、progress、atomic skill abstraction，并用 skill-guided MoE 路由到 atomic expert。

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

它说明 atomic skill expert / skill-guided routing 是有效的，但架构重、训练复杂，不太适合直接用 1k 真机数据复现。

我们的方案可以看作 AtomicVLA 的轻量版：

```text
AtomicVLA:
  model-internal planning + SG-MoE

ours:
  external skill plan + per-skill adapter + completion switching
```

AtomicVLA 中"当前技能是否完成"通过 learned `[think]/[act]` 切换 + progress generation 隐式处理；我们的方案把该问题**显式化**为 completion/progress/keypose prediction，更容易落地到开源 VLA。

### AtomSkill

AtomSkill 从多任务 demonstration 中学习 semantic atomic skill library，三个核心模块是：

```text
1. Semantic Skill Discovery with VLM
   从 demonstration 中切分 variable-length atomic skill segments，
   用 VLM 给每个 segment 生成语义 skill label。

2. Atomic Skill Learning with Semantic Contrastive Alignment
   用 VQ-VAE 学离散 skill codebook，
   再用 temporal contrastive loss + semantic contrastive loss 组织 skill space。

3. Inference with Atomic Skill Priors
   diffusion sampler 采样高层 skill embedding，
   action decoder 执行 action chunk，
   keypose prediction 判断何时切换到下一个 skill。
```

对我们的启发：

**Semantic skill alignment**：同一原子技能在不同任务里的低层轨迹不同，但语义相同（grasp cup / grasp pen / grasp flower 都是 `grasp`）。用 supervised contrastive loss 让 action expert 的 segment-level hidden 对同语义技能靠近：

```text
h_segment = pool(action_expert_hidden over a skill segment)
L_align = SupCon(h_segment, skill.current_id)
```

**Keypose imagination**：不用 binary done head，而是预测当前 skill 的 terminal keypose，推理时用空间距离辅助切换，对 place / insert / open / close 尤其有帮助：

```text
keypose_pred = KeyposeHead(h_action, e_skill)
switch if: p_done high and ||action - keypose_pred|| < δ
```

但 AtomSkill 是从零训练 imitation learning skill library，不是 plug-and-play 到开源 VLA。

### Long-VLA

Long-VLA 强调 phase-aware long-horizon execution，把子任务内部再分为 moving phase 和 interaction phase，让模型在不同阶段关注不同视觉信息。

对我们的启发：

```text
done/progress head 不应只看 current_skill
还应看 phase、object、proprio、history
```

可以在 LeRobot 数据中增加 `skill.phase_id` 字段，并在 prompt 和 completion head 输入中加入 phase embedding。

### InSight

InSight 做的是 self-guided skill acquisition：VLM 发现 primitive gap，机器人自己 rollout，成功后加入训练集继续训练。它说明 primitive-level steerability 和 progress channel 很重要。但完整闭环工程量大、真机安全风险高，不适合作为第一版主线。

## 6. 方案优点

```text
1. 工程上更可行
   不需要重构 pi0.5 / Wall-OSS-0.5 backbone。

2. 数据需求更合理
   1k 真机数据足够训练 per-skill adapter、completion/progress head 和少量组合切换。

3. 即插即用
   模块主要加在 action expert/action head 侧，可以迁移到多个 VLA。

4. 结果更容易做出来
   相比训练 VLA 自己生成 task chain，给定 skill plan 后做执行和切换更稳。

5. 可以清楚分析失败
   能区分 atomic skill failure、transition failure、composition failure。

6. 适合 OpenArm
   可以用 LeRobot 数据标注 current_skill、phase、done、keypose。
```

## 7. 方案缺点和风险

```text
1. 不是真正完全自主的组合泛化
   因为 skill plan 是外部 LLM/rule planner 给的，不是 VLA 自己生成。

2. 可能被认为是 wrapper / 套壳
   如果方法只是在外面套一个 planner + done head，创新性不够强。

3. 依赖 skill plan 正确
   planner 输出错了，后面执行再强也会失败。

4. 只适用于已知原子技能
   第一版不能处理训练中没有的新 primitive。

5. completion 判断仍然困难
   当前技能是否完成不能只靠 skill id，必须结合视觉、proprio、action hidden、object state。

6. 泛化边界有限
   如果测试组合包含未见 transition 或强分布外中间状态，可能仍然失败。
```

所以论文表述要谨慎：不能说“真正解决开放式长程规划”，而应该说：

```text
given a skill plan composed of known atomic skills,
we improve the ability of pretrained VLAs to execute and recombine these skills under unseen long-horizon compositions.
```

## 8. 如何增强创新性

为了避免只是套壳，可以把方法设计成：

```text
1. Per-skill LoRA / adapter bank
   让 action expert 对不同原子技能有不同动作偏置。

2. Hybrid completion head
   从 action expert hidden + VLM hidden + skill embedding + proprio/history 判断完成。

3. Keypose head
   预测当前 skill 的 terminal keypose，用物理目标辅助切换。

4. Semantic skill alignment
   让同一 skill 在不同任务里的 action hidden 靠近，提升可复用性。

5. Cross-backbone plug-and-play
   在至少两个 VLA 上验证，比如 Wall-OSS-0.5 + OpenVLA-OFT 或 pi0.5。
```

这样论文卖点就不是单独的 done head，而是：

```text
plug-and-play skill composition layer
= skill adapter + completion/progress/keypose switching + semantic alignment
```

## 9. 推荐汇报结论

我们认为长程任务必须具备子任务划分和切换能力。完整地让 VLA 自己生成 task chain 是更理想但风险更高的方向，AtomicVLA 属于这个路线，但需要较重架构和更多监督。结合我们只有约 1k 条 OpenArm 真机数据、希望基于 pi0.5/Wall-OSS-0.5 等开源 VLA 快速做出结果的条件，第一版更适合采用轻量 plug-and-play 路线：由 LLM 或规则 planner 把用户任务分解成已学原子技能序列，VLA 通过 per-skill adapter 执行当前技能，并通过 completion/progress/keypose head 判断是否切换到下一个技能。

这个方法不完全等同于真正开放式组合泛化，因为高层 skill plan 来自外部模块；但它更容易落地、更适合少量真机数据，也能系统评估”已有 VLA 是否能复用原子技能完成未见组合”。如果能证明 direct fine-tuning 在 held-out composition 上掉点，而我们的 adapter + completion/keypose 模块能显著缩小 composition gap，就有比较清楚的论文价值。

## 10. 数据采集与训练数据结构

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

**1k demos 推荐分配**：

```text
400 条：单个原子技能
350 条：已见组合任务
100 条：关键 transition / boundary 强化
50 条：validation
100 条：held-out 未见组合测试
```

LeRobot 最小字段：

```text
observation.images.*   ← 各视角相机图像
observation.state      ← 关节角度、末端姿态等本体感受
action                 ← 机器人执行的动作
task.instruction       ← 整个任务的自然语言描述
task.skill_sequence    ← 完整技能序列，如 [open, grasp, insert, close]
skill.current_id       ← 当前帧属于哪个原子技能
skill.segment_start    ← 该技能片段的起始帧
skill.segment_end      ← 该技能片段的结束帧
skill.done             ← 当前帧该技能是否完成（0/1）
```

推荐增加：

```text
skill.phase_id         ← 技能内部阶段，如 approach / contact / lift，让 completion head 判断更细
skill.progress         ← 当前技能完成进度 [0, 1]，比 binary done 更平滑，用于训练 progress head
skill.keypose          ← 当前技能的终止关键姿态，用于训练 keypose head 和辅助切换判断
object.active_name     ← 当前技能操作的主体物体名称，喂给 prompt 和 completion head
object.target_name     ← 当前技能的目标位置/容器名称
object.active_bbox     ← 主体物体在图像中的边界框，可裁出 crop 作为 completion head 的局部视觉输入（可选）
object.target_bbox     ← 目标物体在图像中的边界框（可选）
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

## 11. 推荐实验对照与评估指标

### 11.1 必须比较的 baseline

```text
1. Direct VLA fine-tuning
2. Skill-token only
3. Shared LoRA + skill embedding
4. Per-skill LoRA with oracle skill boundary
5. Per-skill LoRA + learned completion/progress head  ← 主方法最小版
```

### 11.2 增强 ablation

```text
6. + keypose head
7. + semantic skill alignment
8. + object/phase-conditioned completion head
9. + adapter fusion at skill transitions
10. VLM hidden only vs action hidden only vs hybrid done head
```

**Done head 输入来源**建议作为重点 ablation：

```text
VLM-Done:
  只用 VLM hidden

Action-Done:
  只用 action expert hidden

Hybrid-Done:
  VLM hidden + action expert hidden + skill/proprio/history
```

主方法推荐：Hybrid-Done。

### 11.3 推荐评估指标

核心指标：

```text
Atomic Success Rate            ← 单个原子技能执行能力
Seen Composition Success Rate  ← 已见组合
Held-out Composition Success Rate  ← 核心指标，未见组合泛化
Composition Gap                ← seen vs held-out 成功率之差
Completed Prefix Length        ← 平均完成了几步
```

细粒度指标：

```text
Done Prediction F1
Progress MAE
Keypose Error
Skill Transition Accuracy
Failure Position Distribution
Compositional Failure Share
Average Task Progress
```

失败类型建议人工或半自动标注：

```text
manipulation failure      ← 原子技能本身执行失败
transition failure        ← 切换时机错误
wrong-order failure       ← 执行顺序错误
premature-switch failure  ← 过早切换
late-switch failure       ← 过晚切换
object selection failure  ← 作用对象选错
timeout / safety abort
```

## 12. Novelty 边界与论文表述

### 12.1 已有工作覆盖的点

```text
done/completion head:
  SeqVLA 已经做过，不是首创点。

skill-guided expert:
  AtomicVLA 已做重架构版本。

semantic skill library:
  AtomSkill 已做 VQ + contrastive skill alignment。

keypose-based skill transition:
  AtomSkill 已做 keypose imagination。
```

因此**不能写成**：

```text
首次提出 done head
首次提出原子技能专家
首次提出 keypose-based switching
```

### 12.2 我们的差异化定位

**应该写成**：

```text
我们提出一个面向开源 VLM + flow-matching VLA 的 plug-and-play skill composition layer，
把 completion-aware switching、skill-conditioned action adapters、
可选 keypose/progress/semantic alignment 组合起来，
在少量真机数据下提升 known atomic skills 的 held-out long-horizon recombination。
```

推荐英文表述：

```text
SeqVLA demonstrates that completion-aware switching is crucial for long-horizon VLA
execution. Building on this insight, we study a different problem: whether pretrained
VLAs can recombine known atomic skills under unseen long-horizon compositions. To this
end, we couple completion-aware switching with skill-conditioned action adapters attached
to the flow-matching action expert, enabling plug-and-play compositional adaptation
without redesigning the VLA backbone.

Inspired by semantic skill alignment and keypose imagination in AtomSkill, we further
regularize action-expert segment representations by skill labels and optionally predict
skill terminal keyposes, while avoiding the need to train a full VQ skill codebook or
diffusion skill sampler.
```

关键差异点总结：

```text
1. 目标问题不同:
   SeqVLA: seen subtask switching
   本方案: held-out atomic skill recombination

2. 架构形式不同:
   AtomicVLA: 重新设计 VLA 内部，model-internal planning
   本方案: plug-and-play 外挂，不破坏 backbone

3. 数据规模不同:
   AtomSkill: 从零训练 imitation learning skill library
   本方案: 在已有开源 VLA 上少量真机数据 fine-tune

4. 评估重点不同:
   其他工作: seen task performance
   本方案: held-out composition gap
```

## 13. 推荐论文故事线

```text
直接微调 VLA:
  可以学会 seen long-horizon tasks，
  但 held-out skill recombination 掉点明显。
       ↓
Skill token:
  告诉模型当前技能，有帮助但不稳定。
       ↓
Per-skill action adapter:
  降低不同技能之间的动作干扰。
       ↓
Completion/progress head:
  让模型能基于多模态状态判断技能完成，并按 plan 切换。
       ↓
Keypose/semantic alignment:
  进一步让切换更物理可解释，让 skill hidden 更语义一致。
       ↓
Plug-and-play:
  模块主要挂在 action expert/action head，
  可迁移到 pi0.5、Wall-OSS-0.5、OpenVLA-OFT。
```

最小故事（英文）：

```text
Direct VLA fine-tuning learns seen compositions but fails to recombine known atomic skills.
Skill-conditioned adapters reduce skill interference.
Completion-aware switching enables plan-conditioned long-horizon execution.
Keypose/progress and semantic alignment further improve robust transitions and
held-out composition.
```

