/**
 * @component
 * @description Виртуальный контейнер. Позволяет объединять несколько соседних тегов в отдельную капсулу, не создавая ему отдельного тега.
 * @example
 * 		<div>1</div>
 * 		<virtualfragment shortcut="mycontainer">
 * 			<div>2</div>
 * 			<div>3</div>
 * 		</virtualfragment>
 *		<div>4</div>
 * */

$.Controller.register("ui::virtualfragment", {
	start: function(self, $inner, cfg, parent) {
		$inner
			.modelUse(parent)
			.viewSet('!' + cfg.content);
	}
});