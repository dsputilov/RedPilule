/**
 * @component Overlayer
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
 * 			<ballon on='hover' orientation='tr' shortcut='myballoon' template='tplName' content='content' onclose='self.closed();'>
 * 		 		<span>hello world</span>
 * 			</ballon>
 *
 * 		Из логики:
 * 			var myballoon = $.Component('balloon', {
 *				content: 'my text',
 *				attrs: {
 *					template: 'templateName',
 *					content: 'popup description',
 *				}
 *			});
 *
 * @todo
 * 		вызов контроллера, а не вставка шаблона
 * 		определение координат, чтоб оптимальнее выводить на экран
 * */

(function() {

	var $popup;
	$.Controller.register("ui::overlayer", {

		start: function(self, balloonWrapper, cfg, parent) {
			//if ( !self.balloon.model.balloonContent && !self.balloon.model.balloonTemplate ) return;
			self.parent = parent;

			if ($popup) $popup.remove();
			$popup = $('@ui/overlayer');
			$popup.component = self;
			$popup.modelSet({parent: parent}).hide().appendTo(document.body);

			cfg.attrs.setDefault({
				width:			400,
				template:		'',
				content:		'',
				autoclose:		false,
				closeButton:	false
			});

			cfg.attrs.width.bridge({destObject:			$popup, destPath: '>>width'});			// ~> self.balloon.model.width
			cfg.attrs.template.bridge({destObject:		$popup, destPath: '>>template'});	// ~> self.balloon.model.balloonTemplate
			cfg.attrs.content.bridge({destObject:		$popup, destPath: '>>content'});	// ~> self.balloon.model.balloonContent
			cfg.attrs.closeButton.bridge({destObject: 	$popup, destPath: '>>closeButton'});		// ~> self.balloon.model.closeButton

			self.show();
		},

		show: function(self) {
			//if (!self.balloon.model.closeButton) self.clickoutId = self.balloon.clickOut(self.close.bind(self));
			$popup.fadeIn(100);
		},

		hide: function(self) {
			$popup.fadeOut(100);
		},

		close: function(self) {
			//$popup.eventRemove(self.clickoutId);
			//if (event) event.stopPropagation();
			self.hide();
		}
	});

})();