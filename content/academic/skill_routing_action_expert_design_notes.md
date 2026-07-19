# 不同 Skill 路由与 Action Expert 注入设计笔记

本文整理前几轮关于“不同 skill 的路由、如何让 pi0.5-style action expert 针对不同 skill 注入不同信息”的讨论。重点不是文献综述式概括，而是按可实现的网络结构来拆解：每种方案的输入、输出、接入位置、训练方式、优缺点，以及更适合 OpenArm + LeRobot + 约 1k 真机数据的第一版方案。

## 1. 问题定义

你的整体设定是：

```text
用户长程指令
  -> LLM / structural prompt 生成 skill plan
  -> Skill Plan Wrapper 给出 current_skill_id
  -> pi0.5-style VLA 生成动作
  -> done head 判断当前 skill 是否完成
  -> 完成后切到下一个 skill
```

这里讨论的是中间这一块：

```text
current_skill_id 如何影响 action expert？
```

也就是：

```text
同一个 pi0.5 action expert，
在执行 grasp / place / open_drawer / close_drawer 等不同 skill 时，
是否应该激活不同参数、不同 adapter、不同 LoRA，或者注入不同 skill embedding？
```

核心目标：

- 不重训整个 VLA；
- 尽量复用 pi0.5 / Wall-OSS-0.5 这类开源 VLA 权重；
- 在少量 OpenArm 真机数据下稳定训练；
- 让已学过的原子技能在未见长程组合里更容易复用。

## 2. 关键概念区分

### 2.1 Skill routing 不等于 done 判断

两者职责不同：

```text
Skill routing:
    当前已经知道要执行哪个 skill，决定 action expert 用哪组 skill-specific 参数/条件。

Done head:
    判断当前 skill 是否已经完成，决定是否切到下一个 skill。
```

换句话说：

```text
skill_id -> 选择/调制动作生成模块
p_done   -> 控制 skill pointer 是否前进
```

### 2.2 Skill routing 不一定要让模型自己预测 skill

在你的方案里，推理时已有：

```text
LLM planner -> skill plan -> current_skill_id
```

训练时已有 LeRobot 标注：

```text
skill_name / skill_id
subtask_text / subtask_index
segment_id
subtask_done
```

因此第一版不必让 VLM 从图像中“猜当前 skill”。更稳的做法是：

```text
current_skill_id 直接作为 oracle / planner-provided condition。
```

## 3. 已有工作中相关实现

## 3.1 AtomicVLA: Skill-Guided MoE

AtomicVLA 最相关。它提出 SG-MoE：

```text
atomic skill abstraction
  -> skill embedding
  -> skill router
  -> shared expert + selected atomic skill expert
  -> action chunk
```

### 3.1.1 论文概念

论文里说：

- VLM 在 thinking 阶段生成 atomic skill abstraction；
- acting 阶段根据这个 atomic skill abstraction 路由到某个 atomic skill expert；
- 同时保留 shared expert，避免丢失通用动作能力；
- 新 skill 可以新增 expert，实现 continual learning。

### 3.1.2 源码实际实现

AtomicVLA 开源代码里，router 比论文描述更简单。关键文件：

```text
src/openpi/models/gemmoe.py
src/openpi/models/pi0_atomic.py
src/openpi/models/tokenizer.py
```

源码里的 skill 映射：

```python
sigma_map = {
    "pick": 0.0,
    "place": 1.0,
    "open": 2.0,
    "close": 3.0,
    "turn": 4.0,
}
```

也就是当前主要支持：

```text
pick / place / open / close / turn
```

然后构造固定的 skill embedding：

```text
pick  -> [10, 0, 0, 0, 0, ..., 0]
place -> [0, 32.5, 0, 0, 0, ..., 0]
open  -> [0, 0, 55, 0, 0, ..., 0]
...
```

这个 embedding 是：

```text
固定的、不可训练的、放大版 one-hot embedding。
```

Router 本身是一个无 bias 线性层：

```python
Linear(hidden_dim -> num_experts, bias=False)
```

并且初始化成 scaled identity。也就是说，初始行为几乎等价于：

```text
skill_id -> expert_id
```

### 3.1.3 Top-1 routing

AtomicVLA 代码中 routing 逻辑：

```text
router_logits = Linear(skill_embedding)
router_probs = softmax(router_logits)
top expert = argmax(router_probs)
selected expert weight = top probability
shared expert weight = 1 - selected expert weight
```

最终组合：

```text
combine_weights = [shared_weight, selected_skill_expert_weight]
```

不是所有专家都激活，而是：

```text
shared expert + top-1 selected atomic skill expert
```

### 3.1.4 Expert 是什么

AtomicVLA 不是每个 skill 复制一整套 VLA，也不是每个 skill 复制完整 action expert。

它 MoE 化的是 action expert Transformer block 中的 FFN/MLP 部分：

```text
原 action expert block:
    attention
    FFN

AtomicVLA:
    attention
    MoE-FFN:
        shared FFN expert
        skill FFN expert 1
        skill FFN expert 2
        ...
```

VLM backbone、attention、动作输入输出投影等主体结构仍然共享。

### 3.1.5 对你的启发

AtomicVLA 值得借鉴的是：

```text
shared expert + skill-specific expert
```

而不一定是它的 router 本身。因为当前源码 router 初始几乎就是：

```text
skill id -> expert id
```

对你的设定来说，如果已经有 `current_skill_id`，第一版可以直接 hard route，没必要额外训练一个几乎等价的 router。

## 3.2 AdaMoE-VLA: Action Expert 内部 MoE

AdaMoE-VLA 的思想是：

```text
在 flow-matching VLA 的 action expert transformer block 中加入 MoE。
```

它把 action expert 的 FFN 替换成 MoE layer：

```text
shared experts
routed experts
router network
scale adapter
```

特点：

- expert 不一定有显式 skill 语义；
- router 根据 hidden state 动态选择 expert；
- 更像 action-specialized experts，而不是人工定义的 skill experts。

对你的启发：

- MoE 可以插在 action expert FFN 位置；
- 但 1k 真机数据下完整 MoE 风险较高；
- 可以借鉴 shared expert + routed expert 思想，做轻量 adapter/LoRA。

## 3.3 MergeVLA: Task Mask / LoRA Routing

MergeVLA 研究多任务 VLA expert 合并。它的相关点是：

```text
task router -> task mask -> activate task-specific LoRA / expert head
```

它说明：

- 不同任务的 LoRA 方向可能冲突；
- 使用稀疏激活的 task-specific adapter/mask 可以缓解多任务干扰；
- 当 task unknown 时，可以从初始观测中预测 task mask。

对你的启发：

```text
task-level LoRA routing 可以下沉成 skill-level LoRA routing。
```

你的场景更简单，因为 skill plan 已知：

```text
current_skill_id -> activate skill-specific LoRA
```

不需要先从观测中推断 task。

## 3.4 OpenVLA-OFT+ FiLM / X-VLA Soft Prompt

这类工作不是专家路由，而是条件注入：

```text
condition embedding -> scale / shift / soft prompt -> 调制 action 或 vision hidden
```

典型方式：

```text
FiLM:
    gamma, beta = MLP(condition_embedding)
    h' = gamma * h + beta

Soft Prompt:
    condition_id -> learnable prompt tokens
    prompt tokens 与视觉/语言/action tokens 拼接
```

对你的启发：

```text
skill_id 不一定要选择不同专家，也可以作为条件向量调制共享 action expert。
```

这是最轻量、最适合少数据的路线之一。

## 4. 可行网络架构方案

下面按从简单到复杂整理可实现方案。

## 4.1 方案 A: Skill Token / Skill Embedding 注入

### 结构

```text
skill_id
  -> Embedding Table
  -> e_skill
  -> 注入 VLM prompt 或 action expert hidden
```

可接入位置：

1. 文本 prompt：

```text
"Current skill: grasp. Subtask: grasp pencil."
```

2. VLM token：

```text
[image tokens, language tokens, skill token]
```

3. action expert 输入：

```text
h_action_input = h_action_input + MLP(e_skill)
```

### 输入

```text
current_skill_id
current_subtask_text
VLM hidden / action tokens
```

### 输出

```text
conditioned action hidden
```

### 优点

- 最简单；
- 参数少；
- 很适合 1k 条数据；
- 不改变 action expert 内部结构。

### 缺点

- skill-specific 能力弱；
- 只是条件提示，不是真正参数专门化；
- 对差异大的技能，比如 grasp vs open_drawer，可能不够。

### 第一版评价

可以作为 baseline：

```text
Base pi0.5 + skill token / skill prompt
```

但如果要体现方法亮点，最好再加 adapter/LoRA。

## 4.2 方案 B: Skill-FiLM 条件调制

### 结构

```text
skill_id
  -> skill embedding e_s
  -> MLP
  -> gamma_s, beta_s
  -> h' = gamma_s * h + beta_s
```

接入 action expert：

```text
action expert block:
    attention
    Skill-FiLM
    FFN / flow matching block
```

或者更轻：

```text
action expert 输入处:
    h_action = h_action + FiLM(e_s, h_action)
```

### 输入

```text
h_action: action expert hidden, [B, T, D]
e_skill: skill embedding, [B, D_s]
```

### 输出

```text
h_action_conditioned: [B, T, D]
```

### PyTorch 伪代码

```python
class SkillFiLM(nn.Module):
    def __init__(self, num_skills, d_model):
        super().__init__()
        self.skill_emb = nn.Embedding(num_skills, d_model)
        self.to_gamma_beta = nn.Sequential(
            nn.Linear(d_model, 2 * d_model),
            nn.SiLU(),
            nn.Linear(2 * d_model, 2 * d_model),
        )

    def forward(self, h, skill_id):
        e = self.skill_emb(skill_id)
        gamma, beta = self.to_gamma_beta(e).chunk(2, dim=-1)
        gamma = gamma[:, None, :]
        beta = beta[:, None, :]
        return h * (1 + gamma) + beta
```

### 优点

- 参数很少；
- 比单纯 skill token 更直接影响 action hidden；
- 不需要多个 expert；
- 训练稳定。

### 缺点

- 表达能力有限；
- 不同 skill 仍共享绝大多数参数；
- 论文亮点中等。

### 第一版评价

非常适合作为稳健版本：

```text
Skill-FiLM + done head
```

## 4.3 方案 C: Hard Skill-Indexed Adapter Routing

这是最推荐的第一版主线之一。

### 核心思想

不用训练复杂 router，直接：

```text
current_skill_id -> select adapter[skill_id]
```

结构：

```text
h_base = action expert hidden
h_shared = SharedAdapter(h_base)
h_skill = SkillAdapter[skill_id](h_base)
h_out = h_base + h_shared + h_skill
```

### 输入

```text
h_action: action expert hidden
current_skill_id
```

### 输出

```text
skill-conditioned hidden
```

### Adapter 形式

常用 bottleneck adapter：

```text
Adapter(h) = W_up SiLU(W_down h)
```

其中：

```text
W_down: D -> r
W_up: r -> D
```

### PyTorch 伪代码

```python
class BottleneckAdapter(nn.Module):
    def __init__(self, d_model, rank=64):
        super().__init__()
        self.down = nn.Linear(d_model, rank)
        self.up = nn.Linear(rank, d_model)

    def forward(self, h):
        return self.up(F.silu(self.down(h)))


class SkillIndexedAdapter(nn.Module):
    def __init__(self, num_skills, d_model, rank=64):
        super().__init__()
        self.shared = BottleneckAdapter(d_model, rank)
        self.skill_adapters = nn.ModuleList([
            BottleneckAdapter(d_model, rank) for _ in range(num_skills)
        ])

    def forward(self, h, skill_id):
        # h: [B, T, D]
        h_shared = self.shared(h)
        h_skill = torch.zeros_like(h)
        for sid in skill_id.unique():
            mask = skill_id == sid
            h_skill[mask] = self.skill_adapters[int(sid)](h[mask])
        return h + h_shared + h_skill
```

### 接入位置

可以插在 action expert 的：

1. 每个 Transformer block 的 FFN 后；
2. 若干中间层；
3. action expert 输出投影前。

建议第一版：

```text
插在 action expert 后几层或输出前，减少侵入。
```

### 优点

- 不需要训练 router；
- 不容易选错 expert；
- 和你的 LeRobot `skill_id` 标注直接对应；
- 很像 AtomicVLA 的轻量版；
- 适合少量数据；
- 方法容易解释。

### 缺点

- 如果 skill_id 标错，模块也会错；
- 每个 skill 数据太少时 per-skill adapter 可能过拟合；
- 不能自动发现新 skill。

### 论文表述

可以写成：

```text
Inspired by AtomicVLA's shared expert plus atomic expert design,
we adopt a lightweight skill-indexed adapter routing mechanism.
Since our skill plan is externally provided, we avoid learning a separate router
and directly activate the adapter corresponding to current_skill_id.
```

## 4.4 方案 D: Per-Skill LoRA Routing

这是你图里“per-skill LoRA”最对应的实现。

### 核心思想

对 action expert 某些线性层加 LoRA：

```text
W_eff = W_base + ΔW_shared + ΔW_skill_id
```

其中：

```text
ΔW = B A
```

推理时：

```text
current_skill_id -> activate LoRA_skill_id
```

### 接入位置

对 pi0.5-style action expert，可以加在：

```text
attention q_proj / k_proj / v_proj / out_proj
FFN up_proj / gate_proj / down_proj
action_out_proj
```

第一版建议优先：

```text
FFN projection + action_out_proj
```

原因：

- AtomicVLA 也是主要 MoE 化 FFN；
- FFN 更偏动作模式变换；
- 比改 attention 更直接。

### 输入

```text
h_action
skill_id
```

### 输出

```text
skill-conditioned linear output
```

### PyTorch 伪代码

```python
class SkillLoRALinear(nn.Module):
    def __init__(self, base_linear, num_skills, rank=16, alpha=16):
        super().__init__()
        self.base = base_linear
        self.num_skills = num_skills
        self.rank = rank
        self.scale = alpha / rank
        in_dim = base_linear.in_features
        out_dim = base_linear.out_features

        self.shared_A = nn.Parameter(torch.randn(rank, in_dim) * 0.01)
        self.shared_B = nn.Parameter(torch.zeros(out_dim, rank))

        self.skill_A = nn.Parameter(torch.randn(num_skills, rank, in_dim) * 0.01)
        self.skill_B = nn.Parameter(torch.zeros(num_skills, out_dim, rank))

    def forward(self, x, skill_id):
        y = self.base(x)

        y_shared = F.linear(F.linear(x, self.shared_A), self.shared_B) * self.scale

        y_skill = torch.zeros_like(y)
        for sid in skill_id.unique():
            mask = skill_id == sid
            A = self.skill_A[int(sid)]
            B = self.skill_B[int(sid)]
            y_skill[mask] = F.linear(F.linear(x[mask], A), B) * self.scale

        return y + y_shared + y_skill
```

### 优点

- 参数效率高；
- 很 plug-and-play；
- 与开源 VLA 微调方式兼容；
- 能体现不同 skill 的参数专门化；
- 比完整 MoE 更稳。

### 缺点

- 实现上要 patch action expert 线性层；
- 多 skill 时 batch 内按 skill 分组稍麻烦；
- skill 数据不均衡会导致某些 LoRA 训练不足。

### 第一版评价

这是最适合你论文方法味道的主方案之一：

```text
Skill-Routed LoRA Action Expert
```

推荐和 shared LoRA 一起用：

```text
base action expert + shared LoRA + per-skill LoRA
```

## 4.5 方案 E: Lightweight Gate + Skill Adapter

这是 AtomicVLA 的 router 思想和 hard routing 的折中。

### 核心思想

skill_id 决定用哪个 adapter，但一个 gate 决定“用多少”：

```text
h_out = h + A_shared(h) + alpha * A_skill[skill_id](h)
```

其中：

```text
alpha = sigmoid(MLP([skill_embedding, pooled_action_hidden, robot_state]))
```

### 输入

```text
skill_embedding
pooled action expert hidden
robot state
```

### 输出

```text
alpha in [0, 1]
```

### PyTorch 伪代码

```python
class SkillGatedAdapter(nn.Module):
    def __init__(self, num_skills, d_model, state_dim, rank=64):
        super().__init__()
        self.skill_emb = nn.Embedding(num_skills, d_model)
        self.shared = BottleneckAdapter(d_model, rank)
        self.skill_adapters = nn.ModuleList([
            BottleneckAdapter(d_model, rank) for _ in range(num_skills)
        ])
        self.gate = nn.Sequential(
            nn.Linear(d_model + d_model + state_dim, d_model),
            nn.SiLU(),
            nn.Linear(d_model, 1),
            nn.Sigmoid(),
        )

    def forward(self, h, skill_id, state):
        pooled = h.mean(dim=1)
        e = self.skill_emb(skill_id)
        alpha = self.gate(torch.cat([pooled, e, state], dim=-1))
        alpha = alpha[:, None, :]

        h_shared = self.shared(h)
        h_skill = torch.zeros_like(h)
        for sid in skill_id.unique():
            mask = skill_id == sid
            h_skill[mask] = self.skill_adapters[int(sid)](h[mask])

        return h + h_shared + alpha * h_skill
```

### 优点

- 比 AtomicVLA 更轻；
- 比纯 hard routing 更灵活；
- gate 可以根据执行状态调整 skill adapter 强度；
- 可解释为 shared expert + skill expert 的轻量版本。

### 缺点

- 多一个 gate，训练复杂度略高；
- 1k 数据下要防止 gate 崩成全 0 或全 1；
- 需要设计正则或初始化。

### 第一版评价

如果想在 hard routing 上多一点创新，可以采用：

```text
hard select skill adapter + learned scalar gate
```

比训练 expert index router 更稳。

## 4.6 方案 F: AtomicVLA-style MoE-FFN

这是最接近 AtomicVLA 的实现。

### 结构

```text
skill embedding
  -> Router Linear
  -> top-1 expert weights

action expert block FFN:
  shared FFN
  skill FFN 1
  skill FFN 2
  ...
  weighted sum
```

### 输入

```text
h_action: [B, T, D]
skill_embedding / atomic_cond: [B, T, D]
```

### 输出

```text
h_action_after_moe_ffn: [B, T, D]
```

### AtomicVLA 近似伪代码

```python
class SkillRouter(nn.Module):
    def __init__(self, d_model, num_skills):
        super().__init__()
        self.route = nn.Linear(d_model, num_skills, bias=False)

    def forward(self, skill_emb):
        logits = self.route(skill_emb)
        probs = logits.softmax(dim=-1)
        top_val, top_idx = probs.topk(1, dim=-1)

        extra_weights = torch.zeros_like(probs)
        extra_weights.scatter_(-1, top_idx, top_val)

        shared_w = 1.0 - extra_weights.sum(dim=-1, keepdim=True)
        combine = torch.cat([shared_w, extra_weights], dim=-1)
        return combine


class MoEFFN(nn.Module):
    def __init__(self, d_model, d_ff, num_skills):
        super().__init__()
        self.experts = nn.ModuleList([
            FFN(d_model, d_ff),  # shared
            *[FFN(d_model, d_ff) for _ in range(num_skills)]
        ])

    def forward(self, h, combine_weights):
        outs = torch.stack([expert(h) for expert in self.experts], dim=2)
        return torch.einsum("bte,bted->btd", combine_weights, outs)
```

### 优点

- 最像 AtomicVLA；
- 专家化能力强；
- 后续扩展新 skill 时概念清楚。

### 缺点

- 参数多；
- 训练更不稳；
- 要深入改 action expert block；
- 1k 真机数据可能不够；
- 如果 router 输入只是 fixed one-hot skill embedding，本质仍接近 id->expert。

### 第一版评价

不建议第一版直接做完整 MoE-FFN。可以作为后续增强或 ablation：

```text
Adapter/LoRA routing vs MoE-FFN routing
```

## 4.7 方案 G: Dynamic Router from Hidden State

更复杂的动态路由：

```text
router_input = concat(
    skill_embedding,
    pooled VLM hidden,
    pooled action hidden,
    robot state
)
router_output = weights over experts
```

### 结构

```text
z = concat(e_skill, pool(h_vlm), pool(h_action), state)
router_logits = MLP(z)
router_probs = softmax(router_logits)
h_out = shared + sum_k router_probs[k] expert_k(h)
```

### 优点

- 真正根据视觉/状态动态选择 expert；
- 能处理 skill 内部不同阶段；
- 更像一般 MoE。

### 缺点

- 数据需求高；
- router 容易不稳定；
- 可能学到 spurious routing；
- 和你的 planner-provided skill_id 设定不完全一致。

### 第一版评价

暂不推荐。你的数据量和论文主线更适合：

```text
已知 skill_id 下的 adapter/LoRA selection
```

动态 router 可以作为 future work。

## 5. 各方案对比

| 方案 | 参数量 | 工程难度 | 少数据稳定性 | 方法亮点 | 是否推荐第一版 |
| --- | --- | --- | --- | --- | --- |
| Skill token/prompt | 很低 | 很低 | 高 | 低 | baseline |
| Skill-FiLM | 低 | 低 | 高 | 中 | 推荐 |
| Skill-indexed adapter | 中低 | 中 | 高 | 中高 | 强推荐 |
| Per-skill LoRA | 中低 | 中 | 中高 | 高 | 强推荐 |
| Gated skill adapter | 中 | 中 | 中 | 高 | 可选 |
| AtomicVLA-style MoE-FFN | 高 | 高 | 中低 | 高 | 后续 |
| Dynamic hidden router | 中高 | 高 | 低 | 高 | 不建议第一版 |

## 6. 推荐第一版架构

结合你的条件：

- OpenArm 真机；
- LeRobot 数据；
- 约 1k 条；
- pi0.5-style VLA；
- 目标是 plug-and-play；
- 已有 skill plan 和 `skill_id` 标注；

推荐第一版：

```text
Skill-Routed LoRA / Adapter Action Expert
```

具体结构：

```text
obs + state + instruction
  -> pi0.5 VLM backbone
  -> flow-matching action expert hidden h
  -> current_skill_id
  -> shared adapter / shared LoRA
  -> skill-specific adapter / LoRA selected by current_skill_id
  -> conditioned action hidden
  -> action chunk

同时：
  conditioned action hidden + skill embedding + robot state
  -> done head
  -> p_done
```

核心公式：

```text
h' = h + A_shared(h) + A_skill[current_skill_id](h)
```

LoRA 版：

```text
W_eff = W_base + ΔW_shared + ΔW_skill[current_skill_id]
```

可选 gate：

```text
h' = h + A_shared(h) + alpha * A_skill[current_skill_id](h)
alpha = sigmoid(MLP([skill_embedding, pool(h), state]))
```

## 7. 训练方式

训练数据来自你改造后的 LeRobot：

```text
skill_id
subtask_index
segment_id
subtask_done
action
observation.state
observation.images.*
```

训练输入：

```text
obs_t
state_t
instruction / subtask_text / structural prompt
current_skill_id
```

训练输出：

```text
action chunk
p_done
```

loss：

```text
L = L_action + lambda_done * BCE(p_done, subtask_done)
```

如果加入 router/gate，可加正则：

```text
L_gate_reg = encourage non-collapse
```

但第一版 hard route 不需要 router loss。

## 8. 与 AtomicVLA 的关系如何表述

可以这样写：

```text
AtomicVLA introduces a skill-guided MoE action decoder with a shared expert and multiple atomic-skill experts. However, its released implementation uses a fixed one-hot-like skill embedding and an identity-initialized linear router, whose initial behavior is close to direct skill-to-expert assignment.

In our setting, the current skill is already provided by an external skill plan and LeRobot annotations. Therefore, instead of learning an additional skill-discovery router from limited real-robot data, we adopt a lightweight skill-indexed adapter/LoRA routing mechanism. This preserves the shared action expert while injecting skill-specific parameters in a plug-and-play manner.
```

中文解释：

```text
AtomicVLA 证明了“共享动作能力 + 原子技能专家”这个方向有价值。
但在我们的设定里，当前 skill 已经由 planner 和标注给出，
因此没有必要再用少量真机数据训练一个容易出错的 router。
我们把 SG-MoE 轻量化成 skill-indexed adapter/LoRA：
既保留即插即用性，又让不同原子技能有各自的动作参数增量。
```

## 9. 推荐实验 ablation

建议后续实验至少比较：

1. **Base pi0.5 fine-tuning**
   - 不加 skill routing；
   - 只用原始 instruction/action。

2. **Skill prompt**
   - 在语言中加入 current skill；
   - 不加 adapter。

3. **Skill-FiLM**
   - 只用 skill embedding 调制 action hidden。

4. **Shared adapter**
   - 所有 skill 共用一个 adapter。

5. **Shared + per-skill adapter / LoRA**
   - 主方法。

6. **Shared + per-skill adapter + done head**
   - 完整方法。

评估指标：

```text
atomic skill success
seen composition success
unseen composition success
long-horizon completion
failure position
done switch accuracy
```

## 10. 最终建议

第一版不要做复杂 hidden-state router，也不要直接复刻 AtomicVLA 的完整 MoE-FFN。更合理的是：

```text
current_skill_id hard route 到 per-skill LoRA / adapter；
保留 shared adapter；
done head 控制何时切换 skill；
用 skill prompt / Skill-FiLM 做轻量条件注入；
把 MoE router 作为后续增强。
```

这条路线最符合你的论文定位：

```text
少量真机数据下，基于开源 pi0.5-style VLA 的 plug-and-play 原子技能组合泛化增强。
```

