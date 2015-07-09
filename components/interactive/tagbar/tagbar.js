/**
 * @component
 * @description
 * 		Контроллер вывода данных в виде тегов
 * 		Сейчас работает так, что отправляет только галочки на "листьях дерева", то есть если выбран корень, то его id не передается.
 * 		Юзает данные из хелпера, которые представляют собой "уплощенное дерево".
 * 		attrs:
 * 			data			[optional]	Справочник. Может быть задан как справочник в формате "dictionary:name"
 * 			value			список значения. Если задан справочник (аттрибут data), то названия будут браться из него. Если справочник не определен, то список value должен содержать в себе объекты, и название будет браться из свойства name, либо из свойства определенного аттрибутом fieldName)
 * 			fieldName:		[optional]	имя свойства, в которых содержатся заголовки для вывода (в случае если `data` содержится список обьектов)
 * 			removable		[optional]	default:true	Возможно ли удалять теги. Если true - то у каждого тега появляется крестик, при нажатии на который он удаляется из списка `value`
 *
 * @example
 * 		<tagbar data="dictionary:regions" value="{{M.regions}}" />
 * 		<tagbar value="{{M.data.tags}}" fieldName="title"/>				//		M.data.tags = {1: {title:'Vasya'}, 2:{title:'Petya'}}
 */

$.Controller.register("ui::tagbar", {
	data:	undefined,		// Словарь, #TODO: Данные {cfgName: name, cfgId: id, cfgParent: parentId} // в динамический словарь
	tags:	{},
	tagbar:	undefined,

	start: function(self, tagbar, cfg) {
		self.tagbar = tagbar;
		if (!cfg.attrs.value) _throw_('[ui:tagbar] Attribute `value` required');

		cfg.attrs.setDefault({
			data:		'none',
			fieldName:	'name',
			fieldId:	'name',
			removable:	true
		});
		self.fieldName = cfg.attrs.fieldName.value;
		self.removable = cfg.attrs.removable.value != "false" && cfg.attrs.removable.value != false;

		if (cfg.attrs.data.value!=='none') {
			if ($.isString(cfg.attrs.data.value) && cfg.attrs.data.value.match(/^dictionary:(.*)$/) ) {
				self.dataType = 'dictionary';
				self.data = $.Dictionary(RegExp.$1);
			} else {
				self.dataType = 'list';
				self.data = cfg.attrs.data.value;
			}
		}

		cfg.attrs.value.bridge({destObject: tagbar, destPath: 'value'});

		if (!tagbar.model.value) {
			tagbar.model.value = [];
		} else {
			tagbar.model.value.forEach(function(value, num) {
				self.addTag(num, value);
			})
		}

		tagbar
			.modelEventAdd('change', 'value.*', function(event, path, cfg) {
				// TODO
				//console.log('tagbar/change ['+self.tagbar.pid+']', path, cfg);
			})
			.modelEventAdd('add', 'value.*', function(event, path, cfg) {
				var num = path.split('.').pop();
				self.addTag(num, cfg.newValue);
			})
			.modelEventAdd('delete', 'value.*', function(event, path, cfg) {
				//console.log('DEL item:', path);
				var num = path.split('.').pop();
				if (self.tags[num]) self.tags[num].remove();
			});
	},

	addTag: function(self, num, value) {
		if (!value) return;
		var title = self.data ?
			(self.dataType == 'dictionary' ? self.data.getNameById(value) : self.data[value][self.fieldName] ) :
			value[self.fieldName];
		self.tags[num] = $('@ui/tagbar/tag'+ (self.removable ? '/removable' : ''))
			.logicSet(self)
			.modelSet({num: num, name: title})
			.appendTo(self.tagbar);
	},

	removeTag: function(self, num) {
		self.tagbar.modelDelete('value.'+num);
	}
});