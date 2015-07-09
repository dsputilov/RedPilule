/**
 * @fileOverview This file has functions related to documenting JavaScript.
 * @author <a href="mailto:javascript@programist.ru">Dmitri Putilov</a>
 * @version 4.0.1
 *
 */

"-use strict";

/**
 * @class 		RedPilule
 * @description	create RPObject
 * @params		{*} Selector
 * @returns		{Object}	Ferna object.
 */

$ = $.Class( $, {
	init: function(self) {

		// Binding View -> Model
		var inputEventHandler = function(e) {
			var target = e.target || e.srcElement;
			//;;;console.info('GLOBAL E:', e,  '   SELF:',self, target);
			if (!target) return;

			var cfg = self.static.ioData[target.nodeId];
			if ( cfg ) {
				//;;;console.info('keybord/mouse event on: ', cfg);
				var isChanged = false;
				var value;
				var owner;
				if ( target.nodeName == 'INPUT' ) {
					//console.info('input change');
					if (target.type == 'checkbox') {
						value = target.checked;
					} else if (target.type == 'radio') {
						if (e.type == "DOMSubtreeModified") return;
						owner = self.static.getOwnerObject(cfg.objSelf, cfg.owner);
						value = $.isFunction(cfg.forceValue) ? cfg.forceValue(owner.self) : cfg.forceValue;
					} else if (e.type == 'click') {
						return;
					} else {
						value = target.value;
					}
					isChanged = true;
				} else if ( target.nodeName == 'TEXTAREA' ) {
					if (e.type == 'click') {
						return;
					} else {
						value = target.value;
						isChanged = true;
					}
				} else if (target.isContentEditable == true) {
					value = target.innerHTML;
					isChanged = true;
				}

				if (isChanged) {
					//;;;console.log('set value['+cfg.modelPath+']: ', value,  '   [nodeId: '+target.nodeId+']    cfg:', cfg);
					if (cfg.adapters) {
						value = cfg.objSelf.private.adapterApply(value, '<<', cfg.adapters);
						if (cfg.usedPaths) cfg.modelPath = cfg.usedPaths.anyValue.modelPath;
					}
					//if (cfg.adapters) value = self.static.adapterApply(value, '<<', cfg.adapters);

					//console.log('['+cfg.modelPath+'] setvalue: ', value, '|   exclude:', target);
					if (!owner) owner = self.static.getOwnerObject(cfg.objSelf, cfg.owner);
					owner.self.public.modelSet(cfg.modelPath, value, {viewExclude: target});
					//cfg.objSelf.public.modelSet(cfg.modelPath, value);
				}

			}

			//console.info('parent:', parent);
			//console.info('GLOBAL E:', e.rangeParent);
			//alert('body');
		};
		document.addEventListener('input', inputEventHandler, true);
		//document.addEventListener('DOMSubtreeModified', inputEventHandler, true);	// для IE contenteditable	//После рендеринга срабатывает евент и еще раз отправляет на рендеринг, ломая value (проблема возникала при рендеринга массива в форе)
		document.onclick = inputEventHandler;

		//Храним все бриджы
		//self.static.bridges = $.Dispatcher();

		/*
		var DOMMutateHandler = function(e) {
			console.info(e.target);
		};*/
		/*
		document.addEventListener('DOMActivate', inputEventHandler, true);
		document.addEventListener('DOMAttrModified', inputEventHandler, true);
		document.addEventListener('DOMCharacterDataModified', inputEventHandler, true);
		*/
		/*
		*/
	},


	constructor: function(self, selector, parent) {
		//CT.start('pidgen');
		var pid = 'rp' + self._pid_; //Number.uid();
		//CT.stop('pidgen');
		//;;;console.info('| SELECTOR ['+pid+']: ', selector, ',  SELF: ', self);
		$.defineProperty(self.public, 'pid', {value: pid});

		self.static.pids[pid] = self;

		//Set disatcher for each event
		['set', 'add', 'change', 'beforeSet', 'delete', 'error'].forEach(function(eventName) {
			self.private.modelEvents[eventName] = $.Dispatcher({
				create: function () {
					return $.Transaction();
				},
				add: function(transaction, handler) {
					transaction.push(handler, null, [eventName]);
				}
			});
		});
		self.private.dataTypes = $.Dispatcher({
			create: function() { return {}; },
			add: function(obj, value) {obj.value = value;},
			get: function(obj) { return obj.value }
		}, 'left');

		if ( parent ) {
			self.public.modelUse(parent);
		} else {
			self.private.modelDefineProperty({ obj: self.public, objPath: '', prop: 'model', modelPath: '', value:{} }, {init:true} );
		}

		if ( !selector ) {
			self.private.view.templateSrc = '';
			self.private.view.fragment = document.createDocumentFragment();
		} else if ( $.isString(selector) ) {
			var objSelf = self.static.pids[selector];
			if ( objSelf ) {
				return objSelf.public;
			}
			self.private.templateBuild(selector);
		} else if ( $.isNode(selector) ) {
			self.private.view.node = selector;
			self.private.view.type = 'node';
			self.private.view.stashed = false;
			self.private.view.fragment = document.createDocumentFragment();
		} else if ( $.isRP(selector) ){
			return selector;
		} else if (self.static.pids[selector]) {
			return self.static.pids[selector];
		} else {
			console.warn('Selector: ', selector);
			_throw_(new Error('unknown type of selector'));
		}

		$.defineProperty(self.public, 'view', {
			get: function() {
				if (self.private.view.type =='node') {
					return [self.private.view.node];
				} else {
					var view = [];
					var point;
					if (!self.private.view.stashed) {
						point = self.private.view.pointerStart.nextSibling;
						while ( point!=self.private.view.pointerEnd ) {
							view.push(point);
							point = point.nextSibling;
						}
					} else {
						self.private.view.fragment.forEach(function(el) {
							view.push(el);
						});
					}
					return view;
				}
			},
			set: $.noop,
			enumerable: true
		});

		$.defineProperty(self.public, 'logic', {
			get: function() {
					return self.private.parent ? self.private.parent.logic : self.public.logicGet();
				},
			set: self.public.logicSet.bind(self.public),
			enumerable: true
		});

		self.private.viewInitDimension();
	},


	chainDisabled: ['getElementByModelPath', 'logic', 'modelGet', 'viewGet'],

	public: {
		//view:		[],				// Создается конструктором с g/s
		//model:	{},				// Создается конструктором с g/s
		pid:		undefined,
		shortcuts:	{},

		modelGet: function(self, path, cfg) {
			//CT.start('modelGet');
			var ret;
			if (!path || path=='~') {
				ret = self.public.model;
			} else {
				if ( !(cfg && cfg.absPath)) path = 'model.'+path;
				ret = self.public.getPropertyByPath(path);
			}
			//console.info('modelGet ['+self.public.pid+ ', '+path+'] ', ret);
			//CT.stop('modelGet');
			return ret;
		},

		modelUse: function(self, parent) {
			if ( !$.isRP(parent) ) _throw_(new Error('modelUse: В качестве аругмента должен быть передан объект RP, чью модель необходимо использовать'));
			if (self.private.parent && self.private.parent.pid == parent.pid) return;

			self.private.parent = parent;
			var parentSelf = parent.__self__;
			//;;;console.log('['+self.public.pid+'] self:', self ,', inherit model ', parentSelf, '['+parentSelf.public.pid+']');
			delete self.public.model;
            self.public.model 						= parentSelf.public.model;
            //self.public.logic 					= parentSelf.public.logic;
			self.public.shortcuts					= parentSelf.public.shortcuts;
			self.public.component					= parentSelf.public.component;
			self.private.modelEvents				= parentSelf.private.modelEvents;
			self.private.eventStack					= parentSelf.private.eventStack;
			self.private.dataTypes					= parentSelf.private.dataTypes;
			self.private.scope						= parentSelf.private.scope;
			//self.private.view.tplObject.bindData	= parentSelf.private.view.tplObject.bindData;


			/* OPTIMIZE: воще какая то жесть. Надо както оптимайзить и хранить прямые указатели. Много много думать. [rend:160ms]*/
			parentSelf.public.modelEventAdd('set add delete', '~ **', function(event, path, cfg) {
				//console.log('[' + parentSelf.public.pid + '; ' + self.public.pid + ' model use] prerend', event, path, cfg, cfg.viewExclude);
				//CT.start('render bridged');
				self.private.modelRenderPath(path, cfg);
				//CT.stop('render bridged');
			});

			if ( !self.static.shares ) self.static.shares = $.MTM();
			self.static.shares.add(self.public.pid, parentSelf.public.pid);
			self.private.modelRenderAll();			//Перерендериваем все данные, согласно новой установленной модели

		},

		/* *
		 * @name	modelSet	Установить значение в модели
		 * @param	path		[optional] Путь в модели, которому присвоить значение.				Пример: modelSet('user.name', 'Merlin', {});
		 * @param	value		[optional] Значение, либо хеш с парами 'Путь в модели':значение.	Пример:	modelSet({'user.name': 'Merlin', 'balance': 100}, {});
		 * @param	cfg			Конфигуратор.

			Пример использования:
			modelSet(path, value);
			modelSet({key: value})

		 */
		modelSet: function(self, path, value, cfg) {		//value can be Object
			//console.warn('[modelSet] ', path, value, cfg);
			var set = function(path, value) {
				//console.warn('['+self.public.pid+'] MODELSET  path: '+path , '|    value: ', value, typeof value);
				self.private.modelDefineProperty({modelPath: path, value: value}, cfg);
			};

			if ( $.isHash(path) ) {
				cfg = value;
				value = path;
				path = '~';
			}
			//console.log('path:',path, 'value:', value, ' cfg:',cfg);
			if (!path && path!=='') {
				value.forEach(function(modelValue, modelPath) {
					var cfg = modelPath.splitAs(':', ['modelPath', 'type']);
					if (cfg.type) {
						self.public.modelSetType(cfg.modelPath, cfg.type);
					}
					set(cfg.modelPath, modelValue);
					//self.private.modelDefineProperty({modelPath: cfg.modelPath, value: modelValue}, cfg);
				});
			} else {
				set(path, value);
			}
		},
		/* *
		 * @name	modelMerge	Подмержить хэш value в модель по пути path.
		 * @param	path		[optional] Путь в модели, которому присвоить значение.				Пример: modelSet('user.name', 'Merlin', {});
		 * @param	value		[optional] Значение, либо хеш с парами 'Путь в модели':значение.	Пример:	modelSet({'user.name': 'Merlin', 'balance': 100}, {});
		 * @param	cfg			Конфигуратор. cfg.force == true, то перезаписываем то, что есть в модели дефолтными значениями, иначе пишем только отсутствующие свойства

		 Пример использования:
		 modelSet(path, value);
		 modelSet({key: value})

		 */
		modelMerge: function(self, path, value, cfg) {
			if (!path) return;
			cfg = cfg || {};
			//cfg.transactionId = Number.uid();
			var set = function(path, value) {
				if (self.public.model.hasPropertyByPath(path)) {
					var oldVal = self.public.model.getPropertyByPath(path);
					if ($.isHash(oldVal) || $.isArray(oldVal)) {
						oldVal.extendByClone(value, {force: cfg.force});
					} else {
						if (cfg.force) self.public.modelSet(path, value, cfg);
					}
				} else {
					self.private.modelDefineProperty({modelPath: path, value: value}, cfg);
				}
			};

			if ( $.isHash(path) ) {
				cfg = value || {};
				value = path;
				path = '';
			}
			if (!path) {
				value.forEach(function(modelValue, modelPath) {
					var cfg = modelPath.splitAs(':', ['modelPath', 'type']);
					if (cfg.type) {
						self.public.modelSetType(cfg.modelPath, cfg.type);
					}
					set(cfg.modelPath, modelValue);
				});
			} else {
				set(path, value);
			}
		},	//value can be Object

		/**
		 *
		 * @param self
		 * @param cfg
		 * @example
		 * 		.modelBridge(cfg)
		 * 			cfg.destObject	//Обьект из которого берется модель
		 * 			cfg.destPath	//Путь обьекта, на который делается указатель
		 * 			cfg.modelPath		//Путь обьекта, который становится указателем
		 *
		 * 		.modelBridge({fromObject})	//Собственная модель будет целиком ссылаться на удаленную
		 * 		---- .modelBridge(fromObject, toPath)	//В определенный путь моей модели  создать ссылку на целую удаленную модель
		 * 		--- .modelBridge(toPath, fromPath)	//В своей модели по пути toPath сделать указатель на
		 */

		modelBridge: function(self, cfg, options) {			// Удаленный объект, куда линкую (локальный путь), что линкую (удаленный путь)
			if (!options) options = {};
			if ( $.isRP(cfg.destObject) && !cfg.destPath && !cfg.modelPath ) {					//	$().modelBridge(fromObj);
				self.public.model = cfg.destObject.__self__.public.model;
			} else if ( cfg.modelPath ) {
				var stream = false;
				cfg.toPath = cfg.modelPath = cfg.modelPath.replace(/^(>>|<<)/, function(_, s) { stream = s; return ''; });


				var objectSelf = self;
				var destObjectSelf = cfg.destObject ? cfg.destObject.__self__ : self;

				var destObject = destObjectSelf.public;
				var destPid = destObject.pid;
				var srcPid = objectSelf.public.pid;


				var setBridge = function(params) {
					//console.warn('bridge: ', params, cfg);
					self.static.bridges.set(params.srcPid + '.' + params.modelPath, params);
					if (options.childObserve!==false) self.static.bridges.set(params.srcPid + '.' + params.modelPath + '.**', params);
				};

				if ( !stream || stream == '>>' )	setBridge({modelPath: cfg.destPath, destPath: cfg.modelPath, srcPid: destPid, destPid: srcPid, destSelf: objectSelf});
				if ( !stream || stream == '<<' )	setBridge({modelPath: cfg.modelPath, destPath: cfg.destPath, srcPid: srcPid, destPid: destPid, destSelf: destObjectSelf});


				if ( destObject.model.hasPropertyByPath(cfg.destPath) ) {
					var linkedValue =  destObject.model.getPropertyByPath(cfg.destPath);
					if (cfg.modelPath !== '~' && self.public.modelGet(cfg.modelPath) !== linkedValue) {

						//console.log(' =linkedValue: ', linkedValue, self.public.modelGet(cfg.modelPath));

						self.private.modelDefineProperty({modelPath: cfg.modelPath, value: linkedValue}, {excludeBridge: destPid+'.'+cfg.destPath, event:false, view:false, childObserve: options.childObserv});
					}
				} else {
					destObjectSelf.private.modelDefineProperty({modelPath: cfg.destPath, value: undefined}, {event:false, view:false, excludeBridge: srcPid+'.'+cfg.modelPath, childObserve: options.childObserv});
					if (cfg.modelPath !== '~') self.private.modelDefineProperty({modelPath: cfg.modelPath, value: undefined}, {event:false, view:false, excludeBridge: destPid+'.'+cfg.destPath, childObserve: options.childObserv});
				}
			}
		},

		modelGetBridged: function(self, path, pid, origValue) {
			//console.warn('search bridged for:', path, pid||self.public.pid, self);
			var bridgedPaths = [];

			var addBridged = function(pid, checkPath, exclude) {

				var pids = [pid];
				if (self.static.shares) {
					var shares = self.static.shares.get(pid);
					if (shares) Array.prototype.push.apply(pids, shares);
				}
				//console.warn('all pids:', pids);
				pids.forEach(function(pid) {

					//Добавляются только значения с уникальными хешами. Если модели подцеплены через modelUse, то в результате будет только один объект с этой моделью (чтобы при сете не срать в нее несколько раз).

					var bridges = self.static.bridges.get(pid+'.'+checkPath);
					//console.log('[bridges for pid: '+pid+':'+checkPath+']    bridges: ', bridges, '    |bridges dsp:',self.static.bridges);

					if (Object.keys(bridges).length>0) {
						bridges.forEach(function(bridge, path) {
							bridge.forEach(function(bridgeCfg) {

								if ( exclude && exclude.indexOf(bridgeCfg.destPid +'.'+bridgeCfg.destPath)!=-1 ) return;
								//console.info('find bridge:', bridge, '   |destpid:', bridgeCfg.destPid, '   |path:', path);

								var modelPath = bridgeCfg.destPath;
								var offset = path.indexOf('**');
								if (offset!=-1) modelPath += '.' + checkPath.substr(offset-pid.length-1);

								var pathCfg = {
									modelPath:	modelPath,
									//value:		origValue,
									fullPath:	'model.' + modelPath,
									objSelf:	bridgeCfg.destSelf
								};
								if (origValue!==undefined) pathCfg.value = origValue;
								self.private.modelPropsInit(pathCfg);				// TODO: ищем pathCfg.obj, както оптимизировать мб ?

								//console.log('+ add to result:', pathCfg.objSelf.public.pid, '     start subsearch from this');
								bridgedPaths.push(pathCfg);
								addBridged(pathCfg.objSelf.public.pid, pathCfg.modelPath, pid+'.'+checkPath);
							});
						});
					}
				});
			};



			addBridged(pid || self.public.pid, path, '');
			//console.log('search result: ', bridgedPaths);
			return bridgedPaths;
		},

		modelBridgesClearAll: function() {

		},

		/**
		 *
		 * @param self
		 * @param path
		 * @param cfg		[option]{data, event, bind}
		 */
		modelDelete: function(self, path, cfg) {
			//TODO: Необходимо проверять вдруг этот путь должен баиндиться на вьюху, тогда надо ее не удалять, а enumerable:false и обнулять


			if (!cfg) cfg = {};

			var del = function(objSelf, path) {
				//console.log('   del path:', path);
				var obj = objSelf.public.model;
				var nodes = path.split('.');
				var prop = nodes[nodes.length-1];
				nodes.length--;
				if (nodes) {
					nodes.forEach(function(nodeName) {
						//console.log(obj, nodeName);
						obj = obj[nodeName];
					});
				}
				//console.info('delete ['+path+']: ', obj, ', prop:' + prop);
				cfg.oldValue = obj[prop];
				delete obj[prop];
				cfg.transactionId = Number.uid();
				objSelf.public.modelEventFire('delete', path, cfg);
				objSelf.public.modelEventFire('delete', path+'.**', cfg);
				objSelf.private.modelRenderParentPath(path);
			};


			var changedPaths = [{objSelf: self, modelPath:path}];
			//Array.push.apply(changedPaths, self.public.modelGetBridged(path));
			changedPaths = changedPaths.concat(self.public.modelGetBridged(path));


			//console.info('delete:', changedPaths);

			changedPaths.forEach(function(pathCfg) {
				del(pathCfg.objSelf, pathCfg.modelPath);
			});
		},

		//modelQuerySelector: function(self) {},			//moveTo Object.prototype.propertyQuerySelector
		//modelFilterAdd: function(self) {},

		modelEventAdd: function(self, eventNames, paths, handler) {	//beforeSet, change, set, delete
			paths = paths.trim().split(/\s+/);
			eventNames.trim().split(/\s+/).forEach(function(eventName) {
				if ( {'set':1, 'change':1, 'add':1, 'beforeSet':1, 'delete':1, 'error': 1}[eventName] ) {
					paths.forEach(function(path) {
						if ( path != '~' && path.indexOf('*') == -1 && !$.isFound(self.public.model.getPropertyByPath(path)) ) {
							self.private.modelDefineProperty({modelPath: path}, {setValue: false});
						}
						//console.log('=add event:'+eventName+'; path:',path);
						self.private.modelEvents[eventName].set(path, handler);
					});
				} else {
					_throw_(new Error("modelEventAdd: unknown eventName [" + eventName + "]"));
				}
			});
		},

		modelEventRemove: function(self, eventName, paths) {

		},

		modelEventFire: function(self, eventName, paths, cfg) {
			if (!paths) paths = '~';
			var hasConfig = true;
			if (!cfg) {
				hasConfig = false;
				cfg = {};
			}
			paths = paths.trim().split(/\s+/);

			//;;;console.log('['+self.public.pid+'] run event:', eventName, paths, cfg);

			if ( {'set':1, 'add':1, 'change':1}[eventName] ) {
				//console.info('run event: ',eventName);
				paths.forEach(function(path) {

					if (hasConfig) {
						self.private.modelEvents[eventName].get(path).forEach(function(transaction) {
							transaction.run({}, [path, {type: '-todo:rp_560-', oldValue: cfg.data.oldValue, newValue: cfg.data.newValue, initiator:cfg.data.initiator, transactionId: cfg.transactionId, viewExclude: cfg.viewExclude}]);
						});
					} else {
						self.private.modelEvents[eventName].get(path).forEach(function(transaction) {
							transaction.run({}, [path, { newValue: self.public.modelGet(path) }]);
						});
					}
				});
			} else if ( eventName == 'beforeSet' ) {
				var allowChange = true, ret = [];
				paths.forEach(function(path) {
					self.private.modelEvents[eventName].get(path).forEach(function(eventTreansaction, modelPath) {
						var res = eventTreansaction.run({}, [path, {type: '-todo:rp_572-', oldValue: cfg.data.oldValue, newValue:cfg.data.newValue, viewExclude: cfg.viewExclude, initiator:cfg.data.initiator, transactionId: cfg.transactionId}]);
						ret.push(res);
					});
				});
				var flatRet = ret.toFlatArray();
				flatRet.forEach(function(r) {
					if ( r === false ) allowChange = false;
				});
				return allowChange === false ? false : flatRet;
			} else if ( eventName == 'error' ) {
				paths.forEach(function(path) {
					self.private.modelEvents[eventName].get(path).forEach(function(transaction) {
						transaction.run({}, [path, cfg.data]);
					});
				});
			} else if ( eventName == 'delete' ) {
				paths.forEach(function(path) {
					self.private.modelEvents[eventName].get(path).forEach(function(transaction) {
						//console.log('DELETE TRANSACTION['+path+']:', transaction);
						transaction.run({}, [path, {type: '-todo:rp_line_346-', initiator:cfg.initiator, transactionId: cfg.transactionId, oldValue:cfg.oldValue}]);
					});
				});
			} else {
				_throw_(new Error('Unknown event method: '+eventName));
			}
		},

		modelEventClear: function(self) {},

		modelSetType: function(self, path, value) {
			if ( $.isHash(path) ) {
				path.forEach(function(type, modelPathMask) {
					if ( !self.static.types[type] ) _throw_(new Error('modelSetType: тип данных '+type+' не существует'));
					self.private.dataTypes.set(modelPathMask, type);
				});
			} else {
				self.private.dataTypes.set(path, value);
			}
		},

		modelValidate: function(self, modelSelectors) {
			var errorCheck = function(value, path) {
				var type = self.private.dataTypes.get(path);
				if (!type) return;
				var errObj = self.static.types[type].validate(value);

				if (!errObj.valid) errors.push({path: path, errorType: errObj.errorType, type: type});
			};

			var errors = [];
			if (modelSelectors) {
				modelSelectors.toFlatArray().forEach(function(selector) {
					self.public.model.forEachBySelector(selector, function(value, path) {		// :)
						errorCheck(value, path);
					});
				});
			} else {
				self.public.model.forEachRecursive(errorCheck);
			}
			return errors;
		},

		getElementByModelPath: function(self, modelPath) {
			if (!self.private.view.tplObject) return;
			modelPath = 'M.'+modelPath;
			var db = self.private.view.tplObject.bindData[modelPath];
			if (db) {
				var ref;
				db.nodes.forEach(function (el) {
					var node = el.node;
					if (!node) return;
					if (node.nodeType == 1 && (node.nodeName == "INPUT" || node.nodeName == "TEXTAREA")) {
						ref = node;
						return false;
					}
				});
				if (!ref && db[0]) ref = db[0].node;
				return ref;
			}
		},

		logicSet: function(self, scope) {
			self.private.scope = scope;
			self.private.parent = undefined;
		},

		logicGet: function(self) {
			return self.private.scope;
		},

		onReady: function(self, handler) {
			if ( self.private.onReadyCheck() ) {
				setTimeout(handler, 0);		// Если .onReady навешан в цепочке, надо подождать пока произойдет присваивание, чтобы в хендлере легко обращаться к капсуле
			} else {
				if (!self.private.onReady.buffer) self.private.onReady.buffer = $.Transaction();
				self.private.onReady.buffer.push(handler);
			}
		},

		//isInserted: false,
		//isVisible: false,

		viewSet: function(self, selector) {
			var curCRC = $.crc32(selector);
			if (curCRC == self.private.view.currentCRC) return;		//Выходим если тот же самый шаблон пропихивают
			self.private.view.currentCRC = curCRC;

			var isStashed = self.private.view.stashed;
			self.private.viewStash();			//Очищаем дом от старого шаблона
			self.private.initViewEvents();		//Очищаем старые события
			if ( !$.isRP(selector) ) {
				self.private.templateBuild(selector);
				if (!isStashed) self.private.viewPop();
			} else {
				//Node ?
				//RP ?
				_throw_(new Error('ViewSet: аргумент должен быть именем шаблона, либо шаблоном'));
			}
			self.private.IORegister();
		},

		viewGet: function(self) {
			var html = '';
			self.public.view.forEach(function(el) {         //TODO: FIX сделать для скорости пробежку по pointerStart.noxtSibling
				html+=el.outerHTML || (el.nodeType!==8 ? el.textContent : '');
			});
			return html;
		},

		parentNode: function(self) {
			if (self.private.view.type=='node' && self.private.view.node.parentNode) {
				return self.private.view.node.parentNode;
			} else if (self.private.view.pointerStart) {
				return self.private.view.pointerStart.parentNode;
			} else {
				return;
			}
		},

		prependTo		:function(self, parent) {
			if ( !$.isRP(parent) ) parent = $(parent);
			parent.prependChild(self.public);
		},

		prependChild	:function(self, node) {
			if ($.isNode(node) && (self.private.view.type == 'node')) {
				self.public.view[0].appendChild(node);
				return;
			}

			if ( !$.isRP(node) ) node = $(node);
			var parent, parentView = self.private.view;
			var child = node.__self__;
			var childView = child.private.view;
			if ( !parentView )	{_throw_(new Error('parent is undefined')); return}
			if ( !childView )	{_throw_(new Error('child is undefined')); return}

			//console.info('child:', child, child.public.isInserted, child.private.view);
			child.private.viewStash();

			var first, parentNode;
			if (parentView.type == 'node') {
				parentNode = parentView.node;
				first = parentNode.childNodes.last;
			} else {
				if (parentView.stashed) {
					if (parentView.fragment.length) {
						first = parentView.fragment.firstChild;
					}
				} else if (parentView.pointerStart) {
					first = parentView.pointerStart.previousSibling;
					//console.log('last: ', last);
				}
				parentNode = parentView.fragment;
			}

			if ( !first ) {
				child.private.pointerSet({in: parentNode});
				child.private.viewPop();
			} else {
				if (child.private.view.pointerStart != first) { //Если втыкаемся не сами после себя. TODO: перенести проверку в pointerSet
					child.private.pointerSet({before: first});
				}
				child.private.viewPop();
			}
		},

		appendTo		:function(self, parent)	{		//куда, что
			if ( !$.isRP(parent) ) parent = $(parent);
			//;;;var dt = new Date();

			/*
			console.log('[apnd to'+parent.pid+'] ', self.public.pid);
			parent.__self__.private.onReady.childsWait++;
			parent.onReady(function() {
				parent.__self__.private.onReady.childsWait--;
				parent.__self__.private.onReadyCheckOut();
			});
			*/

			parent.appendChild(self.public);
			//;;;CT+= new Date() - dt;
		},

		appendChild		:function(self, node)	{
			if ($.isNode(node) && (self.private.view.type == 'node')) {
				self.public.view[0].appendChild(node);
				return;
			}
			//self.private.father = node;

			if ( !$.isRP(node) ) node = $(node);

			/*
			console.log('[apnd child '+self.public.pid+'] ', node.pid);
			self.private.onReady.childsWait++;
			node.onReady(function() {
				self.private.onReady.childsWait--;
				self.private.onReadyCheckOut();
			});
			*/

			var parent, parentView = self.private.view;
			var child = node.__self__;
			var childView = child.private.view;
			if ( !parentView )	{_throw_(new Error('parent is undefined')); return}
			if ( !childView )	{_throw_(new Error('child is undefined')); return}

			//console.info('child:', child, child.public.isInserted, child.private.view);
			child.private.viewStash();


			var last, parentNode;
			if (parentView.type == 'node') {
				parentNode = parentView.node;
				last = parentNode.childNodes.last;
			} else {
				if (parentView.stashed) {
					if (parentView.fragment.length) {
						last = parentView.fragment.lastChild;
					}
				} else if (parentView.pointerEnd) {
					last = parentView.pointerEnd.previousSibling;
					//console.log('last: ', last);
				}
				parentNode = parentView.fragment;
			}

			if ( !last ) {
				child.private.pointerSet({in: parentNode});
				child.private.viewPop();
			} else {
				if (child.private.view.pointerEnd != last) { //Если втыкаемся не сами после себя. TODO: перенести проверку в pointerSet
					child.private.pointerSet({after: last});
				}
				child.private.viewPop();
			}
		},

		insertBefore	:function(self, node) 	{		//что куда,
			if ( !$.isRP(node) ) node = $(node);
			var parentView = node.__self__.private.view;
			node = parentView.type=='node' ? parentView.node : parentView.pointerStart;
			if ( !node ) {
				_throw_(new Error('insertAfter: У заданной ноды должен быть родитель'));
			}
			self.private.viewStash();
			self.private.pointerSet({before: node});
			self.private.viewPop();
		},

		insertAfter: function(self, node) {
			if ( !$.isRP(node) ) node = $(node);
			var parentView = node.__self__.private.view;
			node = parentView.type=='node' ? parentView.node : parentView.pointerEnd;
			if ( !node.parentNode ){
				_throw_(new Error('insertAfter: У заданной ноды должен быть родитель'));
			}
			self.private.viewStash();
			self.private.pointerSet({after: node});
			self.private.viewPop();
		},

		empty: function(self) {
			if (self.private.view.type == 'node') {
				self.private.view.node.innerHTML = "";
			} else {
				if ( self.private.view.stashed ) {
					self.private.view.fragment = document.createDocumentFragment();
				} else {
					var startPoint = self.private.view.pointerStart;
					var parent = startPoint.parentNode;
					if (startPoint) {
						while ( startPoint.nextSibling != self.private.view.pointerEnd ) {
							parent.removeChild(startPoint.nextSibling);
						}
					}
				}
			}
		},

		click: function(self, fn) {
			return self.public.eventAdd('click', fn);
		},

		clickOut: function(self, fn, params) {
			return self.public.eventAdd('clickOut', fn, params);
		},

		eventAdd: function(self, eventName, fn, params) {
			var eventId = Number.uid();
			if (!params) params = {};
			if (eventName == 'clickOut') {
				var nodes;
				if (params && params.include) {
					nodes = [];
					self.public.view.forEach(function(node) {nodes.push(node)});
					params.include.view.forEach(function(node) {nodes.push(node)});
				} else {
					nodes = self.public.view;
				}
				params.nodeList = nodes;
				self.private.eventStack[eventId] = [{
					eventName: 'clickout',
					eventId: Element.prototype.addEventListener.call(null, 'clickout', fn, false, params)	//{nodeList: nodes}
				}];
				return eventId;
			} else {
				var eventCfg = [];
				self.public.view.forEach(function(node) {
					eventCfg.push({
						eventName:	eventName,
						node:		node,
						eventId: 	node.addEventListener(eventName, fn)
					});
				});
				self.private.eventStack[eventId] = eventCfg;
				return eventId;
			}
		},

		eventRemove: function(self, eId) {
			if ($.isNumber(eId) && self.private.eventStack[eId] ) {
				self.private.eventStack[eId].forEach(function(nodeCfg) {
					if (nodeCfg.eventName == 'clickout') {
						Element.prototype.removeEventListener.call(null, 'clickout', nodeCfg.eventId);
					} else {
						nodeCfg.node.removeEventListener(nodeCfg.eventName, nodeCfg.eventId);
					}
				});
				delete self.private.eventStack[eId];
			}
		},

		remove			:function(self) {
			if (self.private.view.type == 'node') {
				var node = self.private.view.node;
				node.parentNode.removeChild(node);
				/// TODO сделать эксепшн если нода не в DOMе
			} else {
				self.public.empty();
			}
		},

		hide			:function(self) {
			self.private.isHidden = true;
			self.private.viewStash();
		},

		show			:function(self) {
			self.private.isHidden = false;
			if (self.private.view.type == 'node') {
				var node = self.private.view.node;
				node.classList.remove('dn');
				node.style.cssText = node.style.cssText.replace(new RegExp('opacity[^;]+;'), '');
			}
			self.private.viewPop();
		},

		animation: function(self, animateCfg) {
			var time = '0.3s';
			if (typeof animateCfg.speed == 'string' || typeof animateCfg.speed == 'number') {
				var speedPreset = {'slow': '1s', 'normal': '0.6s', 'fast': '0.3s'};
				time = speedPreset[animateCfg.speed] || (animateCfg.speed / 1000).toFixed(1) + 's';
			}
			animateCfg.transition = 'all linear ' + time;

			if (!$.isNonEmptyObject(animateCfg.from)) animateCfg.from = {};
			if (!$.isNonEmptyObject(animateCfg.to)) animateCfg.to = {};

			/*
			if (self.private.view.type=='node') {
				var container = self.public.view[0].childNodes;
				console.log('animate', animateCfg, container);
			} else {
			}*/

			var container = self.public.view;


			if (animateCfg.clear && animateCfg.callback) {
				var callback = animateCfg.callback;
				animateCfg.callback = function() {
					//console.log('[animation] animation end');
					container.forEach(function(node, i) {
						if (node.style) {
							node.style = '';
							//console.log('[anim] clear:', animateCfg.clear, node);
							node.style.cssText = node.style.cssText.replace(new RegExp(animateCfg.clear+'[^;]+;'), '');
						}
					});
					callback();
				}
			}


			var firstEl = true;
			container.forEach(function(node, i) {
				if (node.nodeType == 1) {
					// этот код восстанавливает сохраненное значение css. Например, если после fadeOut запускат fadeIn, то этот код решает какой display должен быть
					if (animateCfg.remember) {
						if ($.isArray(animateCfg.remember)) {
							animateCfg.remember.forEach(function(rem) {
								node._rp_['memcss_' + rem] = window.getComputedStyle(node, null).getPropertyValue(rem) || '';
							});
						} else {
							node._rp_['memcss_' + animateCfg.remember] = window.getComputedStyle(node, null).getPropertyValue(animateCfg.remember) || '';
						}
					}
					if (animateCfg.restore) {
						if ($.isArray(animateCfg.restore)) {
							animateCfg.restore.forEach(function(rem) {
								var cssProp = node._rp_['memcss_' + rem];
								if (cssProp) animateCfg.from[rem] = cssProp;
							});
						} else {
							var cssProp = node._rp_['memcss_' + animateCfg.restore];
							if (cssProp) animateCfg.from[animateCfg.restore] = cssProp;
						}
					}

					node.removeEventListener('transitionend');
					node.animation(animateCfg);

					if (i ==0 || firstEl) {
						firstEl = false;
						var tmp = {}.extendByClone(animateCfg);
						delete tmp.callback;
						animateCfg = tmp;
					}
				}
			});
		},

		fadeIn: function (self, speed, fn, scope) {	// slow, normal, fast
			self.public.show();
			self.public.animation({
				speed: speed,
				from: {opacity: 0},
				to: {opacity: 1},
				callback: function () {
					//self.public.show();
					fn && fn.call(scope || self.public.logic);
				},
				scope: scope,
				restore: ['display'],
				clear: 'opacity'
			});
		},

		fadeOut: function(self, speed, fn, scope) {
			var args = arguments;
			//console.log('[fade out] :', fn);
			self.public.animation({
				speed: speed,
				from: {opacity: 1},
				to: {opacity: 0, display:'none'},
				callback: function () {
					//self.public.show();
					//console.log('[fade out] callbackrun:', fn);
					self.public.hide();
					fn && fn.call(scope || self.public.logic);
				},
				scope: scope,
				remember: ['display'],
				clear: 'opacity'
			});
		},

		slideUp: function(self, speed, fn, scope) {
			console.log('slideUp start');
			if (!self.public.isInserted) return;   // Если вьюха не в доме - ниче не надо анимировать
			self.public.show();
			self.public.animation({
				speed: speed,
				from: {height: 0},
				to: {height: self.public.viewDimensions.outerHeight + 'px'},
				callback: function () {
					//console.log('slideUp stop');
					fn && fn.call(scope);
				}
			});
		},

		slideDown: function(self, speed, fn, scope) {
			//console.log('sd: ', self.public.isInserted);
			if (!self.public.isInserted) return;
			self.public.animation({
				speed: speed,
				from: {height: self.public.viewDimensions.outerHeight + 'px'},
				to: {height: 0},
				callback: function () {
					self.public.hide();
					if (self.private.view.type=='node') {self.private.view.node.style.height='auto';}
					fn && fn.call(scope);
				}
			});
		},

		scrollTo: (function() {
			var optBuffer = 10;						//минимальный отступ от края экрана
			var scroll = function(endOffset) {
				var duration, tweenEeaseOutBouncePosition;
				if ($.S.model.funnyMode) {
					duration = 2000;
					tweenEeaseOutBouncePosition = function (t, b, c, d) {
						if ((t/=d) < (1/2.75)) {
							return c*(7.5625*t*t) + b;
						} else if (t < (2/2.75)) {
							return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
						} else if (t < (2.5/2.75)) {
							return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
						} else {
							return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
						}
					};
				} else {
					duration = 200;
					tweenEeaseOutBouncePosition = function (t, b, c, d) {
						t /= d;
						return -c * t*(t-2) + b;
					};
				}

				var beginOffset = window.pageYOffset;
				var total = endOffset - beginOffset;
				var direction = total > 0 ? 1 : -1;
				var time = 0;
				var interval = 10;		// The interval of every step

				var pageScroll = function() {
					var currentOffset = window.pageYOffset;
					if(time < duration && (total> 0 ? (currentOffset < endOffset) : (currentOffset > endOffset) ) ) {
						var p = tweenEeaseOutBouncePosition(time, beginOffset, total, duration);
						window.scroll(0,p);
						time+=interval;
						setTimeout(pageScroll, interval);
					} else {
						time = 0;
					}
				};
				pageScroll();
			};
			var win = {
				getPos: function() {
					var top = window.scrollY;
					var winHeight = document.body.offsetHeight;
					return ({top:top, bottom:top + winHeight, winHeight: winHeight});
				},
				getAmbit: function($obj) {
					var winPos = win.getPos();
					var elTop = $obj.viewDimensions.top;
					var outerHeight = $obj.viewDimensions.outerHeight;
					var start = elTop - winPos.top;
					var end = winPos.bottom - (elTop + outerHeight);
					return ({start: start, end: end, top: winPos.top, bottom:winPos.bottom, winHeight:winPos.winHeight, elHeight: outerHeight});
				},
				scrollBy: function(top) {
					scrollBy(0, top);
				},
				scrollTo: function(top) {
					scroll(top, 200);
				}
			};

			return function (self, type) {
				var coords, opt, top;
				if (!type || type == 'auto') {/*автоматический минимальный скроллинг, чтобы обьект попадал в зону видимости*/
					coords = win.getAmbit(self.public);
					opt = Math.floor((coords.start + coords.end) / 2);
					if (opt > 0) {
						opt = optBuffer;
						if (coords.start < 0) {
							top = coords.top + coords.start - opt;
						} else if (coords.end < 0) {
							top = coords.top - coords.end + opt; //coords.end - coords.elHeight - opt; // - ( );
						}
					} else {
						opt = 10;
						top = coords.top + coords.start - opt;
					}
					if (top) win.scrollTo(top);
				} else if (type == 'center') {											/*Скролит так чтобы элемент был в центре экрана*/
					coords = win.getAmbit(self.public);
					opt = Math.floor((coords.start + coords.end) / 2);
					top = coords.start - (opt > 0 ? opt : 0);
					win.scrollBy(top);
				} else if (type=='toElement') {											/*Скролит к началу элемента*/
					top = self.public.viewDimensions.top - optBuffer;
					win.scrollTo(top);
				} else if (type == 'up') {												/*Скролит вверх чтобы верхняя точка элемента вошла на экран*/
					coords = win.getAmbit(self.public);
					if (coords.start<0) {
						top = coords.top + coords.start - optBuffer;
						win.scrollTo(top);
					}
				} else if (type=='down') {												/*Скролит вниз чтобы нижняя точкая элемента вошла на экран*/

				}
			}
		})(),

		replaceTarget: function(self, node) {
			var parent = node.parentNode;
			if (!parent) {
				_throw_( new Error('Нода должна иметь родителя') );
				return;
			}

			var isHidden = self.private.isHidden;
			self.private.viewStash();
			self.private.pointerSet({before: node});
			parent.removeChild(node);
			if (!isHidden) self.private.viewPop();
		},

		viewDimensions: {
			outerHeight: undefined,
			outerWidth: undefined
		}
	},

	private: {
		scope:	{},
		parent:		undefined,		//pid		Родитель, чья логика или модель юзается. (Выставляется при logicSet и modelUse)
		father:		undefined,		//capsula	Предок, в который мы вставились (капсула, чья модель используется как объект P в шаблоне)
		isHidden:	false,
		onReady: {
			status: false,
			ifs: undefined,
			buffer: undefined,
			childsWait: 0,
			childsAll: []
		},
		viewRenderEvents: {								//события, которые вешаются для рендеринга вьюхи. Эти события необходимо подчищать при замене вью
			add: [],
			beforeSet:[],
			change:[],
			delete: [],
			error: [],
			set: []
		},

		initViewEvents: function(self) {
			self.private.viewRenderEvents = {
				add: [],
				beforeSet:[],
				change:[],
				delete: [],
				error: [],
				set: []
			};
		},

		onReadyCheck: function(self) {
			var res = false;
			if (self.private.onReady.status && self.private.onReady.childsWait == 0) {
				if ( !self.private.onReady.ifs || (self.private.onReady.ifs && self.private.onReady.ifs() )) {
					res = true;
				}
			}
			return res;
		},

		onReadyCheckOut: function(self) {
			if ( self.private.onReadyCheck() && self.private.onReady.buffer ) {
				self.private.onReady.buffer.run();
				self.private.onReady.buffer.clear();
			}
		},

		onReadyAddIf: function(self, ifs) {
			self.private.onReady.ifs = ifs;
		},

		modelEvents: {},
		view: {
			type:			'fragment',		// ='node' если $(node);
			pointerStart:	null,
			pointerEnd:		null,
			stashed:		true,
			stash:			undefined,
			node:			undefined,		// if type=='node'
			fragment:		undefined,		// if type=='fragment'
			tplObject:		undefined,		// Скомпилированный шаблон
			templateName:	undefined,		// Имя шаблона
			templateSrc:	undefined		// Код шаблона (задается через префикс '!')
		},
		dataTypes:			undefined,		// $.Dispatcher
		eventStack:			{},

		viewInitDimension: function(self) {
			//CT.start('viewInitDimension');
			$.defineProperty(self.public, 'isInserted', {
				get: function() {
					return (self.private.view.type=='node' && self.private.view.node.parentNode) || self.private.view.pointerStart ? true : false;
				},
				enumerable:  true
			});

			$.defineProperty(self.public, 'isVisible', {
				get: function() {
					//console.log('stashed: ', self.private.view.stashed);
					return self.private.view.pointerStart && !self.private.view.stashed ? true : false;
				},
				enumerable:  true
			});

			$.defineProperty(self.public.viewDimensions, 'top', {
				get: function() {
					return self.public.view[0].cumulativeOffsetTop();
				},
				enumerable:  true
			});

			$.defineProperty(self.public.viewDimensions, 'outerHeight', {
				get: function() {
					var h = 0;
					self.public.view.forEach(function(el) {
						if (el.nodeType==1) {
							//h+= el.clientHeight;
							//TODO: вспомнить почему такой изврат и записать.	//можно наверно сделать margin + el.offsetHeight (?)
							var cs = window.getComputedStyle(el, null);
							h+= parseInt(cs.getPropertyValue("height")) +
								parseInt(cs.getPropertyValue("padding-top")) +
								parseInt(cs.getPropertyValue("padding-bottom")) +
								parseInt(cs.getPropertyValue("border-top-width")) +
								parseInt(cs.getPropertyValue("border-bottom-width"));

						} else if (el.nodeType==2) {
							//TODO think
						}
					});
					//$.defineProperty(self.public.viewDimensions, 'outerHeight', {value: h});		//TODO: кеш можно вернуть, но надо менять на геттер если внутри была перевставка.
					//console.log('ch:', h, self.public);
					return h;
				},
				enumerable:  true
			});

			$.defineProperty(self.public.viewDimensions, 'outerWidth', {
				get: function() {
					var h = 0;
					self.public.view.forEach(function(el) {
						if (el.nodeType==1) {
							var cs = window.getComputedStyle(el, null);
							h+= parseInt(cs.getPropertyValue("width")) +
								parseInt(cs.getPropertyValue("padding-left")) +
								parseInt(cs.getPropertyValue("padding-right")) +
								parseInt(cs.getPropertyValue("border-left-width")) +
								parseInt(cs.getPropertyValue("border-right-width"));
						} else if (el.nodeType==2) {
							//TODO think
						}
					});
					$.defineProperty(self.public.viewDimensions, 'outerWidth', {value: h});
					return h;
				},
				enumerable:  true
			});
			//CT.stop('viewInitDimension');
		},

		viewStash			:function(self) {
			if (self.private.view.stashed) return;

			if (self.private.view.type == 'node') {
				if (!self.private.view.pointerStart) self.private.pointerSet({wrap: self.private.view.node});
				self.private.view.fragment = document.createDocumentFragment();
				self.private.view.fragment.appendChild(self.private.view.node);

				//self.private.view.node.parentNode.removeChild(self.private.view.node);
				//self.private.view.fragment.appendChild(self.private.view.node);

				/*self.public.view[0].childNodes.forEach(function(el) {
					self.private.view.fragment.appendChild(el);
				});
				*/
				//console.log('['+self.public.pid+'] stash view:', self.private.view, self.public.view);
			} else {
				if (!self.private.view.pointerStart) return;
				//TODO: сделать через nextSibling;
				self.public.view.forEach(function(el) {
					self.private.view.fragment.appendChild(el);
				});
			}
			self.private.view.stashed = true;
		},

		viewPop:	function(self) {

			if (!self.private.view.stashed) {
				return;
			}

			var node;
			if (self.private.view.type == 'node') {
				node = self.private.view.fragment;

				//console.log('node:', node, self.private.view);
			} else {

				if (!self.private.view.pointerStart) {
					//;;;console.info('cant append without pointerStart ', self);
					// Error
					return;
				}
				//console.log('pointerStart: ', pointerStart, self.private.view);
				//var node = self.private.view.type == 'node' ? self.private.view.node : self.private.view.fragment;
				node = self.private.view.fragment;
			}
			var pointerStart = self.private.view.pointerStart;
			pointerStart.parentNode.insertAfter(node, pointerStart);

			self.private.view.stashed = false;
		},

		pointerSet: function(self, cfg) {
			//;;;console.log('set pointerStart ['+self.public.pid+']', self, cfg);
			if (self.private.view.pointerStart) {
				//if (self.private.view.stashed) return;
				self.private.pointerRemove();
			}
			var parent;
			var pointerStart = document.createComment('@RP:pointerStart:'+self.public.pid);
			var pointerEnd = document.createComment('@RP:pointerEnd:'+self.public.pid);


			if (!cfg.before && !cfg.after && !cfg.in && !cfg.wrap) {
				console.log(cfg);
				_throw_(new Error('pointerSet: необходимо указать позицию'));
				return;
			}



			if ( cfg.before ) {
				parent = cfg.before.parentNode;
				if (parent) {
					parent.insertBefore(pointerStart, cfg.before);
					parent.insertBefore(pointerEnd, cfg.before);
				} else {
					//;;;console.warn('cant set pointerStart without parent');
					return;
				}
			} else if ( cfg.after ) {
				parent = cfg.after.parentNode;
				if (parent) {
					parent.insertAfter(pointerEnd, cfg.after);
					parent.insertAfter(pointerStart, cfg.after);
				} else {
					//;;;console.warn('cant set pointerStart without parent');
					return;
				}
			} else if ( cfg.in ) {
				cfg.in.appendChild(pointerStart);
				cfg.in.appendChild(pointerEnd);
			} else if (cfg.wrap) {
				parent = cfg.wrap.parentNode;
				if (parent) {
					parent.insertBefore(pointerEnd, cfg.wrap);
					parent.insertAfter(pointerStart, cfg.wrap);
				} else {
					//;;;console.warn('cant set pointerStart without parent');
					return;
				}
			}

			//pointerEnd.insertAfter(pointerStart.parentNode, pointerStart);
			self.private.view.pointerStart = pointerStart;
			self.private.view.pointerEnd = pointerEnd;
			if (cfg.IO!==false) self.private.IORegister();
		},

		pointerRemove: function(self) {
			if (self.private.view.pointerStart) {
				if (self.private.view.pointerStart.parentNode){

				self.private.view.pointerStart.parentNode.removeChild(self.private.view.pointerStart);
				self.private.view.pointerEnd.parentNode.removeChild(self.private.view.pointerEnd);
				} else {
					self.private.view.pointerStart = undefined;
					self.private.view.pointerEnd = undefined;
				}
			}
		},

		IORegister: function(self) {			// регистрирует источники данных для связи view->model
			var tpl = self.private.view.tplObject;
			if (!tpl) return;
			//;;;console.info('IORegister: ', tpl, modelCfg);
			tpl.bindData.forEach(function(modelCfg, fullPath) {
				modelCfg.nodes.forEach(function(cfg) {
					var node = cfg.node;
					if (node.nodeType==3) node = node.parentNode;
					if ( !self.static.ioData[node.nodeId] ) {
						self.static.ioData[node.nodeId] = { objSelf: self, modelPath: modelCfg.modelPath, fullPath:fullPath, owner:modelCfg.owner, adapters: cfg.adapters, usedPaths: cfg.usedPaths, forceValue: cfg.forceValue};
					}
					//;;console.info('[IORegister]', modelCfg.modelPath, modelCfg, self.static.ioData[node.nodeId], node.nodeId);
				});
			});
		},

		/* *
		 * @private	modelDefineProperty
		 * @param 	data {Object}		Объект или массив обьектов
		 * 				obj,				Объект, свойство в котором делаем наблюдательным
		 *				objPath,			Путь внутри объекта (включая model. )
		 *				prop,				Имя свойства, который нужно обзервить
		 *				value,				Значение
		 *				fullPath			Полный путь, включая имя свойства
		 *				modelPath			Путь, начиная от модели
		 * @param	cfg {Object}
		 * 				event: false,		вызвать ли обработчики событий (change/set/error)
		 *				view: false,		нужно ли отрендерить значение на вьюху
		 *				viewExclude:node,	при выводе исключить апдейт ноды
		 *				setValue: false		присвоить ли значение
		 */

		modelDefineProperty: function(self, data, cfg) {
			//if ($.isFound(self.public.getPropertyByPath('model.'+data.modelPath))) return;		//OPTIMIZE: При присваивании сюда тоже попадут и выйти поидее можно если cfg:{setValue: false}. Измерить производительность.

			//;;;console.info('modelDefineProp ['+self.public.pid+']', self, data, cfg);
			self.private.modelPropsInit(data);
			//console.log(self, data, cfg);


			if ( !data.obj || !$.isHash(data.obj) && !$.isArray(data.obj) ) {
				;;;console.info('[modelDefineProperty] Can`t define G/S: ', self, data);
				//_throw_(new Error('Can`t define G/S for not Object [' + data.objPath + ': ' + data.obj + ';'+data.prop+']'));
				return;
			}

			if ( !data.obj.hasOwnProperty(data.prop) ) {
				data.isCreated = true;
				var retvalue;

				$.defineProperty(data.obj, data.prop, {
					get: function() {
						//console.log('[getter] return property:', data.prop);
						return retvalue;
					},
					set: function(newValue) {
						//console.log('setter: ', newValue);
						if ( $.isHash(newValue) && newValue.__frnActionSet__ ) {	//== self.public.pid
							//console.log(' ---- setvalue ['+self.public.pid+', '+ newValue.__frnActionSet__+']:', newValue.value);
							retvalue = newValue.value;
						} else {
							data.value = newValue;
							self.private.modelDefineProperty(data);
							//self.private.modelSetValue(data);	// Т.к это уже юзерское присваивание после, cfg не наследуется и отсуствует
						}
					},
					enumerable: !/^RP_/.test(data.modelPath)
				});

			}

			if (cfg && cfg.setValue === false ) {
				return;
			}
			//console.info('[modelDefineProperty] set value:', data, cfg);
			self.private.modelSetValue(data, cfg);
		},

		modelPropsInit: function(self, data) {
			if (data.modelPath == '~' || data.modelPath === '') {
				data.modelPath = '';
				data.obj = self.public;
				data.fullPath = 'model';
				data.prop = 'model';
				data.objPath = '';
			} else if ( !data.obj && data.modelPath) {
				data.fullPath = 'model.' + data.modelPath;
				data.prop = undefined;
				data.obj = (data.objSelf && data.objSelf.public) || self.public;
				//console.log('init obj: ', data.obj);
				data.objPath = '';
				var objPath = '';
				var value = $.isArray(data.value) ? [] : {};
				var ref = value;
				var nodes = data.fullPath.split('.');

				nodes.chop().forEach(function(nodeName) {
					objPath = (objPath ? objPath + '.' : '') + nodeName;
					if ( !Object.prototype.hasOwnProperty.call(data.obj, nodeName) ) {
						if ( !data.prop ) {
							data.prop = nodeName;
						} else {
							ref[nodeName] = {};
							ref = ref[nodeName];
						}
					} else {
						if ( !$.isHash(data.obj[nodeName]) && !$.isArray(data.obj[nodeName]) ) {
							data.obj[nodeName] = {};
						}
						data.obj = data.obj[nodeName];
						data.objPath = objPath;
						//data.modelPath = objPath + '.' + data.prop; //data.modelPath.replace(/^model\.?/, '');
					}
				});
				if ( !data.prop ) {
					data.prop = nodes.last;
					value = data.value;
				} else {
					ref[nodes.last] = data.value;
				}
				data.value = value;
				data.fullPath = (data.objPath + '.'+ data.prop);
				data.modelPath = (data.objPath + '.'+ data.prop).replace(/^model\.?/, '');
				//console.log('OBJ', data.obj);
			} else {
				if (!data.fullPath)		data.fullPath = (data.objPath ? data.objPath + "." : "") + data.prop;
				if (!data.modelPath)	data.modelPath = data.fullPath.replace(/^model\.?/, '');
			}
		},

		/* *
		 * @private	modelSetValue
		 * @param 	dataArr {Object}			Объект или массив обьектов
		 * 				obj,					Объект, свойство в котором делаем наблюдательным
		 *				objPath,				Путь внутри объекта
		 *				prop,					Имя свойства, который нужно обзервить
		 *				value,					Значение
		 *				fullPath				Полный путь, включая имя свойства
		 * @param	cfg {Object}
		 * 				event,					(default:true) вызвать ли обработчики событий (change/set/error)
		 *				view,					(default:true) нужно ли отрендерить значение на вьюху
		 *				viewExclude:node,		при рендеринге исключить апдейт ноды
		 *				setValue: (true|false)	присвоить ли значение (true = force)
		 *				bridgesUpdate: true|false // 	(default:true)
		 *				childObserve			(default: true) рекурсивно наблюдать за всеми детьми
		 */
		modelSetValue: function(self, dataArr, cfg) {
			if ( !cfg ) cfg = {};
			dataArr = dataArr.toFlatArray();
			var root;
			if (!cfg.transaction) {
				root = true;
				cfg.transaction = {
					id:		Number.uid()
				};
				cfg.transaction.set		= $.Transaction();
				cfg.transaction.add		= $.Transaction();
				cfg.transaction.change	= $.Transaction();
				cfg.transaction.error	= $.Transaction();
			}
			//;;;console.warn('events', transaction);

			dataArr.forEach(function(data) {
				//;;;console.info('['+self.public.pid+'] modelSetValue ['+data.fullPath+';   '+data.objPath+'] ', data, cfg);

				if (!data.objSelf) data.objSelf = self;

				var origValue = data.value;
				var changedPaths = [data]; 	//Массив всех объектов и путей,включая линкованые, значения в которых необходимо поменять

				/* Смотрим есть ли ссылки на этот обьект и надо ли там менять чтото*/

				//if (cfg.bridgesUpdate===false) {
				//	console.log('[rp] modelset without bridges:', data.modelPath);
				//}
				if (data.modelPath && cfg.bridgesUpdate!==false) {
					//Array.push.apply(changedPaths, self.public.modelGetBridged(data.modelPath, data.objSelf.public.pid, origValue));
					changedPaths = changedPaths.concat(self.public.modelGetBridged(data.modelPath, data.objSelf.public.pid, origValue));
				}

				//console.log('['+self.public.pid+'] changedPaths:', changedPaths); //, changedPaths.map(function(item) {return item.objSelf.public.pid}));

				changedPaths.forEach(function(changeCfg) {																		//Пробегаемся по всем обьектам и их путям, которые наобходимо поменять

					var newValue = origValue;
					var oldValue = changeCfg.objSelf.public.modelGet(changeCfg.modelPath);
					//console.log('newValue: ', newValue, '   oldValue:', oldValue, '   equal:', (newValue === oldValue) );

					if (cfg.event!==false) {
						var beforeSetStatus = changeCfg.objSelf.public.modelEventFire("beforeSet", changeCfg.modelPath, {data: {oldValue: oldValue, newValue: newValue, initiator: cfg.initiator, viewExclude: cfg.viewExclude}});
						//beforeSetStatus возвращает массив всех рузультатов. Если событий нету - массив будет пустым. Если все результаты отрицательные - тогда beforeSetStatus = false
						if ( beforeSetStatus !== false) {
							if ($.isHash(beforeSetStatus[0])) {
								newValue = beforeSetStatus[0].value;
								//console.info('beforeSetStatus:', beforeSetStatus[0], newValue);
								//console.log('changeCfg:', changeCfg);
							}
						} else {
							return;
						}

						changeCfg.objSelf.private.modelEvents['set'].get(changeCfg.modelPath).forEach(function(eventTransaction) {				//Диспатчером находим существующие транзакции для обработки евента Set
							if (eventTransaction.length) {
								cfg.transaction['set'].include(
									eventTransaction,
									[changeCfg.modelPath || '~', {oldValue: oldValue, newValue: newValue, initiator:cfg.initiator, transactionId: cfg.transaction.id, viewExclude: cfg.viewExclude}]
								);
							}
						});
					}



					var valueType = changeCfg.objSelf.private.dataTypes.get(changeCfg.modelPath);
					if (valueType) {
						var coerceValue = self.static.types[valueType].validate(changeCfg.value);
						newValue = coerceValue.value;
						if ( !coerceValue.valid && cfg.event!==false) {
							self.public.modelEventFire('error', changeCfg.modelPath, {
								data: {type: valueType, errorType: coerceValue.errorType, oldValue: oldValue, newValue: newValue}
							});
							//;;;console.info('Некорректное значение ['+data.fullPath+'  :'+valueType+']: ' + coerceValue.error);
						}
					}

					if ( (newValue !== oldValue || cfg.setValue === true) && cfg.setValue!==false) {
						//В теории в modelSevValue уже попадают после modelDefineProperty. Нижняя строка поидее не нужна. Но она ооочень нужна =)
						changeCfg.objSelf.private.modelDefineProperty(changeCfg, {setValue: false, viewExclude: cfg.viewExclude});


						var valueStub = cfg.childObserve===false ? false : ($.isHash(newValue) && !$.isRP(newValue)) ? {} : $.isArray(newValue) ? [] : false;

						var changeEventName = 'change';
						if (changeCfg.isCreated) {
							changeEventName = 'add';
							changeCfg.isCreated = false;
						}

						if (cfg.event!==false) {
							changeCfg.objSelf.private.modelEvents[changeEventName].get(changeCfg.modelPath || '~').forEach(function(eventTransaction) {				//Диспатчером находим существующие транзакции для обработки евента Set
								if (eventTransaction.length) {
									//console.log('inc event: ', eventTransaction);
									cfg.transaction[changeEventName].include(
										eventTransaction,
										[changeCfg.modelPath || '~', {oldValue: oldValue, newValue: valueStub || newValue, initiator:cfg.initiator, transactionId: cfg.transaction.id, viewExclude: cfg.viewExclude}]
									);
								}
							});
						}

						if ( valueStub ) {
							changeCfg.obj[changeCfg.prop] = {__frnActionSet__: changeCfg.objSelf.public.pid, value: valueStub};

							newValue.forEach(function(propValue, propName) {			//Для массивов и хешей - сканим и обзервим все свойства
								changeCfg.objSelf.private.modelDefineProperty({
									obj:		valueStub,
									objPath:	changeCfg.fullPath,
									objSelf:	changeCfg.objSelf,
									prop:		propName,
									value:		propValue,
									modelPath:	(changeCfg.modelPath ? changeCfg.modelPath + '.' : '') + propName,
									fullPath:	changeCfg.fullPath + '.' + propName
								}, cfg);
							});


							if ( $.isArray(valueStub) ) {		// Если в модели массив - необходимо следить за ее свойствами чтобы вовремя отрендеривать
								if ( !valueStub.hasOwnProperty('_RPDefineProp_') ) {
									$.defineMethod(valueStub, '_RPDefineProp_', function(obj, id, values) {
										var nCfg, ln = values.length-1;
										if ( ln>0 && $.isHash(values[ln]) ){
											if (values[ln].hasOwnProperty('_RPCFG_'))	{
												nCfg = values.pop();
											}
										}
										//console.info(' msv: set arr values', values);
										values.forEach(function(value) {
											changeCfg.objSelf.private.modelDefineProperty({
												obj:		valueStub,
												objSelf:	changeCfg.objSelf,
												objPath:	changeCfg.fullPath+'.'+id,
												prop:		id,
												value: 		value,
												modelPath:	changeCfg.modelPath+'.'+id,
												fullPath:	changeCfg.fullPath + '.' + id
											}, nCfg);		// cfg Не надо, потому что пуш - другая операция с новой транзакцией. nCfg в пуше может придти
											id++;
										});
										//changeCfg.objSelf.private.modelRenderPath(changeCfg.fullPath + '.length', cfg);				//Полная жопа. бриджи не смогут эти свойства синкать, т.е они уровнем павполраолв бу(
										//console.log('[arr.push] ln update:', changeCfg.fullPath + '.'+id, '  values', values);
										//console.log('self=', self);
									});
								}
							}

						} else {
							if ( $.isDate(newValue) ) {		// Если в модели дата - необходимо следить за ее свойствами чтобы вовремя отрендеривать
								if ( !newValue.hasOwnProperty('_RPSet_') ) {
									$.defineProperty(newValue, '_RPSet_', {
										value: function() {
											//console.warn('[modelsetValue RPSET] setValue:', changeCfg, cfg);
											cfg.setValue = true;
											self.public.modelSet(changeCfg.modelPath, newValue, {setValue: true, viewExclude: cfg.viewExclude});
										}
									});
									//self.public.modelSet(changeCfg.modelPath, newValue, {setValue: true, viewExclude: cfg.viewExclude});	//НАФИГА ЕЩЕ РАЗ ?
								}
							} /*else if ($.isFunction(newValue)) {
								consle.log('set fn in model');
							}*/

							changeCfg.obj[changeCfg.prop] = {__frnActionSet__: changeCfg.objSelf.public.pid, value: newValue};
						}

						//setTimeout(function() {
							//console.log('[modelSetValue] prerender path:', changeCfg.modelPath, newValue, cfg);
							changeCfg.objSelf.private.modelRenderPath(changeCfg.modelPath, cfg);
						//},10);


						//console.log('changeCfg', changeCfg);

						/*
						// рендерим зависимости и заодним всех детей, которые учавствуют в выражениях
/*
						if ( ($.isHash(oldValue) || $.isArray(oldValue) ) && changeCfg.objSelf.private.view.tplObject) {
							var mask = changeCfg.modelPath ? (changeCfg.modelPath+'.') : '';

							changeCfg.objSelf.private.view.tplObject.bindData.forEach(function(value, key) {
								//console.warn('-find render child ['+mask+']:', key);
								var subkey = key.indexOf(mask);

								if (subkey!=-1) {
									//console.warn('render child ['+mask+']:', key, arguments);
									changeCfg.objSelf.private.modelRenderPath(key, {parent:false, viewExclude:cfg.viewExclude});	// Зафорсить value=undef  нельзя, потому что некоторые дети не менялись

									var deps = changeCfg.objSelf.private.view.tplObject.modelDepends[key];

									//console.info('-render depends:', deps, changeCfg.objSelf.private.view.tplObject.modelDepends);

									if (deps && deps.renderFn) deps.renderFn.forEach(function(renderFn){
										renderFn(changeCfg.objSelf, cfg);
									});
								}

							});
						}
*/
					}

				});
				if (root && cfg.event!==false) {
					//console.log('run model events:', cfg.transaction['add']);
					cfg.transaction['set'].run();			//{optimized: true}
					cfg.transaction['change'].run();		//{optimized: true}
					cfg.transaction['add'].run();			//{optimized: true}
				}
			});
		},

		/**
		 *
		 * @param self
		 * @param path
		 * @param cfg.parent			//Рендерить ли родителей (default:true)
		 * 			cfg.forceValue
		 */

		modelRenderPathTimes: {},

		modelRenderPath: function (self, path, cfg) {
			//console.log('[modelRenderPath]', path, 'cfg:', cfg);
			if (!path) return;																		//TODO FIX разобраться почему чтото пустое приходит сюда
			//self.private.modelRenderPathApply(path, cfg);
			//return ;	//disable optimization

			if ( self.private.view.tplObject ) {
				//console.log('[' + self.public.pid  + '] modelRenderPath:', path);
				var cfgs = self.private.view.tplObject.bindData['M.' + path];
				if (cfgs && cfgs.nodes.length) {
						if (cfg && cfg.forceRender) {
						self.private.modelRenderPathApply(path, cfgs.nodes, cfg);
					} else {
						if (self.private.modelRenderPathTimes[path]) clearTimeout(self.private.modelRenderPathTimes[path]);
						self.private.modelRenderPathTimes[path] = setTimeout(function () {
							self.private.modelRenderPathApply(path, cfgs.nodes, cfg);
						}, 3);
					}

				} else {
					if (cfg.viewExclude) return;		// TODO: так то надо только конкретную ноду только исключать, а не вообще все. Но пока оно как то робит :)
					var fullPath = 'M.' + path;
					var deps = self.private.view.tplObject.modelDepends[fullPath];
					//if (self.private.view.tplObject.ioData[fullPath]) alert(1);
					if (deps && deps.modelPath.indexOf('RP')==-1) {		//&& deps.virtual
						//console.log('[modelRenderPath] nobind, fnRender:', deps.virtual, '|', path, deps, self, cfg);
						deps.renderFn.forEach(function(fn) {
							fn(self, cfg);
						});
					}
				}
			}
		},

		modelRenderPathApply: function(self, path, nodes, cfg) {
			//console.log('[' + self.public.pid  + '] modelRenderPathApply:', path, nodes, self, cfg);
			//CT.start('modelRenderPathApply');

			if (!cfg) cfg = {};
			//if (cfg.parent !== false) self.private.modelRenderParentPath(path, cfg);			//TODO: раcкоментить

			var value = cfg.hasOwnProperty('forceValue') ? cfg.forceValue : self.public.modelGet(path);
			//;;;console.log('render path: ', path, value, cfg, self, nodes);
			nodes.forEach(function(nodeCfg) {
				self.private.modelRenderNode(value, nodeCfg, cfg);
			});

			//CT.stop('modelRenderPathApply');
		},

		modelRenderNode: function(self, value, pathCfg, cfg) {
			var node = pathCfg.node;
			if ( pathCfg.renderHandler ) {				//используется для изменнеия значений чекбокса/селекта итд
				pathCfg.renderHandler(node, value);
			}
			if (node.nodeType == 3) node = node.parentNode;
			if (cfg && cfg.viewExclude) {
				if (node == cfg.viewExclude) {
					return;
				}
			}
			if ( !node ) {	//Это тупой IE удалил нашу ноду из контентедитобловского родителя
				return;
			}

			if ( value === undefined || value === null || !$.isFound(value) ) {
				value = '';
			} else if ($.isString(value)) {
				value = value.replace(/\&nbsp;/g, ' ');
			}

			if (pathCfg.type=='attr') {
				pathCfg.node.setAttribute(pathCfg.valueProp, value);
			} else {
				pathCfg.node[pathCfg.valueProp] = value;
			}
		},

		modelRenderParentPath: function(self, path, cfg) {		// проверяет, если в модели родительские ноды тоже рендерятся - рендерим их
			//console.warn('render parent:', path);
			//CT.start('modelRenderParentPath');
			var parentPath;
			if ( path && path.match(/^(.*)\.[^.]+$/) ) {
				//console.log('    render parent ['+path+']: ', RegExp.$1);
				parentPath = RegExp.$1;
				if (self.private.view.tplObject) {
					self.private.modelRenderParentPath(parentPath, cfg);
					var deps = self.private.view.tplObject.modelDepends[parentPath];
					if (deps && deps.renderFn) {
						deps.renderFn.forEach(function(fn) {
							fn(self, cfg);
						});
					}
				}
			}
			//CT.stop('modelRenderParentPath');
		},

		modelRenderAll: function(self) {					//TODO: проверить то ли он вообще перерендеривает
			var tpl = self.private.view.tplObject;
			if (!tpl) return;
			//console.log('[modelRenderAll] ',tpl);

			tpl.bindData.forEach(function(modelCfg) {
				//console.log('rerender: ', modelPath);
				var owner = self.static.getOwnerObject(self, modelCfg.owner);
				owner.self.private.modelRenderPath(modelCfg.modelPath);
			});
		},

		templateBuild: function(self, selector) {
			self.private.view.currentCRC = $.crc32(selector);
			if ( selector.indexOf('!') == 0 ) {
				self.private.view.templateSrc = selector.replace(/^!/, '');
			} else if (selector.indexOf('@') == 0) {
				self.private.view.templateName = selector.replace(/^@/, '');
			} else {
				console.warn('Selector: ', selector);
				_throw_(new Error('unknown prefix of selector:  '+ selector));
			}

			self.private.view.tplObject = self.private.view.templateName ?
				$.Template({templateName:	self.private.view.templateName}):
				$.Template({templateSrc: 	self.private.view.templateSrc});
			self.private.templateCompile();
		},

		templateCompile: function(self) {
			//console.info('TT compile', self);
			self.private.onReady.status = false;
			var tpl = self.private.view.tplObject;
			self.private.view.fragment = tpl.fragment;

			if ( !tpl.fragment.childNodes.length) return;

			tpl.bindFn.forEach(function(cfg) {
				cfg.node[cfg.name] = self.private.compileFn(cfg.value);
			});



            //self.private.bindData = {}.addPair(self.public.pid, tpl.bindData);

			/** TODO replace: modelRenderAll start, НО не забыть что тут по дефолту setValue = false. Добавить в конструктор флаг для отключения автоинициализации модели: даст скорости */
			//console.warn('--[tpl.bindData] FOREACH:', tpl.bindData, self);


			tpl.bindData.forEach(function(modelCfg, fullPath) {
				if (modelCfg.virtual) return;

				var owner = self.static.getOwnerObject(self, modelCfg.owner);
				if (owner.self) {
					owner.self.private.modelDefineProperty({modelPath: modelCfg.modelPath, value:undefined}, {setValue:false});
					//console.log('=[tpl.bindData]', self, fullPath, modelCfg, owner);
					var ownerProps = self.static.getOwnerProps(modelCfg.owner);
					if (ownerProps.unbound !== true) {								//Если это не локальная модель и при этом если владелец - капсула, то и туда биндим ноду тоже.
						var bd = owner.self.private.view.tplObject.bindData;
						var fullPath = 'M.' + modelCfg.modelPath;
						if ( !bd[fullPath] ) bd[fullPath] = {modelPath: modelCfg.modelPath, owner:'M', nodes:[]};			//Т.к мы владельцу вписываем - то он уже 'M'

						//console.log('- [tpl.bindData] modelCfg:', modelCfg);
						bd[fullPath].nodes = bd[fullPath].nodes.concat(modelCfg.nodes); //push(modelCfg);		//OPTIMIZE
						//console.log('bd:', bd);
					}
					owner.self.private.modelRenderPath(modelCfg.modelPath);
				}

			});





			// Подписываемся на зависимости
			tpl.modelDepends.forEach(function(modelCfg, fullPath) {
				var owner = self.static.getOwnerObject(self, modelCfg.owner);
				var modelPath = modelCfg.modelPath;
				var renderExpression = function(eventName, modelPath, cfg) {
					if (!cfg) cfg={};
					//console.log('[templateCompile] rend expr ['+fullPath+']', modelPath, cfg);
					//CT.start('renderExpression');
					modelCfg.renderFn.forEach(function(fn) {
						//console.log('[templateCompile] renderFn cfg:', cfg);
						var rendCfg = {};
						if (cfg.viewExclude) rendCfg.viewExclude = cfg.viewExclude;
						fn(self, rendCfg);		//Почему то если вторым параметром передать cfg целиком, то откомпиленные значение аттрибутов не переситчываются: <div>{{M.data.products::length}}<h1 class=\"aaa {{M.data.products::isEmpty}}\" >111</h1></div>
					});
					//CT.stop('renderExpression');
				};

				if (owner.self) {	//Если есть владелец - значит данные динамические и надо подписаться на модификацию для отрендеривания
					owner.self.public
						.modelEventAdd('set', modelPath, renderExpression)			// TODO: Если стоит односторонний бридж, то на одной стороне значение может быть set, а на другой change
						.modelEventAdd('set', modelPath+'.**', renderExpression)		// Придумать как грамотно подписаться на set, но не делать лишнюю работу, если нет бриджей
						.modelEventAdd('delete', modelPath, renderExpression)
						.modelEventAdd('delete', modelPath+'.**', renderExpression);
				}
				renderExpression();
			});

			//console.log('tpl.bindExtTag:', tpl.bindExtTag);
			tpl.bindExtTag.forEach(function(tag) {
				self.private.onReady.childsWait++;
				var component = $.Component(tag.name, {attrs: tag.attrs, content: tag.value, parentNode: tag.node.parentNode}, self.public);
				self.private.onReady.childsAll.push(component);
				if (tag.attrs.shortcut) {
					self.public.shortcuts[tag.attrs.shortcut.value] = component;
				}
				component.replaceTarget(tag.node);
				component.onReady(function() {
					self.private.onReady.childsWait--;
					self.private.onReadyCheckOut();
				});
			});

			tpl.bindExtAttr.forEach(function(attr) {
				var component = $.Component(attr.name, {attrs: attr.attrs, owner: attr.node.ownerElement, content: attr.value, node: attr.node}, self.public);
				self.private.onReady.childsAll.push(component);

				component.onReady(function() {
					//console.log('['+tag.name+'] child component ready');
					self.private.onReady.childsWait--;
					self.private.onReadyCheckOut();
				});
			});

			tpl.shortcuts.forEach(function(shortcut, name) {
				self.public.shortcuts[name] = shortcut;
			});


			self.private.onReady.status = true;
			self.private.onReadyCheckOut();
			//console.info('END COMPILE: ', self, tpl);
		},


		compileFn: function(block, fnStr) {
			return function(event){
				var _oRP1Self	= self;
				var parent 		= block.private.parent;
				var father		= block.private.father && block.private.father.public;
				var mvc			= block.public;
				var component	= block.public.component;
				var model		= block.public.model;
				var M			= model;
				//var ret = eval('var self = mvc.logic; console.log(self); var _RP1res=(function(){' + fnStr+'})();self=_oRP1Self; _RP1res'); 			//eval use: self,model,mvc,event
/*
				var ret = eval('var _RP1res=(function(){var self = mvc.logic; console.log(self, mvc, component, model, M); return ' + fnStr+'})(); console.log("rpres", _RP1res); '); 			//eval use: self,model,mvc,event
				console.log("fnStr:", fnStr);
				console.log("ret:", ret);
				return ret;
*/

				fnStr = fnStr.replace('return ', '');
				var ret = eval('var self = mvc.logic; ' + fnStr); 			//eval use: self,model,mvc,event
				return ret;
			};
		},

		adapterApply: function(self, str, stream, adapters) {
			//console.warn('APPLY private adapters: ', arguments);
			adapters[{'>>': 'forEach', '<<':'forEachBack'}[stream]](function(filter) {
				var handler = self.static.adapters[stream + filter.name];
				if ( handler ) {
					var params = [];
					if (filter.paramStr) {
						try {
							params = new Function('var M=arguments[0]; return [' + filter.paramStr+']')(self.public.model);
						} catch (e) {
							//console.log('params isnot defined:', filter.paramStr);
							params = [];
						}
					}
					str = handler.apply(str, [str].concat(params));
				} else {
					// TODO: check prototype;
					_throw_(new Error('filter '+ stream + filter.name + '  is Undefined'));
				}
			});
			return str!==undefined ? str : '';
		}
	},

	static: {
		pids: {},

		shares:		undefined,
		bridges:	$.Dispatcher(),		// pid : {pid1: 1, pid2: 1}
		links:		{},

		ioData:		{},						//nodeId: {selfObj}

		types: {
			__god__: {
				validate: 	function(value) {
					var coerseValue = this.checkType(value);
					if ( !coerseValue.valid )	return {value: value, errorType: coerseValue.errorType, valid: false};
					value = coerseValue.value;
					if ( !this.checkMin(value) )				return {value: value, errorType: 'too_small_' + this.originTypeName, valid: false};
					if ( !this.checkMax(value) )				return {value: value, errorType: 'too_big_' + this.originTypeName, valid: false};
					return {value: value, valid: true};
				},
				checkType:	function(value) {return {value: value, valid: true}},
				checkMin:	function() {return true;},
				checkMax:	function() {return true;}
			}
		},
		adapters: {
			// '>>name': fn
		},

		getOwnerObject: function(self, objSelf, name) {
			//console.log('[getOwnerObject]', name, objSelf);

			if (name == 'M') {
				return {self: objSelf, data: objSelf.public.model};
			}
			if (name == 'G') {
				return {self: $.G.__self__, data: $.G.model};
			}
			if (name == 'S') {
				return {self: $.S.__self__, data: $.S.model};
			}
			if (name == 'E') {
				return {data: ENV}
			}
			if (name == 'P') {
				//console.warn('[P]', objSelf, objSelf.private.father, self);
				if (objSelf.private.father) {
					return {self: objSelf.private.father, data: objSelf.private.father.public.model};
				} else {
					return {data: {}};
				}
			}
			if (name == 'R') {
				return {data: ENV.system.route}
			}
		},

		getOwnerProps: function(self, name) {
			if (name == 'M') {
				return {unbound: true, isCapsule: true};
			}
			if (name == 'G') {
				return {isCapsule: true};
			}
			if (name == 'P') {
				return {isCapsule: true};
			}
			return {};
		},


		adapterApply: function(self, str, stream, adapters) {

			console.warn('APPLY static adapters: ', arguments);
			adapters[{'>>': 'forEach', '<<':'forEachBack'}[stream]](function(filter) {
				var handler = self.static.adapters[stream + filter.name];
				if ( handler ) {
					var params = [];
					if (filter.paramStr) {
						try {
							params = new Function('return [' + filter.paramStr+']')();
						} catch (e) {
							console.log('params isnot defined:', filter.paramStr);
							params = [];
						}
					}
					str = handler.apply(str, [str].concat(params));
				} else {
					// TODO: check prototype;
					_throw_(new Error('filter '+ stream + filter.name + '  is Undefined'));
				}
			});
			return str!==undefined ? str : '';
		}
	},

	extend: {
		extend: function(self, methodName, fn) {
			self.registerExtension(methodName, fn);
		},

		typeAdd: function(self, name, cfg) {
			if (self.static.types.hasOwnProperty(name)) {
				console.log('[$.typeAdd] Такой тип данных уже зарегистрирован: ', name);
				return;
			}

			cfg = {}.extendByClone(cfg);
			var base = cfg.baseType;
			delete cfg.baseType;

			var objType = cfg;
			if ( !base ) base = '__god__';
			self.static.types[base].forEach(function(propValue, propName) {
				if ( $.isFunction(propValue) ) {
					var fn;
					if ( propName == 'checkType' ) {
						fn = objType['checkType'];
						if ( fn ) {
							objType['checkType'] = function(value, originTypeName) {
								if ( !originTypeName ) {
									originTypeName = objType.originTypeName || self.static.types[base].originTypeName;
								}
								var res = propValue.call(this, value);			// run parent check with my params

								if (!res || !res.valid) {
									return {errorType: res.errorType || 'incorrect_' + originTypeName, valid: false};
								} else {
									res = fn.call(this, res.value, originTypeName);
									if (!res || !res.valid) {
										return {errorType: res.errorType || 'incorrect_' + originTypeName, valid: false};
									} else {
										return res;
									}
								}
							};
						} else {
							objType['checkType'] = function(value) {
								return propValue.call(this, value);			// run parent check with my params
							};
						}
					} else if ( objType[propName] ) {
						fn = objType[propName];
						objType[propName] = function(value) {
							var res = propValue.call(this, value);			// run parent check with my params
							return res ? fn.call(this, value) : false;
						};
					} else {
						objType[propName] = self.static.types[base][propName];
					}
				} else if (!objType[propName]) {
					objType[propName] = propValue;
				}
			});
			self.static.types[name] = objType;
		},

		typeHas: function(self, name) {
			return self.static.types.hasOwnProperty(name);
		},

		adapterAdd: function(self, name, handler) {
			var add = function(name, handler) {
				if ( !name.match(/^(>>|<<)/) ) { name = '>>'+name; }
				self.static.adapters[name] = handler;
			};

			if ( $.isHash(name) ) {
				name.forEach(function(handler, name) {
					add(name, handler);
				});
			} else {
				add(name, handler);
			}
		}
	}
});




/* ---------------------------------------------------------------------------------------*/
/**
 * @class	Template				Регистрирует, компилирует, кеширует шаблон, регистрирует расширения html разметки.
 * @param	{cfg}
 *     			templateName		Имя зарегистрированного шаблона.
 *   			templateSrc			Текст шаблона. Используется, если не задано имя используемого шаблона.
 * @return	{Object}
 * 				fragment:	null,
 *				bindData:	{},		//'#expression': [{node:1}]
 *				bindIO:		[],		// input, textarea, checkbox, select, etc..
 *				bindFn:		[],		// onclick, onmouseover, onsubmit etc..
 *				bindExtTag:	[]
 *
 */

$.Template = $.Class({
	constructor: function(self, cfg) {
//		;;;console.info('create tpl', self, {}.extendByClone(cfg) );
		CT.start('template contructor');

		if (cfg.templateSrc !== undefined) cfg.templateName = $.crc32(cfg.templateSrc);

		self.private.tpl = self.static.templates[cfg.templateName];

		var createTplCfg = function(name, src) {
			self.private.tpl = {
				dom: null,
				template: src || '',
				index: {},
				modelDepends: {}
			};
			self.static.templates[cfg.templateName] = self.private.tpl;				//Comment for DISABLE cache
		};

		if (!self.private.tpl && cfg.templateSrc!==undefined) {
			createTplCfg(cfg.templateName, cfg.templateSrc);
		} else if (!self.private.tpl && cfg.templateName) {
			var tpl = document.querySelectorAll('template[name="'+cfg.templateName+'"]')[0];
			if (tpl) {
				cfg.templateSrc = tpl.innerHTML;
				tpl.parentNode.removeChild(tpl);
				createTplCfg(cfg.templateName, cfg.templateSrc);
			} else {
				document.getElementsByTagName('script').forEach(function(sc) {
					//console.log(sc, sc.type);
					if (sc.type=='templates') {
						//console.log('fint static tpl', sc.innerHTML);
						self.extend.register(sc.innerHTML);
					}
				});

				self.private.tpl = self.static.templates[cfg.templateName];

				if ( !self.private.tpl ) {
					//console.log('TPL CFG', cfg);
					_throw_( new Error('template "' + cfg.templateName + '" is not registred' ));
					return;
				}
			}
		}

		if ( !self.private.tpl.dom ) {
			self.private.compile();
		}

		//;;;console.info('Template cfg:', cfg, self.private.tpl);
		self.public.fragment = self.private.tpl.dom.cloneNode(true);


		var rec = function(ixList, nodeList, parent) {			//индексы, список детей
			//console.info('parent: ', parent);
			//console.info('nodeLisT: ', nodeList);
			//console.info('ixList: ', ixList);

			ixList.forEach(function(value, id) {
				var node = nodeList[id];

				if (value.type) {
					var name, data;
					if (value.type == 'extTag') {
						data = {node: node, name: value.tagValue.tagName, attrs: value.tagValue.attrs, value: value.tagValue.value};
						self.public.bindExtTag.push(data);
						return;
					} else if (value.type == 'extAttr') {
						//console.log('reg extAttr:', value);
						data = {node: node, name: value.name, attrs:value.attrs, modelPath: value.modelPath, value: value.value, valueProp: value.valueProp, adapters: value.adapters};
						self.public.bindExtAttr.push(data);
						return;
					} else if (value.type == 'fnData') {
						data = {node: node.ownerElement, name:value.name, value: value.value};
						self.public.bindFn.push(data);
						return;
					}

					name = value.name;		//expr.fullPath
					if (value.type == 'ioData') {					//TODO: optimize
						//;;;console.log('create indexlist for:', node, value);
						data = {node: node, valueProp: value.valueProp, default: value.default, usedPaths: value.usedPaths, renderHandler: value.renderHandler, adapters: value.adapters, forceValue: value.forceValue};
					} else if (value.type == 'nodeData') {
						data = {node: node, valueProp: value.valueProp, default: value.default, adapters: value.adapters};
					} else if (value.type == 'attrData') {
						if (id=='style') {
							data = {node: parent, valueProp: 'style', default: value.default, adapters: value.adapters, type:'attr'};
						} else {
							data = {node: node, valueProp: value.valueProp, default: value.default, adapters: value.adapters};
						}
					}

					//console.info('[rec] fullpath:', name, data);
					data.node.nodeId;	//generate nodeId

					var ownerProps = $.__self__.static.getOwnerProps(value.owner);
					if (ownerProps.isCapsule) {
						//console.log('+bind: ', name);
						if (!self.public.bindData[name]) self.public.bindData[name] = {
							modelPath: value.modelPath,
							owner: value.owner,
							virtual: value.virtual,
							nodes: [],
							origin: value.origin
						};
						self.public.bindData[name].nodes.push(data);

						/*
						if (value.owner != 'M') {						//Если это не локальная модель и при этом если владелец - капсула, то и туда биндим ноду тоже.
							var bd = owner.self.private.view.tplObject.bindData;
							name = 'M.' + value.modelPath;
							if (!bd[name]) bd[name] = {
								modelPath: value.modelPath,
								owner: 'M',
								virtual: value.virtual,
								nodes: []
							};			//Т.к мы владельцу вписываем - то он уже 'M'

							bd[name].nodes.push(data);
						}
						*/
					}
				}

				if (value.shortcut) {
					self.public.shortcuts[value.shortcut.name] = $(node);
				}
				if (value.attrs) {
					rec(value.attrs, node.attributes, node);
				}
				if (node && !$.isAttr(node)) {
					rec(value, node.childNodes);
				}
			});
		};
		rec(self.private.tpl.index, self.public.fragment.childNodes);

/*
		self.private.tpl.modelDepends.forEach(function(modelCfg, fullPath) {
			if ( !self.public.bindData[fullPath] ) self.public.bindData[fullPath] = {modelPath: modelCfg.modelPath, owner:modelCfg.owner, nodes:[]};
		});
*/

		self.public.modelDepends = self.private.tpl.modelDepends;

		CT.stop('template contructor');
		//console.info('tplO', self);
	},

	public: {
		fragment:		null,
		modelDepends:	undefined,		// path:	[renderFn(frnObject)]
		bindData:		{},		//'#expression': [ {modelPath, owner, nodes:[]} ]
		bindFn:			[],		// onclick, onmouseover, onsubmit etc..
		bindExtTag:		[],		// tagExtension
		bindExtAttr:	[],		// tagExtension
		shortcuts:		{}

		/*
		modelSet:	function(self, model) {
			self.private.model = model;
		}
		*/
	},

	private: {
		tpl:	undefined,
		compile: function(self) {
			if ( !self.private.tpl ) return;

			self.private.tpl.template = self.private.tpl.template.replace(/(<\w[^>]*[\s\t])style=/gm, '$1rp-style=');

			//;;;console.info('compile template:', self.private.tpl.template);

			var defaultValue = "\v";
			var ctags = [];
			//console.log($.Component.tagReg);
			self.private.tpl.template = self.private.tpl.template.replace($.Component.tagReg, function() {
				var attrs = '', rtag = '', value, d = arguments;
				for ( var i= 1, ln = ($.Component.tagCount*6+1); i<ln; i+=3 ) {
					if ( d[i] ) {
						rtag = d[i];
						attrs = self.private.parseStrAttrs(d[i+1]);
						value = d[i+2];
						break;
					}
				}
				ctags.push({tagName: rtag, attrs: attrs, value: value});
				return "<!--@RP:extension:" + (ctags.length-1) +"-->";
			});

			//console.log('ctags: ', ctags);
			self.private.tpl.dom = document.createDocumentFragment(self.private.tpl.template);
			//console.info('DOM: ', self.private.tpl.dom);

			//var ext = self.extend;
			var exprReg = /(\{\{.*?\}\})/igm;
			var exprRegIn = /\{\{\s*(.*?)\s*\}\}/igm;


			var compile = function(parent, ixPath, parentPath, attrsExclude) {
				//;;;console.info('ixPath ['+(parent.toString())+', '+parentPath+'] ', ixPath, ' | ', parent, ' | attributes:', attributes);

				if (ixPath) ixPath += '.';
				var ix = -1;


				/** rp-style hack */
				var rpStyleValue = '';
				if ($.isAttrList(parent)) {
					var attrRPstyle = parent.getNamedItem('rp-style');
					if (attrRPstyle) {
						rpStyleValue = attrRPstyle.value;
						parent.removeNamedItem('rp-style');

						var qc = self.private.queryCompile(rpStyleValue);
						if (qc.fullPath) {
							self.private.tpl.index.setPropertyByPath(ixPath+'style', {type:'attrData', name: qc.fullPath, modelPath:qc.modelPath, owner:qc.owner});
						} else {
							var attrStyle = document.createAttribute('style');
							attrStyle.value = rpStyleValue;
							parent.setNamedItem(attrStyle);
							parent.value = qc.value;
						}
					}
				}
				/** /rp-style hack */

				parent.forEach(function(node) {			// #fn(node,ix)
					ix++;
					var fullPath		= ixPath + ix;						// parent.path.id
					var nodeType		= node.nodeType;
					var nodeName		= node.nodeName;
					var textContent 	= node.textContent;
					var haveChilds		= true;
					//;;;console.info('scan node ['+fullPath+']:', node, node.nodeName, nodeType);
					//;;;console.info('         ',fullPath, node, nodeType, nodeName);

					if (nodeType == 8 && textContent.match(/^\@RP:extension:(\d+)$/)) {		// COMMENT_NODE
						self.private.tpl.index.setPropertyByPath(fullPath, {type:'extTag', tagValue: ctags[RegExp.$1]});

					} else if (nodeType == 3 && textContent.match(exprReg)) {			// TEXT_NODE

						var query = self.private.querySplit(textContent);
						//;;;console.warn('QUERY: ', query);

						var firstPart = query.parts[0];
						//console.log('firstPart: ', query);
						//if ( !firstPart ) return;						// Хз зачем это тут ? поидее выше в регекспе не пройдет
						if ( query.parts.length == 1 ) {
							node.textContent = defaultValue;
							firstPart.type = 'nodeData';
							firstPart.valueProp = 'textContent';
							firstPart.name = firstPart.fullPath;		//OPTIMIZE
							self.private.tpl.index.setPropertyByPath(fullPath, firstPart);
						} else {
							if ( firstPart.fullPath ) {
								node.textContent = defaultValue;
								firstPart.type = 'nodeData';
								firstPart.valueProp = 'textContent';
								firstPart.name = firstPart.fullPath;	//OPTIMIZE
								self.private.tpl.index.setPropertyByPath(fullPath, firstPart);
							} else {
								node.textContent = firstPart.value || defaultValue;
							}

							query.parts.shift(); //
							query.parts.forEach(function(part) {
								ix++;
								//;;;console.info('     configure fullPath: ', part);
								if ( part.fullPath ) {
									part.value = defaultValue;
									part.type = 'nodeData';
									part.valueProp = 'textContent';
									part.name = part.fullPath;
									self.private.tpl.index.setPropertyByPath(ixPath + ix, part);
								}

								var el = document.createTextNode(part.value);
								node.parentNode.insertAfter(el, node);
								node = el;
							});
						}

					} else if ( nodeType == 2 ) {									//ATTRIBUTE_NODE
						haveChilds = false;
						//;;;console.log('find attr :', node);
						 if ( nodeName == 'shortcut' ) {
							self.private.tpl.index.setPropertyByPath(parentPath + '.shortcut', {name: textContent});
						} else if ( self.static.bindMethods[nodeName] ) {					// if event
							//;;;console.info('find FN ', fullPath);
							//В фаербаге бага и он не отображает эти ноды, но они там есть (enumerable = true)
							self.private.tpl.index.setPropertyByPath(fullPath, {type:'fnData', name: nodeName, value: node.value});

						} else if ( $.Component.attr[nodeName] ) {
							var attrReg = $.Component.attr[nodeName];
							var tagName = node.ownerElement.tagName.toLowerCase();

							if (attrReg) {
								var attrValue = attrReg[tagName] || attrReg['*'];
								if (attrValue) {
									attrValue = attrValue[node.value] || attrValue['*'];
									if ( attrValue ) {
										var attrCfg;

										if ( textContent.match(exprRegIn) ) {
											attrCfg = self.private.queryCompile(textContent);
										} else {
											attrCfg = {value: textContent};
										}

										attrCfg.type = 'extAttr';
										attrCfg.valueProp = 'value';
										attrCfg.name = attrValue.name;
										attrCfg.attrs =  self.private.parseAttrs(node.ownerElement);
										self.private.tpl.index.setPropertyByPath(fullPath, attrCfg);
									}
								}
							}


						} else if ( textContent.match(exprRegIn) ) {							// if expression in attrValue
							var name = RegExp.$1;

							//отфильтровываем некоторые теги (инпуты итд), у которых свой обработчик
							if ( !( (nodeName == 'value' || nodeName == 'checked' ) && node.ownerElement.tagName == 'INPUT') ) {

								var qc = self.private.queryCompile(textContent);
								//console.info('QC:', qc);
								if (qc.fullPath) {
									qc.name = qc.fullPath;
									qc.type = 'attrData';
									qc.valueProp = 'value';
									self.private.tpl.index.setPropertyByPath(fullPath, qc);
								} else {
									node.value = qc.value;
								}
							}

						}
					} else if ( nodeType == 1 ) {									// ELEMENT NODE
						if ( nodeName == 'INPUT') {
							haveChilds = false;
							if ( node.type == 'checkbox' ) {
								//console.warn('FIND CHECKBOX: ', node);
								if ( node.value.match(exprRegIn) ) {
									var qc = self.private.exprCompile(RegExp.$1);
									if (qc.value) {
										node.value = qc.value;
									} else {
										qc.name = qc.fullPath;
										qc.type = 'ioData';
										qc.valueProp = 'checked';
										qc.renderHandler = function(node, value) {node.checked = value;};
										self.private.tpl.index.setPropertyByPath(fullPath, qc);
									}
								}
							} else if ( node.type == 'radio' && node.value.match(exprRegIn) ) {
								var qc = self.private.exprCompile(RegExp.$1);
								qc.type = 'ioData';
								qc.name = qc.fullPath;
								qc.valueProp = 'value';
								qc.default = node.value;
								qc.renderHandler = function(node, value) {
									if (value == qc.forceValue) node.checked = true;
								};
								self.private.tpl.index.setPropertyByPath(fullPath, qc);

							} else if ( node.value.match(exprRegIn) ) {
								//var name = RegExp.$1;
								var qc = self.private.exprCompile(RegExp.$1);
								if (qc.value) {
									node.value = qc.value;
								} else {
									//console.info('input qc: ', qc);
									node.value = '';
									qc.type = 'ioData',
									qc.name = qc.fullPath;
									qc.valueProp = 'value';
									qc.default = node.value;
									self.private.tpl.index.setPropertyByPath(fullPath, qc);
								}
							}
						} else if ( nodeName == 'TEXTAREA' ) {
							haveChilds = false;
							if ( textContent.match(exprRegIn) ) {
								var qc = self.private.exprCompile(RegExp.$1);
								if (qc.value) {
									node.value = qc.value;
								} else {
									node.value = textContent.replace(exprRegIn, '');
									qc.type = 'ioData';
									qc.name = qc.fullPath;
									qc.valueProp = 'value';
									qc.default = textContent;
									self.private.tpl.index.setPropertyByPath(fullPath, qc);
								}
							}
						}

						if (node.attributes) {
							compile(node.attributes, fullPath+'.attrs', fullPath);
						}
						if (node.childNodes && haveChilds) {			//в IE некоторые ноды имеют детей, в которыйх ненужный шлак, поэтому фильтруем
							compile(node.childNodes, fullPath);
						}
					}
				});
			};

			//console.info('TPL: ', self.private.tpl);
			compile(self.private.tpl.dom, '');
		},

		/* Convert string to attr object*/
		parseStrAttrs: function(self, str) {
			var ret = {
				/*
				attrs: {},
				attrsQuery: {},
				attrsFn: {}
				*/
			};
			if ( !str ) return ret;
			str = str.trim().replace(/\\'/g, "#;squote;").replace(/\\"/g, "#;dquote;");

			var setAttr = function(_, name, value) {
				str = str.replace(/#;squote;/g, "\\'").replace(/#;dquote;/g, '\"');
				if ( name in self.static.bindMethods ) {
					ret[name] = {value: value, isFn: true};
				} else {
					ret[name] = self.private.queryCompile(value);
					//console.log('QC ATTR:', value, ret[name]);

					/*
					if (value.match(/\{\{[^\}]+\}\}/)) {
						var query = self.private.querySplit(value);
						ret.attrsQuery[name] = value;
					} else {
						ret.attrs[name] = value;
					}
					*/
				}
				return '';
			};

			str.replace(/(\w+)='(.*?)'/g, setAttr).replace(/(\w+)="(.*?)"/g, setAttr);
			//console.log('parse attrs:', ret);
			return ret;
		},

		parseAttrs: function(self, node) {
			var ret = {};
			node.attributes.forEach(function(attr) {
				var name = attr.nodeName;
				if ( self.static.bindMethods.hasOwnProperty(name) ) {			//name in self.static.bindMethods
					ret[name] = {value: attr.value, isFn: true};
				} else {
					ret[name] = self.private.queryCompile(attr.value, {disableAdapters: true});
				}
				//console.log('cc attr:', attr, name, ret[name]);
			});
			return ret;
		},


		/**
		 * @description	Разбивает строку с вырожениями на части
		 * @param self
		 * @param query
		 * @returns {
		 * 		parts: [
		 * 			{value: ''},
		 * 			{modelPath: '', provider: 'M'}
		 * 		]
		 * 	}
		 */
		querySplit: function(self, query, cfg) {			// 'myname is {{G.capaign_id ? G.campaign.name : M.name ::upperCase}}, and {{age}} years old'
			if (!cfg) cfg = {};
			var queryParts = [];
			var exprReg = /(\{\{.*?\}\})/igm;
			var exprRegIn = /\{\{\s*(.*?)\s*\}\}/igm;
			var exprRegFill = /^\{\{\s*(.*?)\s*\}\}$/;


			if ( query.match(exprRegIn) ) {
				var text_arr = query.replace(exprReg, ":%QV%:$1:%QV%:").split(':%QV%:');
				text_arr.forEach(function(txt) {
					if ( !txt ) return;
					if ( txt.match(exprRegFill) ) {
						var expr = self.private.exprCompile(RegExp.$1, cfg);	//	('G.capaign_id:filter') -> {modelPath: 'campaign_id', owner: 'G', adapters:{}}
						//;;;console.info('expr :', expr);
						if (expr.value) {
							queryParts.push({value: expr.value});
						} else {
							queryParts.push(expr);		// {modelPath: expr.modelPath, owner: expr.owner, fullPath: expr.fullPath}
						}
					} else {
						queryParts.push({value: txt});
					}
				});
			} else {
				queryParts.push({value: query});
			}

			return {
				parts: 		queryParts	//{modelPath: '', value:''}	//если передано условие - тогда результат компилится в отдельный путь и сюда передается путь
			};
		},

		/**
		 * @description	Вызывается для выражений, которые необходимо схлопнуть в отдельный modelPath, может обработать и просто статику вернув value
		 * @param self
		 * @param query
		 * @param cfg
		 * @return {value: Object}									Если в вырожении только статика
		 * @return {modelPath: string, provider: 'M', adapter:}		Если в выражении пути на динамические данные
		 */
		queryCompile: function(self, query, cfg) {		// 'myname is {{G.capaign_id ? G.campaign.name : M.name ::upperCase}}, and {{age}} years old'
			if (!cfg) cfg = {};
			var ret = {};
			var parts = self.private.querySplit(query, cfg).parts;

			//console.log('cc parts:', parts);
			if ( parts.length == 1) {
				if ( parts[0].modelPath ) {						// Если содержится только выржание. Например: "{{date ::filter}}"
					ret = parts[0];								// {owner, modelPath, fullPath, adapters}
				} else {										// Если только статика	"hello world"
					ret.value = parts[0].value;
				}
			} else {											// Если и выражения и статика: "hello {{M.name}} {{E.test}} {{R.contacts}}" || E & R
				var context = [];
				var usedPaths = {};
				parts.forEach(function(part) {
					if ( part.modelPath ) {
						//owner = 'self.static.getOwnerObject(self, \''+part.owner+'\').data';
						//return p1 + owner + '.' +modelPath;
						context.push("self.static.getOwnerObject(self, '"+part.owner+"').data." + part.modelPath);
						//context.push("self.public.modelGet('" + part.modelPath + "')");
						usedPaths[part.owner + '.' +part.modelPath] = part;
					} else {
						context.push('"' + part.value + '"');
					}
				});

				context = context.length ? context.join('+') : '""';

				if (Object.keys(usedPaths).length) {			//Если в строке есть любые пути
					var cModelPath = 'RP_expr_'+ $.crc32(context);
					ret.owner = 'M';
					ret.modelPath = cModelPath;
					ret.fullPath = ret.owner + '.' + ret.modelPath;
					ret.virtual = true;
					ret.origin = query;

					var renderFn = new Function('var self = arguments[0], _setCfg=arguments[1]; self.public.modelSet("' + cModelPath +'", ' + context + ',_setCfg)');
					//console.log('    qc watch: ', query, usedPaths, cModelPath);
					usedPaths.forEach(function(modelCfg, fullPath) {
						//console.warn('+add depends: ', modelCfg);
						var modelPath = modelCfg.modelPath;
						var ln = modelPath.length-1;
						if (modelPath[ln] == 'h' && modelPath[ln-1] =='t' && modelPath[ln-2]=='g' && modelPath[ln-3]=='n' && modelPath[ln-4]=='e' && modelPath[ln-5]=='l' && modelPath[ln-6]=='.') {	//== .replace(/\.length$/, '');		Тупо, но очень быстро
							modelPath = modelPath.substr(0, ln-6);
							fullPath = fullPath.substr(0, ln-6);
						}
						if ( !self.private.tpl.modelDepends[fullPath] ) self.private.tpl.modelDepends[fullPath] = {modelPath: modelPath, owner: modelCfg.owner, renderFn:[]};
						self.private.tpl.modelDepends[fullPath].renderFn.push(renderFn) ;
					});
				} else {										//Если в строке была тока статика
					ret.value = new Function('return '+context)();
				}
			}
			return ret;
		},

		/**
		 * Компилирует вырожение. Если в нем есть условия - схлопывет в одну локальную. В modelDepends проставляет зависимости с указанием источника
		 * Пример результата
		 *	M.capaignName ::upperCase	 							-> {modelPath: 'campaignName', owner: 'M', adapters:[{name: 'upperCase'}], usedPaths: {'M.campaignName': {modelPath: 'campaignName', owner:'M'}}}
		 *	G.capaign_id ? M.campaign.name : M.name ::upperCase		-> {modelPath: 'RP_expr_355', owner: 'M', adapters:[{name: 'upperCase'}], usedPaths: {'G.capaign_id': {modelPath: 'capaign_id', owner:'G'}, 'M.campaign.name': { ... } } }
		*/
		exprCompile: function(self, expr, cfg) {
			if (!cfg) cfg = {};
			//console.info('== exprCompile: expr', expr);
			var ret = {origin: expr};
			var adapters = [];
			var usedPaths = {};		// {'M.campaignId': true, 'G.count':true}

			var exprCfg = expr.trim().splitAs('::', ['expr', 'adapters[]']);
			if (exprCfg.adapters && !cfg.disableAdapters) {
				exprCfg.adapters.forEach(function(adapter) {
					adapter = adapter.trim();
					if ( adapter.match(/^([\w\d\.]+)\((.*)\)/) ) {
						var paramStr = RegExp.$2;
						var name = RegExp.$1;
						paramStr.replace(/(^|[^\w])([A-Z])\.([\w\.]+)([^\w\d]|$)/gm, function(_, p1, owner, modelPath, p2) {
							usedPaths[owner + '.' + modelPath] = {owner: owner, modelPath: modelPath};
							return p1 + owner + '.' +modelPath + p2;
						});
						adapters.push({name: name, paramStr: paramStr});
					} else {
						adapters.push({name: adapter});
					}
				});
			}

			// Выдираем значения перед перенаправлением ( a >> M.value )
			var valueFlowOffset = exprCfg.expr.indexOf('>>');
			if (valueFlowOffset != -1) {
				ret.forceValue = eval(exprCfg.expr.substr(0, valueFlowOffset));
				exprCfg.expr = exprCfg.expr.substr(valueFlowOffset+2).trim();
				//console.log(exprCfg.expr);
			}
			//console.log('find adapters: ', adapters);

			var staticData = [];
			var context = exprCfg.expr.trim()
			.replace(/(\\'.*?\\')/gm, function(_, data) {
				staticData.push(data);
				return '%@'+ staticData.length +'@%';
			}).replace(/(\\".*?\\")/gm, function(_, data) {
				staticData.push(data);
				return '%@'+ staticData.length +'@%';
			}).replace(/('.*?')/gm, function(_, data) {
				staticData.push(data);
				return '%@'+ staticData.length +'@%';
			}).replace(/(".*?")/gm, function(_, data) {
				staticData.push(data);
				return '%@'+ staticData.length +'@%';
			}).replace(/(^|[^\w])([A-Z])\.([\w\d\.]+)/gm, function(_, p1, owner, modelPath) {			//#TRY: можно сделать match, но идет просер конката http://jsperf.com/reg-match-vs-replace
				usedPaths[owner + '.' + modelPath] = {owner: owner, modelPath: modelPath};
				owner = 'self.static.getOwnerObject(self, \''+owner+'\').data';
				return p1 + owner + '.' +modelPath;
			})
			.replace(/[\w\d]\s*[\-\*\/\+%\(\)]]/g, '')
			.replace(/[\-\*\/\+%\(\)]]\s*[\w\d]/g, '');			//WTF ?

			//console.info('[exprCompile]', context, usedPaths);

			var staticPopReg = /\%\@(\d+)\@\%/g;
			while(staticPopReg.test(context)) {
				context = context.replace(staticPopReg, function(_, sId) {
					return 	staticData[sId-1];
				});
			}

			ret.adapters = adapters;
			var renderFn;
			var up_ln = Object.keys(usedPaths).length;

			if (up_ln) {																			//Если в выаржении есть ДИНАМИЧЕСКИЕ пути
				if (up_ln==1 && !adapters.length && /^([A-Z])\.([\w\d\.]+$)/.test(exprCfg.expr)) {	//Если всего один путь и он не в адаптерах
					ret.owner = RegExp.$1;
					ret.modelPath = RegExp.$2;
					ret.fullPath = ret.owner + '.' + ret.modelPath;
					//;;;console.log('   -find easy expre: ', ret.owner, ret.modelPath, ret);
				} else {
					ret.owner = 'M';
					ret.modelPath = 'RP_expr_'+ $.crc32(expr) + (adapters.length?'A':'');
					ret.virtual = true;
					ret.fullPath = ret.owner + '.' + ret.modelPath;
					if (adapters.length > 0 ) {														//Если путей много и есть адаптеры
						//;;;console.log(' ->[a] ', ret.modelPath, '  <=  ', expr, usedPaths, adapters);
						ret.usedPaths = usedPaths;

						//нулевым аргументом попадают адаптеры, а дальше (self, cfg) родителя
						//var contParent = context.match(/^([^\)]+\))/)[0];
						//var contParent = context.replace(/(\.[\w]+)$/, '');

						renderFn = (new Function('var self=arguments[1], _setCfg =arguments[2], R=ENV.system.route; self.public.modelSet("' + ret.modelPath + '", self.private.adapterApply(' + context + ', ">>", arguments[0]), _setCfg)')).bind(undefined, adapters);
					} else {																		//Если путей много, но адаптеров нету
						//;;;console.log(' -> ', ret.modelPath, '  <=  ', expr, '   |context:',context, usedPaths);
						renderFn = new Function('var self=arguments[0], _setCfg =arguments[1], R=ENV.system.route; self.public.modelSet("' + ret.modelPath + '", ' + context + ');');
						//renderFn = new Function('var self=arguments[0], _setCfg =arguments[1]; self.private.modelRenderPath("'+ret.modelPath+'", {forceValue: ' + context + '});');
						//renderFn = new Function('var self=arguments[0]; console.warn("render: '+ret.modelPath + '     '+context +'"); self.private.modelRenderPath("'+ret.modelPath+'", {forceValue: ' + context + '});');
					}
					//console.log('    ec watch: ', expr , usedPaths, ret.modelPath);

					usedPaths.forEach(function(modelCfg, fullPath) {
						//console.warn('+add depends: ', fullPath);
						var modelPath = modelCfg.modelPath;
						var ln = modelPath.length-1;
						if (modelPath[ln] == 'h' && modelPath[ln-1] =='t' && modelPath[ln-2]=='g' && modelPath[ln-3]=='n' && modelPath[ln-4]=='e' && modelPath[ln-5]=='l' && modelPath[ln-6]=='.') {	//== .replace(/\.length$/, '');		Тупо, но очень быстро
							modelPath = modelPath.substr(0, ln-6);
							fullPath = fullPath.substr(0, ln-6);
						}
						if ( !self.private.tpl.modelDepends[fullPath] ) self.private.tpl.modelDepends[fullPath] = {modelPath: modelPath, owner: modelCfg.owner, renderFn:[]};
						self.private.tpl.modelDepends[fullPath].renderFn.push(renderFn) ;
					});
				}

			} else {																				//Если выражение статическое и в нем нету путей
				if (adapters.length > 0) {															//и есть статические адаптеры
					//console.info('--- use static adapter on static');
					ret.value = $.__self__.static.adapterApply(new Function('var R=ENV.system.route; return '+context)(self), '>>', adapters);
				} else {																			//адаптеров вообще нету
					ret.value = new Function('var R=ENV.system.route; return '+context)();
				}
			}

			//console.log('[expr compile] ret:', exprCfg.expr, ret, self);
			return ret;
		}
	},

	static: {
		templates: {},
		bindMethods: {'onclick':1, 'onmouseover':1, 'onmouseout':1, 'onmousedown':1, 'onmouseup':1, 'onfocus':1, 'onblur':1, 'onchange':1,  'onkeydown':1, 'onkeyup':1}
	},
	extend: {
		/* *
		 * @method	register	Регистирует новый шаблон. Регистрация нужна чтобы можно было обращаться к шаблону по имени
		 * @param name			Имя шаблона
		 * @param tplContent	Контент шаблона
		 */
		register: function(self, name, tplContent) {
			//console.log('register tpl List', name, tplContent);



			var registerTemplate = function(name, tplContent) {
				//console.log('register template:', name);
				self.static.templates[name] = {
					dom: null,
					template: tplContent,
					index: {},
					modelDepends: {}
					//bindData: {},
					//dataExt: [],
				};
			};

			if ( name && (name.indexOf('<template')!=-1 || name.indexOf('<ENV')!=-1)) {
				tplContent = name;
				//tplContent = tplContent.replace(/\t/g, '').replace(/[\r\n]/g, "");
				tplContent.replace(/<ENV>([^\0]+?)<\/ENV>/g, function(a, envs){
					envs = envs.replace(/\t/g, '').replace(/[\r\n]/g, "");
					//console.log('[template] set ENV:', envs);
					envs = eval ("(" + envs + ")"); //.toJSON();
					envs.forEach(function(value, path) {ENV.set(path, value)});
				});
				tplContent.replace(/<template name=\s*['"]?([\w_:\-\+\/]+)['"]?[^>]*>([^\0]+?)<\/template>/g, function(a, name, tpl){
					//console.info('parse tpl:', name);
					tpl = tpl.trim().replace(/[\t\r\n]/g,'');
					registerTemplate(name, tpl);
				});
			} else {
				registerTemplate(name, tplContent);
			}
		}
	}
});



/** ---------------------------------------------------------------------------------------
 * Add basic types
 **---------------------------------------------------------------------------------------*/

/*
 Валидные преобразования:
 boolean, number /isFinite == true/, date, string,
 new String(), Number() /isFinite == true/, Boolean(), new Date() приводятся так же, как и скаляры
 undefined: ->'',
 null:  ->'',

 Все остальные преобразования генерируют ошибку и сохраняются в модели "как есть".

 При выводе на вьюху выводится то, что фактически есть в модели после преобразования (то есть undefined выведется как пустая строка, а не как "undefined");
 */

$.typeAdd('string', {
	originTypeName: 'string',
	checkType: function(value) {
		var valid = typeof value == 'string' || value instanceof String ||
			((typeof value == 'number' || value instanceof Number) && isFinite(value)) ||
			typeof value == 'boolean'|| value instanceof Boolean||
			value instanceof Date ||
			value === undefined || value === null;
		var coercedValue = valid ? ( (value === undefined || value === null) ? '' : '' + value) : value;
		return {value: coercedValue, valid: valid};
	},
	checkMin: function(value) {
		return !this.limit_min || value.length >= this.limit_min;
	},
	checkMax: function(value) {
		return !this.limit_max || value.length <= this.limit_max;
	}
});

/*
 Валидные преобразования:
 boolean (0/1)
 number /isFinite == true/
 date (getTime())
 string: '' -> null, прочие - при условии что +value == value && isFinite(value) == true
 new String(), Number(), Boolean(), new Date() приводятся так же, как и скаляры
 undefined: ->null,
 null:  ->null,

 Все остальные преобразования генерируют ошибку и сохраняются в модели "как есть".
 */
$.typeAdd('number', {
	originTypeName: 'number',
	checkType: function(value) {
		var coercedValue = '' + value === '' || value === undefined || value === null ? null : +value;
		var valid = ( (value instanceof Date && +value == coercedValue) || coercedValue === null || coercedValue == value) && isFinite(coercedValue);
		return {value: valid ? coercedValue : value, valid: valid};
	},
	checkMin: function(value) {
		return !this.limit_min || value >= this.limit_min;
	},
	checkMax: function(value) {
		return !this.limit_max || value <= this.limit_max;
	}
});

$.typeAdd('int', {
	originTypeName: 'int',
	baseType: 'number',
	checkType: function(value) {
		return {value: value, valid: value === parseInt(value) || value === null};
	}
});

$.typeAdd('uint', {
	originTypeName: 'uint',
	baseType: 'int',
	checkType: function(value) {
		return {value: value, valid: value >= 0};
	}
});

$.typeAdd('float', {
	originTypeName: 'float',
	baseType: 'number'
});

$.typeAdd('ufloat', {
	originTypeName: 'ufloat',
	baseType:	'float',
	checkType: function(value) {
		return {value: value, valid: value >= 0};
	}
});

$.typeAdd('float2', {
	originTypeName: 'float2',
	baseType:	'float',
	checkType:	function(value) {
		return {value: value, valid: value === null || value.toFixed(2) == value};
	}
});

$.typeAdd('ufloat2', {
	originTypeName: 'ufloat2',
	baseType:	'ufloat',
	checkType:	function(value) {
		return {value: value, valid: value === null || value.toFixed(2) == value};
	}
});

/*
 BOOLEAN:
 number:		1 -> true, 0->false
 string:		''->false, '0'-> false,  '1+'->true, 'true'->true, 'false'->false
 undefined:	-> false,
 null:		-> false
 */
$.typeAdd('bool', {
	originTypeName: 'bool',
	checkType:	function(value) {
		var coercedValue = (value instanceof String || value instanceof Number || value instanceof Boolean) ? value.valueOf() : value;
		var valid = typeof coercedValue == 'string' || (typeof coercedValue == 'number' && isFinite(coercedValue)) || typeof coercedValue == 'boolean' || value === undefined || value === null;
		coercedValue = Boolean(coercedValue) && !(coercedValue == 'false' || coercedValue == '0');
		return {value: valid ? coercedValue : value, valid: valid};
	}
});

/*
 DATE:
 string:		''->null, 'Mon Sep 30 2013 14:57:27 GMT+0400' -> Date(),	'YY-MM-DDT-xxxx'-> Date(),   'fsdfsd'->Error
 number:		unixtime-> Date()
 undefined:	-> null,
 null:		-> null,
 */
$.typeAdd('date', {
	originTypeName: 'date',
	checkType:	function(value) {
		var coercedValue = ($.isDate(value) ? value : new Date(value)) || ((value == '' || value === undefined || value === null) ? null : value);
		var valid = coercedValue != 'Invalid Date';
		return {value: valid ? coercedValue : value, valid: valid};
	}
});

$.typeAdd('email', {
	originTypeName: 'email',
	checkType:	function(value) {
		var correctType = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(value);
		return {value: value, valid: correctType};
	}
});

$.typeAdd('url', {
	originTypeName: 'url',
	checkType:	function(value) {
		var correctType = /^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/.test(value);
		return {value: value, valid: correctType};
	}
});

$.typeAdd('json', {
	originTypeName: 'json',
	checkType:	function(value) {
		// TODO: вроде не пашет этот типа данных. Проверить и в тесты добавить тест
		try {
			var coercedValue = eval(value);
			console.log('test: ', value, coercedValue);
			return {value: coercedValue, valid: true};
		} catch (e) {
			return {value:value,  valid:false}
		}
	}
});


/** ---------------------------------------------------------------------------------------
 *  Add basic adapters
 **---------------------------------------------------------------------------------------*/

$.adapterAdd('render', function(value, params) {
	if (!value) return '';
	if (!params) return value;
	value = value.replace(/\{\{\s*M\.([\w\.]+)\s*\}\}/gm, function(_, name) {
		return params[name];
	});
	return value;
});

$.adapterAdd('filter', function(obj, params) {
	var ret = $.isArray(obj) ? [] : ($.isHash(obj) ? {} : undefined);
	if (ret) {
		obj.forEach(function(value, key) {
			var allow = true;
			params.forEach(function(filterValue, filterKey) {
				if (!value || !$.isHash(value) || value[filterKey]!=filterValue) {
					allow = false;
					return false;
				}
			});
			if (allow) ret[key] = value;
		});
		return ret;
	} else {
		return '';
	}
});

$.adapterAdd('length', function(value) {
	if ($.isString(value) ) {
		return  value.length;
	} else if ( $.isArray(value) || $.isHash(value)) {
		return Object.keys(value).length;
	} else return '';
});
