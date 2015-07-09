/**
 * @component notice
 * @description Всплывающий небольшой попап, указывающий на элемент
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			orientation: 	match						Позиция, куда будет указывать стрелочка баллона
 * 								tl	- сверху слева
 * 								tr	- сверху справа
 *			 					rt	- справа сверху
 *			 					rb	- справа внизу
 * 								br	- внизу справа
 * 								bl	- внизу слева
 *			 					lb	- слева внизу
 * 								lt	- слева вверху
 * 			on:				enum(click|hover) [optional, default:click]	При клике или при наведении показывать баллон
 * 			width:			number					Ширина всплывающего окна
 * 			template:		templateName [optional]	Имя шаблона, используемого в качестве контента попапа
 * 			content:		string [optional]		Контент шаблона (вместо имени шаблона)
 * 			closeButton:	string [optional]		Контент шаблона (вместо имени шаблона)
 * 		value: 	контент, при клике на который всплывает попап
 * @example
 * 		Из шаблона:
 * 			<notice on='hover' orientation='tr' shortcut='myballoon' template='tplName' content='content' onclose='self.closed();'>
 * 		 		<span>hello world</span>
 * 			</notice>
 *
 * 		Из логики:
 * 			var myballoon = $.Component('notice', {
 *				content: 'my text',
 *				attrs: {
 *					template: 'templateName',
 *					content: 'notice description',
 *				}
 *			});
 *
 * @todo
 * 		вызов контроллера, а не вставка шаблона
 * 		определение координат, чтоб оптимальнее выводить на экран
 * */

(function() {

	var notices = [];
	var container;

	$.Controller.register("ui::notice", {
		timer:	undefined,

		start: function(self, _, cfg, $parent) {
			if (!container) container = $("@ui/notices").appendTo(document.body).shortcuts.notices;
			var $notice = $().logicSet(self);
			self.$notice = $notice;

			if (notices.length == 4) {
				notices[0].close();
				notices.shift();
			}
			notices.push(self);

			cfg.attrs.setDefault({
				template:		'',
				content:		''
			});

			cfg.attrs.template.bridge({destObject:		$notice, destPath: '>>template'});		// ~> self.balloon.model.balloonTemplate
			//cfg.attrs.content.bridge({destObject:		$notice, destPath: '>>content'});		// ~> self.balloon.model.balloonTemplate

			$notice.modelSet('content', cfg.content);

			$notice.viewSet('@ui/notice/ok').appendTo(container);
			$notice.eventAdd('click', 		self.setAutoClose.bind(self));
			$notice.eventAdd('mouseout', 	self.setAutoClose.bind(self));
			$notice.eventAdd('mouseover',	function() {clearTimeout(self.timer);});
			self.setAutoClose();
			self.show();
		},

		setAutoClose: function(self) {
			self.timer = setTimeout(self.hide.bind(self), 3000);
		},

		show: function(self) {
			self.$notice.fadeIn(300);
		},

		hide: function(self) {
			self.$notice.slideDown(300, function() {
				self.$notice.remove();
				notices.shift();
			});
		},

		close: function(self, event) {
			self.hide();
		}
	});

})();
