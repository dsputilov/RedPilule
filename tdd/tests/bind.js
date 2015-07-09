/** Bind Test

 document.getElementsByTagName('body')
 в ФФ и ИЕ - HTMLCollection
 в хроме - 	NodeList

 */

var DATATYPES = {
	FUNCTION:			[function() {}, new Function('')],																					//	Функция
	BOOLEAN: 			[true, false],																					//	true, false
	STRING:				['str', '', '2012-01-01', '22',	'mik.e_23@gmail.com', 'http://www.ya.ru:8080?qwe=asd#qwe=23'],
	NUMBER: 			[0, -0, 111, -111, 111.11, -111.11, 1/Number.MAX_VALUE, -1/Number.MAX_VALUE, Number.MAX_VALUE, Number.NEGATIVE_INFINITY],
	ARRAY:				[[1,2,3], new Array(2,3,4,56), [], new Array(33)],
	DATE:				[new Date(0), new Date('qwtyui')],
	HASH:				[{a:2}, {a:{b: true}}, {}, new Object()],
	OBJECT:				[new (function(){}), (function(){return arguments})(1,2,3), (function(){return arguments})(1,2,3), (function(){return arguments})(1,2,3)],
	HTMLELEMENT:		[document.createElement('span')],																					//	Любой хтмл элемент	(nodeType = 1)			https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	HTMLCOLLECTION:		[document.body.children, document.anchors, document.applets, document.forms, document.images, document.links],		//	Live список хтмл элементов (nodeType = 1)	http://alebelcor.github.io/2011/htmlcollections-nodelists/
	DOCUMENTFRAGMENT:	[document.createDocumentFragment()],
	NODE:				[document.createTextNode('hello')],																					//	Любая нода, не являющаяся аттрибутом (nodeType !=2)
	NODELIST:			[document.body.childNodes, document.querySelectorAll('*')],															//	Список нод, не являющимися аттрибутами (nodeType != 2)
	ATTR:				[document.createAttribute('id')],																					//	Аттрибут (nodeType = 2)
	ATTRLIST:			[document.createElement('div').attributes],																			//	Список аттрибутов	(nodeType = 2)
	RANGE:				[document.createRange()],
	NULL:				[null],
	UNDEFINED:			[undefined],
	OTHER:				[new String('qweqweq'), new Number(23), new Boolean(false), new String(''), new String('false'), new String('0')],
	REGEXP:				[/reg/, new RegExp('reg')]
};

DATATYPES.HASH[1].a.c = DATATYPES.HASH[1]; //circular object


/** ENV ===========================================================================*/
TDD.add({
	group:	'ENV',
	name:	'ENV.get()',
	tests:	{
		'get(g.b)'	:function(complete) {
			ENV.g = {b: 'test', c: {d:5}};
			complete(ENV.get("g.b")=="test");
		},
		'get(g.c.d)'	:function(complete) {
			ENV.g = {b: 'test', c: {d:5}};
			complete(ENV.get("g.c.d") === 5);
		}
	}
});

TDD.add({
	group:	'ENV',
	name:	'ENV.get()',
	tests:	{
		'set(s.b.c)'	:function(complete) {
			ENV.set("s.b.c", "hello");
			ENV.set("s.d", 10);
			complete(ENV.s.b.c == "hello");
		},
		'set(s.d)'	:function(complete) {
			ENV.set("s.b.c", "hello");
			ENV.set("s.d", 10);
			complete(ENV.s.d===10);
		}
	}
});

/** =========================================================================== */

TDD.add({
	group:	'bind',
	name:	'Document.createDocumentFragment',
	tests:	{
		'typeof'	:function(complete) {
			var df = document.createDocumentFragment('<div>hello world<span>test</span></div>');
			complete( (df instanceof DocumentFragment) );
		},
		'content': function(complete) {
			var df = document.createDocumentFragment('<div>hello world<span>test</span></div>');
			complete(df.childNodes[0].innerHTML=='hello world<span>test</span>');
		}
	}
});



/** =========================================================================== */
/*Unitest.add({
 group	:'bind',
 name	:'Object.toQueryString()',
 test	:function(checksum) {
 var t={a:5, b:10};
 t = t.toQueryString();
 return t==="a=5&b=10" ? true : false;
 }
 });*/

TDD.add({
	group:	'bind',
	name:	'Object.addPair()',
	tests:	{
		'key': function(complete) {
			var t = {};
			var key = 'key', value = 5;
			t.addPair(key, value);
			complete(t[key] === value);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.forEach()',
	tests:	{
		'Object.forEach': function(complete) {
			var t={x1: 'test1', y1: 'test2', a:undefined, b:10};
			var checksum = 0;
			t.forEach(function(value, id, num) {
				if (t[id] === value) checksum++;
			});
			complete(checksum==4);
		},
		'NodeList.forEach()': function(complete) {
			var checksum = 0;
			var wrap = document.createElement("div");
			wrap.innerHTML = "<div>test1</div>test2<span>test3</span>";
			var t = ['test1', 'test2', 'test3'];
			var childs = wrap.childNodes;

			childs.forEach(function(child, id, num) {
				var value = child.nodeType == 1 ? child.innerHTML : child.nodeValue;
				if (value == t[num] && id==num) checksum++;
			});

			complete(checksum == 3 );
		},
		'HTMLCollection.forEach()': function(complete) {
			var checksum = 0;
			var wrap = document.createElement("div");
			wrap.innerHTML = "<div>test1</div>test2<span>test3</span>";
			var t = ['test1', 'test2', 'test3'];
			var childs = wrap.children;

			childs.forEach(function(child, id, num) {
				wrap.removeChild(child);
			});
			complete(wrap.innerHTML == 'test2');
			complete(false, 'miss');
		},
		'Fragment.forEach()': function(complete) {
			var frag = document.createDocumentFragment();
			var els = ['DIV', 'H1', 'A'];
			for (var i=0; i<3;i++) {
				var elName = els[i];
				var el = document.createElement(elName);
				frag.appendChild(el);
			}
			var checksum=0;
			frag.forEach(function(el, id, num) {
				if (el.tagName == els[id] && id==num) checksum++;
			});
			complete(checksum==3);
		},
		'Fragment.forEach() 2': function(complete) {
			var frag = document.createDocumentFragment();
			var els = ['DIV', 'H1', 'A'];
			for (var i=0; i<3;i++) {
				var elName = els[i];
				var el = document.createElement(elName);
				frag.appendChild(el);
			}
			var checksum=0;
			frag.forEach(function(el, id, num) {
				var sold = document.createElement('span');
				frag.insertBefore(sold, el);
				if (el.tagName == els[id] && id==num) checksum++;
			});
			complete(checksum==3);
		},
		'AttrList.forEach() [NamedNodeMap]': function(complete) {
			var el = document.createElement('a');
			el.setAttribute('href', 'http://fernajs.ru');
			el.setAttribute('width', '777px');
			var attrs = el.attributes;
			var checkout = 0;
			attrs.forEach(function(attr, name) {
				var value = attr.value;
				if (attr instanceof Attr) checkout++;
				if (name == 'href' && value.indexOf('fernajs.ru'!=-1)) checkout++;
				if (name == 'width' && value.indexOf('777'!=-1)) checkout++;
			});
			complete(checkout==4);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.forEachRecursive()',
	tests:	{
		'Object.forEach': function(complete) {
			var checksum, result = true;
			var t = {account: {user: {name:'foo', surname:'bar'}}, balance: {rub: 100000, euro: 900000}};
			var f = function(value, path, key) {
				checksum += path+'='+value;
			};

			checksum = '';
			var paths = t.forEachRecursive(f);
			result = result && (JSON.stringify(paths) == '["account","account.user","account.user.name","account.user.surname","balance","balance.rub","balance.euro"]' && checksum == 'account=[object Object]account.user=[object Object]account.user.name=fooaccount.user.surname=barbalance=[object Object]balance.rub=100000balance.euro=900000');

			checksum = '';
			var paths = t.forEachRecursive(f, {hash: false});
			result = result && (JSON.stringify(paths) == '["account.user.name","account.user.surname","balance.rub","balance.euro"]' && checksum == 'account.user.name=fooaccount.user.surname=barbalance.rub=100000balance.euro=900000');

			complete(result);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.forEachBySelector()',
	tests:	{
		'Object.forEachBySelector': function(complete) {
			var t = {
				l1: {
					x: {
						l3: {
							l4: {
								l5: 1
							}
						},
						l3a: {
							l4: {
								l5: 1
							}
						},
						l3b: {
							l4: 123
						}
					},
					y: {
						l3: {
							l4: {
								l5: 2
							},
							l3a: {
								l5: 2
							}
						}
					},
					z: {
						l3: {
							l4: {
								l5: 3
							}
						}
					}
				}
			};

			var checklist = {
				'l1.*.l3.*': {
					paths:	'["l1.x.l3.l4","l1.y.l3.l4","l1.y.l3.l3a","l1.z.l3.l4"]',
					values:	'{"l5":1}{"l5":2}{"l5":2}{"l5":3}'
				},
				'l1.*.l3': {
					paths:	'["l1.x.l3","l1.y.l3","l1.z.l3"]',
					values:	'{"l4":{"l5":1}}{"l4":{"l5":2},"l3a":{"l5":2}}{"l4":{"l5":3}}'
				},
				'l1.z.**': {
					paths:	'["l1.z.l3","l1.z.l3.l4","l1.z.l3.l4.l5"]',
					values:	'{"l4":{"l5":3}}{"l5":3}3'
				},
				'l1.*.l3.*.l5': {
					paths:	'["l1.x.l3.l4.l5","l1.y.l3.l4.l5","l1.y.l3.l3a.l5","l1.z.l3.l4.l5"]',
					values:	'1223'
				},
				'l1.*.*.l4.l5': {
					paths:	'["l1.x.l3.l4.l5","l1.x.l3a.l4.l5","l1.y.l3.l4.l5","l1.z.l3.l4.l5"]',
					values:	'1123'
				},
				'*': {
					paths:	'["l1"]',
					values:	'{"x":{"l3":{"l4":{"l5":1}},"l3a":{"l4":{"l5":1}},"l3b":{"l4":123}},"y":{"l3":{"l4":{"l5":2},"l3a":{"l5":2}}},"z":{"l3":{"l4":{"l5":3}}}}'
				},
				'**': {
					paths:	'["l1","l1.x","l1.x.l3","l1.x.l3.l4","l1.x.l3.l4.l5","l1.x.l3a","l1.x.l3a.l4","l1.x.l3a.l4.l5","l1.x.l3b","l1.x.l3b.l4","l1.y","l1.y.l3","l1.y.l3.l4","l1.y.l3.l4.l5","l1.y.l3.l3a","l1.y.l3.l3a.l5","l1.z","l1.z.l3","l1.z.l3.l4","l1.z.l3.l4.l5"]',
					values:	'{"x":{"l3":{"l4":{"l5":1}},"l3a":{"l4":{"l5":1}},"l3b":{"l4":123}},"y":{"l3":{"l4":{"l5":2},"l3a":{"l5":2}}},"z":{"l3":{"l4":{"l5":3}}}}{"l3":{"l4":{"l5":1}},"l3a":{"l4":{"l5":1}},"l3b":{"l4":123}}{"l4":{"l5":1}}{"l5":1}1{"l4":{"l5":1}}{"l5":1}1{"l4":123}123{"l3":{"l4":{"l5":2},"l3a":{"l5":2}}}{"l4":{"l5":2},"l3a":{"l5":2}}{"l5":2}2{"l5":2}2{"l3":{"l4":{"l5":3}}}{"l4":{"l5":3}}{"l5":3}3'
				}
			};

			var checklistNoObjects = {
				'l1.*.l3.*': {
					paths:	'[]',
					values:	''
				},
				'l1.*.l3': {
					paths:	'[]',
					values:	''
				},
				'l1.z.**': {
					paths:	'["l1.z.l3.l4.l5"]',
					values:	'3'
				},
				'l1.*.l3.*.l5': {
					paths:	'["l1.x.l3.l4.l5","l1.y.l3.l4.l5","l1.y.l3.l3a.l5","l1.z.l3.l4.l5"]',
					values:	'1223'
				},
				'l1.*.*.l4.l5': {
					paths:	'["l1.x.l3.l4.l5","l1.x.l3a.l4.l5","l1.y.l3.l4.l5","l1.z.l3.l4.l5"]',
					values:	'1123'
				},
				'*': {
					paths:	'[]',
					values:	''
				},
				'**': {
					paths:	'["l1.x.l3.l4.l5","l1.x.l3a.l4.l5","l1.x.l3b.l4","l1.y.l3.l4.l5","l1.y.l3.l3a.l5","l1.z.l3.l4.l5"]',
					values:	'11123223'
				}
			};

			var success = true;
			checklist.forEach(function(expect, selector) {
				var checksum = '', paths = [];
				paths = t.forEachBySelector(selector, function(obj) {
					checksum += JSON.stringify(obj);
				});
				success = success && (checksum == expect.values && JSON.stringify(paths) == expect.paths);
			});

			checklistNoObjects.forEach(function(expect, selector) {
				checksum = '', paths = [];
				paths = t.forEachBySelector(selector, function(obj) {
					checksum += JSON.stringify(obj);
				}, {hash: false});
				success = success && (checksum == expect.values && JSON.stringify(paths) == expect.paths);
				//console.info('qwe1', (checksum == expect.values && JSON.stringify(paths) == expect.paths), selector, '   ','paths:', JSON.stringify(paths), checksum);
			});

			complete(success);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.map()',
	tests:	{
		'Object.map': function(complete) {
			var t={x1: 'test1', y1: 'test2', a:undefined, b:10};
			var checksum = t.map(function(value, id, num) {
				return "foo"+value + "bar";
			});
			checksum = JSON.stringify(checksum);
			complete(checksum=='["footest1bar","footest2bar","fooundefinedbar","foo10bar"]');
		},

		'NodeList.map()': function(complete) {
			var checksum = 0;
			var wrap = document.createElement("div");
			wrap.innerHTML = "<div>test1</div>test2<span>test3</span>";
			var t = ['test1', 'test2', 'test3'];
			var childs = wrap.childNodes;

			checksum = childs.map(function(child, id, num) {
				child.innerHTML = t[num];
				if (num==0) {
					child.parentNode.removeChild(child);
					return notFound;
				}
				return child;
			});
			complete(checksum.length == 2 && checksum[0].innerHTML =='test2' && checksum[1].innerHTML =='test3');
		},

		'HTMLCollection.map()': function(complete) {
			var wrap = document.createElement("div");
			wrap.innerHTML = "<div>test1</div>test2<span>test3</span>";
			var childs = wrap.children;

			var checksum = childs.map(function(child, id, num) {
				var str = child.innerHTML;
				wrap.removeChild(child);
				return str;
			});
			checksum = JSON.stringify(checksum);
			complete(checksum == '["test1","test3"]');
		},

		'Fragment.map()': function(complete) {
			var frag = document.createDocumentFragment();
			var els = ['DIV', 'H1', 'A'];
			for (var i=0; i<3;i++) {
				var elName = els[i];
				var el = document.createElement(elName);
				frag.appendChild(el);
			}
			var checksum = frag.map(function(el, id, num) {
				var sold = document.createElement('span');
				frag.insertBefore(sold, el);
				return el.tagName;
			});
			checksum = JSON.stringify(checksum);
			complete(checksum=='["DIV","H1","A"]');
		},
		'AttrList.map() [NamedNodeMap]': function(complete) {
			var el = document.createElement('a');
			el.setAttribute('href', 'http://fernajs.ru');
			el.setAttribute('width', '777px');
			var attrs = el.attributes;
			var checksum = attrs.map(function(attr, name) {
				el.setAttribute('height', '150px');
				var value = attr.value;
				return value;
			});
			checksum = JSON.stringify(checksum);
			complete(checksum == '["http://fernajs.ru","777px"]');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.setPropertyByPath()',
	tests:	{
		'set': function(complete) {
			var a = {};
			a.setPropertyByPath('b.c.d', 'test');
			complete(a && a.b && a.b.c && a.b.c.d == 'test' );
		},
		'set onclick': function(complete) {
			var a = {};
			a.setPropertyByPath('0.onclick', 'test');
			complete(a && a[0] && a[0].onclick === 'test' );
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.deletePropertyByPath()',
	tests:	{
		'delete': function(complete) {
			var a = {b: {foo: 5, bar:10}};
			a.deletePropertyByPath('b.foo');
			var bstr = JSON.stringify(a);
			complete(bstr == '{"b":{"bar":10}}' );
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.hasPropertyByPath()',
	tests:	{
		'get': function(complete) {
			var results = [];
			var a = {b:{c:{d:'test'}}};
			results.push(a.hasPropertyByPath('b.c.d'));
			results.push(a.hasPropertyByPath('b.c'));
			results.push(a.hasPropertyByPath('x.y'));
			results.push(a.hasPropertyByPath(''));
			results.push(a.hasPropertyByPath(' '));
			complete(JSON.stringify(results) == '[true,true,false,true,false]');
		}
	}
});


TDD.add({
	group:	'bind',
	name:	'Object.getPropertyByPath()',
	tests:	{
		'get': function(complete) {
			var results = [];
			var a = {b:{c:{d:'test'}}};
			results.push(a.getPropertyByPath('b.c.d'));
			results.push(a.getPropertyByPath('b.c'));
			results.push(a.getPropertyByPath('x.y'));
			results.push(a.getPropertyByPath(''));
			results.push(a.getPropertyByPath(' '));
			complete(JSON.stringify(results) == '["test",{"d":"test"},{"notFound":true},{"b":{"c":{"d":"test"}}},{"notFound":true}]');
		}
	}
});


TDD.add({
	group:	'bind',
	name:	'Object.sort()',
	prepare: function() {
		var hash = {
			"11":	{name: 'a', lastname: 'qwert', age: 10},
			"12":	{name: 'aa',lastname: 123, age: 110},
			"13":	{name: 'ab',lastname: 'lnam', age: 0},
			"14":	{name: 'b', lastname: 'lnAm', age: -1},
			"15":	{name: 'c', lastname: 'bLNAMb', age: 12},
			"16":	{name: 'd', lastname: 'b', age: 15},
			"17":	{name: 'e3',lastname: 'B', age: 11}
		};

		var res = [];
		var fn = function(value, key, index) {
			res.push([value, key, index]);
		};
		var success = true;
	},
	tests:	{
		'sort by key': function(complete) {
			var test = {	// общие: limit, offset, sortBy, sortDir
				params: {
					sortBy: 'name:desc',
					limit: 2,
					offset: 2,
					fn: fn
				},
				expect:	'[[{"name":"c","lastname":"bLNAMb","age":12},"15",2],[{"name":"b","lastname":"lnAm","age":-1},"14",3]]7'
			};

			var fn = test.params.fn;
			delete test.params.fn;
			var total = hash.sort(test.params, fn);
			complete( (JSON.stringify(res) + total) == test.expect );
		},

		'except keys': function(complete) {
			var test = {	// тест except keys
				params: {
					fn: fn,
						filters: {
						lastname: 'b'
					},
					exceptKeys:	['11', '17']
				},
				expect:	'[[{"name":"d","lastname":"b","age":15},"16",0]]1'
			};
			var fn = test.params.fn;
			delete test.params.fn;
			var total = hash.sort(test.params, fn);
			complete( (JSON.stringify(res) + total) == test.expect );
		},

		'regexp': function(complete) {
			var test = {	// тест поиска с параметрами регэкспов
				params: {
					fn: fn,
						filters: {
						lastname: {query: 'b', matchCase: false, matchWhole: false}
					}
				},
				expect: '[[{"name":"c","lastname":"bLNAMb","age":12},"15",0],[{"name":"d","lastname":"b","age":15},"16",1],[{"name":"e3","lastname":"B","age":11},"17",2]]3'
			};
			var fn = test.params.fn;
			delete test.params.fn;
			var total = hash.sort(test.params, fn);
			complete( (JSON.stringify(res) + total) == test.expect );
		},

		'custom filter': function(complete) {
			var test = {	// тест кастомной функции-фильтра и нескольких фильтров
				params: {
					sortBy: 'age',
						fn: fn,
						filters: {
						age: function(val) { return val > 10; },
						name:	'e3'
					}
				},
				expect: '[[{"name":"e3","lastname":"B","age":11},"17",0]]1'
			};
			var fn = test.params.fn;
			delete test.params.fn;
			var total = hash.sort(test.params, fn);
			complete( (JSON.stringify(res) + total) == test.expect );
		},
		'similar value': function(complete) {
			//debug=true;
			var similarHash = {
				"11": {name: 1, lastname: 'qwert', age: 10},
				"12": {name: 2, lastname: 123, age: 110},
				"13": {name: 3, lastname: 'lnam', age: 0},
				"14": {name: 4, lastname: 'lnAm', age: -1},
				"15": {name: 4, lastname: 'bLNAMb', age: 12},
				"16": {name: 4, lastname: 'b', age: 15},
				"17": {name: 5, lastname: 'B', age: 11}
			};
			console.log(similarHash);
			var result1 = '';
			var result2 = '';
			similarHash.sort(
				{sortBy:'name:asc'},
				function(item){
					result1 += item.name;
				}
			);
			similarHash.sort(
				{sortBy:'name:desc'},
				function(item){
					result2 += item.name;
				}
			);
			complete(result1=='1234445' && result2=='5444321');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.extendByClone()',
	prepare: function() {
		var tests = [
			{	// простой мерж без конфликтов, вложенностей и массивов
				a:{x:1},
				b:{y:1}
			},
			{	// мерж с конфликтом
				a:{x:1, y:1, z:[1]},
				b:{x:2, y:2, z:[2]}
			},
			{	// мерж с конфликтом
				a:{x:1, y:1, z:{k:1}},
				b:{x:2, y:2, z:{p:1}}
			}
		];
	},
	tests:	{
		'no force, no mutate': function(complete) {
			var expect = [
				'[{"x":1},{"y":1},{"x":1,"y":1}]',
				'[{"x":1,"y":1,"z":[1]},{"x":2,"y":2,"z":[2]},{"x":1,"y":1,"z":[1]}]',
				'[{"x":1,"y":1,"z":{"k":1}},{"x":2,"y":2,"z":{"p":1}},{"x":1,"y":1,"z":{"k":1}}]'
			];

			var result = true;
				tests.forEach(function(srcData, i) {
					var a = srcData.a;
					var b = srcData.b;
					var res;
					res = a.extendByClone(b, false, false);
					result = result && (JSON.stringify([a, b, res]) == expect[i]);
				});
			complete( result );
		},

		'force, no mutate': function(complete) {
			var expect = [
				'[{"x":1},{"y":1},{"y":1,"x":1}]',
				'[{"x":1,"y":1,"z":[1]},{"x":2,"y":2,"z":[2]},{"x":2,"y":2,"z":[2]}]',
				'[{"x":1,"y":1,"z":{"k":1}},{"x":2,"y":2,"z":{"p":1}},{"x":2,"y":2,"z":{"p":1}}]'
			];

			var result = true;
			tests.forEach(function(srcData, i) {
				var a = srcData.a;
				var b = srcData.b;
				var res;
				res = a.extendByClone(b, true, false);
				result = result && (JSON.stringify([a, b, res]) == expect[i]);
			});
			complete( result );
		},

		'no force, mutate': function(complete) {
			var expect = [
				'[{"x":1,"y":1},{"y":1},null]',
				'[{"x":1,"y":1,"z":[1]},{"x":2,"y":2,"z":[2]},null]',
				'[{"x":1,"y":1,"z":{"k":1}},{"x":2,"y":2,"z":{"p":1}},null]'
			];

			var result = true;
			tests.forEach(function(srcData, i) {
				var a = srcData.a;
				var b = srcData.b;
				var res;
				res = a.extendByClone(b, false, true);
				result = result && (JSON.stringify([a, b, res]) == expect[i]);
			});
			complete( result );
		},

		'force, mutate': function(complete) {
			var expect = [
				'[{"x":1,"y":1},{"y":1},null]',
				'[{"x":2,"y":2,"z":[]},{"x":2,"y":2,"z":[2]},null]',
				'[{"x":2,"y":2,"z":{"p":1}},{"x":2,"y":2,"z":{"p":1}},null]'
			];

			var result = true;
			tests.forEach(function(srcData, i) {
				var a = srcData.a;
				var b = srcData.b;
				var res;
				res = a.extendByClone(b, true, true);
				result = result && (JSON.stringify([a, b, res]) == expect[i]);
			});
			complete( result );
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.toFlatArray()',
	tests:	{
		'array flat': function(complete) {
			var t =[[1,2],[3,[4,5]],6];
			complete( t.toFlatArray().join("") === "123456" );
		},
		'string flat': function(complete) {
			var a="test";
			var val = a.toFlatArray();
			complete(val.length==1 && val.toFlatArray()[0] === 'test');
		},
		'number flat': function(complete) {
			var b=5;
			var val = b.toFlatArray();
			complete(val.length==1 && val.toFlatArray()[0] == 5);
		},
		'array of objects': function(complete) {
			var c = [new String("test2"), new Number(10)];
			var val = c.toFlatArray();
			complete(val.length==2 && typeof val.toFlatArray()[0] == 'object');
		},
		'array of objects eq string': function(complete) {
			var c = [new String("test2"), new Number(10)];
			var val = c.toFlatArray();
			complete(val.length==2 && val.toFlatArray()[0]+'' == 'test2');
		},
		'array of objects eq number': function(complete) {
			var c = [new String("test2"), new Number(10)];
			var val = c.toFlatArray();
			complete(val.length==2 && +val.toFlatArray()[1] == 10);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.anyKey',
	tests:	{
		'anyKey': function(complete) {
			var t = {'test1':1, 'test2':2};
			var k = t.anyKey;
			complete(k==='test1' || k==='test2');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Object.anyValue',
	tests:	{
		'anyKey': function(complete) {
			var t = {'test1':4, 'test2':5};
			var k = t.anyValue;
			complete(k===4 || k==5);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'window.is*',
	tests:	(function() {
		var funcs = {
			isHash:				{'HASH':true},
			isObject:			{'OBJECT': true, 'HASH':true},
			isString:			{'STRING':true},
			isNumber:			{'NUMBER':true},
			isFunction:			{'FUNCTION':true},
			isDate:				{'DATE':true},
			isArray:			{'ARRAY':true},
			isHtmlElement:		{'HTMLELEMENT':true},
			isHtmlCollection:	{'HTMLCOLLECTION':true},
			isDocumentFragment:	{'DOCUMENTFRAGMENT':true},
			isRange:			{'RANGE':true},
			isNode:				{'NODE':true,'DOCUMENTFRAGMENT':true,'HTMLELEMENT':true},
			isNodeList:			{'NODELIST':true},
			isAttr:				{'ATTR':true},
			isAttrList:			{'ATTRLIST':true}
		};

		var tests = {};

		for (var func in funcs) {
			(function(func) {
				var test = function(complete) {
					var checkFn = funcs[func];
					var isFail = 0;
					for (var i in DATATYPES) {
						for (var num in DATATYPES[i]) {
							var value = DATATYPES[i][num];
							if ( (i in checkFn && !$[func](value) ) || ( !(i in checkFn) && $[func](value) )) {
								console.log(func + ' FAIL', i, value);
								isFail = true;
							}
						}
					}
					complete( !isFail );
				};
				tests[func] = test;
			})(func);
		}



		return tests;
	})()
});


/** STRING =========================================================================================== */
TDD.add({
	group:	'bind',
	name:	'String.uid()',
	tests:	{
		'main': function(complete) {
			var t1 = String.uid(10);
			var t2 = String.uid(10);
			complete( typeof t1 == 'string' && t1!=t2 && t1.match(/^[\w\d]+$/));
		},
		'length': function(complete) {
			var t1 = String.uid(10);
			var t2 = String.uid();
			complete( t1.length == 10 && t2.length == 16);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'String.splitAs()',
	tests:	{
		'split flat': function(complete) {
			var str = "test1.hello.word";
			var t=str.splitAs(".", ['module', 'entity', 'field']);
			complete(t.module === 'test1' && t.entity === 'hello' && t.field === 'word');
		},
		'split part 1': function(complete) {
			var str = "test1.hello.word";
			var t=str.splitAs(".", ['module', 'entity[]', 'field']);
			complete(t.module == 'test1' && t.entity instanceof Array && t.entity[0]=='hello' && t.entity[1]=='word' && t.fields === undefined);
		},
		'split part 2': function(complete) {	// тут надо тест дозапилить, чтобы работало с массивами
			var str = "test1.hello.x.y.z";
			var t=str.splitAs(".", ['module', 'entity', 'fields[]']);
			complete(t.module == 'test1' && t.entity =='hello' && t.fields[0]=='x' && t.fields[1]=='y' && t.fields[2] == 'z');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'String.toJSON()',
	tests:	{
		'simple': function(complete) {
			var a = "{t:5}";
			var b = a.toJSON();
			complete(b && b.t === 5);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'String.x()',
	tests:	{
		'repeat': function(complete) {
			var t = "a".x(7);
			complete(t==="aaaaaaa");
		}
	}
});

/** NUMBER =========================================================================================== */
TDD.add({
	group:	'bind',
	name:	'Number.uid()',
	tests:	{
		'main': function(complete) {
			var t1 = Number.uid();
			var t2 = Number.uid();
			complete( t1+1 == t2);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Number.sprintf()',
	tests:	{
		'main': function(complete) {
			var t1 = 20;
			var t2 = 130;
			complete(t1.sprintf("%04d")==="0020" && t2.sprintf("%03d")==="130");
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Number.match()',
	tests:	{
		'is number': function(complete) {
			var t = 20;
			complete(t.match(/^\d+$/));
		},
		'match last':function(complete) {
			var t = 4531;
			complete(t.match(/1$/));
		}
	}
});


/** ARRAY =========================================================================================== */
TDD.add({
	group:	'bind',
	name:	'Array.chop()',
	tests:	{
		'main': function(complete) {
			var arr = ['x','y','z'];
			var b = arr.chop();
			complete(b.length == 2 && b[0]=='x' && b[1]=='y');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Array.toObject()',
	tests:	{
		'main': function(complete) {
			var arr = ['a', 1, true, undefined];

			var success = true;
			success = success && JSON.stringify(arr.toObject(true)) == '{"0":"a","1":1,"2":true}';
			success = success && JSON.stringify(arr.toObject(false)) == '{"1":true,"a":true,"true":true,"undefined":true}';

			complete(success);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Array.first',
	tests:	{
		'main': function(complete) {
			var t = ['test1', 'test2', 'test3'];
			complete(t.first == 'test1');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Array.last',
	tests:	{
		'main': function(complete) {
			var t = ['test1', 'test2', 'test3'];
			t.push('test4');
			complete(t.last == 'test4');
		}
	}
});


/** DATE =========================================================================================== */

TDD.add({
	group:	'bind',
	name:	'Date.value',
	tests:	{
		'setDay': function(complete) {
			var d = new Date();
			d.value.day = 5;
			complete(d.getDate() === 5);
		},
		'setValue': function(complete) {
			var d = new Date();
			d.value = {year: 2012, month:5, day:10};
			complete(d.getDate() === 10 && d.getFullYear() == 2012 && d.getMonth() == 5-1);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Date.get',
	tests:	{
		'getByMask 1': function(complete) {
			var d = new Date();
			d.setDate(4);
			d.setMonth(2);
			d.setFullYear(2013);
			var ymd = d.get('dd.mm.yyyy');
			complete(ymd=='04.03.2013');
		},
		'getByMask 2': function(complete) {
			var d = new Date();
			d.setDate(4);
			d.setMonth(2);
			d.setFullYear(2013);
			var ymd = d.get('yyyy.dd.mm');
			complete(ymd=='2013.04.03');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Date.set',
	tests:	{
		'set Date': function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.setDate(4);
			d1.set(d2);
			complete(d1.value.day==4);
		},
		'set yyyy-mm-dd' : function(complete) {
			var d = new Date();
			d.set('2012-04-23');
			complete(d.value.year == 2012 && d.value.month==4 && d.value.day==23);
		},
		'set byMask (dmy)': function(complete) {
			var d = new Date();
			d.set('[23:04/2012]', '[dd:mm/yyyy]');
			complete(d.value.year == 2012 && d.value.month==4 && d.value.day==23);
		},
		'set today' : function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.setDate(4);
			d2.set('today');
			complete(d1.value.day == d2.value.day);
		},
		'set yesterday' : function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.set('yesterday');
			d2.value.day++;
			complete(d1.value.day == d2.value.day);
		},
		'set quarter' : function(complete) {
			var d = new Date();
			d.set('quarter');
			var m = (d.value.month-1)%3;
			complete(m==0);
		},
		'set year' : function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.setYear(2002);
			d2.set('year');
			complete(d2.value.year == d1.value.year-1);
		},
		'set month' : function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.set('month');
			complete((d2.value.month + 1) % 12 == d1.value.month);
		},
		'set week' : function(complete) {
			var d1 = new Date();
			var d2 = new Date();
			d2.set('week');
			d2.value.day+=7;
			complete(d1.value.day == d2.value.day);
		}
	}
});

/** Function =========================================================================================== */

TDD.add({
	group:	'bind',
	name:	'Function.fnId',
	tests:	{
		'main': function(complete) {
			var checksum = 0;
			var a = function() {};
			var a_id = a.fnId;
			var b = function() {};
			var c = function() {};
			var b_id = b.fnId;
			var c_id = c.fnId;
			var d_id = a.fnId;
			var e = a;

			if (a_id == b_id-1 && b_id==c_id-1  && e.fnId === a.fnId && a_id==d_id) checksum++;
			if (a.fnId != b.fnId && b.fnId!= c.fnId) checksum++;
			complete (checksum==2);
		}
	}
});

/** Node =========================================================================================== */

TDD.add({
	group:	'bind',
	name:	'Node.nodeId',
	tests:	{
		'main': function(complete) {
			var checksum = 0;
			var a = document.createElement('span');
			var a_id = a.nodeId;
			var b = document.createElement('div');
			var c = document.createElement('span');
			var b_id = b.nodeId;
			var c_id = c.nodeId;
			var d_id = a.nodeId;
			var e = a;

			if (a_id == b_id-1 && b_id==c_id-1  && e.nodeId === a.nodeId && a_id==d_id) checksum++;
			if (a.nodeId != b.nodeId && b.nodeId!= c.nodeId) checksum++;
			complete(checksum==2);
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Node.insertAfter()',
	tests:	{
		'last': function(complete) {
			var parent = document.createElement('div');
			parent.innerHTML = "<h1>testheader</h1>hello";
			var el1 = document.createElement('a');
			el1.innerHTML = "el1";
			parent.appendChild(el1);

			var el2 = document.createElement('span');
			el2.innerHTML = "el2";
			parent.insertAfter(el2, el1);
			complete(parent.innerHTML == "<h1>testheader</h1>hello<a>el1</a><span>el2</span>");
		},
		'inner': function(complete) {
			var parent = document.createElement('div');
			parent.innerHTML = "<h1>testheader</h1>hello";
			var el1 = document.createElement('a');
			el1.innerHTML = "el1";
			var el2 = document.createElement('a');
			el2.innerHTML = "el2";
			parent.appendChild(el1);
			parent.appendChild(el2);

			var el3 = document.createElement('span');
			el3.innerHTML = "el3";
			parent.insertAfter(el3, el1);
			//;;;console.info(parent.innerHTML);
			complete(parent.innerHTML == "<h1>testheader</h1>hello<a>el1</a><span>el3</span><a>el2</a>");
		}
	}
});



TDD.add({
	group:	'bind',
	name:	'Element.addEventListener',
	tests:	{
		'main': function(complete) {
			var el = document.createElement('div');
			var eid = el.addEventListener('click', function() {
			});
			complete(typeof eid == 'number', '~');
		}
	}
});

TDD.add({
	group:	'bind',
	name:	'Element.removeEventListener',
	tests:	{
		'main': function(complete) {
			var el = document.createElement('div');
			var eid = el.addEventListener('click', function() {});
			el.removeEventListener(eid);
			complete(el.addEventListener, '~');
		}
	}
});
