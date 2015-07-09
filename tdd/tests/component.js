/*
TDD.add({
	group:	'$.Component',
	name:	'.constructor',
	prepare: function() {
		$.Controller.register('testc', {
			start: function(self, inner, cfg, parent) {
				inner.viewSet('!innertestok');
			}
		});

		$.Component.register('testc', {
			controllerName: 'testc'
		});
	},
	tests:	{
		'inner viewset': function(complete, body) {
			var t = $("!<testc>test1</testc>").appendTo(body);
			var code = t.viewGet();
			complete(code=='innertestok');
		}
	}
});
*/

TDD.add({
	group:	'$.Component',
	name:	'bridge',
	prepare: function() {
		$.Component.register('btest', {
			controllerName: 'btest'
		});
	},
	tests:	{
		'main': function(complete, body) {
			var e;
			$.Controller.register('btest', {
				start: function(self, inner, cfg, parent) {
					;;;console.log(arguments);
					e = $();
					cfg.attrs.bara.bridge({ destObject: e, destPath:'epath' });
					e.model.epath = 'foo';
				}
			});

			var t = $("!<btest bara='{{M.myattr}}'>test1</btest>")
				.appendTo(body);
			complete(t.model.myattr == 'foo');
		}
	}
});


TDD.add({
	group:	'$.Route',
	name:	'singleton [ctrl preloaded]',
	tests:	{
		'main': function(complete) {
			var checksum = '';

			$.Controller.register('singleton', {
				init: function(self) {
					checksum += 'i|';
				},
				a: 10,
				test: function() {
					checksum += 't';
				}
			});


			$.Router.register('singleton', {
				controllerName: 'singleton'
			});

			var r = $.Router('singleton');
			r.start();
			r.test();

			complete(checksum =='i|t' && r.a == 10);

		}
	}
});


TDD.add({
	group:	'$.Route',
	name:	'singleton [ctrl + load]',
	tests:	{
		'main': function(complete) {
			window.ctrlsig1_checksum = '';

			//debug = true;
			$.Router.register('singletond', {
				controllerName: 'singletond',
				loadScript: '/core/tdd/tests/data/route_ctrl.js'
			});

			var r = $.Router('singletond');

			r.start({});
			r.onReady(function() {
				r.test();
				complete(ctrlsig1_checksum =='i|t' && r.a == 10);
			});
		}
	}
});


TDD.add({
	group:	'$.Route',
	name:	'singleton [ctrl + load, dd]',
	tests:	{
		'main': function(complete) {
			window.ctrlsig2_checksum = '';

			$.Router.register('singletondd', {
				controllerName: 'singletondd',
				loadScript: '/core/tdd/tests/data/route_ctrl_dd.js'
			});

			var r = $.Router('singletondd');

			r.a = 50;

			r.start({});
			r.onReady(function() {
				r.test();
				complete(ctrlsig2_checksum =='i|r|12' && r.a == 30);
			});
		}
	}
});



TDD.add({
	group:	'$.Route',
	name:	'mod _STATUS_ [ctrl preloaded]',
	tests:	{
		'main': function(complete, body) {
			var checksum = '';
			$.Controller.register('STparent', {
				init: function(self, inner, cfg, parent) {
					checksum = 'sp|';
					self._STATUS_ = 'wait';

					setTimeout(function() {
						checksum += 'rp|';
						self._STATUS_ = 'ready';
					}, 100);
				},
				isparent: true
			});

			$.Controller.register('STtest', {
				init: function(self) {
					checksum += 'st';
					complete(checksum =='sp|rp|st');
				},
				isChild : true
			});

			$.Router.register('STparent', {
				controllerName: 'STparent'
			});
			$.Router.register('STtest', {
				controllerName: 'STtest',
				parentRoute: 'STparent'
			});

			var r = $.Router('STtest');
			r.start();
		}
	}
});

