/*Red Pilule main test*/

TDD.add({
	group:	'RedPilule',
	name:	'.constructor',
	tests:	{
		'main': function(complete) {
			var t = $("!<div id='name'>name is #{name}</div><span id='surname'>sur is #{surname} happy!</span>");
			complete(t);
		}
	}
});

TDD.add({
	group:	'RedPilule',
	name:	'pid',
	tests:	{
		'getPyPid': function(complete) {
			var a = $("!<span>test</span>");
			var pid = a.pid;
			var b = $(pid);
			complete( a.pid == b.pid );
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'modelSet()',
	tests:	{
		'no params': function(complete) {
			var success = true;

			var a = $('').modelSet({x:1});
			success = success && (JSON.stringify(a.model) == '{"x":1}');

			a.modelSet({x:1, y:1}).modelSet({x:2}).modelSet('z', 5);
			success = success && (JSON.stringify(a.model) == '{"x":2,"z":5}');

			complete(success);
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'modelBridge()',
	tests:	{

		'a[$preSet] <<>> b': function(complete) {
			var a = $('');
			var b = $('');
			a.modelSet({user: {name: 5}});
			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			complete( a.model.user.name == 5 && b.model.name ==5 );
		},

		'a[$preSet] <<>> b[$preSet]': function(complete) {
			var a = $('');
			var b = $('');
			a.modelSet({user: {name: 5}});
			b.modelSet({name: 7});
			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			complete( a.model.user.name == 5 && b.model.name == 5);
		},

		'$a <<>> b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			a.model.user.name = 5;
			//a.modelSet({user: {name: 5}});

			//console.info('a:', a.model, '   b:', b.model);
			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name == 5 && b.model.name == 5);
		},

		'a <<>> $b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			b.model.name = 5;

			//console.info('a:', a.model, '   b:', b.model);
			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name ==5 && b.model.name ==5 );
		},

		'$a[$preSet] <<>> b[$preSet]': function(complete) {
			var a = $('');
			var b = $('');

			a.modelSet({user: {name: 5}});
			b.modelSet({name: 10});
			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			a.model.user.name = 7;

			//console.info('a:', a.model, '   b:', b.model);
			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name == 7 && b.model.name == 7);
		},

		'a <<>> $b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: 'name', destPath:'user.name', destObject: a});
			b.modelSet({name: 5});

			//console.info('a:', a.model, '   b:', b.model);
			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name === b.model.name );
		},

		'$a >>b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: '>>name', destPath:'user.name', destObject: a});
			//a.modelSet({user: {name: 5}});
			a.model.user.name = 'itsA';
			//b.model.name = 'itsB';

			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name == 'itsA' && b.model.name == 'itsA');
		},

		'$a >>$b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: '>>name', destPath:'user.name', destObject: a});
			//a.modelSet({user: {name: 5}});
			a.model.user.name = 'itsA';
			b.model.name = 'itsB';

			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name == 'itsA' && b.model.name == 'itsB');
		},

		'$a <<$b': function(complete) {
			var a = $('');
			var b = $('');

			b.modelBridge({modelPath: '<<name', destPath:'user.name', destObject: a});
			a.modelSet({user: {name: 5}});
			b.model.name = 'itsB';
			a.model.user.name = 'itsA';

			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name == 'itsA' && b.model.name == 'itsB');
		},

		'$a.1 <<>> a.2': function(complete) {
			var a = $('');

			a.modelBridge({modelPath: 'name', destPath:'user.name'});
			a.model.user.name = 5;

			//console.info('a.model.user.name:', a.model.user.name, '   b.model.name:', b.model.name);
			complete( a.model.user.name === a.model.name );
		},

		'$a.1 >>$a.2': function(complete) {
			var a = $('');

			a.modelBridge({modelPath: '>>name', destPath:'user.name'});
			a.modelSet({user: {name: 5}});
			a.model.user.name = 'itsA';
			a.model.name = 'itsB';

			//console.info('a.model.user.name:', a.model.user.name, '   a.model.name:', a.model.name);
			complete( a.model.user.name == 'itsA' && a.model.name == 'itsB');
		},

		'a.1[$preSet] >>a.2': function(complete) {
			var a = $('');

			a.modelSet({user: {name: 5}});
			a.modelBridge({modelPath: '>>name', destPath:'user.name'});

			//console.info('a.model.user.name:', a.model.user.name, '   a.model.name:', a.model.name);
			complete( a.model.user.name == 5 && a.model.name == 5);
		},

		'a <<~> b <~>> c': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			a.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});
			c.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});
			a.modelSet({name: 'foo'});

			console.log(a.model.name, b.model.name, c.model.name);

			complete( a.model.name == 'foo' && b.model.name == 'foo' && c.model.name == 'foo');
		},

		'a <<~> b <<~> c': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			console.log('A:', a);
			console.log('B:', b);
			console.log('C:', c);

			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});
			c.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});

			console.info('----------------------------');
			a.modelSet({name: 'foo'});
			console.info('----------------------------');

			console.log(a.model.name, b.model.name, c.model.name);

			complete( a.model.name == 'foo' && b.model.name == 'foo' && c.model.name == 'foo');
		},

		'a <<~> b <<~> c [push]': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			console.log('A:', a);
			console.log('B:', b);
			console.log('C:', c);
			a.modelSet({name: []});

			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});
			c.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});

			console.info('=PUSH----------------------------');
			a.model.name.push('foo');
			console.info('----------------------------');

			console.log('RES:', a.model.name, b.model.name, c.model.name);

			complete( a.model.name[0] == 'foo' && b.model.name[0] == 'foo' && c.model.name[0] == 'foo');
		},

		'a <~>> b <~>> c [push]': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			console.log('A:', a);
			console.log('B:', b);
			console.log('C:', c);
			a.modelSet({name: []});

			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});
			c.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});

			console.info('----------------------------');
			c.model.name.push('foo');
			console.info('----------------------------');

			console.log(a.model.name, b.model.name, c.model.name);

			complete( a.model.name[0] == 'foo' && b.model.name[0] == 'foo' && c.model.name[0] == 'foo');
		},

		'a <<~> b, a <<~> c [push]': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			console.log('A:', a);
			console.log('B:', b);
			console.log('C:', c);
			a.modelSet({name: []});

			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});
			c.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});

			console.info('----------------------------');
			a.model.name.push('foo');
			console.info('----------------------------');

			console.log(a.model.name, b.model.name, c.model.name);

			complete( a.model.name[0] == 'foo' && b.model.name[0] == 'foo' && c.model.name[0] == 'foo');
		},

		'a <~> b [getBridged]': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');

			c.modelUse(a);
			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});

			//debug = true;
			var links = c.modelGetBridged('name');
			console.info("A:", a, a.model);
			console.info("B:", b, b.model);
			console.info("C:", c, c.model);
			console.log('LINKS', links);
			//debug = false;
			complete(links[0].objSelf.public.pid == b.pid);
		},

		'a <~> b[modeluse a] <~> c <~> d': function(complete) {
			var a = $('');
			var b = $('');
			var c = $('');
			var d = $('');

			b.modelUse(a);
			c.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});
			d.modelBridge({modelPath: 'name', destObject: b, destPath:'name'});


			//debug=true;
			console.info("A:", a, a.model);
			console.info("B:", b, b.model);
			console.info("C:", c, c.model);
			console.info("D:", d, d.model);

			var links = d.modelGetBridged('name');

			console.info('LINKS:', links);

			d.model.name = 'foo';
			//b.modelSet({name: 'foo'});

			//console.log(a.model.name, b.model.name, c.model.name, d.model.name);

			//debug = false;
			complete( a.model.name == 'foo' && b.model.name == 'foo' && c.model.name == 'foo');
		},

		'a <<>> b [event `change`, eventCount]': function(complete) {
			var a = $('');
			var b = $('');

			a.modelSet({name: {a: 'foo'}});


			b.modelBridge({modelPath: 'name', destObject: a, destPath:'name'});

			//debug = true;
			console.log('A:', a);
			console.log('B:', b);

			a.modelEventAdd('change', 'name.a', function() {
				console.log('exec event add:', arguments);
			});


			a.model.name.a = 'bar';

			complete( a.model.name.a == 'bar' && b.model.name.a == 'bar' );
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'modelMerge()',
	tests:	{
		'extend hash': function(complete) {
			var success = true;

			// found cases
			var a = $('').modelSet({x:1});
			a.modelMerge({x:2});
			success = success && (JSON.stringify(a.model) == '{"x":1}');

			a.modelSet({x:1});
			a.modelMerge({x:2}, {force:true});
			success = success && (JSON.stringify(a.model) == '{"x":2}');

			a.modelSet({x:1});
			a.modelMerge({x:{a:1}}, {force:true});
			success = success && (JSON.stringify(a.model) == '{"x":{"a":1}}');

			// not found cases
			a.modelSet({x:1});
			a.modelMerge({y:2});
			success = success && (JSON.stringify(a.model) == '{"x":1,"y":2}');

			a.modelSet({x:1});
			a.modelMerge({y:{a:1}}, {force:true});
			success = success && (JSON.stringify(a.model) == '{"x":1,"y":{"a":1}}');

			complete(success);
		},
		'extend scalar': function(complete) {
			var success = true;

			// found cases
			var a = $('').modelSet({x:1});
			a.modelMerge('x', {x:2});
			success = success && (JSON.stringify(a.model) == '{"x":1}');

			a.modelSet({x:1});
			a.modelMerge('x', {x:2}, {force:true});
			success = success && (JSON.stringify(a.model) == '{"x":{"x":2}}');

			// not found cases
			a.modelSet({x:1});
			a.modelMerge("y", 2);
			success = success && (JSON.stringify(a.model) == '{"x":1,"y":2}');

			a.modelSet('', {x:5});
			a.modelMerge({y:{a:1}});
			success = success && (JSON.stringify(a.model) == '{"x":5,"y":{"a":1}}');
			complete(success);
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'modelEventAdd',
	tests:	{
		'set': function(complete) {
			var str = '';
			var a = $()
				.modelSet({val:0})
				.modelEventAdd('set', 'val', function() {str += 'set';});
			a.model.val = -0;
			a.model.val = 0;
			complete(str == 'setset');
		},
		'set with typed model': function(complete) {
			var str = '';
			var a = $()
				.modelSet({val:0})
				.modelSetType('val', 'number')
				.modelEventAdd('set', 'val', function() {str += 'set';})
				.modelEventAdd('error', 'val', function() {;});
			a.model.val = -0;
			a.model.val = 0;
			complete(str == 'setset');
		},

		'set ~': function(complete) {
			var str = '';
			var a = $().modelEventAdd('set', '~', function(event, path, cfg) {str += path;})
			a.model = {foo: {bar: 5}};

			complete(str == '~');
		},

		'set ** [event direction]': function(complete) {
			var str = '';
			var a = $().modelEventAdd('set', '~ **', function(event, path, cfg) {str += path+">";})
			a.model = {foo: {bar: 5}};

			//debug=true;
			console.warn(str);

			complete(str == '~>foo>foo.bar>');
		},

		'change': function(complete) {
			var str = '';
			var a = $()
				.modelSet({val:0})
				.modelEventAdd('change', 'val', function(event, path, cfg) {str += 'change' });
			a.model.val = 5;
			complete(str == 'change');
		},
		'change ** [event direction]': function(complete) {
			var str = '';
			//debug = true;
			var a = $()
				.modelSet({foo: {bar:7}})
				.modelEventAdd('add change', '~ **', function(event, path, cfg) {str += path+'>';})
			a.model = {foo: {bar: 5}};
			complete(str == '~>foo>foo.bar>');
		},
		'change [$.G]': function(complete) {
			var str = '';
			//debug = true;
			$.G.model = {todos: []};
			$.G.modelEventAdd('add change', 'todos.**', function(eventName, path, cfg) {
				str+=path+">";
			});
			$.G.model.todos.push({a:1});
			console.log(str);
			complete(str == 'todos.0>todos.0.a>');
		},
		'error': function(complete) {
			var str = '';
			var a = $()
				.modelSet({val:0})
				.modelSetType('val', 'url')
				.modelEventAdd('error', 'val', function() {str += 'set';})
			a.model.val = -0;
			a.model.val = 0;
			complete(str == 'setset');
		},
		're-set model': function(complete) {
			var str = '';
			var a = $()
				.modelSet({val:0})
				.modelEventAdd('change', '~', function(eventName, path, cfg) {
					str += path + JSON.stringify(cfg.newValue);
				});
			a.model = {newVal: 5};
			complete(str == '~{"newVal":5}');
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'~model render [$.M]',
	tests:	{
		'M.array deffered': function(complete, body) {
			var a = $('!test {{M.data}}').appendTo(body);
			a.model = {data: 'hello'};
			setTimeout(function() {
				complete(a.viewGet() == 'test hello');
			},100);
		},
		'M render class': function(complete, body) {
			var a = $("!<div class='foo {{M.data}}'></div>").appendTo(body);
			a.model = {data: 'bar'};
			a.model.data = 'hello';
			setTimeout(function() {
				var rend = a.viewGet();
				complete(rend == '<div class="foo hello"></div>');
			},100);
		},
		'M render class+filter': function(complete, body) {
			//debug = true;
			//var a = $("!<div>{{M.data.products::length}}<h1 class=\"aaa {{M.data.products::isEmpty::if(true, 'dn')}}\">Вы выбрали:</h1></div>").appendTo(body);
			var a = $("!<div>{{M.data.products::length}}<h1 class=\"aaa {{M.data.products::isEmpty}}\" >abc</h1></div>"); //.appendTo(body);

			a.modelSet('data.products.2', {price:1});

			console.log(a.__self__);

			setTimeout(function() {
				//debug = true;
				var rend = a.viewGet();
				console.warn(rend);
				complete(rend == '<div>1<h1 class="aaa false">abc</h1></div>');
			},100);
		},
		'M.array [deffered render]': function(complete, body) {
			//debug = true;
			var a = $('!test {{M.data.1}}').appendTo(body);
			a.model = {data: ['foo','bar']};
			//console.log(a.viewGet());
			setTimeout(function() {
				complete(a.viewGet() == 'test bar');
			},100);
		},
		'M.array .push [event]': function(complete, body) {
			var a = $('!test {{M.data}}').appendTo(body);
			a.model = {data: [1,2,3]};
			var checksum='';
			a.modelEventAdd('add change','data.*', function(event, path, cfg) {
				checksum += cfg.newValue;
			});
			a.model.data.push(10);
			complete(checksum == '10');
		},

		'M.array::filter [render]': function(complete, body) {
			$.G.modelSet('data1', [1,2,5]);
			var a = $('!test {{G.data1::length}}').appendTo(body);
			setTimeout(function() {
				//debug = true;
				console.log('M.array::filter', a, a.viewGet());
				complete(a.viewGet() == 'test 3');
			},100);
		},

		'M.array .push ::filter [deffered render]': function(complete, body) {
			$.G.modelSet('data2', [1,2,5,7]);
			var a = $('!test {{G.data2::length}}').appendTo(body);
			$.G.model.data2.push(8);
			setTimeout(function (){
				console.log(a.viewGet(), $.G);
				complete(a.viewGet() == 'test 5');
			},100);
		}
	}
});

TDD.add({
	group:	'RedPilule',
	name:	'~model render [$.G]',
	tests:	{
		'G.data [render]': function(complete, body) {
			$.G.modelSet({data3: 'hello'});
			var a = $('!test {{G.data3}}').appendTo(body);
			setTimeout(function(){
				complete(a.viewGet() == 'test hello');
			},100);
		},
		'G.data .push [event]': function(complete, body) {
			$.G.model = {data: [1,2,3]};
			var a = $('!test {{G.data}}').appendTo(body);
			var checksum='';
			$.G.modelEventAdd('add change','data.*', function(event, path, cfg) {
				checksum += cfg.newValue;
			});
			$.G.model.data.push(10);
			complete(checksum == '10');
		},
		'G.data .push [render]': function(complete, body) {
			//debug = true;
			$.G.model = {data: [1,2,3]};
			var a = $('!test {{G.data.2}}').appendTo(body);
			$.G.model.data.push(10);
			console.log(a.viewGet());
			complete(a.viewGet() == 'test 10');
		},
		'G.data::filter [render]': function(complete, body) {
			$.G.model = {data: [1,2,5]};
			var a = $('!test {{G.data::length}}').appendTo(body);
			complete(a.viewGet() == 'test 3');
		},
		'G.data::filter [modify, render]': function(complete, body) {
			$.G.model = {df: [1,2,5]};
			var a = $('!test {{G.df::length}}').appendTo(body);
			$.G.model.df.push(8);
			complete(a.viewGet() == 'test 4');
		},

		'G.data .push ::filter [render]': function(complete, body) {
			$.G.model = {data: [1,2,5]};
			var a = $('!test {{G.data::length}}').appendTo(body);
			$.G.model.data.push(8);

			console.log(a.viewGet(), $.G);
			complete(a.viewGet() == 'test 4');
		}
	}
});


/* ------------------------------------------------------------------------------*/
/*COERCE TYPES */
/* ------------------------------------------------------------------------------*/
(function() {
	var checklist = [];
	['FUNCTION','BOOLEAN','STRING','NUMBER','ARRAY','DATE','OBJECT','HTMLELEMENT','NULL','UNDEFINED','OTHER'].forEach(function(key) {
		Array.prototype.push.apply(checklist, DATATYPES[key]);
	});

	function checkType(type, passes, fails) {
		var setOk = [], err = [],
			pass = [], fail = [], // console debug only
			passIdx = [], failIdx = [], // test result
			count = 0;

		for (var i = 0, l = checklist.length; i < l; i++) {
			err[i] = '__neveruse__';
		}

		var test = $()
			.modelSetType({'value': type})
			.modelEventAdd('set', 'value', function(eventName, path, params) {
				setOk[count] = params.newValue;
			})
			.modelEventAdd('error', 'value', function(eventName, path, params) {
				err[count] = params.newValue;
			})
			.modelSet({value: undefined});

		checklist.forEach(function(val, i) {
			test.model.value = val;
			count++;
		});
		for (var i = 0, l = checklist.length; i < l; i++) {
			if (err[i] === '__neveruse__') { pass.push(setOk[i]); passIdx.push(i); }
			if (err[i] !== '__neveruse__') { fail.push(setOk[i]); failIdx.push(i); }
		}

		// с датой браузеры ведут себя слишком по разному (недокументированные возможности), поэтому нормальный тест сделать не получается
		return type =='date' || (passes == passIdx.join('') && fails == failIdx.join(''));
	}

	TDD.add({
		group:	'RedPilule',
		name:	'~model coerce types',
		tests:	{
			'string': function(complete) {
				complete(checkType('string', '2345678910111213141516171825263233343536373839', '011920212223242728293031'));
			},

			'number': function(complete) {
				complete(checkType('number', '23571011121314151617182325323335363739', '01468919202122242627282930313438'));
			},

			'int': function(complete) {
				complete(checkType('int', '2357101112132325323335363739', '014689141516171819202122242627282930313438'));
			},

			'uint': function(complete) {
				complete(checkType('uint', '23571011122325323335363739', '01468913141516171819202122242627282930313438'));
			},

			'float': function(complete) {
				complete(checkType('float', '23571011121314151617182325323335363739', '01468919202122242627282930313438'));
			},

			'ufloat': function(complete) {
				complete(checkType('ufloat', '23571011121416182325323335363739', '01468913151719202122242627282930313438'));
			},

			'float2': function(complete) {
				complete(checkType('float2', '2357101112131415182325323335363739', '014689161719202122242627282930313438'));
			},

			'ufloat2': function(complete) {
				complete(checkType('ufloat2', '235710111214182325323335363739', '0146891315161719202122242627282930313438'));
			},

			'bool': function(complete) {
				complete(checkType('bool', '234567891011121314151617183233343536373839', '0119202122232425262728293031'));
			},

			'date': function(complete) {
				complete(checkType('date', '23610111213141516172125323536', '01457891819202223242627282930313334373839'));
			},

			'url': function(complete) {
				complete(checkType('url', '9', '012345678101112131415161718192021222324252627282930313233343536373839'));
			},

			'email': function(complete) {
				complete(checkType('email', '8', '012345679101112131415161718192021222324252627282930313233343536373839'));
			}
		}
	});
})();


TDD.add({
	group:	'RedPilule',
	name:	'appendTo()',
	tests:	{
		'main': function(complete, body) {
			$("!<div>test1</div><span>test2</span>").appendTo(body);
			var childs = body.childNodes;
			var isComment = function(value) { return value && value instanceof Node && value.nodeType==8 };
			complete(
				isComment(childs[0]) && isComment(childs[3]) &&
					childs[1].innerHTML=='test1' && childs[2].innerHTML=='test2'
			);
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'appendChild()',
	tests:	{
		'main': function(complete, body) {
			var t = $("!<div>test1</div>").appendTo(body);
			t.appendChild($("!<div>test2</div>"));
			var childs = body.childNodes;
			var isComment = function(value) { return value && value instanceof Node && value.nodeType==8 };
			complete(
				isComment(childs[0]) && isComment(childs[5]) &&		//t поинты
					isComment(childs[2]) && isComment(childs[4]) &&		//вложеные поинты
					childs[1].innerHTML=='test1' && childs[3].innerHTML=='test2'
			);
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'insertBefore()',
	tests:	{
		'main': function(complete, body) {
			var t1 = $("!<div>test1</div>").appendTo(body);
			$("!<div>test2</div>").insertBefore(t1);
			var childs = body.childNodes;

			var isComment = function(value) { return value && value instanceof Node && value.nodeType==8 };
			complete(
				isComment(childs[0]) && isComment(childs[2]) &&		//t2 поинты
					isComment(childs[3]) && isComment(childs[5]) &&		//t1 поинты
					childs[1].innerHTML=='test2' && childs[4].innerHTML=='test1'
			);
		}
	}
});


TDD.add({
	group:	'RedPilule',
	name:	'insertAfter()',
	tests:	{
		'main': function(complete, body) {
			var t1 = $("!<div>test1</div>").appendTo(body);
			$("!<div>test2</div>").insertAfter(t1);
			var childs = body.childNodes;
			var isComment = function(value) { return value && value instanceof Node && value.nodeType==8 };
			complete(
				isComment(childs[0]) && isComment(childs[2]) &&			//t1 поинты
					isComment(childs[3]) && isComment(childs[5]) &&		//t2 поинты
					childs[1].innerHTML=='test1' && childs[4].innerHTML=='test2'
			);
		}
	}
});


/*
 view				:{},
 *	model				:{},
 modelUpdate			:function() {},
 modelRename			:function() {},
 modelDelete			:function() {},
 modelSync			:function() {},
 modelEventSet		:function() {},
 modelFilterSet		:function() {},
 wrapper				:function(cfg) {
 include				:function(template, parentNode) {},
 bridge				:function(mvc) {},
 addEvent			:function() {},
 *	appendTo			:function() {},
 prepentTo			:function() {},
 appendChild			:function() {},
 prependChild		:function() {},
 insertBefore		:function() {},
 insertNodeBefore	:function() {},
 insertAfter			:function() {},
 insertNodeAfter		:function() {},
 empty				:function() {},
 clone				:function() {},
 css					:function() {},
 hide				:function() {},
 show				:function() {},
 attr				:function() {},
 dimensions			:function() {}, //attr {x:int, y:int}
 parentNode			:undefined,
 nextSibling			:undefined,
 previousSibling		:undefined,
 */







/* -------------------------------------------------------------------------*/
/** Template ============================================================= */
/* -------------------------------------------------------------------------*/

/*

Unitest.add({
	group	:'Fernu',
	name	:'Fernu.registerTemplateExtension()',
	test	:function(checksum) {
		Fernu.registerTemplateExtension({
			matchTag:	'button',
			extendType:	'replace',	// replace|extend
			handler: function(mvc, container, attrs, value) {		//attrs:{key, each, order}
				mvc.include("!<span>BUTTON "+attrs.value+"</span>", container);
			}
		});
		return "EXIST";
	}
});

Unitest.add({
	group	:'Fernu',
	name	:'Fernu.registerExtension()',
	test	:function(checksum) {
		Fernu.registerExtension(
			'etest',
			function (self, cfg) {
				self.model.name1 = cfg.text;
			}
		);
		var t = Fernu("!<div id='name'>name is #{name1} #{name2}</div>").etest({text:'Dima'});
		if (t.model.name1 === 'Dima') {checksum++}
		return checksum ==1 ? true : false;
	}
});






 Unitest.add({
 group	:'Template',
 name	:'Template.constructor',
 test	:function(checksum) {


 //$.Template.register("button", "<a href='fdsfsdf'>test</a>");
 $.Template.register("myTemplate", "<span>hello world <a href='http://ya.ru'>link</a></span>test #{name}");


 var tpl = $.Template('myTemplate');

 //console.info(tpl);


 if ( tpl.fragment instanceof DocumentFragment ) checksum++;

 return checksum==1 ? true: false;
 }
 });


 Unitest.add({
 group	:'Template',
 name	:'Template.register()',
 test	:function(checksum) {
 $.Template.register("mytemplate", "<span>hello world <a href='http://ya.ru'>link</a></span>test #{name}");
 return true;
 }
 });
 */

		/*
Unitest.add({
	group	:'Template',
	name	:'Template.registerExtension()',
	test	:function(checksum) {

		return true;

		 $.Template.registerExtension("button", {
		 run: function() {

		 },
		 test: function() {

		 }
		 });
		 $.Template.registerExtension("databox", {
		 run: function() {

		 },
		 test: function() {

		 }
		 });
		 */
		/*
		 $.Template.register("myTemplate", "<div class='dib vat switch_display #{classes}' onclick='test();' style='width:#{width}px'>#{name}<div class='noselect db' ref='%{expand}'><div class='button_white_lite fwn dib tal pl10 arrow_dropdown' style='width:#{cwidth}px' ref='%{selected1}'></div></div><div class='pos_r cp' ref='%{rollup}'><div class='white_drop dib tal pl10 arrow_dropdown' style='width:#{cfwidth}px' ref='%{selected2}'></div><div class='pos_r'><div class='pos_a t3 l0 zi5000' style='width:#{width}px'><div class='bg_white fwn bs1_a0b br5 box_sh_b3cd' style='max-height: 185px'><div ref='%{items}' style='max-height: 185px; overflow-y: auto;'></div></div></div></div></div></div>");
		 */
/*
		var self = {
			test: function(value) {
				//alert(value);
			}
		};
		var model = {
			a:10
		};

		$.Template.registerExtension("button", {
			run: function(self, node, attr) {

			}
		});


		$.Template.register( 'myTemplate', "<div onclick='self.test(model.a);'>hello #{name} putilov! <button width='5'>mybut</button> #{age}</div>" );

		var tpl = $.Template( 'myTemplate', {scope: self, model: model} );

		//tpl.fragment.childNodes[0].onclick();



		//tpl2.fragment.childNodes[0].click();


		/*
		 var time= new Date();
		 for(var i=0; i<10000; i++) {
		 //var tpl = $.Template( 'myTemplate', {scope: self} );
		 tpl.fragment.childNodes[0].onclick();
		 //var tpl = $.Template('myTemplate');
		 }
		 alert(new Date()-time);

		;;;console.info(tpl);

		return true;
	}
});
		 */

