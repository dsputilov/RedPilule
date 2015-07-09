$.Controller.register("ui::progressBar", {
	start: function(self, $progressBar, cfg) {
		cfg.attrs.setDefault({
			max: 0,
			value: 0,
			width: 400
		});
		$progressBar.modelSetType({max: 'int', value: 'int'});
		cfg.attrs.max.bridge({destObject: $progressBar, destPath: 'max'});
		cfg.attrs.value.bridge({destObject: $progressBar, destPath: 'value'});
		cfg.attrs.width.bridge({destObject: $progressBar, destPath: 'width'});
		$progressBar.viewSet('@ui/progressBar');
	}
});