---
layout: post
title:  "MPD Well Control and Kick Tolerance"
date:   2025-01-19 18:58:51 -0600
categories: well_control
---

## MPD Dynamic Well Control
The use of Managed Pressure Drilling (MPD) combined with mass flowmeters (i.e. Coriolis flowmeters) enhances the kick detection capability, reducing both detection time and reaction time ([Bacon et al., 2012](https://doi.org/10.2118/151392-MS)). This is clearly reflected in the resulting Influx Management Envelope (IME) designs, which downsize the MPD manageable kick limit from 25 bbl. down to 15 or 10 bbl. However, the origin or basis for these reference kick volume limits is not explicitly delineated, and is often referred to as the “customary limit” or “agreed volume limit” ([Gabaldon et al., 2019](https://doi.org/10.2118/194537-MS)).
MPD influx management and dynamic well control offer tangible benefits to limit gas influx volumes and facilitate influx circulation: 
   - Since pressure is actively applied from surface to suppress the influx, it eliminates the after-flow effect observed in conventional well control, even in the assisted shut-in case. Thus, kick size is reduced.
   - In deep-water (DW) wells, the choke line friction can be eliminated and the reduction in mud column hydrostatic is reduced when the kick is circulated rather than the low-capacity the choke line ([Bacon et al. (2016)](https://doi.org/10.2118/179185-MS)).

|                                                                                                                                ![Downhole Influx Volume]({{ site.baseurl }}/images/bacon_downhole_volume.svg "Downhole Influx Volume")                                                                                                                                 |
|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| *<small>Figure 1.1: Downhole influx volume for a 10 bbl. surface pit gain ([Bacon et al. (2016)](https://doi.org/10.2118/179185-MS)). The purple line (10 bbl – Conventional legend) represents the conventional shut-in method for a 10 bbl. kick, which displays the effect of after-flow with the downhole influx volume increasing after the well shut-in at 30 minutes.</small>* |


## MPD Kick Tolerance

The increasing field adoption of MPD Dynamic Well Control ([Bacon et al., 2012](https://doi.org/10.2118/151392-MS); [Davoudi et al., 2011](https://doi.org/10.2118/128424-PA)), pushed the growing need to update the MPD Operations Matrix ([API, 2023](https://store.accuristech.com/standards/api-rp-92m?product_id=1993607&srsltid=AfmBOoqx9RuyDzS0klhgXnTM7_Yt_rPLvs2jYys1q6N2yfpFNJ_26BJf)) operating limits to consider additional fields for MPD Dynamic Well Control. This addressed the need of identifying a priori which well influxes could be safely circulated using the MPD equipment.

>e.g. since surface pressures increase as the influx is circulated to surface, the drilling crew needs to know a priori based on the initial pressure and volume conditions, if that influx circulation will exceed surface equipment limits once it reaches the surface - otherwise, secondary well control needs to be engaged

The development of an MPD Well Control Matrix, the predecessor of the Influx Management Envelope (IME), was first proposed by [Rajabi et al. (2014)](https://doi.org/10.2118/170684-MS), later continued by [Bacon et al. (2015)](https://doi.org/10.2118/173174-MS); [Hollman et al. (2015)](https://doi.org/10.2118/173094-MS). This requires first identifying the pressure and flow limits imposed by the surface equipment and downhole environment, as detailed in [[#Table 1.1 MPD Dynamic Well Control Limits]] [^1]. 

###### Table 1.1: MPD Dynamic Well Control Limits

| Classification                 | Parameter                                                                                                                                                                                                                                                   |
| ------------------------------ |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Surface Equipment Pressures    | RCD Max. Static Working Pressure $$(P_{MSWP})$$<br><br>RCD Max. Dynamic Working Pressure ($P_{MDWP}$)<br><br>MPD PRVs Setting ($P_{P RV}$)<br><br>Riser Max. Working Pressure ($P_{RMWP}$)<br><br>Max. Stand Pipe Pressure ($P_{SPP_{max}}$) |
| Surface Equipment Flowrate     | MGS Liquid Handling Capacity ($Q_{LMGS_{max}}$)<br><br>MGS Gas Handling Capacity ($Q_{gMGS_{max}}$)                                                                                                                                                         |
| Downhole Environment Pressures | Formation Integrity Limit ($\rho_{LOT},\ \rho_{FIT}$)<br><br>Max. Allowable Annular Surface Pressure ($P_{MAASP}$ )                                                                                                                                         |

[^1]: The Riser Max. Working Pressure (\(P_{RMWP})\ is based on marine riser max. burst pressure, and differential pressure evaluated at Lower Marine Riser Package (LMRP). The Riser Max. Working Pressure ($P_{RMWP}$) is determined after Equations 1.1 and 1.2, where $P_{PRV_{Riser}}$ corresponds to the marine riser PRV setting. $P_{RMWP_1} = P_{RMWP_{lim}} − (\rho_{SMW} + \Delta{\rho_{PT_{mudline}}} − \rho_{seawater})\ Z_{mudline}\ g$ (1.1), $P_{RMWP} = min(P_{RMWP_1}, P_{PRV_{Riser}})$ (1.2)

The second step is to model and identify the kicks that can be safely circulated out of the well without exceeding any of the pre-defined limits ([[#Table 1.1 MPD Dynamic Well Control Limits]]) using the MPD dynamic well control procedure. Each kick is identified as a combination of kick volume (reflected as the initial pit gain in Figure 1.1) and kick intensity (reflected as the initial surface back pressure in Figure 1.1, required to suppress the kick). 

|                                                                                                                                                                                                                           ![MPD Dynamic Well Control]({{ site.baseurl }}/images/bacon_2016_RDFM_MPD_Dynamic_Well_Control_for_IME.png)                                                                                                                                                                                                                           |
|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| *<small>Figure 1.2: MPD Dynamic Well Control results, using a reduced drft-flux model (RDFM) ([Gu et al. (2022)](https://doi.org/10.1016/j.applthermaleng.2022.118077)) for the [Bacon et al. (2016)](https://doi.org/10.2118/179185-MS) Standard Well Case. The upper plot shows the surface back pressure results, highlighting the Initial SBP value, when the kick is controlled, and the Max. SBP value, when the kick is at surface. The lower plot shows the Pit Volume values, highlighting the Initial Pit Gain, when the kick is controlled.</small>* |

The kick combinations that reach the limit values are then registered in an Initial Surface Back Pressure (also called Post-Influx Surface Pressure) versus Initial Influx Volume plot (Figure 1.2):

- Combinations that exceed the surface equipment limits are registered under the “Equipment Limit” curve
- Combinations that exceed the downhole environment limits are registered under the “Weak Point Limit” curve
- The yellow area represents the influx combinations that can be safely circulated out of the well
- The red area represents the influx combinations that cannot be safely circulated out of the well, since they exceed either the equipment or weak point limit

|                                                                                                                                                               ![Single-Bubble IME]({{ site.baseurl }}/images/IME_SB.svg)                                                                                                                                                               |
|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| *<small>Figure 1.3: MPD Influx Management Envelope (IME), built using the Single-Bubble<br>method derived by [Culen et al. (2016)](https://doi.org/10.2118/179191-MS). The equipment limit curve represents the<br>kick combinations that exceed surface equipment limits, the weak point limit curve<br>represents the combinations that exceed downhole environment limits.</small>* |


This plot was later called the “Influx Management Envelope (IME)” ([Culen et al., 2016](https://doi.org/10.2118/179191-MS); [API, 2023](https://store.accuristech.com/standards/api-rp-92m?product_id=1993607&srsltid=AfmBOoqx9RuyDzS0klhgXnTM7_Yt_rPLvs2jYys1q6N2yfpFNJ_26BJf)), used as additional guidance for MPD dynamic well control. Kick events are regularly modeled using transient multi-phase hydraulic models, however, [Culen et al. (2016)](https://doi.org/10.2118/179191-MS)introduced a method to analytically derive the plot using Single-Bubble formulas (i.e., the gas fraction $\alpha_g$ is equal to 1) and the Ideal-Gas Law. This was later refined by [Berg et al. (2020)](https://doi.org/10.2118/200510-MS) who coupled the Peng-Robinson ([Peng and Robinson, 1976](https://doi.org/10.1021/i160057a011)) and the Soave-Redlich-Kwong ([Soave, 1972](https://doi.org/10.1016/0009-2509(72)80096-4)) equations of state to evaluate gas conditions, still using the Single-Bubble model. Furthermore, [Patil et al. (2018)](https://doi.org/10.2118/189995-MS) later introduced additional considerations, as the need to satisfy the requirement to perform an MPD assisted shut-in during the kick circulation, and considering the maximum stand pipe pressures the rig can handle. The analytical derivation of an IME together with a Python tool for IME development is described in [[IME_Analytical_Development]].

Altogether, this methodology encompasses the framework for MPD Dynamic Influx Control during operational planning and execution, and the definition of MPD Kick Tolerance.

## References

API. *API RP 92M - Managed Pressure Drilling Operations with Surface Backpressure*. American Petroleum Institute, 1st, addendum 1 edition, 4 2023.

W. Bacon. An improved dynamic well control response to a gas influx in managed pressure drilling operations. In *IADC/SPE Drilling Conference and Exhibition*, number SPE-151392-MS, 3 2012. doi: https://doi.org/10.2118/151392-MS.

W. Bacon, C. Sugden, and O. Gabaldon. From influx management to well control; revisiting the mpd operations matrix. In *SPE/IADC Drilling Conference and Exhibition*, number SPE/IADC-173174-MS, 3 2015. doi: https://doi.org/10.2118/173174-MS.

W. Bacon, C. Sugden, P. Brand, O. Gabaldon, and M. Culen. Mpd dynamic influx control mitigates conventional well control pitfalls. In *SPE/IADC Managed Pressure Drilling and Underbalanced Operations Conference and Exhibition*, number SPE/IADC-179185-MS. Society of Petroleum Engineers, 4 2016. doi: https://doi.org/10.2118/179185-MS.

C. Berg, W. Bacon, T. Rinde, L. Solli, G. A. Evjen, and M. Clen. The influx management envelope, sensitivity of model choice. In *SPE/IADC Managed Pressure Drilling and Underbalanced Operations Conference and Exhibition*, number SPE/IADC-200510-MS, 4 2020. doi: https://doi.org/10.2118/200510-MS.

M. S. Culen, P. R. Brand, W. Bacon, and O. R. Gabaldon. Evolution of the mpd operations matrix: The influx management envelope. In *SPE/IADC Managed Pressure Drilling and Underbalanced Operations Conference and Exhibition*, number SPE/IADC-179191-MS, 4 2016. doi: https://doi.org/10.2118/179191-MS.

M. Davoudi, J. R. Smith, B. M. Patel, and J. E. Chirinos. Evaluation of alternative initial responses to kicks taken during managed-pressure drilling. *SPE Drilling and Completion*, 26(SPE-128424-PA):169–181, 5 2011. ISSN 10646671. doi: https://doi.org/10.2118/128424-PA.

Q. Gu, A. H. Fallah, A. Ambrus, T. Feng, D. Chen, P. Ashok, and E. van Oort. Computationally efficient simulation of non-isothermal two-phase flow during well construction using a new reduced drift-flux model. *Applied Thermal Engineering*, 206, 2022. ISSN 13594311. doi: https://doi.org/10.1016/j.applthermaleng.2022.118077.

L. Hollman, I. Haq, C. Christenson, T. P. D. Silva, M. Idris, B. Fayed, N. Thorn, W. Geldof, and B. G. Egypt. Developing a mpd operation matrix-case history. In *SPE/IADC Drilling Conference and Exhibition*, number SPE/IADC-173094- MS, 3 2015. doi: https://doi.org/10.2118/173094-MS.

H. Patil, T. L. Ponder, C. Retired, M. Arnone, D. Hannegan, and W. Retired. Advancing the mpd influx management envelope ime: A comprehensive approach to assess the factors that affect the shape of the ime. In *SPE/IADC Managed Pressure Drilling Underbalanced Operations Conference Exhibition*, number SPE/IADC-189995-MS, 4 2018b. doi: https://doi.org/10.2118/189995-MS. D. 

Peng and D. B. Robinson. A new two-constant equation of state. *Industrial Engineering Chemistry Fundamentals*, 11:1469, 2 1976. doi: https://doi.org/10.1021/i160057a011.

M. M. Rajabi, D. Hannegan, and D. Moore. The mpd well control matrix: What is actually happening. In *SPE Annual Technical Conference and Exhibition*, number SPE-170684-MS, 10 2014. doi: https://doi.org/10.2118/170684-MS.

G. Soave. Equilibrium constants from a modified redlich-kwong equation of state. *Chemical Engineering Science*, 27:1197–1203, 6 1972. ISSN 0009-2509. doi: https://doi.org/10.1016/0009-2509(72)80096-4.

You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run `jekyll serve`, which launches a web server and auto-regenerates your site when a file is updated.

Jekyll requires blog post files to be named according to the following format:

`YEAR-MONTH-DAY-title.MARKUP`

Where `YEAR` is a four-digit number, `MONTH` and `DAY` are both two-digit numbers, and `MARKUP` is the file extension representing the format used in the file. After that, include the necessary front matter. Take a look at the source for this post to get an idea about how it works.

Jekyll also offers powerful support for code snippets:

{% highlight ruby %}
def print_hi(name)
  puts "Hi, #{name}"
end
print_hi('Tom')
#=> prints 'Hi, Tom' to STDOUT.
{% endhighlight %}

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: https://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/
