/**
 * @component
 * @description Обрабатывает аттрибут 'editable' - при двойном клике навешивает аттрибут contenteditable, при нажатии enter - снимает
 * @example
 * 		<span editable>hello world</span>
 * */

$.Controller.register("ui::editable", {
	node: undefined,
	start: function(self, node, cfg, parent) {
		self.node = node;

		self.eventName = cfg.attrs.editable.value;
		if (!self.eventName) self.eventName = 'dblclick';

		node.eventAdd(self.eventName, function() {
			var el = self.node.view[0];
			if (el.contentEditable == "true") return;
			var sel = window.getSelection();
			sel.removeAllRanges();
			self.on();
			node.clickOut(self.off.bind(self));
			return false;
		});
		node.eventAdd('keypress', function(e) {
			if (e.keyCode == 13) self.off();
		});
	},

	on: function(self) {
		var el = self.node.view[0];
		el.setAttribute('contenteditable', true);
		el.focus();
	},

	off: function(self) {
		var el = self.node.view[0];
		el.setAttribute('contenteditable', false);
		el.blur();
	}
});