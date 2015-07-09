/**
 * @component
 * @description тестовый компонент для тестирования всякого говна
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			value:			rpObject				новый контекст, от которого будет наследоваться модель, логика
 * 		value: 	контент, при клике на который всплывает попап
 * @example
 * 		Из шаблона:
 * 			<testag data="{{M.balloonScope}}">123</scope>
 * */
$.Controller.register("ui::testag", {
	start: function(self, container, cfg, parent) {

		console.log('[testag] attrs:', cfg.attrs);

		cfg.attrs.value.bridge({destObject: container, destPath: 'data'});


		container.viewSet('!<h1>{{M.data}}</h1>');

	}
});