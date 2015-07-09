/**
 * @component
 * @descriptiotn Контроллер выпадающего списка
 * 		attrs:
 * 			width:			number		Ширина контрола
 * 			value:			string		выбраное значние
 * 			placeholder:	string		Подсказка, если значение не выбрано
 * 			data:			[{id: num, name: string}, {}]	|| {id: name} || { id: {name: string}}		[options]	Список
 * @example
 *
 *	 <droptree value="{{M.data.landingId}}" name="{{M.data.landingName}}" data="{{M.ctrl.landingList}}" />
 */

$.Controller.register("ui::droptree", {
	$droptree: undefined,
	isRendered: false,
	eventClickOutId: false,
	columnId: 'id',
	columnName: 'name',
	onItemSelect: undefined,			//function()

	start: function (self, $droptree, cfg, $parent) {
		self.$droptree = $droptree;
		cfg.attrs
			.setDefault({
				name: '',
				value: null,
				width: 300,
				filters: {},
				placeholder: ''
			})
			.setHandler({
				onsetvalue: $.noop
			});

		console.warn('$droptree:', $droptree);

		cfg.attrs.width.bridge({destObject: $droptree, destPath: 'width'});
		cfg.attrs.data.bridge({destObject: $droptree, destPath: 'dataTree'});
		cfg.attrs.value.bridge({destObject: $droptree, destPath: 'value'});

		$droptree.viewSet("@ui/droptree");
		if ($droptree.model.value === undefined) {
			self.selectAll();
		}
	},

	toggle: function(self) {
		self.$droptree.model.toggler = !self.$droptree.model.toggler;
		if (self.$droptree.model.toggler) {
			self.eventClickOutId = self.$droptree.shortcuts.popup.clickOut(function() { self.$droptree.model.toggler = false; });
		}
	},

	close: function(self) {
		self.$droptree.model.toggler = false;
		if (self.eventClickOutId) self.$droptree.shortcuts.popup.eventRemove(self.eventClickOutId);
		self.eventClickOutId = undefined;
	},

	selectItem: function(self, catId) {
		self.$droptree.model.value = catId;
		self.close();
	},

	selectAll: function(self) {
		self.$droptree.model.value = undefined;
		self.$droptree.model.selectedName = 'Все';
		self.close();
	}
});
