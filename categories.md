---
layout: page
title: Posts
permalink: /categories/
---

<div>
{% for category in site.categories %}
  <h2 id="{{ category | first | slugify }}" class="category-title">{{ category | first | replace: "_", " " | strip }}</h2>
  <ul>
    {% for post in category.last %}
      <li><a href="{{ post.url | relative_url }}">{{ post.date | date: "%Y-%m-%d" }} &mdash; {{ post.title }}</a></li>
    {% endfor %}
  </ul>
{% endfor %}
</div>
