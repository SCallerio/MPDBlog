---
layout: post
title:  "A python code based Influx Management Envelope (IME)"
date:   2025-01-19 18:58:51 -0600
categories: well_control
---
## Formulae Derivation

$$P_{BH_2}=P_{H_2}+P_{AFL_2}+P_{SBP_2}\ (1)$$

$$P_{H_2}=P_{H_{MW}}+P_{H_K}$$

$$P_{H_2}=\rho_{MW}×g×d_2+\rho_K×g×h_{K_2}$$
$$P_{H_2}=\rho_{MW}×g×(d_{TD}-h_{K_{2}})+\rho_K×g×h_{K_2}$$
$$h_{K_2}=L_2\ \cos (\theta)$$  $$P_{H_2}=\rho_{MW}×g×(d_{TD}-L_2\ \cos (\theta))+\rho_K×g×L_2\ \cos (\theta)$$
$$P_{H_2}=g\ [\rho_{MW}\ d_{TD}+L_2\ \cos(\theta)\ (\rho_K -\rho_{MW})]$$

## Code Development 
First we import the required Python libraries, where `matplotlib.pyplot` is used for generating the plots, and`numpy` to define array operations. `matplotlib.style.use` sets predefined parameters from a style sheet that set the plots appareance.

```python
# Import required libraries
import matplotlib.pyplot as plt
import numpy as np
# Set plot style
import matplotlib.style as style
style.use('tableau-colorblind10')
style.use('seaborn-whitegrid')

colors = plt.rcParams['axes.prop_cycle'].by_key()['color']
```

Based on the available well data, the IME inputs are then defined as follows.

```python
# IME Input Parameters
TD_TVD=21325 #ft - Total Depth TVD
MW=11.2 # ppg - Surface Mud Weight
P_AFL= 600 #psi - Annular Friction Losses at TD
P_SBP=230 # psi - Drilling SBP
ECD= MW+(P_AFL+P_SBP)/(TD_TVD*.052)#11.86   ppg - Drilling ECD at TD
print(f'ECD {ECD:.2f} ppg')
```
```python
[Out:] 'ECD 11.95 ppg'
```

The reservoir or influx pressure is defined with respect to the Drilling ECD with a given Kick Intensity ($$\rho_{KI}$$) value after equation (1):
$$\rho_{BH_{2}}=\rho_{ECD}+\rho_{KI}\ (1)$$
$$P_{BH_{2}}=\rho_{BH_{2}}\ Z_{TD}\ g\ (2)$$

```python
# Influx Pressure Definition
KI=500 #psi - Kick Intensity
P_BH_2=ECD+KI/(TD_TVD*.052)# 12.31 ppg - Reservoir/Kick EMW at TD
P_BH_2_psi=P_BH_2*TD_TVD*.052#13648.235 psi - Reservoir/Kick Pressure at TD
print(f'PP+KI {P_BH_2:.2f} ppg')
print(f'PP+KI {P_BH_2_psi:.0f} psi')
```
```python
[Out:] PP+KI 12.40 ppg
[Out:] PP+KI 13750 psi
```

## MPD Dynamic Well Control
The use of Managed Pressure Drilling (MPD) combined with mass flowmeters (i.e. Coriolis flowmeters) enhances the kick detection capability, reducing both detection time and reaction time ([Bacon et al., 2012](https://doi.org/10.2118/151392-MS)). This is clearly reflected in the resulting Influx Management Envelope (IME) designs, which downsize the MPD manageable kick limit from 25 bbl. down to 15 or 10 bbl. However, the origin or basis for these reference kick volume limits is not explicitly delineated, and is often referred to as the “customary limit” or “agreed volume limit” ([Gabaldon et al., 2019](https://doi.org/10.2118/194537-MS)).
MPD influx management and dynamic well control offer tangible benefits to limit gas influx volumes and facilitate influx circulation: 
   - Since pressure is actively applied from surface to suppress the influx, it eliminates the after-flow effect observed in conventional well control, even in the assisted shut-in case. Thus, kick size is reduced.
   - In deep-water (DW) wells, the choke line friction can be eliminated and the reduction in mud column hydrostatic is reduced when the kick is circulated rather than the low-capacity the choke line ([Bacon et al. (2016)](https://doi.org/10.2118/179185-MS)).

![Downhole]({{ site.baseurl }}/images/bacon_downhole_volume.svg)

$$(P_{MSWP})$$
$$ x = y^2 $$
