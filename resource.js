(function() {
	var resConfigs = {};
	var resourceClass = $.Class({
		init: function(self) {

			self.static.subscribes = $.Dispatcher({			//Все подписки
				create: function () {
					return $.Transaction();
				},
				add: function(transaction, handler) {
					transaction.push(handler);
				}
			});

			if (ENV.system.path.websocket) {
				self.static.ws = $.WS(ENV.system.path.websocket, {
					onError: function() {
						//TODO: сделать несколько ретраев и если не поможет - упасть.
						console.log('[WS] error:', arguments);
						self.static.ready = true;
						self.static.onReady.run();
					},
					onOpen: function() {
						self.static.ws.get(function(response) {
							console.warn('[WS GET]:', response);
							self.static.wsFire(response);
						});
						console.log('[WS] try connect to WS server...');
						self.static.ws.send({
							action: "authorize",
							login: ENV.system.accountId,
							password: ENV.system.wsToken
						});

						self.static.ready = true;
						self.static.onReady.run();
					}
				});
			} else {
				//self.static.ready = true;
				self.static.onReady.run();
			}
		},

		constructor: function(self, resourceName) {
			var resource = self.static.resources[resourceName];
			if (resource) return resource;
			self.static.resources[resourceName] = self.public;
			self.private.resourceName = resourceName;
			var cfg = resConfigs[resourceName];
			if (!cfg) _throw_('Resource `'+resourceName+'` not configured yet');
			self.private.config = cfg;


			//console.info('[resource cfg] ', resourceName, cfg);

			['add', 'change', 'delete', 'refresh'].forEach(function(eventName) {	//, 'refresh'
				self.private.events[eventName] = {};
			});

			if (cfg.methods) {
				cfg.methods.forEach(function(methodName) {
					if ({getInfo:1, saveInfo:1, getAll:1, getList:1, getItems:1, saveItem:1}[methodName]) {

					} else {
						var cache = true;
						methodName = methodName.replace(/:nocache/, function() {cache=false; return ''});
						self.public[methodName] = function(filter, callback, actionConf) {

							//console.warn('[Resource] run method:', methodName, filter, 'cache:', cache, self.private.data);

							if (cache && !cfg.fieldId && Object.keys(filter).length === 0 && self.private.data) {
								//console.log('return from cache');
								if (callback) callback(self.private.data);
							} else {
								LPG.form(self.private.resourceName+'.'+ methodName, filter||{}, function(response) {
									if (callback) callback(response);
								}, actionConf);
							}
						};
					}
				});
			}
		},

		public: {
			getInfo: function(self, filter, callback, actionConf) {
				var cfg = self.private.config;
				LPG.form(self.private.resourceName + '.getInfo', filter || {}, function (response) {
					self.private.data = response;
					if (callback) callback(response);
				}, actionConf);
			},
			saveInfo: function(self, data, callback, actionConf) {
				LPG.form(self.private.resourceName + '.saveInfo', data, function(response) {
					/*
					if (Object.keys(response).length>0) {
						//console.warn('res:', self);
						if (self.private.config.fieldId) {
							var itemId = response[self.private.config.fieldId];
							self.private.data[itemId] = response;

							var bridges = self.static.modelBridgesIdx[self.private.resourceName];
							if (bridges) {
								bridges.forEach(function(bridgeCfg){
									var modelPath = bridgeCfg.path+'.'+response[self.private.config.fieldId];
									bridgeCfg.obj.public.modelSet(modelPath, response);
								});
							}

						} else {
							self.private.data = response;
						}
					}
					*/
					if (callback) callback(response);
				}, actionConf);
			},


			getAll: function(self, filter, callback, actionConf) {
				var cfg = self.private.config;
				LPG.form(self.private.resourceName + '.getAll', filter || {}, function (response) {
					/*
					 if (cfg.fieldId) {
					 var itemId = response.anyKey;
					 var itemValue = response[itemId];
					 if (!self.private.data) self.private.data = {};
					 self.private.data[itemId] = itemValue;
					 if (callback) callback(itemValue);
					 } else {
					 */
					self.private.data = response;
					if (callback) callback(response);
					//}
				}, actionConf);
			},
			getList: function(self, filter, callback, actionConf) {
				//console.info('[resource getList] self:', self);
				if (!self.private.data) self.private.data = {};
				if (self.private.config.fieldId) {
					LPG.form(self.private.resourceName+'.getList', filter||{}, function(ret) {
						var response = {};
						var missedIds = [];
						var allCount = ret.count;
						if (self.private.config.nocache['getList']) {
							missedIds = ret[self.private.config.fieldId];
						} else {
							ret[self.private.config.fieldId].forEach(function (id) {
								if (self.private.data.hasOwnProperty(id)) {
									response[id] = self.private.data[id];
								} else {
									//console.log('+id: ',id);
									missedIds.push(id);
								}
							});
						}
						if (missedIds.length) {
							LPG.form(self.private.resourceName+'.getItems', {}.addPair(self.private.config.fieldId, missedIds), function(data) {
								data.forEach(function (itemValue, itemId) {
									self.private.data[itemId] = itemValue;
									response[itemId] = itemValue;
								});
								if (callback) callback(response, allCount);
							});
						} else {
							if (callback) callback(response, allCount);
						}
					}, actionConf);
				} else {
					_throw_('getList not allowed for nonList structure. Check your Resource configuration.');
				}
			},
			getItems: function(self, filter, callback, actionConf) {
				//console.warn('[resource getList] self:', self);
				var fieldId = self.private.config.fieldId;
				if (filter) {
					if (filter.hasOwnProperty(fieldId) && !$.isArray(filter[fieldId])) {
						filter[fieldId] = [filter[fieldId]];
					}
				} else {
					filter = {};
				}
				var cfg = self.private.config;									 //resConfigs[self.private.resourceName];

				if (!cfg.fieldId && Object.keys(filter).length === 0 && self.private.data) {
					if (callback) callback(self.private.data);
				} else if (cfg.fieldId && Object.keys(filter).length == 1 && filter.hasOwnProperty(cfg.fieldId)  && self.private.data && self.private.data[filter[cfg.fieldId]] ) {
					if (callback) callback(self.private.data[filter[cfg.fieldId]]);
				} else {
					LPG.form(self.private.resourceName + '.getItems', filter || {}, function (response) {
						if (cfg.fieldId) {
							var itemId = response.anyKey;
							var itemValue = response[itemId];
							if (!self.private.data) self.private.data = {};
							self.private.data[itemId] = itemValue;
							if (callback) callback(itemValue);
						} else {
							self.private.data = response;
							if (callback) callback(response);
						}
					}, actionConf);
				}
			},
			saveItem: function(self, data, callback, actionConf) {
				LPG.form(self.private.resourceName + '.saveItem', data, function(response) {
					if (Object.keys(response).length>0) {
						//console.warn('res:', self);
						if (self.private.config.fieldId) {
							var itemId = response[self.private.config.fieldId];
							self.private.data[itemId] = response;

							var bridges = self.static.modelBridgesIdx[self.private.resourceName];
							if (bridges) {
								bridges.forEach(function(bridgeCfg){
									var modelPath = bridgeCfg.path+'.'+response[self.private.config.fieldId];
									bridgeCfg.obj.public.modelSet(modelPath, response);
								});
							}

						} else {
							self.private.data = response;
						}
					}
					if (callback) callback(response);
				}, actionConf);
			},

			addInfoLocally:	function(self, response) {		//если в ресурс нужно добавить в ресурс данные без запроса на сервер
				if (self.private.config.fieldId) {
					var itemId = response[self.private.config.fieldId];
					self.private.data[itemId] = response;

					var bridges = self.static.modelBridgesIdx[self.private.resourceName];
					if (bridges) {
						bridges.forEach(function(bridgeCfg){
							var modelPath = bridgeCfg.path+'.'+response[self.private.config.fieldId];
							bridgeCfg.obj.public.modelSet(modelPath, response);
						});
					}
				}
			},

			eventAdd: function(self, eventName, path, handler) {
				path = self.private.resourceName + (path ? '.' + path : '');
				eventName.split(/\s+/).forEach(function(eventName) {
					var fullPath = eventName + '.' + path;
					if (!self.private.events[eventName][path]) {
						//console.log('create subscribe:', eventName, path);
						self.private.events[eventName][path] = $.Transaction();
						self.static.ws.send({action: "subscribe", data: [fullPath]});
					}
					self.private.events[eventName][path].push(handler);
					self.static.subscribes.set(fullPath, handler);
				});
			}
		},

		private: {
			events: 		{},
			config:			undefined,
			resourceName:	undefined,
			data:			{}
		},

		static: {
			ready:			false,
			onReady:		$.Transaction(),
			ws:				undefined,		//webSocket
			resources:		{},
			subscribes:		undefined,		//dispatcher object for resource's subscribes,
			modelBridges:	{},
			modelBridgesIdx:{},
			wsFire: function(self, response) {
				console.warn('[WSfire]:', response);
				//return;
				setTimeout(function() {								//Чтобы сокеты не были такими быстрыми xD
					var data = $.isString(response.data) ?  JSON.parse(response.data) : response.data;
					console.log('wsdata:', data);
					var pathCfg = data.path.splitAs('.', ['event', 'module', 'structure', 'path~']);
					var transactions = self.static.subscribes.get(data.path);
					transactions.forEach(function(transaction) {
						transaction.run(null, {path:pathCfg.path, value:data.value, tid:data.tid});
					});
				}, 300);
			}
		},

		extend: {
			register: function() {},
			onReady: function(self, callback) {
				if (!self.static.ready) {
					self.static.onReady.push(callback);
				} else {
					callback();
				}
			},
			wsMock: function(self, value) {
				self.static.wsFire({data: value});
			}
		}
	});


	$.Resource = resourceClass;
	$.Resource.register = function(name, cfg) {
		cfg.nocache = {};
		var methods = {};
		if (cfg.methods) {
			cfg.methods.forEach(function(value, key) {
				methods[value] = value;
				//TODO: на все изменяемые данные сделать сокеты и всем включить кеширование.
				if ($.isString(value) && (value.indexOf(':nocache')>1)) {value = cfg[key]= value.replace(':nocache', '');cfg.nocache[value] = true;}
			});
		}
		cfg.methods = methods;
		resConfigs[name] = cfg;
		return $.Resource;
	};

	$.extend('modelBridgeResource', function(self, modelPath, resource, resourceFilter, callback, actionConf) {
		var resourceName, resourceMethod, resourceCfg;

		if ( resource.match(/^([A-Z0-9\._]+)$/) ) {
			resourceName = RegExp.$1;
			resourceCfg = resConfigs[resourceName];
			resourceMethod = resourceCfg.methods.getInfo || resourceCfg.methods.getAll || resourceCfg.methods.getList;
		} else if ( resource.match(/^([A-Z0-9\._]+)\.([\w0-9]+)$/) ) {
			resourceName = RegExp.$1;
			resourceMethod = RegExp.$2;
			resourceCfg = resConfigs[resourceName];
		} else {
			console.log(arguments);
			_throw_('[modelBridgeResource] Syntax error');
			return;
		}

		resource = $.Resource(resourceName);
		var resourceSelf = resource.__self__;
		if (!resourceFilter) resourceFilter = {};

		var fullPath = self.public.pid + '.' + modelPath + ':'+resourceName;
		if ({getInfo:1, getList:1, getItems:1, getAll:1}[resourceMethod]) {							//if methods == getList|getInfo|getAll
			//console.warn('[Resource] ', resourceMethod, ':', fullPath);
			if (!resourceSelf.static.modelBridges[fullPath]) {
				//console.warn('create res bridge');
				resourceSelf.static.modelBridges[fullPath] = self;
				var modelBridgesIdx = resourceSelf.static.modelBridgesIdx;
				if (!modelBridgesIdx[resourceName]) {modelBridgesIdx[resourceName] = [];}
				modelBridgesIdx[resourceName].push({path: modelPath, obj: self});

				if (resourceCfg.autoObservedPath) {
					resourceCfg.autoObservedPath.forEach(function(observedPath) {
						//Если данные меняются в ресурсе - меняем их в капсуле
						resource.eventAdd('change', observedPath, function(data) {
							resourceSelf.private.data.setPropertyByPath(data.path, data.value);
							var fullModelPath = modelPath+'.'+data.path;
							if (self.public.model.hasPropertyByPath(fullModelPath)) {
								//console.log('[WS] data changed:', data, resourceSelf, '   self:', self);
								self.public.modelSet(modelPath+'.'+data.path, data.value, {initiator: data.tid});
							}
						});

						resource.eventAdd('add', observedPath, function(data) {
							resourceSelf.private.data.setPropertyByPath(data.path, data.value);
							//var fullModelPath = modelPath+'.'+data.path;
							//console.log('[WS] data added:', data, resourceSelf, '   self:', self);
							//self.public.modelSet(modelPath+'.'+data.path, data.value, {initiator: data.tid});
						});

						resource.eventAdd('delete', observedPath, function(data) {
							resourceSelf.private.data.setPropertyByPath(data.path, data.value);
							var fullModelPath = modelPath+'.'+data.path;
							self.public.modelDelete(modelPath+'.'+data.path, data.value, {initiator: data.tid});
						});

						resource.eventAdd('refresh', '', function(data) {
							var getMethod = resourceCfg.methods.getInfo; // || resourceCfg.methods.getAll || resourceCfg.methods.getList;
							resource[getMethod](resourceFilter, function(value) {
								//console.log('rs:', self.public.model, modelPath, value);
								self.public.modelSet(modelPath, value, {initiator: data.tid});
							});
						});

						self.public.modelEventAdd('change', modelPath+'.'+observedPath, function(eventName, path, cfg) {
							//console.log('caps change:', path.replace(modelPath+'.', ''));
							resourceSelf.private.data.setPropertyByPath(path.replace(modelPath+'.', ''), cfg.newValue);
						});
					});
				}
			}

			if (resourceMethod == 'getList') {
				resource.getList(resourceFilter, function(data, count) {
					self.public.modelSet(modelPath, data, actionConf);
					if (callback) callback(count, data);
				}, actionConf);
			} else {
				resource[resourceMethod](resourceFilter, function (data) {
					self.public.modelSet(modelPath, data, actionConf);
					if (callback) callback(data);
				}, actionConf);
			}

			/*
			if (resourceMethod == 'getAll') {
				resource.getAll(resourceFilter, function (data) {
					self.public.modelSet(modelPath, data, actionConf);
					if (callback) callback(data);
				}, actionConf);
			} else if (resourceMethod == 'getList') {
				resource.getList(resourceFilter, function(data, count) {
					self.public.modelSet(modelPath, data, actionConf);
					if (callback) callback(count, data);
				}, actionConf);
			} else if (resourceMethod == 'getItems') {
				resource.getItems(resourceFilter, function (data) {
					self.public.modelSet(modelPath, data, actionConf);
					if (callback) callback(data);
				}, actionConf);
			}
			*/

		} else {
			console.log('resourceMethod:', resourceMethod, '|  args:', arguments);
			resource[resourceMethod](resourceFilter, function(data) {
				if (callback) callback(data);
			});
		}
	});

})();


