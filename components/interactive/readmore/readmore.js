/**
 * @component
 * @descriptiotn Контроллер выпадающего списка
 * 		attrs:
 * 			length:			int		Количество отображаемых символов в свернутом виде
 * @example
 *
 *	 <readmore length="50"></readmore>
 */

$.Controller.register("ui::readmore", {

	status: 'collapse',

	start: function (self, $readmore, cfg, $parent) {
		self.$readmore = $readmore;
		self.$parent = $parent;
		cfg.attrs
			.setDefault({
				length: 80
			});

		self.content = cfg.content;
		self.length = cfg.attrs.length.value;
		/*
		cfg.attrs.width.eventAdd('change', function(event, path, c) {
			console.log('change content', c);
			self.content = c.newValue;
			self[self.status]();
		});
		*/
		self[self.status]();
	},

	expand: function(self) {		//раскрыть текст
		self.status = 'expand';
		var content = $('!'+self.content, self.$parent);	//.modelSet({}, {forceRender: true}
		setTimeout(function() {
			content = content.viewGet();
			content+= "<dib class='db cp link mt2' onclick='self.collapse();'>Скрыть ↑</dib>";
			self.$readmore.viewSet("!<span>" + content+"</span>", self.$parent);
		},100);
	},

	collapse: function(self) {		//свернуть текст
		self.status = 'collapse';
		var content = $('!'+self.content, self.$parent);	//.modelSet({}, {forceRender: true})
		setTimeout(function() {
			content = content.viewGet();
			if (content.length > self.length) {
				content = content.substr(0, self.length) + "...";
				content = "<span class='link cp' onclick='self.expand();'>" + content + "</span>";
			}
			self.$readmore.viewSet("!"+content, self.$parent);
		},100);
	}
});