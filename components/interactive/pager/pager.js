/**
 * @component
 * @description
 * 		Пейджер
 *
 * 		attrs:
 * 			count			количество страниц
 * 			current			текущая страница
 * 			range			диапазон видимых странниц
 * @example
 * 		<pager count="{{M.count}}" current="{{M.page}}" />
 */

$.Controller.register("ui::pager", {
	$pager:		undefined,
	pages:		[],

	start: function(self, $pager, cfg) {

		self.$pager = $pager;

		cfg.attrs.setDefault({
			count: 0,
			current: 0,
			range: 2
		});
		self.$pager.modelSetType({count: 'int', current: 'int', range: 'int'}).viewSet('@ui/pager');
		cfg.attrs.count.bridge({destObject: self.$pager, destPath: 'count'});
		cfg.attrs.current.bridge({destObject: self.$pager, destPath: 'current'});
		cfg.attrs.range.bridge({destObject: self.$pager, destPath: 'range'});
		self.$pager
			.modelEventAdd('change', 'count range', self.render.setFPS(17).bind(self))
			.modelEventAdd('change', 'current', function(eventName, path, cfg) {
				if (self.pages[cfg.oldValue]) self.pages[cfg.oldValue].model.isActive = '';
				if (self.pages[cfg.newValue]) self.pages[cfg.newValue].model.isActive = 'active';
			});
		self.render();
	},

	render: function(self) {
		self.$pager.shortcuts.pages.empty();
		//console.warn('[pager] count:', self.$pager.model.count);
		if (self.$pager.model.count<=1) return;
		var range = self.$pager.model.range;
		var startPage = (self.$pager.model.current - range) <= 0 ? 0 : self.$pager.model.current - range;	// начало и  конец показываемых страниц
		var finishPage = (self.$pager.model.current + range+1) >= self.$pager.model.count ? self.$pager.model.count : self.$pager.model.current + range + 1;
		self.pages = [];
		var page;
		if(startPage > 0){			//если нужно показать первцю страницу и ...
			page = $('@ui/pager/page')
				.logicSet(self)
				.modelSet({page: 0, isActive: ''})
				.appendTo(self.$pager.shortcuts.pages);
			if (startPage > 1) $('@ui/pager/crumbs').appendTo(self.$pager.shortcuts.pages);
			self.pages.push(page);
		}
		for (var i=startPage; i<finishPage; i++) {
			page = $('@ui/pager/page')
				.logicSet(self)
				.modelSet({page: i, isActive: self.$pager.model.current == i ? 'active' : ''})
				.appendTo(self.$pager.shortcuts.pages);
			self.pages.push(page);
		}
		if(finishPage < self.$pager.model.count){			//если нужно показать последнюю страницу и ...
			if (finishPage < self.$pager.model.count - 1) $('@ui/pager/crumbs').appendTo(self.$pager.shortcuts.pages);
			page = $('@ui/pager/page')
				.logicSet(self)
				.modelSet({page: self.$pager.model.count-1, isActive: ''})
				.appendTo(self.$pager.shortcuts.pages);
			self.pages.push(page);
		}
	},

	selectPage: function(self, page) {
		//console.log('select page:', page);
		//self.pages[self.$pager.model.current].model.isActive = '';
		self.$pager.modelSet('current', page);
		self.render();
		//self.pages[page].model.isActive = 'active';
	},

	switchPage: function(self, offset) {
		self.selectPage(self.$pager.model.current + offset);
	}
});