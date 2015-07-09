
/* Class2 Test */
TDD.add({
	group	:'Class',
	name	:'.constructor',
	tests	:{
		main: function(complete) {
			var checksum = 0;
			var t = $.Class({
				constructor: function(self, n) {
					checksum+=n+1;	//1 +n
				},
				public: {
					ch_pub: 1,
					test_public: function(self, x,y) {  //5, 10
						checksum++; //2
						checksum+=x; //7
						checksum+=y; //17
						checksum+= self.public.ch_pub; //18
						self.private.test_private(1,2);
					}
				},
				private: {
					ch_pub: 2,
					test_private: function(self,a,b) {
						checksum++; //19
						checksum+=a; //20
						checksum+=b; //22
					}
				}
			});

			var el = t(10);
			el.test_public(5,10); //32

			if (1) {
				checksum++;
			}
			complete(checksum == 33);
		}
	}
});

/* Class2 Static Test */
TDD.add({
	group	:'Class',
	name	:'.static',
	tests	:{
		main:function(complete) {
			var checksum = 0;
			var t = $.Class({
				constructor: function(self) {
					checksum+=self.static.ch;
				},
				public: {
					test_static: function(self) {
						checksum+=self.static.ch;
						self.private.test_static();
					},
					changeStatic: function(self) {
						self.static.ch = 5;
					}
				},
				private: {
					test_static: function(self) {
						checksum+=self.static.ch;
					}
				},
				static: {
					ch: 1
				}
			});

			var el1 = t();
			el1.test_static(); //3
			el1.changeStatic();
			var el2 = t();
			el2.test_static(); //3+15 =18

			complete(checksum == 18);
		}
	}
});

/* Class2 Extend Test */
TDD.add({
	group	:'Class',
	name	:'.extend',
	tests	: {
		main: function(complete) {
			var checksum = '';
			var t = $.Class({
				constructor: function(self) {
				},
				public: {
				},
				private: {
				},
				static: {
					ch: 1
				},
				extend: {
					extTest: function(self, x, y) {
						checksum = self.static.ch + x + y;
					}
				}
			});

			t.extTest(5,10);	//16
			complete(checksum == 16);
		}
	}
});