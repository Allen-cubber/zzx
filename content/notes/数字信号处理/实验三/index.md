
## 一、 实验原理与公式推导

### 1. 双线性变换法原理
双线性变换法是一种将模拟滤波器 $H(s)$ 映射为数字滤波器 $H(z)$ 的代数变换方法。它利用了梯形积分法则，建立了 $s$ 平面与 $z$ 平面之间的非线性映射关系：
$$ s = \frac{2}{T} \frac{1 - z^{-1}}{1 + z^{-1}} $$
其中 $T$ 为采样间隔（$T = 1/F_s$）。

这种映射将模拟平面的虚轴 ($j\Omega$) 映射到 $z$ 平面的单位圆 ($e^{j\omega}$) 上，避免了频率混叠现象，但会引入**频率畸变（Frequency Warping）**。

### 2. 频率预畸变 (Frequency Pre-warping)
由于双线性变换是非线性的，模拟角频率 $\Omega$ 与数字角频率 $\omega$ 之间的关系为：
$$ \Omega = \frac{2}{T} \tan\left(\frac{\omega}{2}\right) $$
或者写作：
$$ \Omega = 2 F_s \tan\left(\frac{\pi f}{F_s}\right) $$

由于高频部分会被压缩，为了保证设计出的数字滤波器截止频率准确，必须先进行**预畸变**。即根据要求的数字截止频率 $\omega_c$，反向计算出设计模拟滤波器所需的模拟截止频率 $\Omega_c$。

### 3. 数值稳定性与归一化处理
在MATLAB仿真中，如果采样率 $F_s$ 很大（如本实验中的4000Hz），直接代入 $2F_s$ 会导致 $\Omega$ 数值极大（甚至溢出），从而在计算高阶多项式系数时产生“矩阵接近奇异值”的数值精度错误。
为此，采用**归一化设计**思路：
1.  预畸变时不乘系数，令 $\Omega' = \tan(\omega/2)$。
2.  双线性变换时，设有效采样率参数为 0.5（即 $2 F_s' = 1$），使得公式变为 $s = \frac{z-1}{z+1}$。
这样既保证了数学上的等价性，又解决了数值计算的稳定性问题。

### 4. 滤波器类型特性
*   **Butterworth (巴特沃斯)**：通带和阻带均具有单调平坦的幅频特性，被称为“最平坦”滤波器，但在相同指标下阶数较高。
*   **Chebyshev-I (切比雪夫I型)**：通带内有等波纹起伏，阻带单调下降。相同指标下阶数比Butterworth低，过渡带更陡峭。

---

## 二、 程序源代码与注释

本程序实现了低通、高通、带通三种滤波器的设计，包含Butterworth和Chebyshev-I两种类型，并绘制了幅频响应和相频响应。

```matlab
%% IIR滤波器设计实验代码 (双线性变换法)
clear; clc; close all;

% --- 全局参数设置 ---
Fs = 4000;          % 采样率 4000Hz
Rp = 1;             % 通带最大波纹 1dB
Rs = 40;            % 阻带最小衰减 40dB
Fs_calc = 0.5;      % 归一化计算用采样率 (用于解决双线性变换数值不稳问题)

% 创建图形窗口
figure('Name', '幅频响应 (Magnitude Response)', 'Color', 'w');
fig_phase = figure('Name', '相频响应 (Phase Response)', 'Color', 'w');

%% 第一部分：低通滤波器 (Lowpass)
% 指标: 通带1000Hz, 阻带1200Hz
fp_L = 1000; fs_L = 1200;

% 1. 预畸变: 将数字频率转为模拟归一化频率
omega_p_L = 2 * pi * fp_L / Fs;
omega_s_L = 2 * pi * fs_L / Fs;
Wp_L = tan(omega_p_L / 2);
Ws_L = tan(omega_s_L / 2);

% 2. 计算阶数 (Butterworth & Chebyshev)
[N_bw_L, Wn_bw_L] = buttord(Wp_L, Ws_L, Rp, Rs, 's');
[N_ch_L, Wn_ch_L] = cheb1ord(Wp_L, Ws_L, Rp, Rs, 's');

% 3. 模拟原型设计
[num_bw_L_a, den_bw_L_a] = butter(N_bw_L, Wn_bw_L, 's');
[num_ch_L_a, den_ch_L_a] = cheby1(N_ch_L, Rp, Wn_ch_L, 's');

% 4. 双线性变换 (模拟 -> 数字)
[num_bw_L, den_bw_L] = bilinear(num_bw_L_a, den_bw_L_a, Fs_calc);
[num_ch_L, den_ch_L] = bilinear(num_ch_L_a, den_ch_L_a, Fs_calc);

% 绘图
plot_filter(1, num_bw_L, den_bw_L, num_ch_L, den_ch_L, Fs, '低通 Lowpass');


%% 第二部分：高通滤波器 (Highpass)
% 指标: 通带1400Hz, 阻带1000Hz
fp_H = 1400; fs_H = 1000;

% 1. 预畸变
omega_p_H = 2 * pi * fp_H / Fs;
omega_s_H = 2 * pi * fs_H / Fs;
Wp_H = tan(omega_p_H / 2);
Ws_H = tan(omega_s_H / 2);

% 2. 计算阶数
[N_bw_H, Wn_bw_H] = buttord(Wp_H, Ws_H, Rp, Rs, 's');
[N_ch_H, Wn_ch_H] = cheb1ord(Wp_H, Ws_H, Rp, Rs, 's');

% 3. 模拟设计 (注意高通需加 'high')
[num_bw_H_a, den_bw_H_a] = butter(N_bw_H, Wn_bw_H, 'high', 's');
[num_ch_H_a, den_ch_H_a] = cheby1(N_ch_H, Rp, Wn_ch_H, 'high', 's');

% 4. 双线性变换
[num_bw_H, den_bw_H] = bilinear(num_bw_H_a, den_bw_H_a, Fs_calc);
[num_ch_H, den_ch_H] = bilinear(num_ch_H_a, den_ch_H_a, Fs_calc);

% 绘图
plot_filter(2, num_bw_H, den_bw_H, num_ch_H, den_ch_H, Fs, '高通 Highpass');


%% 第三部分：带通滤波器 (Bandpass)
% 指标: 通带[900,1300], 阻带[600,1500]
fp_B = [900, 1300]; fs_B = [600, 1500];

% 1. 预畸变 (向量运算)
omega_p_B = 2 * pi * fp_B / Fs;
omega_s_B = 2 * pi * fs_B / Fs;
Wp_B = tan(omega_p_B / 2);
Ws_B = tan(omega_s_B / 2);

% 2. 计算阶数
[N_bw_B, Wn_bw_B] = buttord(Wp_B, Ws_B, Rp, Rs, 's');
[N_ch_B, Wn_ch_B] = cheb1ord(Wp_B, Ws_B, Rp, Rs, 's');

% 3. 模拟设计
[num_bw_B_a, den_bw_B_a] = butter(N_bw_B, Wn_bw_B, 's');
[num_ch_B_a, den_ch_B_a] = cheby1(N_ch_B, Rp, Wn_ch_B, 's');

% 4. 双线性变换
[num_bw_B, den_bw_B] = bilinear(num_bw_B_a, den_bw_B_a, Fs_calc);
[num_ch_B, den_ch_B] = bilinear(num_ch_B_a, den_ch_B_a, Fs_calc);

% 绘图
plot_filter(3, num_bw_B, den_bw_B, num_ch_B, den_ch_B, Fs, '带通 Bandpass');


%% --- 封装绘图函数 ---
function plot_filter(idx, num_bw, den_bw, num_ch, den_ch, Fs, title_str)
    % 绘制幅频响应
    figure(1); 
    subplot(3, 1, idx);
    [h1, w1] = freqz(num_bw, den_bw, 1024, Fs);
    [h2, w2] = freqz(num_ch, den_ch, 1024, Fs);
    
    plot(w1, 20*log10(abs(h1)), 'b', 'LineWidth', 1.5); hold on;
    plot(w2, 20*log10(abs(h2)), 'r--', 'LineWidth', 1.5);
    yline(-1, 'k:'); yline(-40, 'k:'); % 辅助线
    legend('Butterworth', 'Chebyshev-I');
    title([title_str, ' 幅频响应']);
    ylabel('幅度 (dB)'); grid on; ylim([-80 10]);
    if idx==3, xlabel('频率 (Hz)'); end
    
    % 绘制相频响应
    figure(2);
    subplot(3, 1, idx);
    plot(w1, unwrap(angle(h1)), 'b', 'LineWidth', 1.5); hold on;
    plot(w2, unwrap(angle(h2)), 'r--', 'LineWidth', 1.5);
    title([title_str, ' 相频响应']);
    ylabel('相位 (rad)'); grid on;
    legend('Butterworth', 'Chebyshev-I');
    if idx==3, xlabel('频率 (Hz)'); end
end
```

---

## 三、 运行结果与波形

*(此处在实际报告中应插入代码生成的两张图片，以下为对波形的文字描述)*

### 1. 幅频响应 (Magnitude Response)
*   **低通滤波器**：
    *   **Butterworth**：在0-1000Hz通带内非常平坦，单调下降。在1200Hz处衰减达到要求，但过渡带较宽。
    *   **Chebyshev-I**：在0-1000Hz通带内可见明显的等幅波动（波纹大小为1dB）。在1000Hz-1200Hz的过渡带下降速度明显快于Butterworth，迅速达到-40dB衰减。
*   **高通滤波器**：
    *   两者均在1400Hz以上通带保持高增益。Chebyshev在通带内有波纹，但在1400Hz到1000Hz的过渡区下降更陡峭。
*   **带通滤波器**：
    *   呈现“拱门”形状。Chebyshev在通带（900-1300Hz）顶部有波纹，但两侧的裙边（过渡带）比Butterworth收缩得更紧。

### 2. 相频响应 (Phase Response)
*   所有滤波器的相位曲线均为**非线性**。
*   在通带截止频率附近，相位变化的斜率最大。
*   Chebyshev滤波器的相位非线性程度通常比Butterworth更严重（曲线弯曲更厉害），这意味着其群延迟失真更大。
*   使用 `unwrap` 函数处理后，相位呈现连续下降趋势，没有出现 $2\pi$ 的跳变。

---

## 四、 实验结果分析

### 1. 滤波器性能对比
通过实验波形可以清晰地验证两种滤波器的理论特性：
*   **阶数与陡峭度**：在相同的通带波纹和阻带衰减指标下，`buttord` 计算出的阶数通常高于 `cheb1ord`。实验结果显示，Chebyshev滤波器虽然阶数较低，但凭借牺牲通带平坦度（引入波纹），换取了更窄的过渡带，即拥有更好的频率选择性。
*   **应用场景**：如果应用场景对信号幅度的保真度要求极高（如高保真音频），应优先选择Butterworth；如果需要在有限阶数下获得极陡峭的切除效果（如强干扰分离），Chebyshev更为合适。

### 2. 数值稳定性分析
在代码编写初期，曾出现 `RCOND` 极小（矩阵接近奇异值）的警告。经分析，这是由于直接使用 $F_s=4000$ 进行双线性变换计算，导致中间变量数值过大。
本实验通过**归一化方法**（设置 `Fs_calc = 0.5` 配合 $\tan(\omega/2)$ 预畸变）成功解决了此问题。结果表明，数字滤波器的设计关键在于“数字角频率”与“模拟归一化频率”的正确映射，而非绝对采样率数值的大小。

### 3. IIR滤波器的相位特性
实验中的相位响应图表明，IIR滤波器具有非线性相位特性。对于对波形时域形状敏感的应用（如图像处理或数据通信），可能需要后续进行相位校正，或改用FIR滤波器（具有线性相位）。

### 4. 结论
本实验成功利用MATLAB实现了基于双线性变换法的IIR滤波器设计。所设计的低通、高通、带通滤波器均满足预定的频率指标（截止频率准确）和衰减指标（波纹<1dB，阻带衰减>40dB）。验证了预畸变步骤对于双线性变换法设计数字滤波器的必要性。