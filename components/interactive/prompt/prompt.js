/**
 * @component prompt
 * @description Всплывающий запрос
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
 * 			notext:			string				Текст на кнопке "нет"
 * 			yestext:		string				Текст на кнопке "да"

 * 			yes:			fn					Обработчик кнопки "да"
 * 			no:				fn					Обработчик кнопки "нет"
 * 		content:			string				html c вопросом
 * @example
 * 		Из шаблона:
 * 			<prompt yes='self.yes();'>
 * 		 		Удалить все ?
 * 			</prompt>
 *
 * 		Из логики:
 * 			$.Component('prompt', {
 *				attrs: {
 *					yes: function() { ... }
 *				},
 *				content:	'Вы уверены что хотите удалить интернет ?'
 *			});
 * */

$.Controller.register("ui::prompt", {

	start: function(self, $prompt, cfg, $parent) {
		self.$parent = $parent;

		self.attrs = cfg.attrs.setDefault({
			position:		'center',
			width:			250,
			template:		'',
			content:		'',
			autoclose:		false,
			closeButton:	false,
			notext:			'Нет',
			yestext:		'Да'
		}).setHandler({
			yes:	function() {alert('noop yes');}, //
			no:		function() {alert('noop no');} //$.noop
		});

		cfg.attrs.notext.bridge({destObject: 	$prompt, destPath: '>>noText'});		// ~> self.balloon.model.notext
		cfg.attrs.yestext.bridge({destObject: 	$prompt, destPath: '>>yesText'});		// ~> self.balloon.model.yestext

		$prompt
			.modelSet('content', cfg.content)
			.modelSet('parent', $parent || $());

		self.$popup = $.Component('popup', {
			attrs: {
				uiLock:		true,
				template:	'ui/prompt'
			}
		}, $prompt);
	},

	yes: function(self) {
		self.$popup.logic.close(100);
		self.attrs.yes();
	},

	no: function(self) {
		self.$popup.logic.close(100);
	}
});
