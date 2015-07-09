/**
 * @component	suggest
 * @description
 * 		Контроллер выподающего списка
 * 		Сейчас работает так, что отправляет только галочки на "листьях дерева", то есть если выбран корень, то его id не передается.
 * 		Юзает данные из хелпера, которые представляют собой "уплощенное дерево".
 * 		attrs:
 * 			data			Справочник
 * 			value			массив данных
 * @example
 * 		<input type=text value="{{M.value}}" suggest="dictionary:regions" suggestOnSelect="self.onSelect();"/>
 */

$.Controller.register("ui::suggest", {
	data:			undefined,		// Словарь, #TODO: Данные {cfgName: name, cfgId: id, cfgParent: parentId} // в динамический словарь
	hoveredItem:	undefined,
	itemsId:		{},				// {%nodeId: itemId}

	start: function(self, $input, cfg, parent) {
		//console.warn('SUGGEST: ', $input, cfg);
		self.$input = $input;
		self.attrs = cfg.attrs
			.setDefault({
				value: '',
				suggestwidth: 300,
				suggestemptycontent: 'Совпадений не найдено'
			})
			.setHandler({
				suggestonselect:	function() {console.log('noop');}
			});

		if ( cfg.attrs.suggest.value.match(/^dictionary\:(.*)$/) ) {
			var dictionary = $.Dictionary(RegExp.$1);
			self.data = dictionary.getAllNames();
		} else {
			//TODO: Подумать. сделать бридж данных. Может быть динамический словарь как то создать.
		}

		self.$suggest = $("@ui/suggest")
			.insertAfter($input)
			.hide();

		cfg.attrs.suggestwidth.bridge({destObject:	self.$suggest, destPath: 'width'});
		cfg.attrs.suggestemptycontent.bridge({destObject:	self.$suggest, destPath: 'emptyContent'});

		cfg.attrs.value.eventAdd('change', self.show.bind(self));
		$input.eventAdd('click', self.show.bind(self));
		$input.eventAdd('keydown', function(e) {
			if (self.$suggest.isVisible && self.$suggest.model.itemsCount) {
				if (self.hoveredItem) self.hoveredItem.classList.remove('hover');
				switch (e.keyCode) {
					case 38:	self.hoveredItem = self.hoveredItem.previousSibling ? self.hoveredItem.previousSibling : self.$suggest.shortcuts.suggestList.view[0].childNodes.last;break;				//вверх
					case 40:	self.hoveredItem = self.hoveredItem && self.hoveredItem.nextSibling ? self.hoveredItem.nextSibling :self.$suggest.shortcuts.suggestList.view[0].childNodes[0];break;	//вниз
					case 13:	self.select(self.itemsId[self.hoveredItem.nodeId]);break
				}
				if (self.hoveredItem) {
					self.hoveredItem.classList.add('hover');
					//self.hoveredItem.scrollIntoView();
				}
			}
		});
		self.$suggest.eventAdd('mouseover', function() {
			if (self.hoveredItem) self.hoveredItem.classList.remove('hover');
		});
	},

	show: function(self) {
		var newValue = self.attrs.value.value || '';
		if (newValue.length<2) {
			self.$suggest.hide();
			return;
		}
		var resList = [];
		self.data.forEach(function(item, name) {
			if (name.toLowerCase().indexOf(newValue.toLowerCase())!=-1) {
				resList.push({name: name, id:item._id_});
			}
		});

		self.$suggest.shortcuts.suggestList.empty();
		self.itemsId = {};
		if (resList.length) {
			resList.forEach(function(item) {
				var el = document.createElement('div');
				el.onclick = self.select.bind(self, item.id);
				el.innerHTML = item.name;
				self.itemsId[el.nodeId] = item.id;
				self.$suggest.shortcuts.suggestList.appendChild(el);
			});
		}

		if (!self.$suggest.isVisible) {
			self.clickoutId = self.$suggest.show().clickOut(function() {
				self.$suggest.hide();
			}, {include: self.$input});
		}
		self.$suggest.model.itemsCount = resList.length;
	},

	select: function(self, id) {
		if (self.clickoutId) self.$suggest.eventRemove(self.clickoutId);
		self.$suggest.hide();
		self.attrs.suggestonselect(id);
		self.attrs.value.set('');
	}
});
