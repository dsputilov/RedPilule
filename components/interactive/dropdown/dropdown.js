/**
 * @component
 * @descriptiotn Контроллер выпадающего списка
 * 		attrs:
 * 			width:			number		Ширина контрола
 * 			value:			string		выбраное значние
 * 			placeholder:	string		Подсказка, если значение не выбрано
 * 			data:			[{id: num, name: string}, {}]	|| {id: name} || { id: {name: string}}		[options]	Список
 * 			sortby:			string,
 * 			itemscount		общее колчество всех итемов (на случай если фильтр отдает лимитированное значение)
 * 			renderitem		function(item)		[optional] итератор, который вовращает сгенеренную ноду итема
 * 			onquerychange	function()			[optional] Если задан - используется поиск в дропдауне
* 			headertemplate:	string
 * 			footertemplate:	string
 * 			selectedName:	string
 * 			orientation:	enum(t)				//t - for top
 * @example
 *	 <dropdown value='{{M.country}}' data="dictionary:landingList">
 *		<item option='1'>Россия</item>
 * 	</dropdown>
 *
 *	 <dropdown value='{{M.country}}' data="{{M.ctrl.ArrayList}}"/>
 *
 *	 <dropdown value="{{M.data.landingId}}" name="{{M.data.landingName}}" data="{{M.ctrl.landingList}}" onQueryChange="self.loadLandingsList()">-</dropdown>
 */

$.Controller.register("ui::dropdown", {
	$dropdown:			undefined,
	data:				[],
	dictionary:			undefined,
	isRendered:			false,
	eventClickOutId:	false,
	columnId:			'id',
	columnName:			'name',
	onItemSelect:		undefined,			//function()
	nodeItems:			{},

	start:	function(self, $dropdown, cfg, $parent) {
		self.$dropdown = $dropdown;
		$dropdown.component = self;
		cfg.attrs
			.setDefault({
				name:		'',
				search:		false,
				value:		null,
				width:		300,
				sortby:		'',
				filters:	{},
				placeholder:	'',
				orientation:	'',
				headertemplate:	'',
				footertemplate:	'',
				selectedName:	'',
				columnName:		'name',
				columnId:		'id',
				valueObject:	{}
			})
			.setHandler({
				onsetvalue: $.noop
			});

		self.attrs = cfg.attrs;

		if (cfg.attrs.renderitem) {
			cfg.attrs.setHandler({renderitem: $.noop});
			self.renderitem = cfg.attrs.renderitem;
		}

		self.columnName = cfg.attrs.columnName.value;
		self.columnId = cfg.attrs.columnId.value;
		self.onItemSelect = cfg.attrs.onsetvalue;
		self.renderItemsList = self.renderItemsList.setFPS(10);								//Вдруг юзер скоростной дикарь - чтобы слишком часто не перерендеривать список

		cfg.attrs.sortby.bridge({destObject:		$dropdown, destPath: 'sortby'});
		cfg.attrs.value.bridge({destObject:			$dropdown, destPath: 'value'});
		cfg.attrs.valueObject.bridge({destObject:		$dropdown, destPath: 'valueObject'});
		cfg.attrs.width.bridge({destObject:			$dropdown, destPath: '>>width'});
		cfg.attrs.orientation.bridge({destObject:	$dropdown, destPath: '>>orientation'});
		cfg.attrs.filters.bridge({destObject:		$dropdown, destPath: '>>filters'});

		if ( $.isString($dropdown.model.filters) ) {										//Десериализуем если хеш в аттрибуте стрингой
			var filter = (new Function('return '+ $dropdown.model.filters))();
			$dropdown.modelSet('filters', filter, {event:false});
		}

		$dropdown.modelEventAdd('change', 'filters', function(event, path, cfg) {
			self.setFilter(cfg.newValue);
		});

		$dropdown.modelEventAdd('change', 'value', function(event, path, cfg) {
			if (self.dictionary) {
				self.$dropdown.model.selectedName = self.dictionary.getById(cfg.newValue)[self.columnName];
			}
		});

		if (cfg.attrs.data) {
			if (cfg.attrs.onquerychange) {
				cfg.attrs.setHandler({
					onquerychange: function() {return {}}
				});
				$dropdown.model.search = true;
				$dropdown.modelEventAdd('change', 'query', function(e,path, params) {
					cfg.attrs.onquerychange(params.newValue);
				});
				cfg.attrs.onquerychange();
			}
			self.setData(cfg.attrs.data.value);
			cfg.attrs.data.eventAdd('change', function(e, path, cfg) {
				self.setData(cfg.newValue);
				self.renderItemsList();
			});

		} else {
			cfg.content.replace(/<item([^\>]+?)?>([^\0]+?)?<\/item>/igm, function(r, attrStr, content) {
				var attrs = {};
				var attrStr = attrStr.replace(/\\'/g, ";squote;").replace(/\\"/g, ";dquote;");
				var unesc = function(str) {return str.replace(/;squote;/g, "\\'").replace(/;dquote;/g, '\"');};
				attrStr.replace(/(\w+)='(.*?)'/g, function(r, name, value) {
					attrs[name] = unesc(value);
					return "";
				}).replace(/(\w+)="(.*?)"/g, function(r, name, value) {
					attrs[name] = unesc(value);
					return "";
				});

				self.data.push({id:attrs.option, name: content});
				return "";
			});
			self.dictionary = $.Dictionary('ui_dd_'+Number.uid(), {data:self.data});	//Создаем словарь чтобы легко делать выборку по id=>name и name=>id
		}


		$dropdown
			.modelMerge({
				parent:			$parent,
				toggler:		false,
				placeholder:	cfg.attrs.placeholder.value,
				footertemplate:	cfg.attrs.footertemplate.value,
				headertemplate:	cfg.attrs.headertemplate.value,
				selectedName:	(self.dictionary && $dropdown.model.value!==undefined && $dropdown.model.value!==null) ? self.dictionary.getById($dropdown.model.value).name : (cfg.attrs.name.value || $dropdown.model.value || '')
			})
			.viewSet('@ui/dropdown');

		if (self.data) {
			if (self.dictionary) {		// TODO: Словарь нужен только если задан фильтр. Как то проверить надо. Если данные не из словаря - создаем словарь динамически чтобы к данным легко лазить
				//self.dictionary = $.Dictionary('dropdown:'+ String.uid(), {data: self.data});
				self.setFilter();
			} else {
				self.renderItemsList();
			}
		}
		//console.log('[dd] sn ', self.dictionary, $dropdown.model.value, self.data);
		//console.log('[dd] $dropdown.model.value=', self.data, $dropdown.model.value);
	},

	setData: function(self, data) {
		if(!data) return;
		if ( $.isArray(data) ) {
			self.data = data;
		} else if ( $.isHash(data) ) {
			self.data = [];
			data.forEach(function(item, id) {
				if (item && $.isHash(item)) {
					item.id = id;
					self.data.push(item);
				} else {
					self.data.push({name: item && item.name || item, id:id});
				}
			});
		} else if ( data.match(/^dictionary:(.*)$/) ) {
			var dictionaryName = RegExp.$1;
			self.dictionary = $.Dictionary(dictionaryName);
			self.columnId = self.dictionary.cfg.columnId;
			self.columnName = self.dictionary.cfg.columnName;
			self.dictionary
				.eventAdd('add', function(value) {
				})
				.eventAdd('remove', function(value) {
					var li = self.nodeItems[value[self.columnId]];
					if(!li) {return;}
					li.parentNode.removeChild(li);
					delete self.nodeItems[value[self.columnId]];
				}).
				eventAdd('refresh', function(){
					self.dictionary = $.Dictionary(dictionaryName);
					self.setFilter();
				});
			self.columnId = self.dictionary.cfg.columnId;
			self.columnName = self.dictionary.cfg.columnName;
		} else {
			_throw_('[$dropdown] Unknown type of data')
		}
	},

	setFilter: function(self, filters) {
		if (!filters) filters = self.$dropdown.model.filters;

		//TODO: заменить на modelSetType({filters: 'json'})	для автопреобразования типа	 и убрать этот говнохак
		if ($.isString(filters) ) {
			filters = (new Function('return '+ filters))();
		}

		var parentId = (filters && filters.hasOwnProperty('parentId')) ? filters.parentId : 0;
		self.data = self.dictionary.hasChild(parentId) ? self.dictionary.getChilds(parentId) : self.dictionary.getAll();

		if (self.$dropdown.model.toggler) {
			self.renderItemsList();					//Если список свернут и поменялся фильтр - то нафик рендерить,
		} else {
			self.isRendered = false;					//просто меняем флажок и после открытия - список перерендерится. Авось и воще не откроет
		}
	},

	toggle: function(self) {
		if (!self.isRendered) self.renderItemsList();
		self.$dropdown.model.toggler = !self.$dropdown.model.toggler;
		if (self.$dropdown.model.toggler) {
			self.eventClickOutId = self.$dropdown.shortcuts.popup.clickOut(function() { self.$dropdown.model.toggler = false; });
		}
		if (self.$dropdown.model.search) setTimeout(function(){self.$dropdown.shortcuts.search.view[0].focus()}, 50);
	},

	clear: function(self) {
		self.attrs.name.set('');
		self.$dropdown.model.selectedName = '';
		self.$dropdown.model.value = undefined;
		self.close();
	},

	close: function(self) {
		self.$dropdown.model.toggler = false;
		self.$dropdown.shortcuts.popup.eventRemove(self.eventClickOutId);
	},

	renderItemsList: function(self) {
		self.isRendered = true;
		self.$dropdown.shortcuts.itemsList.empty();
		if ($.isHash(self.data)) {
			self.data.sort({sortBy: self.$dropdown.model.sortby}, function(item) {
				self.createNode(item);
			}, {});
		} else if ($.isArray(self.data)){
			self.data.forEach(function(item) {
				self.createNode(item);
			}, {});
		}
	},

	createNode: function (self, item) {
		//console.log('[dd] item:', item);
		var li = document.createElement('li');
		self.nodeItems[item.channelId] = li;
		if (self.renderitem) {
			self.renderitem(li, item);
		} else {
			li.innerHTML = item[self.columnName] !==undefined ? item[self.columnName] : item;
		}
		li.onclick = self.selectItem.bind(self, item);
		//console.log('    value:', self.$dropdown.model.value, item);
		if (item[self.columnId] == self.$dropdown.model.value) {
			self.setName(item);
		}
		self.$dropdown.shortcuts.itemsList.appendChild(li);
	},

	setName: function(self, item) {
		if (item[self.columnName]) {
			//console.warn('setName:', self, item, [self.columnId]);
			//console.warn('setValue:', item[self.columnId]);
			self.$dropdown.model.value = item[self.columnId];
			self.$dropdown.model.selectedName = item[self.columnName];
		} else {
			self.$dropdown.model.value = item;
			self.$dropdown.model.selectedName =item;
		}
		self.$dropdown.model.valueObject = item;

		self.attrs.name.set(self.$dropdown.model.selectedName);
	},

	selectItem: function(self, item) {
		//console.log('select item:', item);
		self.setName(item);
		self.onItemSelect(item);
		self.close();
	}
});
