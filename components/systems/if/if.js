/**
 * @component
 * @description Динамические условия для блоков
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			expr:		boolean		Условие для проверки. Если возвращает true - то блок показывается, иначе - скрывается
 * @example
 * 		<if expr="{{ name == 'foo' }}"/>
 * */

$.Controller.register("ui::if", {
	start: function(self, inner, cfg, parent) {
		cfg.attrs.setDefault({expr:	undefined, animation:''});

		inner
			.modelUse(parent)
			.viewSet('!' + cfg.content);

		if (!self.checkExpression(cfg.attrs.expr.value)) inner.hide();

		var animation = cfg.attrs.animation.value;
		var control = animation ?
			({
				fade: {false: 'fadeOut', true: 'fadeIn'},
				slide: {false: 'slideDown', true: 'slideUp'}
			}[animation]) : {false: 'hide', true: 'show'};


		cfg.attrs.expr.eventAdd('change', function(event, path, cfg) {
			inner[control[self.checkExpression(cfg.newValue)]]();
		});
	},

	checkExpression: function(self, expr) {
		if (expr == 'false') {
			return false;
		} else if (expr == 'true'){
			return true;
		}
		expr = JSON.stringify(expr);
		var val = expr ? !!(new Function('return '+expr+'||false'))() : false;
		//console.log('[if]', expr, val);
		return val;

/*
		try {
			var val = expr ? !!(new Function('return (' + expr + ')||false'))() : false;
		} catch (e) {
			val = false;
		}
		console.log('[if]', expr, val);
		return val;
*/
	}
});