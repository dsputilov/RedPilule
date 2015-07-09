/**
 * @component
 * @description устанавливает src равным source
 * @example
 * 		<img source="{{M.domainValue.imageUrl}}" extPrefix="preview">
 *
 * */

$.Controller.register("ui::imagesource", {
	start: function(self, $node, cfg, $parent) {
		self.$node = $node;
		cfg.attrs.setDefault({
			'source':	'',
			'extprefix':	''
		});

		self.$img = $();
		cfg.attrs.source.bridge({destObject: self.$img, destPath: 'source'});
		cfg.attrs.extprefix.bridge({destObject: self.$img, destPath: 'extprefix'});
		self.$img
			.modelEventAdd('change', 'source extprefix', function(event, path, cfg) {
				self.setSource();
			});
		if (cfg.attrs.source.value) {
			self.setSource();
		}
	},

	setSource: function(self) {
		var source = self.$img.model.source;
		if(!source){return}
		if (self.$img.model.extprefix) {
			source = source.replace(/(\.[^\.]+)$/, "."+self.$img.model.extprefix+"$1");
		}
		self.$node.view[0].src = source;
	}
});