
$.Keymap = (function() {
	var maps = {};
	
	document.addEventListener('keypress', function(chr) {
		var key = chr.charCode + ':' + chr.ctrlKey + ':' + chr.altKey + ':' + chr.shiftKey;
		if (maps[key]) maps[key]();
	}, true);

	return {
		add: function(keys, fn) {
			var chr = {ctrlKey: false, altKey: false, shiftKey: false};
			keys.trim().split(/[\+\s\t]+/).forEach(function(key) {
				if (key == 'ctrl') {
					chr.ctrlKey = true;
				} else if (key == 'alt') {
					chr.altKey = true;
				} else if (key == 'shift') {
					chr.shiftKey = true;
				} else {
					chr.keyCode = key.charCodeAt(0);
				}
			});
			var key = chr.keyCode + ':' + chr.ctrlKey + ':' + chr.altKey + ':' + chr.shiftKey;
			maps[key] = fn;
		}
	};
})();
