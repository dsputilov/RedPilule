/**
 * @component
 * @description
 * 		Таймер с цифрами
 * 		attrs:
 * 			data			Данные вида {cfgName: name, cfgId: id, cfgParent: parentId}
 * 			value			массив выбранных галочек
 * 			rootId			Корневая нода
 * @example
 * 		<timer shortcut='mytimer'></tree>
 * 		$capsule.shortcuts.mytimer.logic.begin();	//Запустить таймер
 * 		$capsule.shortcuts.mytimer.logic.end();		//Остановить таймер
 */

$.Controller.register("ui::timer", {
	startTime:	undefined,
	interval:	undefined,
	$timer:		undefined,
	start: function(self, $timer) {
		self.$timer = $timer
			.modelSet({
				hours:		0,
				minutes:	0,
				seconds:	0
			})
			.viewSet('@ui/timer');
	},

	renderDigits: function(self) {
		var duration = Math.floor((new Date()-self.startTime)/1000);
		var hours = Math.floor(duration/(60*60));
		var minutes = Math.floor((duration - hours*60*60)/60);
		var seconds = duration - hours*60*60 - minutes*60;
		self.$timer.model.hours = hours;
		self.$timer.model.minutes = minutes;
		self.$timer.model.seconds = seconds;
		self.interval = setTimeout(self.renderDigits.bind(self), 1000);
	},

	begin: function(self) {
		self.startTime = new Date();
		self.interval = setTimeout(self.renderDigits.bind(self), 1000);
	},

	end: function(self) {
		clearInterval(self.interval);
	}
});