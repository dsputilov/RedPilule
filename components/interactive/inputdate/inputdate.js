$.Controller.register("ui::inputdate", {
	start: function(self, input, cfg, parent) {
		self.input = input;
		$('@ui/inputdate/ico').insertAfter(input).click(self.showcalendar.bind(self));
		self.inputAttrs = cfg.attrs;
		input.click(self.showcalendar.bind(self));
	},

	showcalendar: function(self) {
		if (!self.balloon) {
			self.inputAttrs.value.bridge({destObject: self.input, destPath: 'date'});
			self.balloon = $.Component("balloon", {
					attrs: {
						template: 'ui/inputdate/popup',
						orientation: 'rb'
					}
				}, self.input)
				.onReady(function(){
					self.balloon.logic.insertOut(self.input);
					self.input.view[0].focus();
				});
		} else {
			self.balloon.logic.show();
			self.input.view[0].focus();
		}
	},

	onDateSelect: function(self) {
		//console.log('[ui:inputdate] inputAttrs:', self.inputAttrs);
		self.balloon.logic.close();
	}
});
