/**
 * @component
 * @description Календарь
 * 		attrs:
 * 			value:			'yyyy-mm-dd'
 * 			disabled:		boolean			Если true - запрещает редактировать дату
 * 			minDate:		'yyyy-mm-dd'	Минимальная дата, которую можно выставить
 * 			maxDate:		'yyyy-mm-dd'	Максимальная дата, которую можно выставить
 * 			onDateSelect:	function(Date)	Отрабатывает при выборе даты
 * @example
 * 		html:
 * 		<calendar value='{{M.mydate}}' minDate='2000-01-01' disabled='true' onDateSelect='alert(123)'/>
 */

$.Controller.register("ui::calendar", {
	$calendar:			undefined,
	dateSelectedCell:	null,
	dayShift:			0,			//смещение дней недели (например для американского календаря =1)

	start: function(self, $calendar, cfg) {
		cfg.attrs
			.setDefault({
				value:			new Date(),
				minDate:		new Date('1970-01-01'),
				maxDate:		new Date('2099-12-31'),
				disabled:		false
			})
			.setHandler({
				onDateSelect:	$.noop
			});
		$calendar.modelSetType('date', 'date');

		cfg.attrs.value.bridge({destObject: $calendar,	 	destPath: 'date'});			// <~> self.$calendar.model.date
		cfg.attrs.minDate.bridge({destObject: $calendar,	destPath: '>>minDate'});	// ~> self.$calendar.model.minDate
		cfg.attrs.maxDate.bridge({destObject: $calendar,	destPath: '>>maxDate'});	// ~> self.$calendar.model.maxDate
		cfg.attrs.disabled.bridge({destObject: $calendar,	destPath: '>>disabled'});	// ~> self.$calendar.model.disabled

		self.onDateSelect = cfg.attrs.onDateSelect;
		self.$calendar = $calendar
			.modelSetType({
				'date':		'date',			// selected
				'current':	'date'			// current view
			})
			.modelEventAdd('change', 'date', function(_eventName, _modelPath, cfg) {
				if ( !$.isDate(self.$calendar.model.date) ) return;
				self.$calendar.model.current.value = self.$calendar.model.date.value;
				self.generateDayMatrix(_eventName, _modelPath, cfg);
			})
			.modelEventAdd('change', 'minDate maxDate disabled', self.generateDayMatrix.bind(self))
			.viewSet("@ui/calendar");
		self.$calendar.model.current = self.$calendar.model.date ? new Date(self.$calendar.model.date) : new Date();
		self.generateDayMatrix();
	},

	scrollYear: function(self, shift) {
		self.$calendar.model.current.value.year += shift;			//new Date().value = {year, month, day}
		self.generateDayMatrix();
	},

	scrollMonth: function(self, shift) {
		self.$calendar.model.current.value.month += shift;			//new Date().value = {year, month, day}
		self.generateDayMatrix();
	},

	select: function(self, date, cell) {
		if ( self.dateSelectedCell ) self.dateSelectedCell.classList.remove('ui_calendar_day_selected');
		self.dateSelectedCell = cell;
		self.dateSelectedCell.classList.add('ui_calendar_day_selected');
		var d = new Date();
		d.value = date;
		self.$calendar.modelSet('date', d, {initiator:'ui::calendar'});
		self.onDateSelect();
	},

	getDaysCount: function (self, date) {
		var monthDays = [31,28,31,30,31,30,31,31,30,31,30,31];
		if (((date.year % 4 == 0) &&
			(date.year % 100 != 0)) ||
			(date.year % 400 == 0))
			monthDays[1] = 29;
		return monthDays[date.month - 1];
	},

	generateDayMatrix: function (self, _eventName, _modelPath, cfg) {
		if ( cfg && cfg.initiator == 'ui::calendar' ) return;
		var date = self.$calendar.model.current;

		var dateYMD = date.value;					//new Date().value = {year, month, day}
		var today = new Date();
		var daysTable = $("!");
		var daysCount = self.getDaysCount(dateYMD),
			daysShift = getShift(dateYMD, self.dayShift - 1),
			column = 0;

		function getShift(date, shift) {
			var	a = parseInt( (14 - date.month) / 12 ),
				y = date.year - a,
				m = date.month + 12 * a - 2,
				unshifted = (7000 + parseInt(1 + y + parseInt(y / 4) - parseInt(y / 100) + parseInt(y / 400) + (31 * m) / 12)) % 7,
				shifted = unshifted + shift;
			return (shifted < 0) ? shifted + 7 : shifted;
		}

		var addCell = function () {
			function createLine() {
				var tr = document.createElement('tr');
				daysTable.appendChild(tr);
				return tr;
			}
			var tr = createLine();
			return function (date, dayClass) {
				if (column == 7) {
					tr = createLine();
					column = 0;
				}
				var cell = document.createElement('td');
				cell.innerHTML = date.day;

				if ( ( date < self.$calendar.model.minDate ) || ( date > self.$calendar.model.maxDate ) || self.$calendar.model.disabled ) {
					cell.className = "tac ui_calendar_day_inactive";
				} else {
					cell.className = "tac cp " + dayClass;
					cell.onclick = self.select.bind(self, date, cell);
				}

				if (self.$calendar.model.date &&
					self.$calendar.model.date.value &&
					self.$calendar.model.date.value.year == date.year &&
					self.$calendar.model.date.value.month == date.month &&
					self.$calendar.model.date.value.day == date.day
				) {
					cell.classList.add('ui_calendar_day_selected');
					self.dateSelectedCell = cell;
				}
				if (
					today.value.year == date.year &&
					today.value.month == date.month &&
					today.value.day == date.day
				) {
					cell.classList.add('ui_calendar_day_today');
				}
				column++;
				tr.appendChild(cell);
				return cell;
			}
		}();

		var i, prevMonthCount = self.getDaysCount({year: (dateYMD.month == 1 ? dateYMD.year-1 : dateYMD.year), month: (dateYMD.month == 1 ? 12 : dateYMD.month-1)});
		for (i = daysShift; i>0; i--) {
			addCell( {day: prevMonthCount-i+1, month: dateYMD.month==1 ? 12: dateYMD.month-1, year: dateYMD.month==1 ? dateYMD.year-1 : dateYMD.year}, 'ui_calendar_day_othermonth');
		}

		for (var day = 1; day <= daysCount; day++) {
			var dayClass = 'ui_calendar_day' + ((column >= 5 && column <7) ? ' ui_calendar_day_rest' : '');
			addCell({day: day, month: dateYMD.month, year: dateYMD.year}, dayClass);
		}

		var extTd = 8-column;
		for (i = 1; i<extTd; i++) {
			addCell({day: i, month:dateYMD.month==12 ? 1: dateYMD.month+1, year: dateYMD.month==12 ? dateYMD.year+1 : dateYMD.year}, 'ui_calendar_day_othermonth');
		}

		daysTable.appendTo(self.$calendar.shortcuts.days.empty());
	}
});
