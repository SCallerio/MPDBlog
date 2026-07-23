---
layout: page
title: My Awesome Table
permalink: /table_layout/
---
<table>
  {% for row in site.data.dc_archive_posts %}
    {% if forloop.first %}
    <tr>
      {% for pair in row %}
        <th>{{ pair[0] }}</th>
      {% endfor %}
    </tr>
    {% endif %}

    {% tablerow pair in row %}
      {{ pair[1] }}
    {% endtablerow %}
  {% endfor %}
</table>
[//]: #
[//]: #
[//]: #
