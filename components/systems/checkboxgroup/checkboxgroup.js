/**
 * @component
 * @description Цикл
 * 		attrs: доступные аттрибуты для конфигурации группы
 * 			group:			string
 * 			groupowner:		string
 * @example
 * 		<input type='checkbox' groupowner='foo'> Select all
 * 		<input type='checkbox' group='foo' value='item.a'> select a
 * 		<input type='checkbox' group='foo'  value='item.b'> select b
 * */

(function() {

	var groups = {};

	$.Controller.register("ui::checkboxGroup", {
		start: function(self, node, cfg) {
			cfg.attrs.setDefault({ value: false });
			var groupname = cfg.attrs.group.value;
			if (!groups[groupname]) groups[groupname] = [];
			groups[groupname].push({node: node, attrs: cfg.attrs});
			cfg.attrs.value.eventAdd('change', function(event, path, eventCfg) {
				console.log('change ingroup: ', eventCfg.newValue);
			});
		}
	});

/*
	$.Controller.register("ui::checkboxGroupOwner", {
		start: function(self, ) {
			var groupname = ;
			if (!groups[]) {

			}
		}
	});
*/
})();

