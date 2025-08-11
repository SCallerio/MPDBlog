---
layout: post
title:  "Managed Pressure Tripping on extended-reach (ERD) wells"
date:   2025-02-10 21:00:00 -0600
author: Santiago Callerio, Carlos Sanguinetti
categories: Tripping
tags: Tripping
published: false
excerpt_separator: <!--more-->
---
This work focuses on planning and execution of Managed Pressure Tripping operations in  high-pressure extended reach (ERD) wells in Argentina’s Vaca Muerta play. Increased complexity is presented by over-pressurized naturally fractured shales in the Quintuco-Vaca Muerta system. Managed Pressure Drilling (MPD) with hydrostatically underbalanced muds has proven effective in managing pore pressure and mud loss risk, but tripping can be quite challenging. The paper details a new, field-proven tripping methodology.
<!--more-->
## Anchor point and kill depth selection
- Show ESD at Shoe change with kill depth
- Show required volume and time for rollover
- Show tripping time

![esd_vs_rollover_depth]({{ site.baseurl }}/images/esd_vs_rollover_depth.png "ECD vs. Rollover Depth")
*<small>ECD vs. Rollover Depth</small>*

## Swab/Surge - where's our anchor depth?
- Useful S&S models
	- [Crespo et al. (2012), Surge-and-Swab Pressure Predictions for Yield-Power-Law Drilling Fluids, SPE-138938-PA](https://doi.org/10.2118/138938-PA)
	- [Mitchell, 1988, Dynamic Surge/Swab Pressure Predictions, SPE-16156-PA](https://doi.org/10.2118/16156-PA)
	- [Burkhardt, 1961, Wellbore Pressure Surges Produced by Pipe Movement, SPE-1546-G-PA](https://doi.org/10.2118/1546-G-PA)

- Swab Speed and Anchor Depth
![swab_speed_anchor_depth]({{ site.baseurl }}/images/swab_speed_anchor_depth.png "Swab speed and anchor point")
*<small>Swab speed and anchor point</small>*
- Temperature effect on static mud
![temp_effect_static_mud]({{ site.baseurl }}/images/temp_effect_static_mud.png "Temperature effect on static mud")
*<small>Temperature effect on static mud</small>*

## Pill design - do we include kill mud to optimize?
- Types of pills, and combinations to optimize rollover time
![trip_pill_configuration]({{ site.baseurl }}/images/trip_pill_configuration.png "Tripping slug configuration")
*<small>Tripping slug configuration</small>*

## Kill Top - when is it feasible?
- Show main equations
- Describe control points to ensure correcto execution
### Kill Top schedule in Python
