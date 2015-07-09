/**
	@author 		Dmitri Putilov
	@class			TDD
	@description	������������

	Example:

	TDD.add({
		group:	'CoreBundle',
		name:	'a.test()',
		tests:	{
			'case1'	:function(complete) {
				var a = 1;
				complete( a === 1 );
			},
			'case2'	:function(complete) {
				var a = 2;
				complete( a === 2 );
			},
			'case3'	:function(complete) {
				var a = 3;
				complete( a === 5 );
			}
		}
	});
*/

"use strict";

var TDD = (function() {
	var timeout = 1000;

	var forEach = function(obj, fnIterator) {
		for (var i in obj) {
			fnIterator(obj[i], i);
		}
	};

	var xrep = function(str, num) {
		if(!num) num=50;
		for (var k=str.length; k<num; k++) str += ".";
		return str;
	};


	var conf = {};

	var tpl = function(frag, model) {
		
		for (var m in model) {
			frag = frag.replace(new RegExp('#{'+m+'}', 'g'), model[m]);
		}
		if (frag) {
			var tagWrap = {
					option: ["select"],
					tbody: ["table"],
					thead: ["table"],
					tfoot: ["table"],
					tr: ["table", "tbody"],
					td: ["table", "tbody", "tr"],
					th: ["table", "thead", "tr"],
					legend: ["fieldset"],
					caption: ["table"],
					colgroup: ["table"],
					col: ["table", "colgroup"],
					li: ["ul"]
				},
				reTag = /<\s*([\w\:]+)/,
				master = document.createElement("div");
				
			for(var param in tagWrap){
				if(tagWrap.hasOwnProperty(param)){
					var tw = tagWrap[param];
					tw.pre = param == "option" ? '<select multiple="multiple">' : "<" + tw.join("><") + ">";
					tw.post = "</" + tw.reverse().join("></") + ">";
				}
			}

			frag += "";

			var	match = frag.match(reTag),
				tag = match ? match[1].toLowerCase() : "",
				wrap, i, fc, df;
			if (match && tagWrap[tag]) {
				wrap = tagWrap[tag];
				master.innerHTML = wrap.pre + frag + wrap.post;
				for (i = wrap.length; i; --i)
					master = master.firstChild;
			} else
				master.innerHTML = frag;

			df = document.createDocumentFragment();
			while (fc = master.firstChild) // intentional assignment
				df.appendChild(fc);
		} else {
			df = document.createDocumentFragment();
		}
		
		return df; // DOMNode
	};

	var start = function(testNames) {
		
		var GID = 0;
		var TID = 0;	
		var SID = 0;

		var container = tpl("<div style='Font-family:Lucida Console;Font-size:11px' id='container'></div>");
		document.body.appendChild(container);
		
		forEach(conf, function(groupData, groupName) {
			GID++;
			(function(GID) {
				var groupTpl = tpl("<div style='margin-top:10px'><span><b>#{groupName}</b></span><div id='group_#{groupId}'></div></div>", {
					groupName:	groupName,
					groupId: 	GID
				});
				document.getElementById('container').appendChild(groupTpl);
				

				forEach(groupData, function(testCfg) {
					TID++;
					(function(TID) {
						var testName = testCfg.name;
						var subTests = testCfg.tests;

						//group of tests
						var testTpl = tpl("<span>#{testName}</span><span  style='margin-left:5px' id='testresult_#{testId}'>-</span><div id='test_#{testId}'></div>", {
							testName:	xrep(testName, 53),
							testId: 	TID
						});
						document.getElementById('group_'+GID).appendChild(testTpl);
					
							
						var isFault = false;
						var testsCount = Object.keys(subTests).length;
						var testsComplete = 0;

						var restext = '';

						var prepare = ('' + testCfg.prepare).replace(/^[^\{]+\{(.*?)/im, '$1').replace(/\}$/, '')+';';

						forEach(subTests, function(subtest, subtestName) {
							SID++;
							(function(SID) {

								if (testNames && testNames.indexOf(subtestName) ==-1) return;

								var subtestComplete = false;
								
								if (testsCount>1) {
									var testTpl = tpl("<div style='margin-left:20px'><span>#{subtestName}</span><span style='margin-left:5px' id='subtestresult_#{subtestId}'>-</span></div>", {
										subtestName:	xrep(subtestName),
										subtestId: 		SID
									});
									document.getElementById('test_'+TID).appendChild(testTpl);
								}

								
								var complete = function(result, why) {
									if ( subtestComplete ) {
										return 
									} else {
										subtestComplete = true;
									}
									
									testsComplete++;
									isFault = (isFault || !result);
									if (testsCount>1) {
										document.getElementById('subtestresult_'+SID).innerHTML = result ? '<b>OK</b>' : ('<span style="color:red"><b>FAIL</b></span> ' + (why ? '('+why+')' : ''));
									}
									
									if (testsComplete == testsCount) {
										if ( !result ) restext = why;
										document.getElementById('testresult_'+TID).innerHTML = isFault ? '<span style="color:red"><b>FAIL</b></span> ' + (restext ? '('+restext+')' : '') : '<b>OK</b>';
									}
								};
								
								try {
									var body = document.createElement('div');
									if (testCfg.prepare) {
										var testCode = 'var complete=arguments[0], body=arguments[1];'+prepare +('' + subtest).replace(/^[^\{]+\{(.*?)/im, '$1').replace(/\}$/, '')+';';
										//console.log(testCode);
										(new Function(testCode))(complete, body);
									} else {
										subtest(complete, body);
										window.debug = false;
									}
								} catch (e) {
									complete(false, 'exeption: ' + e + ' ');
									console.warn(e);
									//throw(new Error(e));
								}
								
								setTimeout(	function() {complete(false, 'timeout');},	timeout);
							})(SID);
						});
					})(TID);
				});
			})(GID);
		});
	};


	return {
		add: function(cfg) {
			if (!conf[cfg.group]) conf[cfg.group] = [];
			conf[cfg.group].push(cfg);
		},

		check: function(testNames) {
			start(testNames);
		}
	};



})();


var originalConsole = window.console;
window.console = {};
['log', 'info', 'warn', 'table'].forEach(function(method) {
	window.console[method] = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		if (window.debug=='alert') {
			alert(JSON.stringify(args));
		} else if (window.debug) {
			return originalConsole[method].apply(originalConsole, args);
		} else {
			return function() {}
		}
	}
});