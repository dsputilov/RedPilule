/**
 * @component Popup
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
 * 			closeButton:	boolean [optional]		Контент шаблона (вместо имени шаблона)
 * 			uiLock:			boolean [optional]		блокировать ui
 * 		value: 	контент, при клике на который всплывает попап
 * @example
 * 		Из шаблона:
 * 			<popup on='hover' orientation='tr' shortcut='myballoon' template='tplName' content='content' onclose='self.closed();'>
 * 		 		<span>hello world</span>
 * 			</popup>
 *
 * 		Из логики:
 * 			var myballoon = $.Component('balloon', {
 *				content: 'my popup text',
 *				attrs: {
 *					template: 'templateName',
 *				}
 *			});
 *
 * @todo
 * 		вызов контроллера, а не вставка шаблона
 * 		определение координат, чтоб оптимальнее выводить на экран
 * */

$.Controller.register("ui::popup", {
	start: function(self, _, cfg, $parent) {
		var $popup = $().logicSet(self);
		self.$popup = $popup;

		cfg.attrs.setDefault({
			position:		'center',
			width:			400,
			padding:		undefined,
			template:		'',
			content:		'',
			autoclose:		false,
			closeButton:	false,
			uiLock:			false
		});

		cfg.attrs.setHandler({
			'onclose': $.noop
		});
		self.onclose = cfg.attrs.onclose;

		cfg.attrs.width.bridge({destObject:			$popup, destPath: '>>width'});			// ~> self.balloon.model.width
		cfg.attrs.template.bridge({destObject:		$popup, destPath: '>>template'});		// ~> self.balloon.model.balloonTemplate
		cfg.attrs.closeButton.bridge({destObject: 	$popup, destPath: '>>closeButton'});	// ~> self.balloon.model.closeButton
		cfg.attrs.padding.bridge({destObject: 		$popup, destPath: '>>padding'});		// ~> self.balloon.model.padding
		cfg.attrs.uiLock.bridge({destObject: 		$popup, destPath: '>>uiLock'});			// ~> self.balloon.model.uiLock

		if ($parent) {
			$popup.modelSet('parent', $parent);
			$parent.component = self;
			$popup.component = self;
		}
		if (cfg.content) {
			$popup.model.content = cfg.content;
		} else {
			cfg.attrs.content.bridge({destObject: $popup, destPath: '>>content'});	// ~> self.balloon.model.balloonContent
		}
		$popup.viewSet('@ui/popup').appendTo(document.body);//.hide();
		self.show();
	},

	show: function(self) {
		self.$popup.fadeIn(250);
	},

	hide: function(self) {
		self.$popup.fadeOut(300, function() {
			//self.$popup.remove();				//TODO: если удаляется, то в show надо сделать проверку - вдруг обьекта не существует и тогда надо заного показать
			self.onclose();
		});
	},

	close: function(self, event) {
		self.hide();
	},

	blockUI: function(self, state) {
		self.$popup.model.uiLock = state == 'on';
	}
});
