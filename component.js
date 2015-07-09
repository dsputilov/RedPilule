/**
* @class Controller
*/

/**---------------------------------------------------------------------------------------
 * @class Controller
 **---------------------------------------------------------------------------------------*/

(function(){
	var ctrls = {};
	//_CTRLS_ = ctrls;
	var controller = function(name) {
		var c = ctrls[name];
		if (c) {
			return c();
		} else {
			_throw_(new Error('Controller "'+name+'" is undefined'));
		}
	};
	controller.register = function(name, handler) {
		var singleton = false;
		if (name[0]=='~') {
			name=name.replace(/^~/, '');
			singleton = true;
		}

		//console.log('register:', name);
		ctrls[name] = $.Class({
			constructor: function() {},
			singleton:	singleton,
			selfRoot:	'public',
			public:		handler
		});
	};
	$.Controller = controller;
})();



(function() {

	var componentModules;

	/*	@method Modular.load(cfg, callback);
		cfg = {
			loadScript:		'',
			loadTemplate:	'',
			loadCss:		''
		};
	*/
	var Modular = {
		load: function(module, modules, callback) {
			//;;;console.info('load module:', module, modules);
			if ( module.loaded ) {
				callback();
				return;
			}

			var whenFn = [], requireComponent = {}, requireRoute={}, dependence = {css:[], template:[], script:[]};
			var ctrls = [];

			['dependence', 'requireRoute', 'requireComponent'].forEach(function(dep) {
				if ( dep == 'requireComponent' ) modules = componentModules;				// REFACTOR: убрать цикл и перестать принимать modules, использовать глоабьльные объекты
				if ( module[dep] ) {
					module[dep].forEach(function(req) {
						var requireModule = modules[req];
						if ( !requireModule ) _throw_(new Error("Зависимость (или родитель) " + req + " для " + module.name +" не сконфигурирована"));
						if ( dep != 'requireComponent'  && requireModule.controllerName) ctrls.push(requireModule);			//Собираем все используемые маршруты, за исключением компонентов
						dependence.css = dependence.css.concat(requireModule.loadCss);
						dependence.template = dependence.template.concat(requireModule.loadTemplate);
						dependence.script = dependence.script.concat(requireModule.loadScript);
					});
				}
			});

			['css', 'template', 'script'].forEach(function(type) {
				whenFn.push(
					function(end) {
						$.Transfer({
							type	:type,
							url		:[ dependence[type], requireComponent[type], requireRoute[type], module['load' + type.capitalize()] ],
							onload	:function() { end(); }
						}).send();
					}
				);
			});

			$.when(null, whenFn).then(function() {
				module.loaded = true;
				ctrls.push(module);
				callback(ctrls);
			});
		}
	};


	var sysComponent = {
		status:		'loading',
		checksum:	0,
		onload: 	$.Transaction(),
		check: function(callback) {
			if (sysComponent.checksum == 0) {
				if (sysComponent.status == 'ready') {
					callback();
				} else {
					callback();
					sysComponent.onload.run();
				}
			} else {
				sysComponent.onload.push(callback);
			}
			sysComponent.status = 'ready';
		},
		load: function(componentCfg, allComponents) {
			sysComponent.checksum++;
			Modular.load(componentCfg, allComponents, function() {
				sysComponent.checksum--;
				if (sysComponent.status == 'ready' && sysComponent.checksum == 0 ) {
					sysComponent.onload.run();
				}
			});
		}
	};

	/*
	 Component.register(name, {				// пример:  name = 'tagName:AttrName'; name = '*:disabled';
	 controllerName:	'name',
	 multiple:		true || false		Если false, то контроллер будет синглтоном и иметь одну вьюху, которая будет перемещаться и окажется в том месте кто запросил ее последним.
	 loadScript:		'',
	 loadTemplate:	'',
	 loadCss:		''
	 });

	 Component(name, {attrs: {}, value: ''}, parent);
	 */
	$.Component = $.Class({
		init: function(self) {
			//window._CMP_ = self;
			$.defineProperty(self.extend, 'attr', {enumerable: true});
			$.defineProperty(self.extend, 'tagReg',	{enumerable: false});
			$.defineProperty(self.extend, 'tagCount',	{enumerable: false});

			self.static.getOwnerObject = $.__self__.static.getOwnerObject;
			//console.warn('$.Component:', self);
		},
		constructor: function(self, name, params, parent) {
			//console.warn('COMPONENT: ', name, params);

			name = name.toLowerCase();
			var componentCfg = self.static.components[name];
			if ( !componentCfg ) _throw_(new Error('Компонент `'+ name +'` не зарегистрирован'));

			if (!params) params = {};
			if (!params.attrs) params.attrs = {};
			if (!params.value) params.value = '';
			self.private.componentCfg = componentCfg;
			self.private.params = params;



			var component = params.owner ? $(params.owner) : $();
			/* Компоненту добавляем условие на проверку готовности */
			component.__self__.private.onReadyAddIf(function() {
				return self.private.startComplete && self.private.scope._STATUS_=='ready';
			});

			//self.private.component = component;

			$.when(function(end) {
				if ( componentCfg.loaded ) {
					end();
				} else {
					Modular.load(componentCfg, self.static.components, end);
				}
			}).then(function() {
				//if (params.preload) return;
				if ( componentCfg.name ) {
					var scope = $.Controller(componentCfg.controllerName);
					self.private.scope = scope;
					component.logicSet(scope);

					var status = 'init';
					$.defineProperty(scope, '_STATUS_', {
						get: function() {return status},
						set: function(s) {
							status = s;
							if (s=='ready') {
								component.__self__.private.onReadyCheckOut();
							}
						}
					});

					var attrs = {};
					$.defineMethod(attrs, 'setDefault', function(props) {
						props.forEach(function(value, name) {

							if ( !attrs.hasOwnProperty(name) ) {
								//console.log('set default for: ', name, value);
								attrs[name] = {
									value:		value,
									set:		function(newValue) {
										attrs[name].value = newValue;
									},
									eventAdd:	$.noop,
									bridge: 	function(cfg) {
										//console.info('[compot] attr.bridge (set default): ', value, cfg);
										cfg.destObject.modelSet(cfg.destPath.replace(/^(>>|<<)/,''), value);
									},
									isDefined:	false
								}
							}
						});
						return attrs;
					});

					$.defineMethod(attrs, 'setHandler', function(defaultHandlers) {
						defaultHandlers.forEach(function(value, name) {
							if (!attrs[name]) {
								attrs[name] = value;
								return
							}
							value = attrs[name].value;
							attrs[name] = $.isFunction(value) ? value : (function() {
								return function(){
									var _oCMPSelf	= self;
									var args		= arguments;
									var mvc			= parent;
									var component	= parent.component;
									var model		= parent.model;
									var M			= model;
									var E			= ENV;
									return eval('self = parent.logic; var _res=(function(){' + value+'})();self=_oCMPSelf; _res'); 			//eval use: self,model,mvc,event
								};
							})();
						});
						return attrs;
					});

					//console.log('[components: '+componentCfg.name+'] all params:', params);


					params.attrs.forEach(function(value, name) {
						if (0) {
							console.log('jscr atr:', value, name);
							// TODO проверить вдруг компонент создали из js и передали прямую функцию.

						} else if ( value!== undefined ) {
							if (value.modelPath ) {
								var owner = self.static.getOwnerObject(parent.__self__, value.owner);

								//console.log('[components: '+componentCfg.name+'] modelPath[',name,']:', value, '|  parent:',parent.__self__, '  |value:', owner.data.getPropertyByPath(value.modelPath), owner.self.public.modelGet(value.modelPath));

								if (owner.self) {
									owner.self.public.modelEventAdd('add change', value.modelPath, function(_1,_2, cfg) {
										//console.warn('change attr:', _1,_2, cfg);
										attrs[name].value = cfg.newValue; //parent.modelGet(value.modelPath);	//cfg.newValue; //
									});
									owner.self.public.modelEventAdd('add change', value.modelPath+'.**', function(_, path, cfg) {
										path = path.substr(value.modelPath.length+1);
										//console.warn('change', _, path, cfg);
										if (path) {
											if (attrs[name].value!== undefined) {
												//console.log(' attrs[name]:', attrs[name]);
												//! У детей вызывает сеттер, а не должно если в value - это модель от капсулы
												//attrs[name].value.setPropertyByPath(path,cfg.newValue);
												attrs[name].value.setPropertyByPath(path,
													{
														__frnActionSet__:	true,
														value:				cfg.newValue
													}
												);
											}
										} //parent.modelGet(value.modelPath);	//cfg.newValue; //
									});
									owner.self.public.modelEventAdd('delete', value.modelPath+'.**', function(_, path, cfg) {
										//console.log('cmp attr: del prop');
										path = path.substr(value.modelPath.length+1);
										if (path) attrs[name].value.deletePropertyByPath(path, cfg.newValue); //parent.modelGet(value.modelPath);	//cfg.newValue; //
									});
								}

								attrs[name] = {
									value:		owner.data.getPropertyByPath(value.modelPath), //public.modelGet(value.modelPath),
									set: function(newValue, cfg) {
										//console.log('[compot] set:', name, newValue, value, parent);
										//console.log('owner:', owner, value.modelPath);
										if (value && value.modelPath) {
											//parent.__self__.static.getOwnerObject(parent.__self__, value.owner).self.public.modelSet(value.modelPath, newValue, cfg);
											owner.self.public.modelSet(value.modelPath, newValue, cfg);
											attrs[name].value = newValue;
										} else {
											attrs[name].value = newValue;
										}
									},
									eventAdd: function(eventName, modelPath, fn) {
										if (!fn && $.isFunction(modelPath)) {
											fn = modelPath;
											modelPath = value.modelPath;
										} else {
											modelPath = value.modelPath + '.'+modelPath;
										}
										//console.log('event add: ', parent, eventName, modelPath);
										parent.modelEventAdd(eventName, modelPath, function(_1,_2, cfg) {
											//console.warn('[compot] run event:', eventName, modelPath);
											fn(_1,_2, cfg);
										});
									},

									bridge: function(cfg, params) {
										if (!params) {params = {};}
										if (owner.self) {
											var modelPath = cfg.modelPath!==undefined ? value.modelPath + '.'+ cfg.modelPath : value.modelPath;
											if (!params.direct) {
												//console.info('-bridge model to:', value, cfg, owner, params);
												cfg.destObject.modelBridge({
													modelPath:	cfg.destPath.replace(/^(>>|<<)/,''),
													destPath:	modelPath,
													destObject:	owner.self.public			//owner.self
												}, params);
												//console.log('--- end bridge:', value, cfg, owner, params);
											} else {
												delete params['direct'];
												owner.self.public.modelBridge({
													modelPath:	modelPath,
													destPath:	cfg.destPath.replace(/^(>>|<<)/,''),
													destObject:	cfg.destObject			//owner.self
												}, params);
											}
										} else {			//Если модель не в капсуле - тогде просто присваиваем значение
											cfg.destObject.modelSet(cfg.destPath.replace(/^(>>|<<)/,''), attrs[name].value);
										}
									},
									attrRef: owner && owner.self ? owner.self.public : undefined,
									attrRefPath: value.modelPath,
									isDefined:	true
								};


								//$.defineProperty(attrs[name], 'value', {
								//	get: function() {
								//		owner.data.getPropertyByPath(value.modelPath);
								//	},
								//	set: function() {}
								//});


							} else {
								//TODO: fix for events; now always undef =[
								var attrValue = {'onclick':1, 'onmouseover':1, 'onmouseout':1, 'onfocus':1, 'onblur':1, 'onchange':1, 'onkeydown':1, 'onkeyup':1}[name] ?
									params.node[name] : (value.hasOwnProperty('value') ? value.value : value);

								attrs[name] = {
									fv:			value,
									value:		attrValue,
									set:		$.noop,
									eventAdd:	$.noop,
									bridge: 	function(cfg) {
										//console.warn('BRIDGE COMPONENT:', cfg, value);
										//console.warn('CFG: ', arguments);
										//console.warn('VALUE: ', value);
										//console.log(cfg.destPath.replace(/^(>>|<<)/,''), value);
										cfg.destObject.modelSet(cfg.destPath.replace(/^(>>|<<)/,''), $.isHash(value) ? value.value : value);
									},
									isDefined:	true
								};
							}
						}
					});

					//console.log('componentCfg: ', componentCfg);
					var tagName = componentCfg.name;
					if (componentCfg.hidden) {
						scope._parent_ = parent.component;
						component.component = scope;
						scope.start(component, {attrs: attrs, content: params.content, tagName:tagName, parentNode: params.parentNode}, parent);
					} else {
						scope.start(component, {attrs: attrs, content: params.content, tagName:tagName, parentNode: params.parentNode}, parent);
						if (parent) {
							scope._parent_ = parent.component;
						}
						component.component = scope;
					}

					self.private.startComplete = true;
					if (scope._STATUS_ != 'wait') {scope._STATUS_ = 'ready'};

				} else if ( componentCfg.template ) {
					component.viewSet(componentCfg.template);
				} else {
					_throw_(new Error('Компонент `'+ name +'` должен содержать в конфиге имя контроллера, либо имя шаблона'));
				}
			});
			return component;
		},

		public:	{
		},

		private: {
			//componentCfg: {},
			//params:	{}

			//scope: undefined		// ==component.logic
			//component
			startComplete: false
		},

		static: {
			tagRegStr:	'',			// string of regexp for $.Component.tagReg
			components: {
				/*
				 name: {
				 config: {}
				 handler
				 loaded
				 }
				 */
			},
			getOwnerObject: undefined // $.__self__.static.getOwnerObject
		},

		extend: {
			attr:		{},		//	attrName: {tagName: fn}
			tagReg:		undefined,
			tagCount:	0,

			register: function(self, name, cfg) {
				name = name.toLowerCase();
				cfg.name = name;

				self.static.components[name] = cfg;

				if ( !cfg.controllerName ) {
					componentModules = self.static.components;
					sysComponent.load(cfg, self.static.components);
				} else {
					var nameCfg = name.splitAs(":", ['tagName', 'attrName']);

					var ext	= self.extend;
					if ( nameCfg.attrName ) {
						var attrCfg = nameCfg.attrName.splitAs("=", ['attrName', 'attrValue']);
						var attrIfValue = attrCfg.attrValue || '*';
						ext.attr.setPropertyByPath(attrCfg.attrName + '.' + nameCfg.tagName + '.' + attrIfValue, cfg);
					} else {
						ext.tagCount++;
						self.static.tagRegStr += (self.static.tagRegStr ? '|' :'') + "<(" + nameCfg.tagName + ")([^>]+?)?\/()>|<(" + nameCfg.tagName + ")( [^>]+?)?>([^\0]+?)?<\/" + nameCfg.tagName + ">";
						ext.tagReg = new RegExp(self.static.tagRegStr, "igm");
					}
				}
				return self.extend;
			}
		}
	});



/**
 * Маршрут роутера - всегда синглтон
 *
 Router.register({
	controllerName:	'myPage',		//optional
	url:				'/mypage',		//optional
	requireComponent:	''				//optional	Компоненты, которые необходимо предзагрузить до старта контроллера
	requireRoute:		''				//optional	Маршруты, которые необходимо предзагрузить до старта контроллера
	container:			'&::Root.body',	//optional
	templateName:		'',				//optional
	loadScript:		'',					//optional
	loadTemplate:		'',				//optional
	loadCss:			''				//optional
	disposable:			bool			//optional	Отключает bg(Если true, то при новом запуске init выполнится снова)
 });

 Доступные методы контроллера:
 prepare:	function()		//Вызывается единожды после загрузки контроллера
 init:		function()		//Инициализация контроллера
 start:		function()		//
 stop:		function()		//Вызывается при выгрузке контроллера
 use:		function()		//Вызывается если контроллер используется (Например если у двух контроллеров общий враппер и при переходе из первого контроллера ко второму враппер уже будет инициализирован и запущен, но у него вызовется метод use)

 Управляющие методы роутера:
 $.Router('ctrl:name')
 .start({campaignId: campaignId}, {urlInit:true, urlChange: false, restart:true});			Запустить контроллер
 .onReady(fn)						Выполнить функцию, после того как контроллер будет успешно проинициализирован и запущен

 */

	$.Router = $.Class({
		init: function(self) {
			if (ENV.system.routeDisabled) {alert(1) ;return; }
			self.extend._routes = self.static.routes;

			var setDependence = function(routeName) {
				var config = self.static.routes[routeName];
				var dep = [];
				var reqC = (config.requireComponent || []).toFlatArray();
				var reqR = (config.requireRoute || []).toFlatArray();
				if (config.parentName) {
					if (!self.static.routes[config.parentName]) {
						_throw_(new Error("Неправильная зависимость для: " + config.parentName + " в контроллере: " + config.name));
					}
					if (!self.static.routes[config.parentName].dependence) {
						setDependence(config.parentName);
					}
					dep = [].concat([config.parentName], self.static.routes[config.parentName].dependence);
					reqC = [].concat(reqC, self.static.routes[config.parentName].requireComponent);
					reqR = [].concat(reqR, self.static.routes[config.parentName].requireRoute);
				}
				config.dependence = dep;
				config.requireComponent = reqC;
				config.requireRoute = reqR;
			};

			window.addEventListener("DOMContentLoaded", function() {
				self.static.routes.forEach(function(route, routeName){
					setDependence(routeName);
				});
				self.extend.go();
			}, false);
			window.addEventListener("hashchange", self.extend.go, false);
		},

		constructor: function(self, name, cfg) {

			if (self.static.aliases[name]) {
				return $.Router(self.static.aliases[name], cfg);
			}

			var routeCfg = self.static.routes[name];
			if ( !routeCfg ) _throw_(new Error('Маршрут `'+ name +'` не зарегистрирован'));

			if ( routeCfg.routeInstance ) {			//Маршрут - всегда синглтон
				return routeCfg.routeInstance;
			} else {
				$.defineProperty(self.public, '__superscope__', {value : self});
				$.defineProperty(self.public, '__scope__', {value : self.public});
				routeCfg.routeInstance = self.public;
			}

			self.private.routeCfg = routeCfg;

			routeCfg.inner = $();

			var currentStatus = undefined;
			var changeStatus = {
				get: function() {
					return currentStatus;
				},
				set: function(newValue) {
					currentStatus = newValue;
					if (self.private.state) self.private.state.check();
				}
			};

			var usedCtrls;
			$.when(self,
				function(end) {
					sysComponent.check(end);
				},
				function(end) {
					if ( routeCfg.loaded ) {
						end();
					} else {
						Modular.load(routeCfg, self.static.routes, function(ctrls) {
							usedCtrls = ctrls;
							end();
						});
					}
				}
			).then(function() {
				if (!routeCfg.controllerName) {
					if (routeCfg.templateName) {
						routeCfg.handler = {
							init: function(params, wrapper) {
								wrapper.viewSet("@"+routeCfg.templateName);
							}
						};
					} else {
						if ($.Debug) console.warn("["+routeCfg.controllerName+"] К маршруту не привязан ни один контроллер");
						routeCfg.handler = {init: function() {}};
					}
				} else {
					routeCfg.handler = $.Controller(routeCfg.controllerName);
				}

				$.defineProperty(routeCfg, 'status', changeStatus);
				$.defineProperty(self.public, '_STATUS_', changeStatus);

				var o_init = routeCfg.handler.init;
				var o_start = routeCfg.handler.start;


				for (var methodName in routeCfg.handler) {
					if (!self.public[methodName]) {
						self.public[methodName] = routeCfg.handler[methodName];
					}
				}
				routeCfg.inner.logicSet(self.public);
				self.private.state = $.Stepper(routeCfg, 'step/status', (function(self, state) {
					//console.log('[chstate] params:', this._pid_, Object.keys(this));
					//console.log('[' + routeCfg.name + '] switch state:', state, routeCfg);
					switch (state) {
						case 'init/inited':
							document.body.style.cursor = 'wait';
							if (o_init && !self.private.routeCfg.inited) {
								o_init.call(self.public, self.private.startParams, routeCfg.inner);
							}
							if (routeCfg.status != 'wait') {
								routeCfg.status = 'ready';
							}
							break;

						case 'init/ready':
							routeCfg.inited = true;
							routeCfg.step = 'start';
							routeCfg.status = 'inited';
							break;

						case 'start/inited':
							//document.body.style.cursor = 'wait';
							var parentRouteName = routeCfg.parentRoute;
							if (parentRouteName) {
								var parentRoute = self.static.routes[parentRouteName];
								var insertInto = routeCfg.insertInto;
								if (!parentRoute.activeChilds[insertInto]) {
									parentRoute.activeChilds[insertInto] = [];
								}
								var parentChilds = parentRoute.activeChilds[insertInto];
								if (insertInto) {
									var $insertInto = insertInto == '_documentBody_' ? $(document.getElementById("mainBody")) : parentRoute.inner.shortcuts[insertInto];
									if (parentChilds.length) {
										var oldRouteName = parentRoute.currentChild.name;
										if (oldRouteName != routeCfg.name || self.private.otherParams) {
											var oldRouteId = self.static.activeRoutes.indexOf(oldRouteName);
											//console.info('delete active route:', oldRouteName);
											if (oldRouteId !=-1) delete self.static.activeRoutes[oldRouteId];
											self.extend.switchControllers($insertInto, parentRoute.currentChild.inner, routeCfg.inner, function() {
												if (self.public.started) self.public.started(self.public);
											});
										}
									} else {
										//console.log('[Router| '+parentRouteName+' ] set active child: "', routeCfg.name,'"', parentChilds);
										parentChilds.push(routeCfg.name);
										$insertInto.appendChild(routeCfg.inner);
									}
									parentRoute.currentChild = routeCfg;
								}
							}
							if (o_start) o_start.call(self.public, self.private.startParams, routeCfg.inner);

							if (routeCfg.status == 'inited') {
								//console.info('[start/inited] complete; set ready status');
								routeCfg.status = 'ready';
							}

							break;

						case 'start/ready':
							//console.info('['+self.private.routeCfg.name+'] started');
							document.body.style.cursor = 'auto';
							self.private.routeCfg.onStartBuffer.run();
							self.private.routeCfg.onStartBuffer.clear();
							routeCfg.started = true;
							routeCfg.status = 'started';
							self.static.initCount--;
							//console.log('route ready: ', routeCfg.name, self.static.initCount);
							if (routeCfg.url) {
								self.extend.inited = true;
								self.static.initCount = 0;
							}
							break;

						case 'stop/halt':
							routeCfg.started = false;
							if (!routeCfg.disposable) {
								routeCfg.status = 'paused';
							} else {
								routeCfg.inited = false;
							}
							var oldRouteId = self.static.activeRoutes.indexOf(oldRouteName);
							//console.info('delete active route:', oldRouteName);
							if (oldRouteId !=-1) delete self.static.activeRoutes[oldRouteId];
							break;

						case 'stop/break':
							routeCfg.started = false;
							routeCfg.inited = false;
							var oldRouteId = self.static.activeRoutes.indexOf(routeCfg.name);
							//console.info('delete active route:', routeCfg.name);
							if (oldRouteId !=-1) delete self.static.activeRoutes[routeCfg.name];

						case 'stop/pause':
							break;
					}
				}).bind(self, self));


				routeCfg.onLoadBuffer.run();
				routeCfg.onLoadBuffer.clear();

				if (usedCtrls) usedCtrls.forEach(function(ctrl) {
					var prepRoute = $.Router(ctrl.name);
					if (prepRoute && prepRoute.prepare && !ctrl.prepared) {
						ctrl.prepared = true;
						prepRoute.prepare();
					}
				});
			});
		},

		public: {
			/**
			 *
			 * @param self
			 * @param params
			 * @param cfg
			 * 			cfg.params
			 */
			start: function(self, params, cfg) {

				self = self.__superscope__;
				var routeCfg = self.private.routeCfg;

				if (routeCfg.disposable && routeCfg.routeInstance && routeCfg.status == 'halt') {		//Если маршрут одноразовый и старый хендлер существует, то стираем его и перезапускаемся
					routeCfg.routeInstance = undefined;
					//console.log('disposable route: ', routeCfg.name, ' -restarting');
					$.Router(routeCfg.name).start(params, cfg);
					return;
				}

				//;;;console.info('[' + self.private.routeCfg.name + '] try start; ', self.static.initCount, cfg, routeCfg);
				//;;;console.log('new Route:', routeCfg.name, '   old Route:', ENV.system.currentRoute, self.static.initCount);
				//Если еще один маршрут не прогрузился, а ктото запускает второй, то первый надо убить
				if ( routeCfg.url && self.static.initCount!==0 && ENV.system.currentRoute!= routeCfg.name && (!cfg || (cfg && !cfg.isParent )) ) {
					//console.log('kill', ENV.system.startsRoute, '  cfg:', arguments);
					self.static.initCount-=2;
					$.Router(ENV.system.startsRoute).__self__.private.routeCfg.step = 'break';
				}
				if (routeCfg.url) {
					ENV.set('system.startsRoute', routeCfg.name);
				}


				self.static.initCount++;


				if (params) {
					self.private.otherParams = JSON.stringify(params) != JSON.stringify(self.private.startParams);
					self.private.startParams = params;
				} else {
					params = self.private.startParams;
				}
				if (!cfg) cfg = {};




				/* смена урла */
				if (routeCfg.url && (cfg.urlChange !==false || cfg.urlInit)) {

					/*Останавливаем текущий контроллер*/
					var current = ENV.get('system.currentRoute');
					if ($.isFound(current)) {
						var curRouteCfg = self.static.routes[current];
						if (curRouteCfg.step != 'break') {
							curRouteCfg.step = 'stop';
							curRouteCfg.status = 'halt';
							var currentRoute = $.Router(current);
							if (currentRoute.stop) {
								currentRoute.stop.call(currentRoute);
							}
						}
					}

					var urlParams = Object
						.keys(self.private.startParams)
						.filter(function(value) {return routeCfg.url.mask.indexOf('{{M.'+ value +'}}') ==-1 ?  value : false})
						.map(function(name) {return name + '=' + self.private.startParams[name];})
						.join('&');
					var url = $('!' + routeCfg.url.mask).modelSet({}.extendByClone(params), {forceRender: true}).viewGet();

					if (ENV.get('system.currentUrl') != ('/#' + url)) {
						ENV.set('system.referrerUrl', ENV.get('system.currentUrl'));
						ENV.set('system.referrerRoute', ENV.get('system.currentRoute'));
					}

					ENV.set('system.URIparams', self.private.startParams);
					ENV.set('system.currentUrl', '/#' + url);
					ENV.set('system.currentRoute', routeCfg.name);

					$.G.modelSet('system.currentRoute', routeCfg.name);

					//console.log('- start controller:', routeCfg.name, self.private.startParams);
					if (cfg.urlChange !==false) {
						document.location.hash = ('#' + url + (urlParams ? '?' + urlParams: ''));
						//console.log('url change; hashchange & exit;');
						return;
					}
				}

				routeCfg.step = 'start';

				var whenFn = [function(end) {
					var base = routeCfg.parentRoute;
					var baseReady = false;
					if (base) {
						//;;;console.log('need base: '+base);
						if (self.static.activeRoutes.indexOf(base)!=-1) {
							baseReady = true;
						}

						if (baseReady) {
							//console.log('base ready:' + base);
							var baseRoute = $.Router(base);
							if (baseRoute.use) baseRoute.use();
							end();
						} else {
							//console.log('  start base:', base);
							$.Router(base).start({}, {
								urlChange:	true,
								isParent:	true,
								callback: function() {
									var baseRoute = $.Router(base);
									if (baseRoute.use) baseRoute.use();
									end();
								}
							});
						}
					} else {
						end();
					}

				}];

				var run = function() {
					//console.warn('run loading...');
					$.when(whenFn).then(function() {
						//console.log('run: ', routeCfg.name, routeCfg.step);
						if (routeCfg.step == 'break') {
							//console.log('['+routeCfg.name+'] break');
							return;
						}
						var pageTitle = ENV.get('system.titles')[routeCfg.name];
						if (pageTitle) {
							window.document.title = pageTitle;
						}

						self.static.activeRoutes.push(routeCfg.name);

						if (cfg.callback) routeCfg.onStartBuffer.push(cfg.callback);

						//;;;console.warn('['+routeCfg.name+'] change status to: start', self.private.startParams);
						//console.log('[.start:run] params:', self._pid_);		//.private.startParams
						if (routeCfg.status == 'started') {
							//;;;console.warn('['+routeCfg.name+'] already started');
							routeCfg.step = 'start';
							routeCfg.status = 'inited';
						} else {
							routeCfg.step = 'init';
							routeCfg.status = 'inited';
						}

					});
				};

				//;;;console.warn('WAIT LOADING', routeCfg);
				routeCfg.onLoaded(run.bind(self));
				return self.public;
			},

			onReady: function(self, routeInstance) {
				self = self.__superscope__;
				if (self.private.routeCfg.status == 'ready' && self.private.routeCfg.state == 'started') {
					//console.log('[onready: '+self.private.routeCfg.name+']', self.private.routeCfg);
					routeInstance();
				} else {
					//console.log('[onready] push:', self.private.routeCfg.name);
					self.private.routeCfg.onStartBuffer.push(routeInstance);
				}
				return self.public;
			},

			onLoad: function(self, fn) {
				self.private.routeCfg.onLoaded(fn);
			}
		},
		private: {
			state:			undefined,		//current state
			routeCfg:		undefined,
			startParams:	{}
		},
		static: {
			urlPrefix: '!',
			urlsIdx: {},
			aliases: {},
			routes: {},		// routeName: {conf}
			activeRoutes:	[],
			initCount:	0
		},
		extend: {
			location: {
				url:			undefined,
				referer:		undefined,
				controllerName:	undefined
				//params: 	{}
			},
			inited:	false,

			go: function(self, url, params) {
				if (!params) params = {};
				if (self.static.routes[url]) {
					var routeCfg = self.static.routes[url];

					//self.extend.go(routeCfg.url.mask);			//TODO: replace params in mask
					$.Router(routeCfg.name).start(params, {urlInit:true, urlChange: true, restart:true});

				} else {

					if ( !$.isString(url) ) url = document.location.hash;
					url = url.replace(/^\/?#[\/]+/, '/');
					//console.log('[go] envUrl:', ENV.system.currentUrl, url);

					if (document.location.hash === undefined || document.location.hash == '') {url = '/';}

					//ENV.system.currentUrl != ('/#'+url) &&

					if (  (url !== self.extend.location.hash || document.location.hash === undefined) ) {
						var urlCfg = url.splitAs('?', ['url', 'params']);
						if (urlCfg.params) {
							urlCfg.params.replace(/([^=]+)=([^&]+)&?/g, function(_r, name, value) {
								params[name] = value;
							});
						}
						var is404 = true;
						self.static.routes.forEach(function(routeCfg, name) {
							//console.info(' check routeCfg ['+name+']  /'+ url +': ', routeCfg, urlCfg.url );
							if ( routeCfg.url && routeCfg.url.reg.test(urlCfg.url) ) {
								routeCfg.url.params.forEach(function(paramName, id) {
									params[paramName] = RegExp['$' + (id+1)];
								});
								is404 = false;
								//;;;console.warn('[ROUTER] ['+routeCfg.name+'] go: ', url, params);
								$.Router(routeCfg.name).start(params, {urlInit:true, urlChange: false, restart:true, maker:'.go'}); //{urlChange: false, params: params});
								return false;
							}
						});
						if (is404 && self.static.aliases['404']) $.Router('404').start();
						//alert('404');
					}
				}

			},

			register: function(self, name, cfg) {
				//;;;console.log('add route: ' + name+ (cfg.url ? ' ['+cfg.url+']' : ''));

				var route = cfg.extendByClone({
					name:				name,
					routeInstance:		undefined,		// self.public cache
					handler:			undefined,		// Инстанс контрлолера маршрута (обработчик)
					dependence:			[],				// Список зависимостей от родителей (строится автоматически по parentRoute)
					requireComponent:	[],				// *Список компонентов, скрипты которых надо тоже прогрузить
					requireRoute:		[],				// *Список маршрутов, скрипты которых надо тоже прогрузить

					activeChilds:		{},				// Запущенные потомки
					currentChild:		{},				// Текущее активное дитя, имеющее урл
					loaded:				undefined,		// Загрузился (выставляет Modular в процессе загрузки)
					inited:				false,			// Init выполнился
					started:			false,			// Start выполнился

					step:		'noop',			// noop, init, start
					status:		'noop',			// loading, loaded, wait, ready

					onLoaded: 	function(fn) {
						if (route.loaded) {
							fn();
						} else {
							route.onLoadBuffer.push(fn);
						}
					},
					onStart: function() {

					},
					onStop: 	function() {

					}
				});
				if (cfg.alias) {
					self.static.aliases[cfg.alias] = name;
				}

				route.onLoadBuffer	= $.Transaction();		 //Складываются вызовы если контроллер запускают, но он еще грузится
				route.onStartBuffer	= $.Transaction();		 //Складываются вызовы если контроллер запускают, но он еще грузится
				route.onStopBuffer	= $.Transaction();


				if (cfg.url) {
					ENV.system.route[name] = '/#'+cfg.url;
					var url = {
						mask: cfg.url,
						params: []
					};
					url.reg = new RegExp('^' + cfg.url.replace(/{{M.([\w\.]+)}}/g, function(_r, name) {
						url.params.push(name);
						return "(.*)?";
					}) + '$');
					url.uniq = cfg.url.replace(/{{\w+\.}}/g, '@DYN@');
					if ( self.static.urlsIdx[url.uniq] ) {
						_throw_(new Error('Невозможно зарегистрировать роутинг ['+name+']: заданный URL['+cfg.url+'] уже пренадлежит другому маршруту[' + self.static.urlsIdx[url.uniq] + ']'));
					} else {
						self.static.urlsIdx[url.uniq] = cfg.url;
						route.url = url;
					}
//					console.log('reg url:', url.uniq);
				}



				self.static.routes[name] = route;

				return self.extend;
			},

			switchControllers: function(self, container, oldMVC, newMVC, started) {
				oldMVC.hide();
				container.empty();
				container.appendChild(newMVC);
				newMVC.show();
				container.fadeIn(200, function() {
					started();
				});
			}
		}
	});






})();


/* ---------------------------------------------------------------------------------------*/

/**
Component.register(name, {				// пример:  name = 'tagName:AttrName'; name = '*:disabled';
	controllerName:	'name',
	multiple:		true || false		//Если false, то контроллер будет синглтоном и иметь одну вьюху, которая будет перемещаться и окажется в том месте кто запросил ее последним.
});
*/


