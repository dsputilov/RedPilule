$.Controller.register('singletond', {
	init: function(self) {
		window.ctrlsig1_checksum += 'i|';
	},
	a: 10,
	test: function() {
		window.ctrlsig1_checksum += 't';
	}
});