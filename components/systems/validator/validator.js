/*
* TODO надо так подчищать, чтобы не ломать глобальные масаги итп
* */

(function() {
//	"use strict";

	var dispatcherHandlers = {
		create:	function() { return {}; },
		add:	function(hash, val) { hash.val = val; },
		get:	function(hash) { return hash.val; }
	};

	$.Validator = $.Class({
		init: function(self) {
			//console.warn('validator:', self);

			var onBlur = function(e) {
				var target = e.target || e.srcElement;
				if (!target) return;	// IE fix?
				var cfg = $.__self__.static.ioData[target.nodeId];
				if (cfg && (target.nodeName == 'INPUT' || target.nodeName == 'TEXTAREA' || target.isContentEditable)) {
					if (self.static.onblurSelectors.get(cfg.objSelf.public.pid + '.' + cfg.modelPath)) {
						$.Validator(cfg.objSelf.public).validate([cfg.modelPath]);
					}
				}
			};
			// навешиваем валидацию при блюре
			document.addEventListener('blur', onBlur, true);
		},

		constructor: function(self, mvc) {
			if ($.isRP(mvc)) {
				if (self.static.pids[mvc.pid]) {
					return self.static.pids[mvc.pid];
				} else {
					self.static.pids[mvc.pid] = self.public;
					self.private.mvc = mvc;
				}
			} else if (mvc !== undefined) {
				_throw_(new Error('[$.Validation constructor] аргумент должен быть либо RPObject или undefined"'));
			}
		},

		public: {
			setProperties: function(self, props) {
				props.forEach(function(props, key) {
					if (key == 'message') {
						for (var i = 0, keys = Object.keys(props), l = keys.length, errorCode, template; i < l; i++) {	// если после * есть продолжение селектора
							template = props[keys[i]];
							errorCode = keys[i].split('@');
							if (errorCode.length == 2 && errorCode[0].length && errorCode[1].length) {
								self.static.errorCodeToMessage.set(errorCode.join('.'), template);
							} else {
								_throw_(new Error('[$.Validation.setProperties()] errorCode должен быть в формате "ruleName@errorType"'));
							}
						}
					}
					else if (key.indexOf('bind:') == 0) {
						var sheafs = key.substr(5).trim().split(/\s+/);
						sheafs.forEach(function(tmp) {
							var tmp = tmp.split('@');
							var sheaf = {};
							if (tmp[0]) sheaf.ruleName = tmp[0];
							if (tmp[1]) sheaf.modelSelector = tmp[1];

							if (sheaf.ruleName.indexOf('*')) {
								if (props.force) {
									self.static.ruleGroups.remove(sheaf.ruleName);
								}
								self.static.ruleGroups.set(sheaf.ruleName, sheaf.ruleName);
							}

							// 1) Если bind:ruleName, то привязываем layout, rule, validateOn и message к ruleName
							// 2) Если bind:@modelSelector, то создается анонимный ruleName. Как нетрудно догадаться, ошибки от сервера не могут быть обработаны такими правилами.
							// 3) Если bind:ruleName@modelSelector, то происходит создание ruleName, к которому привязываются свойства вывода ошибок, а также
							//    одновременное привязывание modelSelector к этому правилу (то есть соответствующие пути валидируются этим правилом).
							// 4) Если ruleName уже был определен заранее, то происходит привязывание правила к modelSelector

							if ($.isNonEmptyObject(sheaf)) {
								if (!self.private.mvc && sheaf.modelSelector) _throw_(new Error('[$.Validation.setProperties()]: Нельзя делать привязку ошибок к модели, вызывая $.Validator без аргумента'));

								// собираем layout, пропуская туда только валидные параметры конфигурации
								var layout = {};
								if ($.isNonEmptyObject(props.layout)) {
									if ($.isString(props.layout.bindTo)) {	// Если строка, значит имеется в виду shortcut
										if (self.private.mvc) { layout.bindTo = function() { return self.private.mvc.shortcuts[props.layout.bindTo]; }; }
										else { throw new Error('[$.Validation.setProperties()]: Нельзя делать bindTo к shortcut, вызывая $.Validator без аргумента'); }
									} else if ($.isFunction(props.layout.bindTo)) {
										layout.bindTo = props.layout.bindTo;
										layout.position = 'custom';
									}

									if ($.isString(props.layout.templateName)) { layout.templateName =  props.layout.templateName; }
									if ($.isString(props.layout.position)) { layout.position =  props.layout.position; }
									if ($.isFunction(props.layout.node)) { layout.node =  props.layout.node; }
									if ($.isFunction(props.layout.handler)) { layout.handler = props.layout.handler; }

									if (!sheaf.ruleName) {	// чтобы при генерации имени анонимного правила, bindTo и handler не приводились к {} и можно было как-то различать layout, которые различаются только функциями bindTo
										layout.__uniq__ = '' + (layout.bindTo && layout.bindTo.toString()) + (layout.handler && layout.handler.toString());
									}
								}

								var dotcount;
								if (dotcount = sheaf.ruleName.match(/[\.]/g)) {
									//if (dotcount && dotcount.length ==3) {
									sheaf.ruleName = sheaf.ruleName.replace(/\.CID[^\.]+$/, '.*');
									//}
								}

								// создаем рулю
								var dispatcherProps;
								if ( self.static.ruleNameProps.hasOwnProperty(sheaf.ruleName) ) {
									dispatcherProps = self.static.ruleNameProps[sheaf.ruleName];
								} else {
									dispatcherProps = {};
								}


								//console.log('bind rule: ', sheaf.ruleName, sheaf.modelSelector, props);

								// разбираем rule
								var rule;
								if ($.isNonEmptyObject(props.rule)) {
									var type = {}, typeName = '';
									// устанавливаем тип на модель (валидация на уровне модели)
									if ($.isFunction(props.rule.fn)) {
										typeName = $.crc32(props.rule.fn.toString());
										if (!$.typeHas(typeName)) { $.typeAdd(typeName, {originTypeName: 'by_fn', checkType: props.rule.fn}); }
									}
									else if($.isArray(props.rule.enum)) {
										typeName = $.crc32(JSON.stringify(props.rule.enum));
										if (!$.typeHas(typeName)) {
											$.typeAdd(typeName, {
												originTypeName: 'by_enum',
												checkType: function(val) {
													var valid = props.rule.enum.some(function(enumItem) {
														return enumItem === val;
													});
													return {value: val, valid: valid};
												}
											});
										}
									} else {
										$.isString(props.rule.type) && (type.baseType = props.rule.type);
										$.isNumber(props.rule.limit_min) && (type.limit_min = props.rule.limit_min);
										$.isNumber(props.rule.limit_max) && (type.limit_max = props.rule.limit_max);

										if (Object.keys(type).length) {
											typeName = $.crc32(JSON.stringify(type));
											if (!$.typeHas(typeName)) { $.typeAdd(typeName, type); }
										}
									}

									// Устанавливаем rule, чтоб потом было что в msgModel пробросить

									var rule = {};
									if ($.isBoolean(props.rule.required)) rule.required = props.rule.required;
									if (type.limit_min) rule.limit_min = type.limit_min;
									if (type.limit_max) rule.limit_max = type.limit_max;
								}


								if ($.isNonEmptyObject(layout)) dispatcherProps.layout = layout;
								if ($.isNonEmptyObject(rule)) dispatcherProps.rule = rule;
								if (typeName) dispatcherProps.typeName = typeName;
								if ((props.validateOn === 'change' || props.validateOn === 'blur')) dispatcherProps.validateOn = props.validateOn;

								// генерируем имя анонимной рули, если оно не задано
								if (!sheaf.ruleName) sheaf.ruleName = 'rule_' + $.crc32(JSON.stringify(dispatcherProps));

								delete layout.__uniq__;	// подчищаем


								self.static.ruleNameProps[sheaf.ruleName] = dispatcherProps;

								if (sheaf.modelSelector) {
									var modelSelectorPid = self.private.mvc.pid + '.' + sheaf.modelSelector;

									if (props.force) {
										self.static.modelPathToRuleName.remove(modelSelectorPid);
										self.static.ruleNameToModelPath.remove(sheaf.ruleName);
									}

									self.static.modelPathToRuleName.set(modelSelectorPid, sheaf.ruleName);
									self.static.ruleNameToModelPath.set(sheaf.ruleName, modelSelectorPid);

									if (dispatcherProps.typeName) {
										//console.log('  -set type ['+sheaf.modelSelector+']: ', dispatcherProps.typeName, self.private.mvc);
										self.private.mvc.modelSetType(sheaf.modelSelector, dispatcherProps.typeName);
									}

									if (dispatcherProps.validateOn === 'change') {
										self.private.mvc.modelEventAdd('error', sheaf.modelSelector, function(eventName, path, params) {
											//console.log('error!', eventName, path, params);
											var errorProps = {ruleName: sheaf.ruleName, node: self.private.mvc.getElementByModelPath(path), position: layout.position, msgModel: props.rule};
											if ( params.newValue ) {	// Если поле пустое и не обязательное, то валидацию не надо делать
												errorProps.errorType = params.errorType;
												self.extend.throw([errorProps]);
											} else if (rule.required) {
												errorProps.errorType = 'field_empty';
												self.extend.throw([errorProps]);
											}
										});
										self.private.mvc.modelEventAdd('beforeSet', sheaf.modelSelector, function(eventName, path, params) {
											var errorMVC = self.static.errorMVCs[self.private.mvc.getElementByModelPath(path).nodeId];
											if (errorMVC) errorMVC.remove();
										});
									}

									if (dispatcherProps.validateOn === 'blur') {	// mvc path тоже должны быть
										self.static.onblurSelectors.set(modelSelectorPid, true);
									}
								}

								// Устанавливаем сообщения
								if ($.isNonEmptyObject(props.message)) {
									props.message.forEach(function(template, errorType) {
										self.static.errorCodeToMessage.set(sheaf.ruleName + '.' + errorType, template);
									});
								}
							}
						});
					} else {
						_throw_(new Error('[$.Validation.setProperties()]: Неправильные параметры инициализации $.Validator.setProperties'))
					}
				});
			},

			validate: function(self, selectors) {
				if (!self.private.mvc) throw new Error('Нельзя запускать метод $.Validator(mvc).validate() без mvc.');
				selectors = selectors || ['**'];
				if (!$.isArray(selectors)) selectors = [selectors];

				var errors = [];
				var pidPostfix = self.private.mvc.pid + '.';

				selectors.forEach(function(selector) {

					self.private.mvc.model.forEachBySelector(selector, function(value, path) {
						var ruleNames = self.static.modelPathToRuleName.get(pidPostfix + path, true);	// all = true - возвращает все совпадения в порядке релевантности

						if (ruleNames.length) {	// если есть вообще правила валидации на этот путь...
							var node = self.private.mvc.getElementByModelPath(path);
							//console.log('['+path+'] check:', ruleNames, node);
							if (node) self.static.hideMessages([node.nodeId]);

							var error;
							var props = {rule:{}, layout: {}};
							// бежим по цепочке релевантности и заполняем свойства правила

							var collapseRule = function(ruleNames) {
								ruleNames.forEach(function(ruleName) {
									var localProps = self.static.ruleNameProps[ruleName];
									if (!localProps) return;
									//console.log('['+ruleName+'] localProps:', localProps);
									if ($.isEmptyObject(props.rule) && localProps.hasOwnProperty('rule')) { props.rule = localProps.rule; }
									if ($.isEmptyObject(props.layout) && localProps.hasOwnProperty('layout')) { props.layout = localProps.layout; }
									if ( !props.typeName && localProps.hasOwnProperty('typeName')) { props.typeName = localProps.typeName; }
									if (Object.keys(props).length == 2) return false;
								});
							};

							collapseRule(ruleNames);

							if ( $.isEmptyObject(props.rule) ) {
								var group = self.static.ruleGroups.get(ruleNames[0]);
								if (group) {
									group = group.replace(/([^\.]+)$/, '*');
									//console.log('group:', group);
									collapseRule([group]);
								}
							}

							//console.warn('use props:', props, '  path:',path );


							//console.log('props:', props, self.static.ruleNameProps[ruleNames[0]], self);
							if (props.rule.required && !value) { error = {errorType: 'field_empty'}; }	// ruleNames[0] - самое релевантное правило
							else if (value) { error = self.private.mvc.modelValidate(path)[0]; }	// {path: path, errorType: errObj.error, type: type}
							if (error) {
								error.node = node;
								error.ruleName = ruleNames[0];
								error.position = props.layout.position;
								var template = self.static.errorCodeToMessage.get(ruleNames[0] + '.' + error.errorType);
								error.params = {value: self.private.mvc.model.getPropertyByPath(path), rule: props.rule};
								errors.push(error);
							}
						}

					}, {hash: false});
				});

				//;;;console.info(errors);
				if ( errors.length > 0 ) self.extend.throw(errors);
				return errors.length === 0;
			},

			clearProperties: function(self) {
				self.static.onblurSelectors.destroy();
				self.static.ruleNameProps = {};
				self.static.pids = {};
				self.static.modelPathToRuleName.destroy();
				self.static.errorCodeToMessage.destroy();
				self.static.errorMVCs = {};
			}
		},

		private: {
			mvc:	undefined
		},

		static: {
			ruleGroups:				$.Dispatcher(dispatcherHandlers, 'left'),
			ruleNameToModelPath:	$.Dispatcher(dispatcherHandlers, 'left'),
			modelPathToRuleName:	$.Dispatcher(dispatcherHandlers, 'left'),		// 1) Сначала rule и layoutProps ищем здесь. Если не нашли, то ниже
			ruleNameProps:			{},		// {ruleName -> errorProps[id]}
			errorCodeToMessage:		$.Dispatcher(dispatcherHandlers, 'right'),	// 'right', потому что самые приоритетные поля - errorType (справа), потом более левые

			onblurSelectors:		$.Dispatcher(dispatcherHandlers, 'left'),	// PRIVATE				// Список путей и MVCid (modelPathPid), которые надо валидировать по onblur
			errorMVCs: {},		// PRIVATE				// хэш ошибок (нужен, чтобы можно было из удалять из DOM)
			showMessages: function(self, errorProps) {	// errorProps = {node, text, position}
				//console.info('errorProps:', errorProps);
				errorProps.forEach(function(cfg) {
					//console.log('mes:', mes);
					var locModel = cfg.msgModel;		//TODO: придумать так чтобы модель не смешивалась с локальными свойствами, но все парамсы были доступны чере {{M}}
					delete cfg.msgModel;
					cfg.extendByClone(locModel, false, true);

					if (cfg.position == 'window' || !cfg.node) {
						//alert(mes.viewGet());
						$().modelSet(cfg).viewSet('@ui/validator/custom');
						//$().modelSet({text: cfg.text}).viewSet('@ui/validator/custom');

					} else {
						//var mes = $(cfg.templateName || '@ui/validator').modelSet({text: cfg.text, position: cfg.position});	//TODO: пофисить хз что, но если вью назначить изначально - данные не подсасываются через попап и инклуд
						var mes = $(cfg.templateName || '@ui/validator').modelSet(cfg);	//TODO: пофисить хз что, но если вью назначить изначально - данные не подсасываются через попап и инклуд

						var posAction = {'rt':'insertAfter', 'rb': 'insertAfter', 'lt':'insertBefore', 'lb':'insertBefore', 'custom': 'appendTo'}[cfg.position];
						if (!posAction) _throw_('[$.Validator] invalid position:', cfg.position);
						//// УДАЛЯТЬ КАСТОМНЫЕ СООБЩЕНИЯ И ВАЩЕ ПОДУМАТЬ КАК С POSITION БЫТЬ

						mes[posAction](cfg.node);
						mes.scrollTo('up');
						self.static.errorMVCs[cfg.node.nodeId] = mes;

						mes.click(function() {
							mes.remove();
						});

						if (cfg.node) {
							//console.log('node:', cfg.node);
							var evtId = $(cfg.node).eventAdd('click', function() {
								$(cfg.node).eventRemove(evtId);
								//mes.fadeOut('fast', function() {
									mes.remove();
									//self.static.hideMessages([cfg.node.nodeId]);
								//});
							}, false);
						}
					}
				});
			},
			hideMessages:	function(self, nodeIds) {	//nodeIds [optional]
				var mvcs = self.static.errorMVCs;
				if (!nodeIds) nodeIds = Object.keys(mvcs);

				nodeIds.forEach(function(nodeId) {
					if (mvcs.hasOwnProperty(nodeId)) {
						mvcs[nodeId].remove();
						delete mvcs[nodeId];
					}
				});
			},
			pids:	{}	// используется, чтобы $.Validator(mvc) каждый раз не создавала новый объект, а возвращала старый (если уже вызывали $.Validator от этой mvc)
		},

		extend: {
			setProperties: function(self, rules) {
				return $.Validator().setProperties(rules);
			},

			/** @function
			 *	@name	$.Validator.throw
			 *	@description Собирает все необходимые данные, чтобы вывести ошибки на экран и вызывает $.Notifier();
			 *	@param	self
			 *	@param	{array} [errors] 			Массив ошибок, которые надо вывести
			 *	@param  {string} [errors.ruleName]		Правило валидации, в соответствии с которым произошла ошибка
			 *	@param  {string} [cfg.errorType]	Код ошибки
			 *	@param  {object} [cfg.params]		Данные в выводе сообщений, пример: params: {block:'красный'}		"ошибка в блоке {{block}}"
			 *	@param  {string} [cfg.template]		Сообщение, которое нужно приоритетно вывести
			 */
			throw: function(self, errors) {
				//;;;console.warn('$.Validator:', self);
				;;;console.warn('ERRORS:', errors);
				var msgProps = [];

				errors.forEach(function(error) {
					if ($.isString(error)) {
						error ={ errorCode: error };
					}

					if (error.errorCode) {
						if (error.errorCode.match(/^(.*)\.([^\.]+)$/) ) {
							error.ruleName = RegExp.$1;
							error.errorType = RegExp.$2;

						} else {
							error = {ruleName: error.errorCode};
							//_throw_('[$.Validator.throw] invalid Error config: "' + error +'"');
						}
					}

					var errorCode = error.ruleName + '.' + error.errorType;

					var errorProps = self.static.ruleNameProps[error.ruleName];

					var msgModel = {};
					if ($.isHash(error.params)) msgModel = msgModel.extendByClone(error.params);
					//if (errorProps && $.isHash(errorProps.rule)) msgModel = msgModel.extendByClone(errorProps.rule);

					//console.log('msgModel:',msgModel);

					var node = error.node;
					var position = 'rt';
					//console.log(' - errorProps:', error, errorProps, error.ruleName);
					if (errorProps && errorProps.layout) {
						position = errorProps.layout.position || position;
						//node = (position == 'custom') && ( ($.isFunction(errorProps.layout.bindTo) && errorProps.layout.bindTo(error.params)) );
						node = ( ($.isFunction(errorProps.layout.bindTo) && errorProps.layout.bindTo(error.params)) );
						var templateName = errorProps.layout.templateName;
					}

					// Пробегаемся по создаваемому списку параметров вывода ошибок и смотрим, привязано ли что-то уже к ноде
					for (var index = -1, j = 0, len = msgProps.length; j < len; j++) {
						if (msgProps[j].node === node) { index = j; break; }
					}

					if (!node) {
						var mp = self.static.ruleNameToModelPath.get(error.ruleName);
						if (mp) {
							mp=mp.match(/([\w\d_]+)\.(.*)/);
							node = $(mp[1]).getElementByModelPath(mp[2]);
						}
					}

					//console.log('error:', error);
					//console.log('errorProps:', errorProps);
					//console.log('index:', index);

					if (errorProps && errorProps.layout && errorProps.layout.node) {
						if ($.isFunction(errorProps.layout.node)) {
							node = errorProps.layout.node(errorCode, msgModel);
						}
					}

					// Расширяем модель ошибки
					if ($.isFunction(errorProps && errorProps.layout && errorProps.layout.handler)) {
						var ret = errorProps.layout.handler(msgModel, errorCode);	// text, cid, errorType, params
						if (ret === false) return;
						msgModel.extendByClone(ret, true, true);	// force & mutate
					}
					if (index == -1) {
						var props = {
							node: node,
							position: position,
							msgModel: msgModel,
							templateName: templateName
						};
						if (error.text) { props.text = error.text;}
						else { props.template = error.template || self.static.errorCodeToMessage.get(errorCode); }
						msgProps.push(props);
					} else {
						msgProps[index].msgModel.extendByClone(msgModel, true, true);	// force & mutate
					}
				});

				for (var i = 0, l = msgProps.length; i < l; i++) {
					//console.log('msgProps[i].msgModel:', msgProps[i].msgModel);
					if (!msgProps[i].text) {
						var model = {}.extendByClone(msgProps[i].msgModel);
						var t = $('!' + msgProps[i].template).modelSet(model, {forceRender: true});
						//;;;console.info('T:', t, t.viewGet());
						msgProps[i].text = t.viewGet();
					}
					//delete msgProps[i].msgModel;
					//delete msgProps[i].template;
				}
				//;;;console.info(msgProps);
				self.static.showMessages(msgProps);
			}
		}
	});
})();