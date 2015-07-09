// TODO написать документацию !
// если складываешь функцию а потом вызываешь, то селф не передается. описать в документации
$.Class = function(parent, cfg){
	if ( !cfg ) {
		cfg = parent;
		parent = undefined;
	}

	var construct, implemetation = {
		constructor: cfg.constructor,
		chainDisabled: cfg.chainDisabled ? cfg.chainDisabled.toObject() : {},
		public:		'',
		private:	'',
		proto: {
			public:	{},
			private:{}
		},
		static:	cfg.static || {}
	};

	['private', 'public'].forEach(function(methodType) {
		var methods = cfg[methodType];
		if (methods) {
			methods.forEach(function(method, methodName) {
				if ( $.isFunction(method) ) {
					implemetation.proto[methodType][methodName] = function() {
						var scope = this.__scope__;
						var args = Array.prototype.slice.call(arguments, 0);
						args.unshift(scope);
						var ret = method.apply(scope, args);
						return ret !== undefined || implemetation.chainDisabled[methodName] ? ret : scope.public;
					}
				} else {
					if (cfg.singleton) {
						implemetation.proto[methodType][methodName] = method;
					} else {
						implemetation[methodType] += "this." + methodName + "=" + JSON.stringify(method) + ";";
					}
				}
			});

			implemetation[methodType] = new Function(implemetation[methodType]);
			implemetation[methodType].prototype = implemetation.proto[methodType];
		}
	});

	if (cfg.selfRoot == 'public') {
		construct = (function (implemetation) {

			if (cfg.singleton) {
				var pub = new implemetation.public();
				return function() {
					var self = {
						_pid_:	Number.uid(),
						static: implemetation.static,
						extend: construct,
						public: pub
					};
					$.defineProperty(self.public, '__scope__', {value: self.public});

/*
					$.defineProperty(self.public, '__self__', {
						value : self,
						enumerable: false//true //true							// TODO: set false for disable debug
					});
*/

					return self.public;
				}
			} else {
				return function () {
					var self = {
						static: implemetation.static,
						extend: construct,
						public: new implemetation.public()
					};
					$.defineProperty(self.public, '__scope__', {value: self.public});

					var args = Array.prototype.slice.call(arguments, 0);
					args.unshift(self);
					var ret = implemetation.constructor.apply(self, args);
					return ret != undefined ? ret : self.public;
				}
			}


		})(implemetation);
	} else {
		construct = (function (implemetation) {


				return function() {
					var self = {
						_pid_:		Number.uid(),
						static:		implemetation.static,
						extend:		construct
					};
					if ( cfg.public ) {
						self.public = new implemetation.public();
						$.defineProperty(self.public, '__scope__', {value : self});
					} else {
						self.public = {};
					}

					if ( cfg.private ) {
						{self.private = new implemetation.private();}
						$.defineProperty(self.private, '__scope__', {value : self});
					}


					$.defineProperty(self.public, '__self__', {
						value : self,
						enumerable: !!$.isDebug //true //true							// TODO: set false for disable debug
					});


					var args = Array.prototype.slice.call(arguments, 0);
					args.unshift(self);
					var ret = implemetation.constructor.apply(self, args);
					return ret != undefined ? ret : self.public;
				}
		})(implemetation);
	}

	var regExtension = function(methodName, method, isChained) {		//Расширяет public класса,	isChained=false для отключения цепочек вызовов методов
		implemetation.public.prototype[methodName] = function() {
			var scope = this.__self__;
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift(scope);
			var ret = method.apply(scope, args);
			return ret !== undefined || isChained===false ? ret : scope.public;
		}
	};
	
	var self = {static: implemetation.static, extend:construct, registerExtension: regExtension};
	if (cfg.extend) {
		cfg.extend.forEach(function(method, methodName) {
			if ( $.isFunction(method) ) {
				construct[methodName] = method.bind(self, self);
			} else {
				construct[methodName] = method;
			}
		});
	}


	if (cfg.static) {
		cfg.static.forEach(function(method, methodName) {
			if ( $.isFunction(method) ) {
				implemetation.static[methodName] = method.bind(self, self);
			} else {
				implemetation[methodName] = method;
			}
		});
	}


	$.defineProperty(construct, '__self__', {
		value : self,
		enumerable: !!$.isDebug	//true false
	});

	if (parent) {
		parent.forEach(function(method, methodName) {
			construct[methodName] = method;
		});
	}
		
	if (cfg.init) cfg.init.call(self, self);
	return construct;
};

