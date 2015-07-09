$.Controller.register('singletondd', {
	init: function(self) {
		self._STATUS_ = 'wait';
		window.ctrlsig2_checksum += 'i|';
		setTimeout(function() {
			self.a = 20;
			window.ctrlsig2_checksum += 'r|';
			if ( $.Router('singletondd').a == 20 ) {
				window.ctrlsig2_checksum += '1';
			}

			$.Router('singletondd').a = 30;

			if ( $.Router('singletondd').a == 30 ) {
				window.ctrlsig2_checksum += '2';
			}

			self._STATUS_ = 'ready';

		},100);
	},
	a: 10,
	test: function() {
		window.ctrlsig1_checksum += 't';
	}
});