/**
 * @component
 * @description Изменяет контекст для всх потомков,
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			value:			rpObject				новый контекст, от которого будет наследоваться модель, логика
 * 		value: 	контент, при клике на который всплывает попап
 * @example
 * 		Из шаблона:
 * 			<scope value="{{M.balloonScope}}">
 *				{{M.ballonData}}
 *			</scope>
 * */
$.Controller.register("ui::scope", {
	start: function(self, container, cfg, parent) {
		var scope = cfg.attrs.value.value;
		console.info('scope attrs:',scope);
		container.viewSet('!'+cfg.content);
	}
});