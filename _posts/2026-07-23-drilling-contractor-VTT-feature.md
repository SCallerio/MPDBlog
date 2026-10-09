---
layout: post
author: Santiago Callerio
title: "Beyond the Trip Sheet: Next-Generation Virtual Trip Tank (VTT) Monitoring for MPD"
categories: conference_content
published: false
excerpt_separator: <!--more-->
description: "Drilling Contractor video interview to Santiago Callerio, PhD student of The University of Texas at Austin, where he talks about the Virtual Trip Tank project for improved Managed Pressure Drilling (MPD) well control monitoring (next-gen tripping event detection for MPD operations)"
tags: [tripping, virtual_trip_tank, well_control, monitoring]
# image: {path: "/images/drilling_contractor_interview_expanded_bw.jpg", width: 2000, height: 717, alt: "Santiago Callerio being interviewed by Drilling Contractor"}
# image_position: 50%
# image_caption: 'Santiago Callerio and the enhanced Virtual Trip Tank (VTT) UT Austin research project featured on Drilling Contractor and on the IAPG Houston website'
---
{% include link-card.html
   url="https://drillingcontractor.org/ut-austin-project-targets-next-gen-tripping-event-detection-for-mpd-operations-74857"
   title="UT Austin project targets next-gen tripping event detection for MPD operations"
   site_name="Drilling Contractor"
   image="/images/drillingcontractor-article-callerio_thumb.jpg" %}

{% include youtube-embed.html id="jwrxvjmu9kc" title="DC Video Interview: Santiago Callerio, UT Austin" %}

{% include link-card.html
   url="https://iapg-houston.org/articles/technical-article-by-iapg-houston-scholar-beyond-the-trip-sheet-the-next-generation-of-automated-tripping-well-control-surveillance"
   title="UT Austin project targets next-gen tripping event detection for MPD operations"
   site_name="IAPG Houston"
   image="/images/IAPGH_official_logo.png" %}

*<small class="fig-caption">Santiago Callerio and the enhanced Virtual Trip Tank (VTT) UT Austin research project featured on Drilling Contractor and on the IAPG Houston website.</small>*

*The next-generation VTT combines automated flow calibration, intelligent event detection, and physics-based volume tracking to deliver more reliable deltaflow and displacement measurements—even during tripping operations traditionally monitored with manual trip sheet.*

One of the highlights of 2025 was presenting our work at the **IADC/SPE Managed Pressure Drilling & Underbalanced Operations Conference** in Mexico City, where I presented the paper "[Virtual Trip Tank Auto-Calibration: Next-Generation Tripping Event Detection for Managed Pressure Drilling (MPD) Operations" (SPE-228373-MS)](https://doi.org/10.2118/SPE-228373-MS).
<!--more-->

The paper addresses a longstanding challenge in Managed Pressure Drilling: although MPD systems provide high-quality flow measurements through Coriolis flowmeters, Virtual Trip Tank (VTT) calculations often depend on manually calibrated flow-in estimates. As pump efficiency changes throughout the operation, these assumptions introduce cumulative errors that cause VTT drift, resulting in false alarms, missed events, and reduced confidence during tripping operations.

Our proposed methodology combines:

* Automated rig-state detection;
* Pattern recognition using Symbolic Aggregate Approximation (SAX);
* Real-time flow-in auto-calibration based on mass conservation;
* A physics-based modeled VTT that provides an expected displacement reference;
* Automated tripping tallies and stand fingerprinting for improved kick and loss detection.

Together, these developments significantly improve the accuracy of delta-flow measurements while reducing dependence on manual tripping tallies that continue to be used across many MPD operations.

Following the conference, I had the opportunity to discuss the project with **Drilling Contractor**, where we talked about the motivation behind the research, the practical challenges of conventional VTT systems, and how automated calibration can improve well control surveillance while reducing false alarms and invisible lost time. The interview is available through the conference coverage.

The work was also featured by **IAPG Houston** in the technical article *[Beyond the Trip Sheet: The Next Generation of Automated Tripping Well Control Surveillance](https://iapg-houston.org/articles/technical-article-by-iapg-houston-scholar-beyond-the-trip-sheet-the-next-generation-of-automated-tripping-well-control-surveillance)*, which provides a more detailed overview of the methodology, including the flow-in calibration algorithm, rig-state detection, modeled VTT, automated tripping tally, and the field-validation results.

This project represents one step toward making MPD monitoring more reliable, automated, and interpretable, replacing manual workflows with data-driven surveillance tools that better support well control decision-making.

---
### Resources

* 📄 **Conference paper:** *Virtual Trip Tank Auto-Calibration: Next-Generation Tripping Event Detection for Managed Pressure Drilling (MPD) Operations* (SPE-228373-MS)
* 🎥 **Drilling Contractor interview:** Discussion from the 2025 IADC/SPE MPD Conference in Mexico City.
* 📰 **Technical article:** *Beyond the Trip Sheet: The Next Generation of Automated Tripping Well Control Surveillance* (IAPG Houston).

As the research continues, the next stage focuses on field deployment of the auto-calibrated VTT with real-time AI-assisted kick and loss detection, further advancing automated well control surveillance for MPD operations.
