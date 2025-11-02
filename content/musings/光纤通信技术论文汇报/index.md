---
title: 光纤通信技术论文汇报
date: 2025-10-29T08:00:00+08:00
tags:
  - 光纤
summary: 工作于O波段的高增益宽带宽掺铋光纤放大器
draft: true
---
**摘要**—掺铋光纤（BDF）通过改进的化学气相沉积（MCVD）技术制备。一体化的MCVD制备工艺确保了BDF中的低杂质以及铋磷激活中心（BAC-P）的高效形成激活。在一个采用单1240 nm泵浦双程结构的光放大系统中，研究了不同输入信号和泵浦功率下的增益特性。在1325 nm波长处，当信号功率分别为-30 dBm和-23 dBm时，实现了41.1 dB和40.5 dB的增益。当输入信号功率为-30 dBm时，增益高于20 dB的带宽范围为1290 – 1365 nm（75 nm），该范围覆盖了O波段的大部分区域和E波段的一小部分区域。

**关键词**—掺铋光纤，改进的化学气相沉积，O波段光纤放大器

### I. 引言

日益增长的通信容量需求是当前信息时代不可避免的趋势。作为长距离信息传输不可或缺的一部分，光纤放大器的发展具有重要意义。掺铒光纤放大器的中心波长为1550 nm，对应石英光纤的最低损耗窗口[1]。而作为第二通信窗口的1310 nm兼具低损耗和零色散点的双重优势，在扩大通信容量方面发挥着重要作用[2]。铋在石英机理中易于与其它元素形成多种激活中心，例如铋铝激活中心（BAC-Al）、铋磷激活中心（BAC-P）和铋硅激活中心（BAC-Si），其发射中心分别在近1100 nm、1320 nm和1400 nm处[3-5]。因此，掺铋光纤（BDF）中的BAC-P可以形成，以实现在第二通信窗口的宽带放大。

2019年，N. K. Thipparapu等人在采用1240 nm + 1270 nm泵浦的双程放大系统中，在1360 nm处实现了40 dB的掺铋光纤放大器（BDFA）增益[6]。其发光中心波长位于O波段的边缘，这使得改善O波段短波长的放大变得困难，不利于实现O波段的全波段放大。近期，J. Tian等人制造的采用1240 nm双泵浦配置的BDFA，在-30 dBm输入信号功率下，于1355 nm处实现了约20 dB的净增益[7]。尽管使用1240 nm系统平衡了O波段的短波长放大，但工艺技术的局限性和铋激活中心起源的不明确，导致O波段的铋激活中心未能被高效激发。

在本研究中，传统改进的化学气相沉积（MCVD）技术一体化制备光纤的方式避免了在此过程中引入杂质并降低了损耗，从而实现了O波段中BAC-P的高效激发。基于所制备的此类BDF，构建了单泵浦双程的放大器系统。1240 nm泵浦波长的选择进一步激发了O波段中心波长的激活中心，从而提高了增益并拓宽了O波段的增益带宽。

### II. 实验与方法

高磷掺杂的BDF是通过MCVD（芬兰，Nextrom公司）技术制造的。图1显示了BDF的折射率分布。纤芯与包层之间的折射率差 (Δn) 为0.0066。其包层直径为125.1 µm，纤芯直径为8.9 µm。拉制光纤的截止波长约为3212 nm，表明该光纤为多模光纤。

吸收光谱通过截断法使用白光源（日本横河，AQ6315A）进行测试。如图2所示，搭建了采用单泵浦双程结构的O波段放大器系统，其中双程系统相比单程系统可以实现更高的增益系数[8]。两台波长范围分别为1260 – 1360 nm和1355 – 1485 nm的可调谐激光器（日本Santec，TSL550）用作输入信号源，并配有隔离器（ISO）和衰减器（ATT）。光隔离器用于抑制背向反射和残余泵浦光功率。光纤衰减器用于调节信号功率。一个波长为1240 nm的激光二极管（LD）被用作泵浦源，其最大功率为1223 mW。泵浦光和信号光通过一个1240/1310 nm的波分复用器（WDM）耦合进入BDF。荧光和增益光谱由一台光谱分析仪（日本横河，AQ6370D）记录。注入光纤前的信号功率被定义为输入信号功率。使用两个环形器（C1, C2）来构建双程结构。由于环形器2（C2）的作用，信号光两次通过光纤，放大后的信号光从光纤输出。系统的总损耗为3.7 dB。
![[Pasted image 20251029200902.png]]
【图1. BDF的折射率分布曲线（插图显示了光纤的横截面）。】
![[Pasted image 20251029200922.png]]
【图2. 双程掺铋光纤放大器的实验装置图。】

### III. 结果与讨论

如图3所示，测量了在不同泵浦功率下光纤样品的荧光强度。随着泵浦功率的增加，荧光强度也随之增强。插图显示了所制备BDF的吸收光谱。从插图可以看出，BDF在1600 nm处的背景损耗为0.039 dB/m。在1150 – 1450 nm的吸收包络内，1240 nm处的吸收系数为0.181 dB/m。

同时，在-30、-23和-10 dBm三种不同的输入信号功率下，测量了不同波长的增益。如图4所示，当输入信号功率为-30和-23 dBm时，在1330 nm处分别实现了41.1 dB和40.5 dB的最大增益。当输入信号功率为-10 dBm时，增益峰值蓝移至1335 nm，其值为34.4 dB。随着输入信号功率的增加，高能级粒子数将会减少，转换效率会降低，这归因于在-10 dBm输入信号功率下最大增益的减小[9]。当输入信号功率为-30 dBm时，增益高于20 dB的带宽范围为1290 – 1365 nm（75 nm），该范围覆盖了O波段的大部分区域和E波段的一小部分区域。特别地，增益高于30 dB的带宽为60 nm。由于所使用的1240/1310 nm WDM器件在长波长处有显著损耗，BDFA在较长波长处的增益较低。此外，所用的1240 nm泵浦光接近O波段的短波长尾部，因此该波长范围（1260 – 1275 nm）无法被很好地放大。这意味着优化系统对于扩展增益带宽具有重要意义。不同铋激活中心的中心波长会随着泵浦波长的增加而红移[10]。因此，选择一个合适的泵浦波长有望在整个O波段实现高增益放大。
![[Pasted image 20251029200938.png]]
【图3. BDF的荧光光谱（插图显示了光纤的吸收光谱）。】
![[Pasted image 20251029200949.png]]
【图4. 在三种不同信号功率下，不同波长的增益。】

1325 nm处的荧光强度最高，因此我们测量了在1325 nm处不同信号功率下的增益，如图5所示。当增益趋于饱和时，取最高增益下降3 dB的位置，即在信号输入功率为-19.3 dBm时，对应的BDF小信号增益为39.8 dB，而BDFA的3 dB饱和输出功率为19.5 dBm，该值高于文献[11]中的结果。
![[Pasted image 20251029201004.png]]
【图5. BDFA在1325 nm处不同信号光功率下的增益。】

随着光纤长度的增加，我们观察到了在峰值附近出现了激光现象，这主要是因为强度达到了激光产生的阈值条件，其中谐振腔结构由熔接点形成。这也意味着当BDF的峰值荧光强度达到某一特定值时，激光现象将不可避免地发生，并阻碍最大增益的进一步提升。非峰值波长的增益在很大程度上依赖于器件损耗和泵浦波长。优化系统和泵浦波长的选择可以有效地提高BDFA的增益。

### IV. 结论

在本研究中，我们测量了一款基于掺铋光纤的双程光放大系统的增益。在该系统中，当信号功率为-23 dBm时，我们在1335 nm处实现了40.5 dB的增益。此外，在信号功率为-30 dBm的双程系统中，实现了创纪录的41.1 dB增益。据我们所知，这是迄今为止报道的掺铋光纤放大器的最高增益。在-30 dBm的信号功率下，我们测得在1290 – 1365 nm（75 nm）范围内增益超过20 dB，该范围覆盖了O波段的大部分区域和E波段的一小部分区域。优化系统和泵浦波长的选择可以有效地提高BDFA的增益。下一步，我们将专注于激活中心的高效激发以及光纤长度的优化，以进一步提升BDFA的性能。

### 致谢

本工作得到了国家重点研发计划（2020YFB1805800）的支持。

### 参考文献

[1] L. Rapp and M. Eiselt, "Optical amplifiers for multi-band optical transmission systems," Journal of Lightwave Technology, vol. 11,no. 40(6), pp. 1579-1589, 2022.  
[2] K. Bizheva, B. Považay, B. Hermann, H. Sattmann, W. Drexler, M. Mei, R. Holzwarth, T. Hoelzenbein, V. Wacheck, and H. Pehamberger, "Compact, broad-bandwidth fiber laser for sub-2-µm axial resolution optical coherence tomography in the 1300-nm wavelength region," Optics Letters, vol. 28, no. 9, pp. 707-709, 2003.  
[3] Q. Zhao, Y. Luo, Y. Dai, and G.-D. Peng, "Effect of pump wavelength and temperature on the spectral performance of BAC-Al in bismuth-doped aluminosilicate fibers," Optics Letters, vol. 44, no. 3, pp. 634-637, 2019.  
[4] A. Khegai, Y. Ososkov, S. Firstov, K. Riumkin, S. Alyshev, A. Kharakhordin, V. Khopin, F. Afanasiev, A. Guryanov, and M. Melkumov, "Gain clamped Bi-doped fiber amplifier with 150 nm bandwidth for O-and E-bands," Journal of Lightwave Technology, vol. 40, no. 4, pp. 1161-1166, 2022.  
[5] S. V. Firstov, V. F. Khopin, I. A. Bufetov, E. G. Firstova, A. N. Guryanov, and E. M. Dianov, "Combined excitation-emission spectroscopy of bismuth active centers in optical fibers," Optics Express, vol. 19, no. 20, pp. 19551-19561, 2011.  
[6] N. K. Thipparapu, Y. Wang, A. A. Umnikov, P. Barua, D. J. Richardson, and J. K. Sahu, "40 dB gain all fiber bismuth-doped amplifier operating in the O-band," Optics Letters, vol. 44, no. 44, pp. 2248-2251, 2019.  
[7] J. Tian, M. Guo, F. Wang, C. Yu, L. Zhang, M. Wang, and L. Hu, "High gain E-band amplification based on the low loss Bi/P co-doped silica fiber," Chinese Optics Letters, vol. 20, no. 10, pp. 100602, 2022.  
[8] Y. Wang, N. K. Thipparapu, D. J. Richardson and J. K. Sahu, "High Gain Bi-Doped Fiber Amplifier Operating in the E-band with a 3-dB Bandwidth of 40nm," 2021 Optical Fiber Communications Conference and Exhibition (OFC), San Francisco, CA, USA, pp. 1-3, 2021.  
[9] P, C, Becker, N. A. Olsson, J. R. Simpson, CA: Erbium-Doped Fiber Amplifiers: Fundamentals and Technology, 1999.  
[10] A. Khegai, Y. Ososkov, S. Firstov, K. Riumkin, S. Alyshev, A. Kharakhordin, E. Firstova, F. Afanasiev, V. Khopin, A. Guryanov, and M. Melkumov, "O-Band Bismuth-Doped Fiber Amplifier with 67 nm Bandwidth," 2020 Optical Fiber Communications Conference and Exhibition (OFC), San Diego, CA, USA, pp. 1-3, 2020.  
[11] Y. Chen, W. Q. Wang, Y. Y. Yang, J. X. Wen, Y. H. Dong, Y. N. Shang, Y. H. Luo, and T. Y. Wang, "Near 0.5 dB gain per unit length in O-band based on a Bi/P co-doped silica fiber via atomic layer deposition," Optics Express, vol. 31, no. 9, pp. 14862-14872, Apr 24, 2023.