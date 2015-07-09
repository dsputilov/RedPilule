/**
 * @component
 * @description Блокирует кнопку
 * @example
 * 		<input value="{{ name }}" lock='{{M.isLocked}}' autolock='true' />
 * */

$.Controller.register("ui::lock", {
	start: function(self, $node, cfg, parent) {

		cfg.attrs.setDefault({'autolock': false});

		var $locker= $().modelSetType({'lock': 'bool', 'autolock': 'bool'});
		cfg.attrs.lock.bridge({destObject: $locker, destPath: '>>lock'});
		cfg.attrs.autolock.bridge({destObject: $locker, destPath: 'autolock'});

		$locker
			.modelEventAdd('change', 'lock', function(event, path, cfg) {
				$node.view[0].disabled = cfg.newValue;
			})
			.modelEventFire('change', 'lock', {data: {newValue: $locker.model.lock}});

		$node.eventAdd('beforeClick', function() {
			if ($locker.model.lock) {
				return false;
			} else {
				if ($locker.model.autolock) $locker.model.lock = true;
			}
		});
	}
});