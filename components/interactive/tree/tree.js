/**
 * @component
 * @description
 * 		Контроллер вывода данных в режиме дерева
 * 		Сейчас работает так, что отправляет только галочки на "листьях дерева", то есть если выбран корень, то его id не передается.
 * 		Юзает данные из хелпера, которые представляют собой "уплощенное дерево".
 * 		attrs:
 * 			data			Данные вида {cfgName: name, cfgId: id, cfgParent: parentId}
 * 			value			массив выбранных галочек
 * 			rootId			int			//Корневая нода
 * 			columnName		string		//[только если задана data без словаря]
 * 			columnId		string		//[только если задана data без словаря]
 * 			columnParent	string		//[только если задана data без словаря]
 * 			multiple:		bool		//если true - исплоьзовать чекбоксы
 * 			showRoot:		bool		//показывать корневую директорию ?
 *			selectedName	string		//Выбранное название
 * 			onselect		function	//Срабатывает во время выделения ноды (при multiple = false)
 * @example
 * 		<tree data="dictionary:regions" value="#{M.regions}" columnName='region_name' columnId='region_id'></tree>
 * 		TODO: <tree data="regions" value="#{M.regions}" columnName='region_name' columnId='region_id'></tree>
 */

$.Controller.register("ui::tree", {
	data:			{},		// Данные {cfgName: name, cfgId: id, cfgParent: parentId}
	processedNodes:	{},		// Массив всех отрендеренных шаблонов узлов дерева (тут не все дерево, а только та его часть, которую раскрывал юзер)
	processedRoots:	{},		// Список ID уздлов, для которых уже отрендерены внутренние поддеревья (true / undefined)
	checkedState:	{},		// {Id: value}
	resultState:	[],
	selectedNode:	undefined,	//только для multiple:false
	templatePostfix:	'',	// ='/multi'	for multiple selects

	start: function(self, tree, cfg) {
		//console.warn('tree:', self, tree);
		cfg.attrs.setDefault({
			multiple:	true,
			rootId:		0,
			showRoot:	false,
			columnId:	'id',
			columnName:	'name',
			columnParent:'parent_id',
			selectedName:''
		}).setHandler({
			onselect: $.noop
		});
		cfg.attrs.setDefault({
			value:	cfg.attrs.multiple.value ? [] : null
		});

		self.onselect = cfg.attrs.onselect;
		self.tree = tree;
		self.rootId = cfg.attrs['rootId'].value;
		cfg.attrs.rootId.eventAdd('set', function(_1,_2, eventCfg) {
			console.log('change rootId:', eventCfg);
			self.rootId = eventCfg.newValue;
		});

		cfg.attrs.rootId.bridge({destObject: tree, destPath: 'rootId'});



		if ( cfg.attrs.data.value.match(/^dictionary\:(.*)$/) ) {
			self.dictionaryName = RegExp.$1;
			self.data = $.Dictionary(RegExp.$1);
			self.data
				.eventAdd('add', function(value) {
					//console.log('[tree] add', self, parentId, self.rootId);
					var parentId = value[self.data.cfg.columnParent];
					//TODO: Сча если страница пересоздается, то виджет создает много копий, которые юзают один справочник и на котором повисают все евенты. Надо кого то чистить.
					//console.log('[tree] add', self, ' parentId:',parentId, 'rootId:',self.rootId);
					if (self.processedNodes[parentId]) {
						if (parentId!= self.rootId) {
							self.processedNodes[parentId].viewSet('@ui/tree/node');
							if (!self.processedRoots[parentId]) self.build(parentId);
						}
						self.renderNode(value, parentId);
						self.toggle(parentId, 'expanded');
					}
					self.renderNode(value, parentId);
					self.toggle(parentId, 'expanded');
				})
				.eventAdd('change', function(value) {
					var node = self.processedNodes[value[self.data.cfg.columnId]];
					//console.log('[tree] change:', value, node);
					if (node) {
						node.model.name = value[self.data.cfg.columnName];
					}
				})
				.eventAdd('remove', function(value) {
					var node = self.processedNodes[value[self.data.cfg.columnId]];
					if (node) {
						node.hide();
					}
					var parentId = value.parentId;
					console.log('[tree] remove node!', self.data.hasChild(parentId) );
					if (!self.data.hasChild(parentId) && self.processedNodes[parentId] && parentId!=self.rootId) {
						self.processedNodes[parentId].viewSet('@ui/tree/leaf');
					}
					//self.processedRoots={};
					//self.processedNodes={};
					//self.data = $.Dictionary(self.dictionaryName);
					//self.processedNodes[self.rootId] = tree.viewSet('@ui/tree');
				});
		} else {
			//TODO: Подумать. сделать бридж данных. Может быть динамический словарь как то создать.
		}

		if (cfg.attrs.showRoot.value) {
			self.processedNodes[self.rootId] = tree.viewSet('@ui/tree_root');
			cfg.attrs['rootId'].eventAdd('set', function() {
				//console.warn('rootId changed!');
			});
			//if (self.data.getById(self.rootId)) {
				tree.modelSet({id: self.rootId, name: self.data.getById(self.rootId)[self.data.cfg.columnName]});
			//} else {
			//	alert(1);
			//	return;
			//}
		} else {
			self.processedNodes[self.rootId] = tree.viewSet('@ui/tree');
		}


		cfg.attrs.value.bridge({destObject:	tree, destPath: 'value'});						// ~> tree.model.value
		cfg.attrs.selectedName.bridge({destObject:	tree, destPath: 'selectedName'});		// ~> tree.model.selectedName

		if (cfg.attrs.multiple.value) {
			self.templatePostfix = '/multi';
			tree
				/*
				.modelEventAdd('set change', 'value', function(event, path, cfg) {
					//когданить TODO: Вырубаем все и ставим только нужные
				})
				*/
				.modelEventAdd('add', 'value.*', function(event, path, cfg) {				// Если ктото извне добавляет итем
					if ( cfg.initiator!='ui:tree') {
						self.setValue(cfg.newValue, true);
					}
				})
				.modelEventAdd('delete', 'value.*', function(event, path, cfg) {			//Если ктото извне удаляет итем
					if ( cfg.initiator!='ui:tree' ) {
						self.setValue(cfg.oldValue, false);
					}
				});
			cfg.attrs.value.value.forEach(function(id) {if (id!==null) self.checkedState[id] = true;});		//Выставляем первоначальные значения
		} else {
			tree.modelEventAdd('change', 'value', function(event, path, cfg) {
				//console.info('[tree] change value:', cfg);
				if (cfg.newValue!== undefined && cfg.newValue!==null) {
					self.select(cfg.newValue, true);
				} else {
					self.deselect();
				}
			})
		}


		self.build(self.rootId);														//Рендерим корень

		self.checkedState.forEach(function(v, id) {										//Рендерим ветки, которые активны
			var parentId = self.data.getParentId(id);
			if (parentId) {
				self.build(parentId);
				self.checkParents(id);
			}
			self.setChildValues(id, true);
		});
		if (!cfg.attrs.multiple.value && cfg.attrs.value.value) {
			self.select(cfg.attrs.value.value, true);
		}
	},

	build: function(self, parentId) {													//рисование части дерева
		if (self.processedRoots[parentId]) return;

		if (parentId!=0) {
			var grandParentId = self.data.getParentId(parentId);
			if (grandParentId && !self.processedRoots[grandParentId]) {
				self.build(grandParentId);
			}
		}

		if ( self.data.hasChild(parentId) ) {
			self.data.getChilds(parentId).forEach(function(item) {
				self.renderNode(item, parentId);
			});
		}
		self.processedRoots[parentId] = true;
	},

	renderNode: function(self, item, parentId) {
		var itemId = item[self.data.cfg.columnId];
		var node = $()
			.modelSet({
				id:				item[self.data.cfg.columnId],
				name:			item[self.data.cfg.columnName],
				state: 			'collapsed',
				checked:		self.checkedState[itemId],
				innerChecked:	''
			})
			.logicSet(self);

		node.viewSet((self.data.hasChild(itemId) ? '@ui/tree/node' : '@ui/tree/leaf') + self.templatePostfix) ;	// логика работы для ноды либо листа
		node.modelEventAdd('change', 'checked', function(event, path, cfg) {
			self.setValue(itemId, cfg.newValue);
		});
		node.appendTo(self.processedNodes[parentId].shortcuts.ul);
		self.processedNodes[itemId] = node;
	},

	toggle: function(self, id, status) {														// Сворачивание/разворачивание ноды
		self.processedNodes[id].model.state = status ? status: (self.processedNodes[id].model.state == 'collapsed' ? 'expanded' : 'collapsed');
		if (!self.processedRoots.hasOwnProperty(id)) self.build(id);
	},

	setValue: function(self, id, value) {					// Выставляем значение себе
		self.checkedState[id] = value;
		if ( self.processedNodes.hasOwnProperty(id) && !self.processedNodes[id].model.value) self.processedNodes[id].modelMerge({checked: value, innerChecked: false}, {force:true, event: false});
		self.setChildValues(id, value);
		self.checkParents(id);
		self.updateResult();
	},

	setChildValues: function(self, id, value) {				// Проставление галочек на всю глубину дерева, независимо от того, отрендерено оно или нет.
		if (self.processedNodes.hasOwnProperty(id)) self.processedNodes[id].model.innerChecked = '';
		if (self.data.hasChild(id)) {
			self.data.getChilds(id).forEach(function(item) {
				var itemId = item[self.data.cfg.columnId];
				self.checkedState[itemId] = value;
				if ( self.processedNodes.hasOwnProperty(itemId) && !self.processedNodes[itemId].model.value) self.processedNodes[itemId].modelMerge({checked: value, innerChecked: false}, {force:true, event: false});
				if ( self.data.hasChild(itemId) ) self.setChildValues(itemId, value);
			});
		}
	},

	checkParents: function(self, id) {						// Выставляем полупрозрачные галочки у родителей
		var parentId;
		while ( (parentId = self.data.getParentId(id)) != 0 ) {
			var allChecked = true;
			var someChecked = false;
			self.data.getChilds(parentId).forEach(function(item) {
				var itemId = item[self.data.cfg.columnId];
				if(!self.processedNodes[itemId]) self.build(itemId);
				var model = self.processedNodes[itemId].model;
				allChecked = allChecked && model.checked;
				someChecked = someChecked || model.checked || model.innerChecked;
			});
			self.processedNodes[parentId].modelMerge({checked: allChecked, someChecked: someChecked, innerChecked: (someChecked && !allChecked ? 'innerChecked' : '')}, {force:true, event: false, initiator:'ui:tree'});
			self.checkedState[parentId] = allChecked;
			id = parentId;
		}
	},

	updateResult: function(self) {
		self.resultState = [];
		self.checkedState.forEach(function(state, id) {
			if (state && !self.checkedState[self.data.getParentId(id)]) self.resultState.push(+id);
		});

		self.tree.model.value.forEach(function(id, num) {						//Удаляем удаленные
			if (id && self.resultState.indexOf(id) == -1 ) {
				self.tree.modelDelete('value.'+num, {initiator: 'ui:tree'});
			}
		});

		self.resultState.forEach(function(id) {									//Добавлям добавленные
			if (self.tree.model.value.indexOf(id)==-1) {
				self.tree.model.value.push(+id, {_RPCFG_:true, initiator: 'ui:tree'});
			}
		});
	}.setFPS(5),

	select: function(self, id, disableHandler) {
		//console.info('[tree] select:', id);
		if (!self.processedNodes[id]) {
			return;
		}
		var node = self.processedNodes[id].shortcuts.nodeTitle.view[0];
		if (self.selectedNode) {
			self.selectedNode.classList.remove('node_selected');
		}
		self.selectedNode = node;
		node.classList.add('node_selected');
		self.tree.model.value = id;
		self.tree.model.selectedName = self.data.getNameById(id);
		if (disableHandler!== true) self.onselect(id);
	},

	deselect: function(self) {
		if (self.selectedNode) {
			self.selectedNode.classList.remove('node_selected');
		}
	}
});