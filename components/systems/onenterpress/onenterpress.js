/**
 * @component
 * @description Создает аттрибут 'onEnterPress' - обработчик события, который отрабатывает на полях ввода при нажатии на клавишу enter
 * @example
 * 		<input value="{{ name }}" onEnterPress='self.mymethod()'/>
 * */

$.Controller.register("ui::onEnterPress", {
	start: function(self, node, cfg, parent) {

		node.eventAdd('keypress', function(e) {
			if (e.keyCode == 13) {
				(function(self, event, parent, model, M, R) {
					eval(cfg.content);
				})(parent.logicGet(), e, parent, parent.model, parent.model, ENV.system.route);
			}
		});
	}
});