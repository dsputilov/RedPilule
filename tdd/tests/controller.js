Unitest.add({
	group	:'Controller',
	name	:'Controller.constructor',
	test	:function(checksum) {
		$.Controller.register('control', {
			a: 5,
			inc: function(self) {
				self.a = 10;
			}
		});

		var t1 = $.Controller('control');
		var t2 = $.Controller('control');
		t1.inc();

		return t1.a==10 && t2.a==5 ? true : false;
	}
});

Unitest.add({
	group	:'Controller',
	name	:'Controller.register()',
	test	:function(checksum) {
		$.Controller.register('control', {
			a: 5,
			inc: function(self) {
				self.a = 10;
			}
		});
		return true;
	}
});
