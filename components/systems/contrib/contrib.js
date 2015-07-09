/*****
 * Additional adapters
 */
$.adapterAdd({
	'crop': function(str, ln) {
		if ($.isString(str) && ln) str = str.substring(0, ln);
		return str;
	},
	'>>lengthEqual': function(value1, value2) {
		if ($.isArray(value1)) {
			value1 = value1.length;
		} else if ($.isHash(value1)) {
			value1 = Object.keys(value1).length;
		}
		return value1 == value2;
	},
	'>>lengthNotEqual': function(value1, value2) {
		if ($.isArray(value1)) {
			value1 = value1.length;
		} else if ($.isHash(value1)) {
			value1 = Object.keys(value1).length;
		}
		return value1 != value2;
	},
	'year': function(date) {
		if (!$.isDate(date)) date = new Date(date);
		if (date != 'Invalid Date') return date.value.year;
		else return '';
	},
	'month': function(date) {
		if (!date) return '';
		return date.value.month;
	},

	'>>dateFormat': function(date, mask) {
		if (!mask) mask = 'dd.mm.yyyy';
		if (date && $.isString(date)) date = new Date(date);
		return date ? date.get(mask) : '';
	},
	'<<dateFormat': function(date, mask) {
		if (!mask) mask = 'dd.mm.yyyy';
		return date ? (new Date()).set(date, mask) : '';
	},

	'>>dateTime': function(date) {
		if (date) {
			if ($.isString(date)) date = new Date(date);
			//var year = date.getFullYear();
			//var month = date.getMonth()+1;
			var hours = +date.getHours();
			var minutes = +date.getMinutes();
			return date.get('dd.mm.yyyy') + ' ' + (hours<10 ? '0' :'') + hours + ':'+ (minutes<10 ? '0' :'')+minutes;
		} else {
			return '';
		}
	},

	'>>useDictionary': function(value, dictName) {
		var val = $.Dictionary(dictName).getById(value);
		if (val) return val._name_;
		return '';
	},

	'>>join': function(value, devider) {
		if ($.isHash(value)) {
			var arr = [];
			for (var i =0; value[i]; i++) {arr.push(value[i])}
			value = arr;
		}
		if ($.isArray(value)) return value.join(devider || '');
		return '';
	},

	'>>numberFormat': function(value, type) {
		if (!type) type='int';
		if (type=='int') {
			value = parseInt(value);
			return parseInt(value).toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
		} else {
			return value;
		}
	},

	'>>time': function(duration) {
		duration = +duration + 0;
		var hours = Math.floor(duration/(60*60));
		var minutes = Math.floor((duration - hours*60*60)/60);
		var seconds = duration - hours*60*60 - minutes*60;
		return ((hours<10) ? '0' :'') + hours + ':' + ((minutes<10) ? '0' :'') + minutes + ':'+((seconds<10) ? '0' :'') + seconds;
	},

	'>>moneyFormat': function(value) {
		if (!value) return '0.00';
		return parseFloat(value).toFixed(2);
	},

	'>>twodigit': function(value) {
		return value<10 ? '0'+value : value;
	},

	'>>escape': function(value) {
		return escape(value);
	}
	// domain >>
	// uint uint2 money
});

$.adapterAdd({
	'monthText': function(date) {
		var months = {
			ru: {1:'Январь', 2:'Февраль', 3:'Март', 4:'Апрель', 5:'Май', 6:'Июнь', 7:'Июль', 8:'Август', 9:'Сентябрь', 10:'Октябрь', 11:'Ноябрь', 12:'Декабрь'}
		};
		if (!$.isDate(date)) date = new Date(date);
		//return date != 'Invalid Date' ? months[ENV.system.locale][date.value.month] : '';
		return date != 'Invalid Date' ? months['ru'][date.value.month] : '';
	},

	'flatLength': function(arr) {
		return arr.flatLength;
	},

	'isNotEmpty': function(arr) {
		//return 'fsdfgs';
		if ($.isArray(arr)) {
			return !!arr.flatLength;
		} else if ($.isHash(arr)) {
			//console.log('isNotEmpty', (Object.keys(arr).length!=0));
			return (Object.keys(arr).length!=0);
		} else {
			return true;
		}
	},

	'isEmpty': function(arr) {
		if (!arr) return true;
		if ($.isArray(arr)) {
			return !arr.flatLength;
		} else if ($.isHash(arr)) {
			return (Object.keys(arr).length==0);
		} else {
			return false;
		}
	},

	sumProperty: function(obj, propertyName) {
		if(!obj){return 0;}
		var returnValue = 0;
		obj.forEach(function(elem){
			//console.log('sumProperty', elem[propertyName]);
			if(elem[propertyName]){
				returnValue += elem[propertyName];
			}

		});
		return returnValue;
	},

	'if': function(value, condition, ifTrue, ifFalse) {
		if(condition == value){
			return ifTrue;
		}
		ifFalse = ifFalse || '';
		return ifFalse;
	},

	'addURIParams': function(uri, params){
		var res = [];
		params.forEach(function(value, key) {
			res.push(key+'='+value);
		});
		return res.length ? uri+'?'+res.join('&') : uri;
	},
	'removeDomainZone2': function(domain){
		if (!domain) return '';
		domain.search(/([\wа-яА-ЯёЁ\.\-]+)\.[\wа-яА-ЯёЁ\-]+\.[\wа-яА-ЯёЁ\-]+$/);
		return RegExp.$1;
	},
	'isDomainLevelUp2': function(domain){
		var domainLvl = domain.match(/\./g);
		return domainLvl.length > 1;
	},
	'invertBoolean': function(invert){
		return !invert;
	}

});

$.typeAdd('stringEn', {
	originTypeName: 'stringEn',
	baseType:	'string',
	checkType:	function(value) {
		var isValid = /^[A-Za-z\s]+$/.test(value);
		return {value: value, valid: isValid};
	}
});
$.typeAdd('stringRu', {
	originTypeName: 'stringRu',
	baseType:	'string',
	checkType:	function(value) {
		var isValid = /^[А-Яа-я\s]+$/.test(value);
		return {value: value, valid: isValid};
	}
});
$.typeAdd('phoneNumber', {
	originTypeName: 'phoneNumber',
	baseType:	'string',
	checkType:	function(value) {
		var isValid = /^\+\d{8,20}$/.test(value);
		return {value: value, valid: isValid};
	}
});