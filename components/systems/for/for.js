/**
 * @component
 * @description Цикл
 * 		attrs: доступные аттрибуты для конфигурации цикла
 * 			resourceName	string		//Имя ресурса, используемое для получения данных
 * 			key:			string
 * 			value:			sting
 * 			in:				hash
 * 			sortby:			string,
 * 			filter:			string || hash
 * 			resultcount:	общее количество итемов (для фильтра)
 * 			limit:			int
 * 			offset:			int
 * 			animation:		enum(none|slideVertical|fade)
 * 			loader:			bool,		//Показывать лоадер (только если задан resourceName)
 * 			pager:			bool,
 * 			limitperpage:	int,		//[только при pager:true] Количество элементов на странице
 * 			currentpage:	int			//Текущая страница
 * @example
 * 		<for key="M.id" value="M.item" in="{{M.todos}}" filter="{{'status:' + filter}}" animation="slideVertical">
 *			<div>{{M.id}} = {{M.item.name}} ({{M.num}} of {{M.count}})</div>
 *		</for>
 *
 * 		<for key="M.id" value="M.item" in="{{M.todos}}" filter="{{'status:' + filter}}" animation="slideVertical" lock="{{}}" >
 *			<div>{{M.id}} = {{M.item.name}} ({{M.num}} of {{M.count}})</div>
 *		</for>
 * */

$.Controller.register("ui::for", {

	limitPerPage:	10,				// [только при attr.pager = true]

	in:				undefined,
	key:			undefined,
	value:			undefined,
	sortBy:			undefined,
	content:		undefined,
	parent:			undefined,
	items:			{},
	lastState:		[],				// [item1_id, item2_id, item3_id ... ]
	lastStateIdx:	{},				// {item1_id: pos1, item2_id: po2 ... }
	animateName:	undefined,
	animateEvent:	undefined,

	renderPid:		1,

	$loader:		undefined,
	showProcessBuffer:	[],

	start: function(self, container, cfg, parent) {

		cfg.attrs.setDefault({
			'resourceName': '',
			'limit':		0,
			'offset':		0,
			'key':			'key',
			'value':		'value',
			'in':			{},
			'sortby':		undefined,
			'resultcount':	0,
			'animation':	'fade/hide',
			'animationDuration': '',
			'filter':		{},
			'pager':		true,
			'limitperpage':	10,
			'currentpage':	0,
			'filterObj':	{},
			'filterDelay':	false
		});

		if (!cfg.attrs.key) _throw_(new Error('[UI::FOR] Необходимо указать аттрибут value'));
		if (!cfg.attrs.value) _throw_(new Error('[UI::FOR] Необходимо указать аттрибут value'));
		if ( cfg.attrs.in.value && !$.isHash(cfg.attrs.in.value) && !$.isArray(cfg.attrs.in.value) ) _throw_(new Error('[UI::FOR] аттрибут in должен быть объектом'));

		self.filter = $.isString(cfg.attrs.filter.value) ? eval('self.filter='+cfg.attrs.filter.value) : cfg.attrs.filter.value;

		self.resourceName = cfg.attrs.resourceName;
		self.resultcount = cfg.attrs.resultcount;
		self.limit = cfg.attrs.limit;
		self.offset = cfg.attrs.offset;
		self.in = cfg.attrs.in;
		self.sortby = cfg.attrs.sortby;
		self.filterObj = cfg.attrs.filter;
		self.content = cfg.content;
		self.container = container;
		self.parent = parent;
		self.key = cfg.attrs.key.value;
		self.value = cfg.attrs.value.value;
		self.parentNode = cfg.parentNode;
		self.pager = cfg.attrs.pager;
		self.filterDelay = cfg.attrs.filterDelay.value;

		self.animateName = cfg.attrs.animation;
		self.animateEvent = {
			'slideVertical': {on:'slideUp', off:'slideDown'},
			'fade': {on:'fadeIn', off:'fadeOut'},
			'fade/slideVertical': {on:'fadeIn', off:'slideDown'},
			'fade/hide': {on:'fadeIn', off:'hide'}
		}[cfg.attrs.animation.value] || {on:'show', off:'hide'};

		//console.warn('[FOR SELF]', self, cfg);
		//console.warn('[FOR CONTAINER]', self.container);

		self.in.eventAdd('add set', function(event, path, cfg) {
			if (cfg.initiator!='ui:for' && !self.resourceName.value) {
				self.render();
			}
		});
		self.in.eventAdd('add change', '*', function(event, path, cfg) {
			//console.info('[for] fire event:', event, path, cfg);
			if (cfg.initiator!='ui:for') {		//
				//console.warn('[for] in change:', event, path, cfg);
				self.render();
			}
		});

		self.in.eventAdd('delete', '*', function(event, path) {
			var key = path.substr(path.lastIndexOf('.') + 1);
			if ( self.items[key] ) self.removeItem(key);
			self.render();
		});

		self.resourceName.eventAdd('change', function(event, path) {
			console.warn("[for] resource event:", event,path);
			self.render();
		});
		self.sortby.eventAdd('add change', function() {
			if (!self.resourceName.isDefined && self.filter) {
				console.info('[for] sort changed');
				self.render();
			}
		});
		self.offset.eventAdd('change', function(event, path, cfg) {self.render();});

		var deferedRender;
		var f = function(eventName, path, eventCfg) {
			//console.log('change filter');
			//TODO: self.in.eventRemove();
			self.filter = $.isString(self.filterObj.value) ? eval('self.filter='+self.filterObj.value) : self.filterObj.value;

			if (!self.resourceName.isDefined && self.filter) {
				self.filter.forEach(function(v, key) {
					self.in.eventAdd('add change', '*.'+key, function(event, path, cfg) {
						self.render();
					});
				});
			}

			if ( self.filterDelay || self.resourceName.isDefined && path.match(/queryName$/)) {
				if (!deferedRender) deferedRender = (function() {
					if (self.$pager && self.$pager.model.currentPage!=0) {
						self.$pager.model.currentPage = 0;
					} else {
						self.render();
					}
				}).setFPS(400);
				deferedRender();
			} else {
				if (self.$pager && self.$pager.model.currentPage!=0) {
					self.$pager.model.currentPage = 0;
				} else {
					self.render();
				}
			}
		};

		self.filterObj.eventAdd('add change delete', '**', f);
		self.filterObj.eventAdd('add change delete', f);

		self.showPager();
		self.render();
	},

	showPager: function(self) {

		if (self.pager.value) {
			if (!self.limit.value) {
				self.limit.set(self.limitPerPage);
			}
			//console.log('container:', self.parentNode.tagName);
			if (self.parentNode.tagName == 'TBODY') {
				var table = self.parentNode.parentNode;
				self.$pager = $('@ui/for/pager')
					.modelSet({
						count: 0,
						limit: self.limit.value,
						currentPage: 0
					})
					.modelEventAdd('change', 'currentPage', function(eventName, path, cfg) {
						self.offset.set(cfg.newValue * self.limit.value);
						//self.$mydomains.shortcuts.domainsList.scrollTo('auto');
						setTimeout(function() {		//Чтобы пейджер успел перерендериться
							self.render();
						}, 3);
					})
					.insertAfter(table);
				//console.warn('pager', self.$loader);
			}
		}

	},

	showLoader: function(self) {
		setTimeout(function() {									//Чтобы tbody успел отрендериться
			if (self.resourceName.value) {
				if (self.parentNode.tagName == 'TBODY') {
					var table = window.getComputedStyle(self.parentNode.parentNode, null);
					var width = parseInt(table.getPropertyValue("width"));
					var tbody = window.getComputedStyle(self.parentNode, null);
					var height = parseInt(tbody.getPropertyValue("height"));
					var mt = -height||0;
					if (!height || height < 60) height = 60;

					var props = {
						width: width,
						height: height,
						mt: mt
					};

					if (!self.$loader) {
						self.$loader = $('@ui/for/loader').modelSet(props);
						setTimeout(function() {
							self.$loader.insertAfter(self.parentNode);
						},1);

					} else {
						self.$loader.modelSet(props);
						setTimeout(function() {
							self.$loader.show();
						},1);
					}
				}
			}
		},0);
	},

	hideLoader: function(self) {
		//console.info('hide loader', self.$loader);
		if (self.$loader) {
			self.$loader.hide();
		}
	},

	render: function(self, actionConf) {
		//console.log('[for] render actionConf: ', actionConf, self);
		if (self.resourceName.isDefined) {
			self.showLoader();
			if (!self.$resource) {
				self.$resource = self.in.attrRef;
				self.inDestPath = self.in.attrRefPath;

				$.Resource(self.resourceName.value).eventAdd('add', '*', function() {
					//console.log('[for res] add:', arguments);
					self.render();
				});

				//console.log('[for] bridge resource to attrModel:', self.$resource);
				//self.in.bridge({destPath: 'list', destObject: self.$resource});	//}, {direct:'reverse', initiator:'ui:for'}
			}

			var filter = self.filterObj.value.extendByClone({
				limit:	self.limit.value,
				offset:	self.offset.value
			});

			self.renderPid++;
			var renderPid = self.renderPid;

			//todo: сделать нормальную проверку и вынести ее в сам ресурс.
			var resMethods = $.Resource(self.resourceName.value).__self__.private.config;
			var method = '.'+(resMethods.methods.getList || resMethods.methods.getAll);

			self.$resource.modelBridgeResource(self.inDestPath, self.resourceName.value+method, filter, function(totalCount, data) {
				if (self.renderPid!==renderPid) {
					return;									//Если ктото еще запустил перерендеринг, то выходим.
				}
				//console.log('[for] res render');

				if (self.renderTimer) window.clearTimeout(self.renderTimer);
				//console.info('start -resource- render Animate');
				self.renderTimer = window.setTimeout(self.renderAnimate.bind(self, function() {
					if (self.pager.value && self.$pager) {
						self.$pager.model.count = totalCount;
						self.resultcount.set(totalCount);
					}
					self.hideLoader();
				}), 17);

			}, {initiator: 'ui:for', event: false, view: false});
			//console.info('self.$resource:', self.resourceName.value, self.$resource, self.inDestPath);


			/*
			 self.$resource.modelEventAdd('add', self.inDestPath+'.*', function(eventName, path, eventCfg) {
			 var defRend = self.render.setFPS(10);
			 defRend();
			 });
			 */

		} else {
			//console.info('start -in- render Animate');
			if (self.renderTimer) window.clearTimeout(self.renderTimer);
			self.renderTimer = window.setTimeout(self.renderAnimate.bind(self), 17);
		}
	},

	renderAnimate: function(self, callback) {

		self.showProcessBuffer = [];
		self.filter.forEach(function(field, name) {		//flat filter
			if (!field) delete self.filter[name];
		});

		var showData = [];
		var hideData = Object.keys(self.items).toObject();

		var filter, value;

		if (self.resourceName.isDefined) {
			value = self.$resource.model.getPropertyByPath(self.inDestPath);
			filter = {
				sortBy: self.sortby.value
			};
			//console.log('[for] renderAnimate use:', self.inDestPath, self.$resource, ' filter:', filter);
		} else {
			value = self.in.value;
			filter = {
				limit:	self.limit.value,
				offset: self.offset.value,
				sortBy: self.sortby.value,
				filters: self.filter
			};
		}
		//console.log('[for.renderAnimate] value:', value);

		var rc = Object.prototype.sort.call(
			value,
			filter,
			function(item, id) {
				showData.push(id);
				delete hideData[id];
			}
		);
		self.length = rc;
		self.resultcount.set(rc);

		//console.log('show/hide data:', showData, hideData, self.items);

		hideData.forEach(function(_, itemId) {
			self.hideItem(itemId);
		});

		var pointerId, pointerNum;
		showData.forEach(function(itemId, num) {		// бежим по ид сортированых строк
			var item = self.items[itemId];
			if ( num==0 )  {
				pointerId = itemId;
				pointerNum = num;
				if ( !item || ( item && !item.isVisible )) {
					self.showItem(pointerId, pointerNum);
				}
				return;
			}
			if ( item ) {			// если строка уже существует - перемещаем ее после курсора, иначе создаем в конце новую
				var orderTrue = false, next, pos = self.lastStateIdx[pointerId];
				while (next = self.lastState[pos]) {
					pos++;
					if ( !hideData[next] ) {
						if (next == itemId) {
							orderTrue = true;
						}
						break;
					}
					pointerId = itemId;
					pointerNum = num;
				}

				if ( !orderTrue && pointerId != itemId) {
					self.items[itemId].insertAfter(self.items[pointerId]);
				}
				pointerId = itemId;
				pointerNum = num;
			}
			self.showItem(itemId,num);
		});

		self.lastState = [];				// [item1_id, item2_id, item3_id ... ]
		self.lastStateIdx = {};				// {item1_id: pos1, item2_id: po2 ... }
		showData.forEach(function(itemId, num){
			self.lastState.push(itemId);
			self.lastStateIdx[itemId] = num;
		});

		self.showProcess(callback);
	},

	showItem: function(self, key, num) {
		if (self.lastStateIdx.hasOwnProperty(key)) return;
		var item = self.items[key];
		//console.log('show item:', key, item);

		if ( !item ) {
			item = $();
			item.__self__.private.father = self.parent.__self__;

			self.items[key] = item;

			if (self.resourceName.isDefined) {
				//console.log('[for] bridge `resource` item:', {modelPath: self.value, destObject: self.$resource, destPath: self.inDestPath+'.'+key});
				item.modelBridge({modelPath: self.value, destObject: self.$resource, destPath: self.inDestPath+'.'+key});
			} else {
				//console.log('[for] bridge `in` item:', {modelPath: self.value, destObject: item, destPath: self.value});
				self.in.bridge({modelPath: key, destObject: item, destPath: self.value});
			}

			item.modelSet(self.key, key);
			if (num == 0) item.modelSet('isFirst', true);
			if (num == self.length-1) item.modelSet('isLast', true);
			//console.log('     [for] bridged item value:', item.model.getPropertyByPath(self.value));
			item.viewSet('!' + self.content).logicSet(self.parent.logicGet());
			//console.log('     [for] bridged item value:', item.model.getPropertyByPath(self.value));
			item.appendTo(self.container).hide();
		}
		//item[self.animateEvent.on](200);
		self.showProcessBuffer.push(item);
	},

	showProcess: function(self, callback) {
		//console.info('showProcessBuffer:', self.showProcessBuffer);
		self.showProcessBuffer.forEach(function(item) {
			//console.log('on:', self.animateEvent.on);
			item[self.animateEvent.on](300);
		});
		//console.log('[for] showproc complete');
		if (callback) callback();
	},

	hideItem: function(self, id, callback) {
		var item = self.items[id];
		//console.log('try hide item:', id, item);
		if (!item || !item.isVisible) return;
		var hide = function() {
			self.items[id].hide();
			//console.log('hide:', id, items[id]);
			if (callback) callback();
		};
		if (self.animateName == 'none') {
			hide();
		} else {
			item[self.animateEvent.off](300, hide);
		}
	},

	removeItem: function(self, id, callback) {
		var item = self.items[id];
		//console.log('remove item:', id, item);
		if (!item) return;

		var hide = function() {
			item.viewSet('! ');
			delete self.items[id];
			if (callback) callback();
		};
		if (self.animateName == 'none') {
			hide();
		} else {
			item[self.animateEvent.off](200, hide);
		}
	}
});