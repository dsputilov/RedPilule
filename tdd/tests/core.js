TDD.add({
	group:	'core',
	name:	'$.Transaction()',
	tests:	{
		'push with dataBind': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function() {checksum += "1" + Array.prototype.slice.call(arguments).join('') ; return 1}, null, ['a','b']);
			t.push(function() {checksum += "2" + Array.prototype.slice.call(arguments).join(''); return 2}, null, ['c','d', 'e']);
			var res = t.run({}, ['x', 'y', 'z']);
			complete(checksum == '1abxyz2cdexyz');
		},
		'include with dataBind': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function() {checksum += "1" + Array.prototype.slice.call(arguments).join('') ; return 1}, null, ['a','b']);
			t.push(function() {checksum += "2" + Array.prototype.slice.call(arguments).join(''); return 2}, null, ['c','d', 'e']);
			var c = $.Transaction();
			c.include(t);
			var res = c.run({}, ['x', 'y', 'z']);
			complete(checksum == '1abxyz2cdexyz');
		},
		'push': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function() {checksum+="1"; return 1});
			t.push(function() {checksum+="2"; return 2});
			t.push(function() {checksum+="3"; return 3});
			checksum+="a";
			var res = t.run();
			if ( res && res instanceof Array && res.toString()=='1,2,3') {
				checksum+='RET_OK'
			}
			//console.info('RES', res.toString());
			complete(checksum === "a123RET_OK");
		},
		'push provider': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function() {checksum+="1"; return 1});
			t.push(function() {checksum+="2"; return 2}, undefined, undefined, 'system');
			t.push(function() {checksum+="3"; return 3});
			checksum+="a";
			var res = t.run({provider: 'system'});
			if ( res && res instanceof Array && res.toString()=='2') {
				checksum+='RET_OK'
			}
			t.run();
			complete(checksum === "a2RET_OK213");
		},
		'push data': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function(a,b,c,d,e,f) {checksum += Array.prototype.slice.call(arguments).join(',')+"|"+(b instanceof Array)+"|";   }, null, [1,['a', 'b'], 3]);
			t.push(function() {checksum += Array.prototype.slice.call(arguments).join(',')+"|";});
			t.push(function() {checksum += Array.prototype.slice.call(arguments).join(',')+"|";}, null, [4]);
			checksum+="s";
			var res = t.run({}, [7,8]);
			//console.info(checksum);
			complete(checksum === "s1,a,b,3,7,8|true|7,8|4,7,8|");
		},
		'remove': function(complete) {
			var checksum = '';
			var t = $.Transaction();
			t.push(function() {checksum+="1"});
			var r = t.push(function() {checksum+="2"});
			t.push(function() {checksum+="3"});
			checksum+="a";
			t.remove(r);
			t.run();
			complete(checksum === "a13");
		},
		'include': function(complete) {
			var checksum = '';
			var t1 = $.Transaction();
			var t2 = $.Transaction();
			t1.push(function() {checksum+="1"; return 1});
			t1.push(function() {checksum+="2"; return 2}, undefined, undefined, 'system');
			t1.push(function() {checksum+="3"; return 3});

			t2.push(function() {checksum+="4"; return 4});
			t1.include(t2);

			checksum+="a";
			var res = t1.run();	//{provider: 'system'}
			if ( res && res instanceof Array && res.toString()=='2,1,3,4') {
				checksum+='|RET1_OK|'
			}

			//console.info('RES', res);
			var res = t2.run();
			if ( res && res instanceof Array && res.toString()=='4') {
				checksum+='|RET2_OK|'
			}

			var res = t1.run({provider: 'system'});
			if ( res && res instanceof Array && res.toString()=='2') {
				checksum+='|RET3_OK';
			}
			//console.info(checksum);
			complete(checksum === "a2134|RET1_OK|4|RET2_OK|2|RET3_OK");
		}
	}
});


TDD.add({
	group:	'core',
	name:	'$.MTM()',
	tests:	{
		'main:'	:function(complete) {
			var m = $.MTM();
			//debug=true;
			m.add('a', 'b');
			m.add('b', 'c');
			m.add('c', 'e');
			var a = m.get('a').join(',');
			var b = m.get('b').join(',');
			var c = m.get('c').join(',');
			var e = m.get('c').join(',');
			console.log(a,b,c,e);
			complete(a=='b,c,e' && b=='a,c,e' && c=='b,a,e');
		}
	}
});




TDD.add({
	group:	'core',
	name:	'$.Dispatcher()',
	tests:	{
		'Most relevant (left):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'left');
			var checksum = 0;

			a.set('**',     0);
			a.set('~.a.b.c',  1);
			a.set('a.b.c',  333);
			a.set('a.*.c',  2);
			a.set('a.b.*',  3);
			a.set('a.b.**', 4);
			a.set('a.**',   5);
			a.set('*.b.**', 6);
			a.set('a.*.**', 7);
			a.set('a',      8);
			a.set('a.*',    9);
			a.set('*',     10);

			if (JSON.stringify(a.get('x.y.z'))	== '[0]')	checksum++;
			if (JSON.stringify(a.get('a.b.c'))	== '[1,333]')	checksum++;
			if (JSON.stringify(a.get('~.a.b.c'))	== '[1,333]')	checksum++;
			if (JSON.stringify(a.get('a.b'))	== '[9]')	checksum++;
			if (JSON.stringify(a.get('a'))		== '[8]')	checksum++;
			if (JSON.stringify(a.get('a.b.x'))	== '[3]')	checksum++;
			if (JSON.stringify(a.get('x'))		== '[10]')	checksum++;

			complete(checksum == 7);
		},
		'Most relevant (right):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'right');
			var checksum = 0;

			a.set('**.c',   0);
			a.set('a.b.c',  1);
			a.set('a.b.c',  333);
			a.set('a.*.c',  2);
			a.set('a.b.*',  3);
			a.set('**.a.b', 4);
			a.set('a',   	5);
			a.set('**.b.*', 6);
			a.set('**.*.*', 7);
			a.set('**',      8);
			a.set('a.*',    9);
			a.set('*',     10);

			/*
			;;;console.info(JSON.stringify(a.get('x.y.z')));
			;;;console.info(JSON.stringify(a.get('a.b.c')));
			;;;console.info(JSON.stringify(a.get('a.b')));

			;;;console.info(JSON.stringify(a.get('a')));
			;;;console.info(JSON.stringify(a.get('a.b.x')));
			;;;console.info(JSON.stringify(a.get('x')));
			*/

			if (JSON.stringify(a.get('x.y.z'))	== '[7]')	checksum++;
			if (JSON.stringify(a.get('a.b.c'))	== '[1,333]')	checksum++;
			if (JSON.stringify(a.get('a.b'))	== '[9]')	checksum++;
			if (JSON.stringify(a.get('a'))		== '[5]')	checksum++;
			if (JSON.stringify(a.get('a.b.x'))	== '[3]')	checksum++;
			if (JSON.stringify(a.get('x'))		== '[10]')	checksum++;

			complete(checksum == 6);
		},
		'Most relevant (right-all):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'right');
			var checksum = 0;

			a.set('**.c',   0);
			a.set('a.b.c',  1);
			a.set('a.b.c',  333);
			a.set('a.*.c',  2);
			a.set('a.b.*',  3);
			a.set('**.a.b', 4);
			a.set('a',   	5);
			a.set('**.b.*', 6);
			a.set('**.*.*', 7);
			a.set('**',      8);
			a.set('a.*',    9);
			a.set('*',     10);

/*
			;;;console.info(JSON.stringify(a.get('x.y.z', true)));
			;;;console.info(JSON.stringify(a.get('a.b.c', true)));
			;;;console.info(JSON.stringify(a.get('a.b', true)));

			;;;console.info(JSON.stringify(a.get('a', true)));
			;;;console.info(JSON.stringify(a.get('a.b.x', true)));
			;;;console.info(JSON.stringify(a.get('x', true)));
*/
			if (JSON.stringify(a.get('x.y.z', true))	== '[[8],[7]]')	checksum++;
			if (JSON.stringify(a.get('a.b.c', true))	== '[[1,333],[2],[0],[3],[6],[8],[7]]')	checksum++;
			if (JSON.stringify(a.get('a.b', true))		== '[[9],[8]]')	checksum++;
			if (JSON.stringify(a.get('a', true))		== '[[5],[10],[8]]')	checksum++;
			if (JSON.stringify(a.get('a.b.x', true))	== '[[3],[6],[8],[7]]')	checksum++;
			if (JSON.stringify(a.get('x', true))		== '[[10],[8]]')	checksum++;

			complete(checksum == 6);
		},
		'Most relevant (left miss):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'left');
			a.set('a.b.c',  1);
			var res = a.get('x.y.z');
			complete( res === undefined );
		},
		'Most relevant (right miss):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'left');
			a.set('a.b.c',  1);
			var res = a.get('x.y.z');
			complete( res === undefined );
		},
		'Most relevant (left empty):'	:function(complete) {
			var a = $.Dispatcher(undefined, 'left');
			var res = a.get('x.y.z');
			complete( res === undefined );
		},

		'All appropriate values:'	:function(complete) {
			var a = $.Dispatcher();
			var checksum = 0;

			a.set('a.b.c', [10,5]);
			a.set('a.b.c', 20);
			a.set('a.b.*', 6);
			a.set('*', 100);
			a.set('a.**', 200);
			a.set('a', 300);

			if (JSON.stringify(a.get('a.b.c'))	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}')			checksum++;
			if (JSON.stringify(a.get('a.*.*'))	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}')			checksum++;
			if (JSON.stringify(a.get('a.**'))	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}')			checksum++;
			if (JSON.stringify(a.get('**'))		== '{"a.b.c":[[10,5],20],"a.b.*":[6],"*":[100],"a.**":[200],"a":[300]}')	checksum++;
			if (JSON.stringify(a.get('a.b.c.d'))== '{"a.**":[200]}')											checksum++;
			if (JSON.stringify(a.get('x.y.z'))	== '{}')														checksum++;
			if (JSON.stringify(a.get('x'))		== '{"*":[100]}')												checksum++;
			if (JSON.stringify(a.get('a'))		== '{"a":[300],"*":[100]}')										checksum++;

			complete(checksum == 8);
		},
		'All appropriate values (miss)'	:function(complete) {
			var a = $.Dispatcher();
			a.set('a.b.c',  1);
			var res = a.get('x.y.z');
			//console.info('All appropriate values (miss) ', JSON.stringify(res));
			complete( JSON.stringify(res) == '{}' );
		},
		'All appropriate values (empty)':	function(complete) {
			var a = $.Dispatcher();
			var res = a.get('x.y.z');
			;;;console.info('All appropriate values (empty)', JSON.stringify(res));
			complete( JSON.stringify(res) == '{}' );
		},
		'Empty key ~:'	:function(complete) {
			var a = $.Dispatcher(undefined, 'left');
			var checksum = 0;

			a.set('~',     111);
			a.set('',      222);
			a.set('**',     0);
			a.set('a.b.c',  1);
			a.set('a.b.c',  333);
			a.set('a.*.c',  2);
			a.set('a.b.*',  3);
			a.set('a.b.**', 4);
			a.set('a.**',   5);
			a.set('*.b.**', 6);
			a.set('a.*.**', 7);
			a.set('a',      8);
			a.set('a.*',    9);
			a.set('*',     10);

			if (JSON.stringify(a.get('~'))	== '[111,222]')	checksum++;
			if (JSON.stringify(a.get('~ **'))	== '[111,222]')	checksum++;
			if (JSON.stringify(a.get(''))	== '[111,222]')	checksum++;
			if (JSON.stringify(a.get('~.a.b.c'))	== '[111,222]')	checksum++;

			complete(checksum == 2);
		},
		'** and ~:'	:function(complete) {
			var a = $.Dispatcher();
			var checksum = 0;

			a.set('**', 5);

			;;;console.log(JSON.stringify(a.get('~')));
			if (JSON.stringify(a.get('~'))	== '{}')	checksum++;
			complete(checksum == 1);
		},

		'Remove (left):'	:function(complete) {
			//window.debug = true;
			var a = $.Dispatcher();
			var checksum = 0;

			a.set('**',     0);
			a.set('a',     10);
			if (JSON.stringify(a.get('a')) == '{"a":[10],"**":[0]}')	checksum++;
			a.remove('**');
			if (JSON.stringify(a.get('a')) == '{"a":[10]}')	checksum++;
			a.remove('a');
			if (JSON.stringify(a.get('a')) == '{}')	checksum++;

			complete(checksum == 3);
		}
	}
});


/*
 *
 */






/* Core Test*/
TDD.add({
	group	:'browser',
	name	:'Browser[detect]',
	tests	:{
		'main': function(complete) {
			var a = ENV.browser;
			complete((a.agent + '').match(/^\w+$/) && (a.type + '').match(/^\d$/));
		}
	}
});

/* Core Test*/
TDD.add({
	group:	'core',
	name	:'$.defineProperty()',
	tests	:{
		'main': function(complete) {
			var t = {};
			var checksum ="";
			$.defineProperty(t, 'method', {
				set: function() {checksum+="1"},
				get: function() {checksum+="2"; return "a"}
			});
			t.method = "foo";
			var a = t.method;
			complete(a=="a" && checksum == "12");
		}
	}
});

TDD.add({
	group:	'core',
	name	:'$.defineMethod()',
	tests	:{
		'main': function(complete) {
			var checksum = 0;
			$.defineMethod(Object.prototype, 'testMethodImplement', function(callback) {
				checksum++;
			});
			var h = {};
			h.testMethodImplement();
			for (var i in {}) {
				if (i=='testMethodImplement') {checksum--}
			}
			complete(checksum == 1);
		}
	}
});


TDD.add({
	group:	'core',
	name	:'$.when()',
	tests	:{
		'main': function(complete) {
			var checksum = "";
			$.when(
				this,
				function(end) {
					setTimeout(function() {checksum+="1"; end()}, 20);
				},
				function(end) {
					setTimeout(function() {checksum+="2"; end()}, 10);
				}
			).then(function() {
				checksum+="9";
				complete(checksum == "0219")
			});
			checksum+="0";
		},
		'empty' : function(complete) {
			$.when(null, []).then(function() {
				complete(true);
			})
		}
	}
});


TDD.add({
	group:	'core',
	name	:'$.JSON',
	tests	:{
		'parse': function(complete) {
			var success = true;
			success = success && ($.JSON.parse('{"0":1,"2":3,"__rptype__":"array"}').length == 3);
			success = success && ($.JSON.parse('{"__rptype__":"undefined"}') === undefined);
			success = success && ($.JSON.parse('{"__rptype__":"date","date":"1970-01-01T00:00:00.000Z"}').getTime() == 0);
			complete(success);
		},
		'stringify': function(complete) {
			var success = true;

			var a = [1,2,3];
			delete a[1];
			success = success && $.JSON.stringify(a) == '{"0":1,"2":3,"__rptype__":"array"}';

			a = undefined;
			success = success && $.JSON.stringify(a) == '{"__rptype__":"undefined"}';

			a = new Date(0);
			success = success && $.JSON.stringify(a) == '{"__rptype__":"date","date":"1970-01-01T00:00:00.000Z"}';

			a = {b: {q: new Date(0), w: undefined, e: [1,2,4]}};
			success = success && $.JSON.stringify(a) == '{"b":{"q":{"__rptype__":"date","date":"1970-01-01T00:00:00.000Z"},"w":{"__rptype__":"undefined"},"e":[1,2,4]}}';

			complete(success);
		}
	}
});


/*
TDD.add({
	group:	'core',
	name	:'$.deferredObject()',
	tests	:{
		'main': function(complete) {
		var checksum = "";
			var tm = {
				fn1: function(p) {checksum += "1"+p},
				fn2: function(p) {checksum += "2"+p},
				fn3: function(p) {checksum += "3"+p}
			};
			var deferr = $.deferredObject(tm);
			tm.fn1(4);
			tm.fn2(5);
			checksum+="9";
			deferr.publish();
			tm.fn3(6);
			complete(checksum == "9142536" ? true : false);
		}
	}
});
*/


/*
Unitest.add({
	group	:'core',
	name	:'$.uid()',
	test	:function(checksum) {
		var fr = $.uid(14);
		if (typeof fr == 'string' && fr.length == "14" && fr.match(/^[\w\d]+$/)) {
			checksum++;
		}
		return checksum == 1 ? true : false;
	}
});
*/
