/**
 * @component
 * @description Инклудит подшаблон, либо заданный хтмл
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			html:					number					Ширина всплывающего окна
 * 			template:				templateName [optional]	Имя шаблона, используемого в качестве контента попапа
 * 			modelUse:	RP object [optional]	Обьект чью модель должен унаследовать вставляемый шаблон
 * @example
 * 		<include template='@templateName'/>
 * 		<include html='{{myhtml}}'/>
 * */

$.Controller.register("ui::include", {
	start: function(self, wrapper, cfg, parent) {
		cfg.attrs.setDefault({
			template: '',
			html: '',
			modelUse: null
		});
		wrapper.modelUse(cfg.attrs.modelUse.value || parent);
		wrapper.component = parent.component;
		cfg.attrs.html.eventAdd('change', function (event, path, cfg) {
			wrapper.viewSet('!' + cfg.newValue);
		});
		cfg.attrs.template.eventAdd('set', function (event, path, cfg) {
			wrapper.viewSet('@' + cfg.newValue);
		});

		cfg.attrs.modelUse.eventAdd('set', function (event, path, cfg) {		//TODO: проверить что оно воще меняется и что воще можно менять модель на лету
			wrapper.modelUse(cfg.newValue);
			wrapper.component = parent.component;
		});

		if (cfg.attrs.modelUse.value) 				wrapper.modelUse(cfg.attrs.modelUse.value);
		if (cfg.attrs.template.value)				wrapper.viewSet('@' + cfg.attrs.template.value);
		if (cfg.attrs.html.value) 					wrapper.viewSet('!' + cfg.attrs.html.value);

	}
});