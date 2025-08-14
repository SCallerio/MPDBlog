---
layout: post
title:  "A Python based Influx Management Envelope (IME) generator"
date:   2025-01-19 18:58:51 -0600
author: Santiago Callerio
categories: well_control
tags: python IME
excerpt_separator: <!--more-->
published: false
---
![Influx Management Envelope]({{ site.baseurl }}/images/IME_SB.svg "Influx Management Envelope")<br>
*<small>Influx Management Envelope (IME)</small>*

Developing an Influx Management Envelope (IME) traditionally requires running several instances of a transient multi-phase model (e.g. a drift-flux model ([Gu et al. (2022)](https://doi.org/10.1016/j.applthermaleng.2022.118077)), Drillbench, etc.) to determine which influx combinations surpass the pre-established limits for pressure and flowrate. This can be a time intensive process that requires fine tuning and repetition. An analytical IME, although it disregards part of the multi-phase dynamics such as gas distribution and phase mixture (i.e. using single-bubble equations where $$\alpha_g = 1$$), and gas dilution, it represents an accurate first approximation to an IME and a fast-drafting tool in case an IME needs to be updated.

This article will dive into the development of an IME generator tool in Python, using single-bubble equations and the aid of a gas equation of state to estimate the gas phase parameters in the well.
 <!--more-->
## IME Analytical Development
The equations required to compute an IME are devived below, based on the work by [Culen et al. (2016)](https://doi.org/10.2118/179191-MS) and [Berg et al. (2020)](https://doi.org/10.2118/200510-MS). Essentially, what we need to determine is which downhole influx combinations will exceed the established surface limits for pressure and flowrate, during the circulation process to surface. For this, we characterize every influx combination a pair of influx volume ($$V_K$$) and kick intensity ($$KI$$) or initial surface back pressure required to supress the kick ($$P_{SBP_{2}}$$).

The post-influx bottom-hole pressure ($$P_{BH_{2}}$$), once the influx is suppressed (i.e. $$P_{BH} = P_{Reservoir}$$), is defined after [equation 1](#equation-1-p-bh2).<br>
<a name="equation-1-p-bh2"></a>
$$P_{BH_2}=P_{H_2}+P_{AFL_2}+P_{SBP_2}\ (1)$$<br>
$$P_{H_2}=P_{H_{MW}}+P_{H_K}$$<br>

| <div style="text-align:center"><a name="wellbore-reference"></a><img src="{{ site.baseurl }}/images/wellbore_reference.png" alt="Wellbore Reference" width="200"/></div>        |
|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| *<small>Figure 1.1: Wellbore reference, showing the defined references for influx height ($$h_{K_2}$$), mud column height ($$d_2$$), and total depth TVD ($$d_{TD}$$).</small>* |

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
TD_TVD = 21325 #ft - Total Depth TVD
MW = 11.2 # ppg - Surface Mud Weight
P_AFL = 600 #psi - Annular Friction Losses at TD
P_SBP = 230 # psi - Drilling SBP
ECD = MW+(P_AFL+P_SBP)/(TD_TVD*.052)# ppg - Drilling ECD at TD
print(f'ECD {ECD:.2f} ppg')
```
```python
[Out:] 'ECD 11.95 ppg'
```

The reservoir or influx pressure is defined with respect to the Drilling ECD with a given Kick Intensity ($$\rho_{KI}$$) value after equation (1):<br>
$$\rho_{BH_{2}}=\rho_{ECD}+\rho_{KI}\ (1)$$<br>
$$P_{BH_{2}}=\rho_{BH_{2}}\ Z_{TD}\ g\ (2)$$<br>

```python
# Influx Pressure Definition
KI = 500 #psi - Kick Intensity
P_BH_2 = ECD+KI/(TD_TVD*.052)# ppg - Reservoir/Kick EMW at TD
P_BH_2_psi = P_BH_2*TD_TVD*.052# psi - Reservoir/Kick Pressure at TD
print(f'PP+KI {P_BH_2:.2f} ppg')
print(f'PP+KI {P_BH_2_psi:.0f} psi')
```
```python
[Out:] 'PP+KI 12.40 ppg'
[Out:] 'PP+KI 13750 psi'
```
### Geometric Inputs
Next, a function to compute the tubular squared diameter difference, and another function to compute the tubular capacity are defined. This will provide required inputs to compute $$V_2$$ and $$P_{SBP_{2}}$$.

The functions docstrings are defined as per [PEP-8](https://peps.python.org/pep-0008/), [PEP-257](https://peps.python.org/pep-0257/) and [PEP 287](https://peps.python.org/pep-0287/).

```python
def d_func(OD: float, ID: float):
    """
    Returns squared diameter difference.
    :param OD: Outside Diameter [inches]
    :type OD: float
    :param ID: Inside Diameter [inches]
    :type ID: float
    :return: squared diameter difference [sq. inches]
    :rtype: float
    """
  
    d = (OD ** 2) - (ID ** 2)
    return d


def cap_func(OD: float, ID: float):
    """
    Returns tubular capacity.
    :param OD: Outside Diameter [inches]
    :type OD: float
    :param ID: Inside Diameter [inches]
    :type ID: float
    :return: Tubular capacity [bbl/ft]
    :rtype: float
    """
  
    d = d_func(OD, ID)
    cap = d / 1029.4
    return cap
```

Then the geometric inputs are computed, using the previously defined functions.

```python
# Geometry Input
OD3=10.711 # in - Annular ID at Surface
ID3=5.875  # in - Drill Pipe OD at Surface
D3=d_func(OD3,ID3)
print(f' D3 {D3:.2f} in2')

OD2=8.5 # in - Annular ID at TD
ID2=6.75 # in - Drill Pipe OD at TD
D2=d_func(OD2,ID2)
print(f' D2 {D2:.2f} in2')
```
```python
[Out:] 'D3 80.21 in2'
[Out:] 'D2 26.69 in2'
```

## MPD Dynamic Well Control
The use of Managed Pressure Drilling (MPD) combined with mass flowmeters (i.e. Coriolis flowmeters) enhances the kick detection capability, reducing both detection time and reaction time ([Bacon et al., 2012](https://doi.org/10.2118/151392-MS)). This is clearly reflected in the resulting Influx Management Envelope (IME) designs, which downsize the MPD manageable kick limit from 25 bbl. down to 15 or 10 bbl. However, the origin or basis for these reference kick volume limits is not explicitly delineated, and is often referred to as the “customary limit” or “agreed volume limit” ([Gabaldon et al., 2019](https://doi.org/10.2118/194537-MS)).
MPD influx management and dynamic well control offer tangible benefits to limit gas influx volumes and facilitate influx circulation: 
   - Since pressure is actively applied from surface to suppress the influx, it eliminates the after-flow effect observed in conventional well control, even in the assisted shut-in case. Thus, kick size is reduced.
   - In deep-water (DW) wells, the choke line friction can be eliminated and the reduction in mud column hydrostatic is reduced when the kick is circulated rather than the low-capacity the choke line ([Bacon et al. (2016)](https://doi.org/10.2118/179185-MS)).

![Downhole]({{ site.baseurl }}/images/bacon_downhole_volume.svg)

$$(P_{MSWP})$$
$$ x = y^2 $$


<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-Z5C5SK4PXR"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-Z5C5SK4PXR');
</script>
