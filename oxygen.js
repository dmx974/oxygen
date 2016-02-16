// +--------------------------------------------------------------------+ \\
// ¦ OxygenJS 0.2.0 - High Performance JavaScript MicroTemplating       ¦ \\
// +--------------------------------------------------------------------+ \\
// ¦ Copyright © 2016 Vincent Fontaine                                  ¦ \\
// +---------+----------------------------------------------------------+ \\
// ¦ CREDITS |                                                          ¦ \\
// +---------+                                                          ¦ \\
// ¦   * Kru for the reduce tip                                         ¦ \\
// ¦   * NunJucks for the Jinja like filters                            ¦ \\
// ¦   * John Resig for his excellent work (http://ejohn.org/)          ¦ \\
// +--------------------------------------------------------------------+ \\

(function(){
	var c = {},
		d = document,
		opts = Object.prototype.toString,
		html = function(id){
			return d.getElementById(id) ? d.getElementById(id).innerHTML : '';
		};

	var safeString = function(val){
		if (typeof val != 'string'){ return val; }
		this.toString = function(){ return val; };
		this.length = val.length;

		var methods = [
			'charAt', 'charCodeAt', 'concat', 'contains', 'endsWith',
			'fromCharCode', 'indexOf', 'lastIndexOf', 'length', 'localeCompare',
			'match', 'quote', 'replace', 'search', 'slice', 'split',
			'startsWith', 'substr', 'substring', 'toLocaleLowerCase',
			'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'trim',
			'trimLeft', 'trimRight'
		];

		for (var i = 0; i < methods.length; i++) {
			this[methods[i]] = proxyStr(val[methods[i]]);
		}
	};

	var safeCopy = function(dest, target){
		if (dest instanceof safeString) return new safeString(target);
		return target.toString();
	};

	var escapeMap = {
		'&' : '&amp;',
		'"' : '&quot;',
		"'" : '&#39;',
		"<" : '&lt;',
		">" : '&gt;'
	};

	var lib = {
		escape : function(val){
			return val.replace(/[&"'<>]/g, function(ch){
				return escapeMap[ch];
			});
		},

		isFunction : function(obj){
			return opts.call(obj) == '[object Function]';
		},

		isArray : Array.isArray || function(obj){
			return opts.call(obj) == '[object Array]';
		},

		isString : function(obj){
			return opts.call(obj) == '[object String]';
		},

		isObject : function(obj){
			return obj === Object(obj);
		},

		repeat : function(c, n){
			var str = '';
			for (var i=0; i<n; i++) str += c;
			return str;
		},

		map : function(obj, func){
			var results = [];
			if (obj == null) return results;

			if(Array.prototype.map && obj.map === Array.prototype.map){
				return obj.map(func);
			}

			for (var i=0; i<obj.length; i++){
				results[results.length] = func(obj[i], i);
			}

			if (obj.length === +obj.length){
				results.length = obj.length;
			}

			return results;
		}		
	};

	var filter = function(match, p1){
		var r = p1.split('|').reduce(function(txt, f){
			var par = (f.indexOf("(") + 1) || f.length,
				pl = (par == f.length);

			return "O2.filters." + f.substring(0, par)
				+ (pl ? "(" : "")
				+ txt
				+ (pl ? ")" : ", ") + f.substring(par);
			});

		return "', " + r + ", '";
	};

	var normalize = function(value, defaultValue){
		return (value === null || value === undefined || value === false) ? defaultValue : value;
	};

	this.O2 = function tmpl(id, data){
		var z = !/\W/.test(id) ? c[id] = c[id] || O2(html(id)) : new Function("obj",
			"var p=[];with(obj){p.push('" +
			id
			.replace(/{%[ ]*for ([$a-zA-Z_]+) in ([$a-zA-Z_]+([.][$a-zA-Z_]+)*)[ ]*%}/g, "{% for (var $1=0; $1<$2.length; $1++) { %}")
			.replace(/{%[ ]*if (.+[^ ]{1})[ ]*%}/g, '{% if ($1) { %}')
			.replace(/{%[ ]*end[if|for]*[ ]*%}/g, '{% } %}')
			.replace(/{%[ ]*else[ ]*%}/g, '{% }else{ %}')
			.replace(/[\r\t\n]/g, " ")
			.split("{%").join("');")
			.split("%}").join("p.push('")
			.split("\r").join("\\'")
			.replace(/{{2}[ ]*([^{}, ]*[^{}]*[^{}, ]+)[ ]*}{2}/g, filter)
			+ "');}return p.join('');"
		);
		return data ? z(data) : z;
	};

	this.O2.filters = {
		abs : function(n){
			return Math.abs(n);
		},

		batch : function(arr, linecount, fill_with){
			var res = [],
				tmp = [];

			for (var i=0; i<arr.length; i++){
				if (i % linecount === 0 && tmp.length){
					res.push(tmp);
					tmp = [];
				}
				tmp.push(arr[i]);
			}

			if (tmp.length) {
				if (fill_with) {
					for(var i=tmp.length; i<linecount; i++) {
						tmp.push(fill_with);
					}
				}
				res.push(tmp);
			}
			return res;
		},

		capitalize : function(str){
			str = normalize(str, '');
			var ret = str.toLowerCase();
			return safeCopy(str, ret.charAt(0).toUpperCase() + ret.slice(1));
		},

		center : function(str, width){
			str = normalize(str, '');
			width = width || 80;

			if (str.length >= width) {
				return str;
			}

			var spaces = width - str.length,
				pre = lib.repeat(" ", spaces/2 - spaces % 2),
				post = lib.repeat(" ", spaces/2);

			return safeCopy(str, pre + str + post);
		},

		"default" : function(val, def, bool){
			if (bool) {
				return val ? val : def;
			} else {
				return (val !== undefined) ? val : def;
			}
		},

		dictsort : function(val, case_sensitive, by){
			if (!lib.isObject(val)) {
				throw new ("dictsort filter: val must be an object");
			}

			var array = [];
			for (var k in val) {
				array.push([k,val[k]]);
			}

			var si;
			if (by === undefined || by === "key") {
				si = 0;
			} else if (by === "value") {
				si = 1;
			} else {
				throw new ("dictsort filter: You can only sort by either key or value");
			}

			array.sort(function(t1, t2){ 
				var a = t1[si];
				var b = t2[si];

				if (!case_sensitive) {
					if (lib.isString(a)) {
						a = a.toUpperCase();
					}
					if (lib.isString(b)) {
						b = b.toUpperCase();
					}
				}

				return a > b ? 1 : (a === b ? 0 : -1);
			});

			return array;
		},

		dump : function(obj){
			return JSON.stringify(obj);
		},
	
		escape : function(str){
			if (typeof str == 'string' || str instanceof safeString){
				return lib.escape(str);
			}
			return str;
		},

		safe : function(str){
			return new safeString(str);
		},

		first : function(arr){
			return arr[0];
		},

		groupby : function(obj, val){
			var result = {},
				iterator = lib.isFunction(val) ? val : function(obj){
					return obj[val];
				};

			for (var i=0; i<obj.length; i++){
				var value = obj[i],
					key = iterator(value, i);
				(result[key] || (result[key] = [])).push(value);
			}
			return result;
		},

		indent : function(str, width, indentfirst){
			str = normalize(str, '');
			if (str === '') return '';

			width = width || 4;
			var res = '',
				lines = str.split('\n'),
				sp = lib.repeat(' ', width);

			for (var i=0; i<lines.length; i++) {
				if (i === 0 && !indentfirst) {
					res += lines[i] + '\n';
				} else {
					res += sp + lines[i] + '\n';
				}
			}

			return safeCopy(str, res);
		},

		join : function(arr, del, attr){
			del = del || '';

			if (attr){
				arr = lib.map(arr, function(v){
					return v[attr];
				});
			}

			return arr.join(del);
		},

		last : function(arr){
			return arr[arr.length-1];
		},

		length : function(arr){
			var value = normalize(val, '');
			return value !== undefined ? value.length : 0;
		},

		list : function(val){
			if (lib.isString(val)) {
				return val.split('');
			}
			else if (lib.isObject(val)) {
				var keys = [];

				if (Object.keys) {
					keys = Object.keys(val);
				} else {
					for (var k in val) {
						keys.push(k);
					}
				}

				return lib.map(keys, function(k){
					return {
						key: k,
						value: val[k]
					};
				});
			}
			else if (lib.isArray(val)) {
				return val;
			}
			else {
				throw new ("list filter: type not iterable");
			}
		},

		lower : function(str){
			str = normalize(str, '');
			return str.toLowerCase();
		},

		random : function(arr){
			return arr[Math.floor(Math.random() * arr.length)];
		},

		rejectattr : function(arr, attr){
			return arr.filter(function(item){
				return !item[attr];
			});
		},

		selectattr : function(arr, attr){
			return arr.filter(function(item){
				return !!item[attr];
			});
		},

		replace : function(str, old, new_, maxCount){
			var res = '';  // Output
			var originalStr = str;

			if (old instanceof RegExp) {
				return str.replace(old, new_);
			}

			if (typeof maxCount === 'undefined'){
				maxCount = -1;
			}

			// Cast Numbers in the search term to string
			if (typeof old === 'number'){
				old = old + '';
			} else if (typeof old !== 'string') {
				return str;
			}

			// Cast numbers in the replacement to string
			if (typeof str === 'number'){
				str = str + '';
			}

			// If by now, we don't have a string, throw it back
			if (typeof str !== 'string' && !(str instanceof safeString)){
				return str;
			}

			// ShortCircuits
			if (old === '') {
				// Mimic the python behaviour: empty string is replaced
				// by replacement e.g. "abc"|replace("", ".") -> .a.b.c.
				res = new_ + str.split('').join(new_) + new_;
				return safeCopy(str, res);
			}

			var nextIndex = str.indexOf(old);
			// if # of replacements to perform is 0, or the string to does
			// not contain the old value, return the string
			if (maxCount === 0 || nextIndex === -1){
				return str;
			}

			var pos = 0;
			var count = 0; // # of replacements made

			while (nextIndex  > -1 && (maxCount === -1 || count < maxCount)){
				// Grab the next chunk of src string and add it with the
				// replacement, to the result
				res += str.substring(pos, nextIndex) + new_;
				// Increment our pointer in the src string
				pos = nextIndex + old.length;
				count++;
				// See if there are any more replacements to be made
				nextIndex = str.indexOf(old, pos);
			}

			// We've either reached the end, or done the max # of
			// replacements, tack on any remaining string
			if (pos < str.length) {
				res += str.substring(pos);
			}

			return safeCopy(originalStr, res);
		},

		reverse : function(val){
			var arr = lib.map(val, function(v){
				return v;
			});
			arr.reverse();
			return arr;
		},

		round : function(val, precision, method){
			precision = precision || 0;
			var factor = Math.pow(10, precision),
				rounder;

			if (method == 'ceil') {
				rounder = Math.ceil;
			} else if (method == 'floor') {
				rounder = Math.floor;
			} else {
				rounder = Math.round;
			}

			return rounder(val * factor) / factor;
		},

		slice : function(arr, slices, fillWith){
			var sliceLength = Math.floor(arr.length / slices),
				extra = arr.length % slices,
				offset = 0,
				res = [];

			for (var i=0; i<slices; i++){
				var start = offset + i * sliceLength;
				if (i < extra) offset++;

				var end = offset + (i + 1) * sliceLength,
					slice = arr.slice(start, end);

				if (fillWith && i >= extra) slice.push(fillWith);
				res.push(slice);
			}

			return res;
		},

		sort : function(arr, reverse, caseSens, attr){
			arr = lib.map(arr, function(v){
				return v;
			});

			arr.sort(function(a, b){
				var x, y;

				if (attr){
					x = a[attr];
					y = b[attr];
				} else {
					x = a;
					y = b;
				}

				if (!caseSens && lib.isString(x) && lib.isString(y)) {
					x = x.toLowerCase();
					y = y.toLowerCase();
				}
				   
				if (x < y) {
					return reverse ? 1 : -1;
				} else if (x > y) {
					return reverse ? -1: 1;
				} else {
					return 0;
				}
			});

			return arr;
		},

		string : function(obj){
			return safeCopy(obj, obj);
		},

		striptags: function(input, preserve_linebreaks) {
			input = normalize(input, '');
			preserve_linebreaks = preserve_linebreaks || false;
			var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi;
			var trimmedInput = filters.trim(input.replace(tags, ''));
			var res = '';
			if (preserve_linebreaks) {
				res = trimmedInput
				.replace(/^ +| +$/gm, '')
				.replace(/ +/g, ' ')
				.replace(/(\r\n)/g, '\n')
				.replace(/\n\n\n+/g, '\n\n');
			} else {
				res = trimmedInput.replace(/\s+/gi, ' ');
			}
			return safeCopy(input, res);
		},

		title : function(str){
			var words = str.split(' ');
			for(var i = 0; i < words.length; i++) {
				words[i] = this.capitalize(words[i]);
			}
			return safeCopy(str, words.join(' '));
		},

		trim : function(str){
			return safeCopy(str, str.replace(/^\s*|\s*$/g, ''));
		},

		truncate : function(input, length, killwords, end){
			var orig = input;
			length = length || 255;

			if (input.length <= length)
				return input;

			if (killwords) {
				input = input.substring(0, length);
			} else {
				var idx = input.lastIndexOf(' ', length);
				if (idx === -1) {
					idx = length;
				}

				input = input.substring(0, idx);
			}

			input += (end !== undefined && end !== null) ? end : '...';
			return safeCopy(orig, input);
		},

		upper : function(str){
			return str.toUpperCase();
		},

		wordcount : function(str){
			return str.match(/\w+/g).length;
		},

		'float' : function(val, def){
			var res = parseFloat(val);
			return isNaN(res) ? def : res;
		},

		'int' : function(val, def){
			var res = parseInt(val, 10);
			return isNaN(res) ? def : res;
		}
	};
})();