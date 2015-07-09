$.Controller.register("ui::schedule", {
	schedule:	undefined,
	timesNodes:	[],
	selectionEnabled:	false,
	selectionValue:	false,

	start: function(self, schedule, cfg, parent) {
		self.checkhHours = self.checkhHours.setFPS(30);			//теперь метод checkhHours будет запускаться не чаще чем раз в 30мс, независимо от количества вызовов
		self.updateSRC = self.updateSRC.setFPS(200);			//теперь метод updateSRC будет запускаться не чаще чем раз в 30мс, независимо от количества вызовов
		self.schedule = schedule;

		schedule.modelSet('isAll', false);
		schedule.viewSet('@ui/schedule');
		cfg.attrs.setDefault({dates: undefined});
		cfg.attrs.dates.bridge({destObject: schedule, destPath: 'dates'}, {childObserve: false});		// ~> self.schedule.model.dates

		for (var day=0; day<7;day++) self.timesNodes.push([]);

		//Generate matrix
		var matrix = schedule.shortcuts.days.view[0];
		for (var day=0; day<7; day++) {
			for (var hour=0; hour<24; hour++) {
				var timeNode = document.createElement('div');
				timeNode.className = 'ui_schedule_item ' + (schedule.model.dates[day][hour] ? 'selected' : '');
				timeNode.innerHTML = schedule.model.dates[day][hour] ? '+' : '-';
				timeNode.onmousedown = (function(day, hour) {
					return function() {
						self.selectionEnabled = true;
						self.selectionValue = self.schedule.model.dates[day][hour] ? 0 : 1;
						self.setTime(day, hour, self.selectionValue);
						return false;
					}
				})(day, hour);
				timeNode.onmouseup = function() {
					self.selectionEnabled = false;
				};
				timeNode.onmouseover = (function(day, hour) {
					return function() {
						if (self.selectionEnabled) {
							self.setTime(day, hour, self.selectionValue);
						}
					}
				})(day, hour);
				matrix.appendChild(timeNode);
				self.timesNodes[day][hour] = timeNode;
			}
		}

		//Watch week's checkboxes and select days
		schedule.modelEventAdd('change', 'week.*', function(e, path, cfg) {
			var day = path.split('.')[1];
			for (var hour=0; hour<24; hour++) self.setTime(day, hour, cfg.newValue ? 1 : 0);
		});

		//Watch hour's checkboxes and select days
		schedule.modelEventAdd('change', 'hours.*', function(e, path, cfg) {
			var hour = path.split('.')[1];
			for (var day=0; day<7; day++) self.setTime(day, hour, cfg.newValue ? 1 : 0);
		});
		self.checkhHours(true);		// :disablesave
	},

	setTime: function(self, day, hour, value) {
		var value = $.isNumber(value) ? value : (self.schedule.model.dates[day][hour] ? 0 : 1);
		self.schedule.model.dates[day][hour] = value;
		var timeNode = self.timesNodes[day][hour];
		timeNode.innerHTML = value ? '+' : '-';
		timeNode.classList[value ? 'add' : 'remove']('selected');
		self.checkhHours();
	},

	checkhHours: function(self, disablesave) {
		var days = [];
		var hours = [];
		var workHours = 0;
		var checkedCounter = 0;
		for (var day=0; day<7; day++) {
			if (!days[day]) days[day] = 0;
			for (var hour=0; hour<24; hour++){
				if (!hours[hour]) hours[hour] = 0;
				var value = self.schedule.model.dates[day][hour] ? 1:0;
				days[day] += value;
				hours[hour] += value;
				workHours += day>4 || hour<8 || hour>19 ? 0 : value;
				checkedCounter += value;
			}
		}
		days.forEach(function(value, id) {
			if ( (value == 24) !== self.schedule.model.week[id] ) self.schedule.modelSet('week.'+id, (value == 24), {event: false});
		});
		hours.forEach(function(value, id) {
			if ( (value == 7) !== self.schedule.model.hours[id] ) self.schedule.modelSet('hours.'+id, (value == 7), {event: false});
		});
		self.schedule.model.isAll = (168 == checkedCounter);
		self.schedule.model.workHours = workHours;

		if (!disablesave) self.updateSRC();
	},

	selectAll: function(self) {
		for (var day=0; day<7; day++) self.schedule.modelSet('week.'+day, 1);
	},

	deselectAll: function(self) {
		for (var day=0; day<7; day++) self.schedule.modelSet('week.'+day, 0);
	},

	selectWorks: function(self) {
		for (var day=0; day<7; day++) {
			for (var hour=0; hour<24; hour++)	self.setTime(day, hour, (day>4 || hour<8 || hour>19) ? 0 : 1 );
		}
	},

	updateSRC: function(self) {
		self.schedule.modelSet('dates', self.schedule.model.dates, {childObserve: false, initiator:'ui:schedule'});
	}
});
