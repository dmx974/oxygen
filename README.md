OxygenJS
========

OxygenJS is a High Performance JavaScript MicroTemplating with Jinja like syntax.
This library is just a proof of concept, use it at your own risk ;-)

See demo.html for more information.

Why OxygenJS?
-------------

- It's small (5.3 Kb minified, 2214 bytes gzip)
- It's fast (almost no branch, no parser, no lexer, only use split, join and replace)

Usage
-----
Start by creating a template in your HTML code, like this:

	<script type="html/template" id="users">
		<ul>
		{% for i in users %}
			<li><a href="{{ users[i].url }}">{{ users[i].name|capitalize }}</a></li>
			{% if users[i].name == "John Doz" %}
				<div>{{ users[i].name|capitalize|replace("doz", "Doe") }}</div>
			{% else %}
				<div>no no no</div>
			{% endif %}
		{% endfor %}
		</ul>
	</script>

Then, to feed your template with data, just do the following:

	var data = {
		users : [
			{
				url : 'http://www.google.fr',
				name : 'John Doz'
			},
			{
				url : "http://www.yahoo.fr",
				name : "Stephen's Lawson"
			}
		]
	};

	document.getElementById("result").innerHTML = O2("users", data);


How to add custom filters?
--------------------------

	O2.filters.caterizer = function(obj, number){
		return "I'm the father of " + number + " cats all named " + obj;
	};

And now, in the template side, your brand new filter is available:

	{{ "Alfred"|caterizer(6) }}

Enjoy!
