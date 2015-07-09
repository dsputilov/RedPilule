/**
 * @fileOverview This file has functions related to documenting JavaScript.
 * @author <a href="mailto:javascript@programist.ru">Dmitri Putilov</a>
 * @author <a href="mailto:micmath@gmail.com">Michael Shestakov</a>
 * @version 0.0.3
 */

var $ = {};

/*==============================================================================*/
/* Timelogger
 /*==============================================================================*/
var CR = {
	times: {},
	count: {}
};
var CT = {
	reqursive:	{},
	timesStart: {},
	start:function(name) {
		if (!CR.times[name]) {
			CR.times[name] = 0;
			CR.count[name] = 1;
		} else {
			CR.count[name]++
		}
		if (!CT.reqursive[name]) {
			CT.reqursive[name] = 0;
			CT.timesStart[name] = new Date();
		}
		CT.reqursive[name]++;
	},
	stop:function(name) {
		if (CT.reqursive[name]<=0) {
			console.warn('[TIMES] used stop without start:', name);
			CT.reqursive[name] = 0;
			return;
		}
		CT.reqursive[name]--;
		if (CT.reqursive[name] == 0) {
			CR.times[name] += new Date() - CT.timesStart[name];
		}
	},
	reset: function() {
		CR = {
			times: {},
			count: {}
		};
	}
};



(function() {
"use strict";
/*==============================================================================*/
/* Kernel
 /*==============================================================================*/

/**
 * Browser detect
 */
(function() {
	var type, agent, version;
	if (navigator.appVersion.indexOf("MSIE") != -1) {
		type = 0;
		agent = "IE";
		version = document.documentMode;
	} else if (navigator.appVersion.toLowerCase().indexOf("win") != -1) {
		type = 1;
		agent = "WIN";
	} else if (navigator.userAgent.indexOf("Opera") != -1) {
		type = 2;
		agent = "Opera";
	} else {
		type = 3;
		agent = "Other";
	}
	$.browser = {
		agent	:agent,
		type	:type,
		version	:version
	};
})();


/*==============================================================================*/
/* Хаки И Расширения
/*==============================================================================*/

/**
 *	@name			createContextualFragment
 *	@description	в IE 9 почему то этого нету
 */
if ((typeof Range !== "undefined") && !Range.prototype.createContextualFragment) {
	Range.prototype.createContextualFragment = function(html) {
		var frag = document.createDocumentFragment(),
			div = document.createElement("div");
		frag.appendChild(div);
		div.outerHTML = html;
		return frag;
	};
}

/** 
 *	@property
 *	@name			AttrList
 *	@description	в FF нету NamedNodeMap. По смыслу данный тип данных означает список аттрибутов, поэтому назван AttrList (по аналогии с нативным NodeList)
 */
Object.defineProperty(
	window,
	'AttrList',
	{
		enumerable: false,
		freeze: true,
		value: window.NamedNodeMap || window.MozNamedAttrMap
	}
);

/** @property
 *	@name 			HTMLDocument
 *	@description	в IE нету HTMLDocument
 */
Object.defineProperty(
	window,
	'HTMLDocument',
	{
		enumerable:	false,
		freeze:		true,
		value:		window.HTMLDocument || window.document
	}
);

/**
 * IE 9 / event:input не срабатывал на backspace, delete и на нативный крестик очистки поля
 * */
if ($.browser.agent == 'IE' && $.browser.version == 9) {
	document.addEventListener('keydown', function(e) {
		if (e.keyCode == 8 || e.keyCode == 46) {
			var evt = document.createEvent("Event");
			evt.initEvent("input", true, true);
			setTimeout(	function() { e.srcElement.dispatchEvent(evt); }, 1);
		}
	}, true);
	document.addEventListener('mouseup', function(e) {
		if (e.srcElement.tagName == 'INPUT') {
			var value = e.srcElement.value;
			setTimeout(
				function() {
					console.info( e.srcElement.value, value );
					if (e.srcElement.value != value) {
						var evt = document.createEvent("Event");
						evt.initEvent("input", true, true);
						e.srcElement.dispatchEvent(evt);
					}
				},
				1
			);
		}
	}, true);
}

/*==============================================================================*/
/* Common subs
 /*==============================================================================*/

/**
 * @name		$.defineProperty
 * @description
 * @param		obj
 * @param		prop
 * @param		cfg
 * @return		{*}
 */
$.defineProperty = function(obj, prop, cfg) {
	/** cfg =
	 get : cfg.get,
	 set : cfg.set,
	 enumerable : false,
	 */
	cfg.configurable = true;
	//if (typeof obj == 'object') {
	Object.defineProperty(obj, prop, cfg);
	/*
	 } else {
	 console.warn('cant define property: `'+prop+'` in obj:');
	 console.info(obj);
	 }
	 */
	return obj.prop;
};



/**
 * @name		$.defineMethod
 * @description
 * @param		obj
 * @param		prop
 * @param		cfg
 * @return		{*}
 */
$.defineMethod = function(obj, method, fn) {
	Object.defineProperty(obj, method, {
		value: fn,
		enumerable: false
	});
	return obj.prop;
};


/**
 * @name			window._throw_
 * @description		Exeptions
 * @param			new Error(message)
 * @return			undefined
 */
$.defineMethod(window, '_throw_', function (err){
	var debug = true;
	//console.info(debug = true);
	if (debug) throw err;
});


/**

Типы данных:
	FUNCTION:			[function() {}, new Function('')],									//	Функция
	BOOLEAN: 			[true, false, new Boolean('true')],									//	true, false
	STRING:				['str', new String('wert'), '', new String()],						
	NUMBER: 			[-111, 111.11, new Number(33)],
	ARRAY:				[[1,2,3], new Array(2,3,4,56), [], new Array(33)],
	DATE:				[new Date()],
	HASH:				[{a:2}, {a:{b: true}}, {}, new Object()],
	HTMLELEMENT:		[document.createElement('span')],									//	Любой хтмл элемент	(nodeType = 1)						https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
	HTMLCOLLECTION:		[document.body.children],											//	Live список хтмл элементов (nodeType = 1)				http://alebelcor.github.io/2011/htmlcollections-nodelists/
	DOCUMENTFRAGMENT:	[document.createDocumentFragment()],
	NODE:				[document.createTextNode('hello')],									//	Нода, которую можно вставить в дерево (nodeType = 1,3,7,8,9,10,11)		http://dom.spec.whatwg.org/#node
	NODELIST:			[document.body.childNodes],											//	Список нод (nodeType = 1,3,7,8,9,10,11)
	ATTR:				[document.createAttribute('id')],									//	Аттрибут (nodeType = 2)
	ATTRLIST:			[document.createElement('div').attributes],							//	Список аттрибутов	(nodeType = 2)
	RANGE:				[document.createRange()],
	NULL:				[null],
	NAN: 				[parseInt('d')],
	UNDEFINED:			[undefined]
*/

// http://jsperf.com/get-set-prop-test/2
$.isFunction =	function (value){return typeof value == 'function';};
$.isBoolean =	function (value){return typeof value == 'boolean';};
$.isString =	function (value){return typeof value == 'string';};
$.isNumber =	function (value){return typeof value == 'number' && !isNaN(value);};
$.isArray =		function (value){return value instanceof Array;};
$.isDate =		function (value){return value instanceof Date;};
$.isHash =		function (value){return value instanceof Object && value.constructor === Object && '' + value != '[object Arguments]';};
$.isObject =	function (value){return value instanceof Object && !(value instanceof Array) && !(value instanceof Node) && !(value instanceof Date) && !(value instanceof String) && !(value instanceof Number) && !(value instanceof Function) && !(value instanceof Boolean) && !(value instanceof Range) && !(value instanceof NodeList) && !(value instanceof HTMLCollection) && !(value instanceof Node) && !(value instanceof RegExp) && !(value instanceof AttrList);};
$.isRegExp =	function (value){return value instanceof RegExp;};

$.isHtmlElement =  function (value){return value instanceof HTMLElement;};
$.isHtmlCollection = function (value){return value instanceof HTMLCollection;};
$.isNode = 		function (value){return value instanceof Node && value.nodeType != 2 && value.nodeType != 4 && value.nodeType != 5 && value.nodeType != 6 && value.nodeType != 12;};
$.isNodeComment =  function (value){return value && value instanceof Node && value.nodeType==8};
$.isNodeList =	function (value){return value instanceof NodeList;};
$.isAttr =		function (value){return value instanceof Attr;};
$.isAttrList =	function (value){return value instanceof AttrList;};
$.isDocumentFragment =function (value){return value instanceof DocumentFragment;};
$.isRange =		function (value){return value instanceof Range;};
$.isRP =		function (value){return value && value.pid && value.pid.indexOf('rp')==0;};
$.isNonEmptyObject = function (value){return Boolean(value && typeof value == 'object' && Object.keys(value).length);};
$.isEmptyObject = function (value){return Boolean(value && typeof value == 'object' && Object.keys(value).length == 0);};

(function() {
	var nf = function(){this.notFound = true;};
	$.defineProperty(window, 'notFound', {value: new nf()});
	$.isFound = function(obj) {return !(obj instanceof nf);};
})();





/*==============================================================================*/
/* Extend methods for `Object` 
/*==============================================================================*/

/** addPair | Добавляет в объект пару - ключ:значение
 *	@param	{string} key
 *	@param	{object} value
 *	@return	{this}
 */
$.defineMethod(Object.prototype, 'addPair', function(key, value) {
	this[key] = value;
	return this;
});

/** hasPropertyByPath | find property by path in object
 * @param	{string}	Путь к свойству
 * @return	{Object}	Значение
 */
$.defineMethod(Object.prototype, 'hasPropertyByPath', function(path) {
	return $.isFound(this.getPropertyByPath(path));
});

/** getPropertyByPath | find property by path in object
 * @param	{string}	Путь к свойству
 * @return	{Object}	Значение
 */
$.defineMethod(Object.prototype, 'getPropertyByPath', function(path) {
	if (path == '') return this;
	if ( $.isString(path) ) {
		var pathSteps = path.split('.');
		var cur = this;
		for (var i = 0, l = pathSteps.length, pathStep; pathStep = pathSteps[i], i < l && pathStep && cur; i++) {
			if (cur.hasOwnProperty && cur.hasOwnProperty(pathStep)) cur = cur[pathStep];
			else break;
		}
		return i < l ? notFound : cur;
	}
	else _throw_(new Error('getPropertyByPath argument should be string.'));
});

/** setPropertyByPath | set property by path in object
 * @param	key {string}	Путь к свойству
 * @param	value {string}	Значение
 * @param	options {string}	Опции
 * 				options.devider	Разделитель нод. Если не задан, тогда используется по умолчанию точка.
 * @return	{Object}	Значение
 */
$.defineMethod(Object.prototype, 'setPropertyByPath', function(key, value, options) {	// #TODO: допилить options:  rw
	//console.warn('setPropertyByPath -------------------------------------------------');
	if ( $.isString(key) ) {
		var obj = this;
		var devider = (options && options.devider) || '.';
		var path = key.split(devider);											// Если в <!ENV> встратилась запись типа "a.b.c"
		for (var i = 0, len = path.length; i < len - 1; i++) {
			if ( $.isHash(obj[path[i]]) ) {
				obj = obj[path[i]];
			}
			else {
				//console.info('[setPropertyByPath] leaf:', obj);
				obj[path[i]] = {};
				obj = obj[path[i]];
			}
		}

		if ( $.isHash(obj[path[i]]) ) {
			obj[path[i]].extendByClone(value);
		} else {
			//var $key = path[i];
			//console.log('[setPropertyByPath] obj:', this, typeof this, key, value);
			obj[path[i]] = value;
		}
	} else _throw_(new Error('ENV path should be string.'));
});

/** mergePropertyByPath | set property by path in object
 * @param	key {string}	Путь к свойству
 * @param	value {string}	Значение
 * @param	options {string}	Опции
 * 				options.devider	Разделитель нод. Если не задан, тогда используется по умолчанию точка.
 * @return	{Object}	Значение
 */
$.defineMethod(Object.prototype, 'mergePropertyByPath', function(key, value, options) {	// #TODO: допилить options:  rw
	//console.warn('setPropertyByPath -------------------------------------------------');
	if ( $.isString(key) ) {
		var obj = this;
		var devider = (options && options.devider) || '.';
		var path = key.split(devider);											// Если в <!ENV> встратилась запись типа "a.b.c"
		for (var i = 0, len = path.length; i < len - 1; i++) {
			if ( $.isHash(obj[path[i]]) ) {
				obj = obj[path[i]];
			} else {
				//console.info('[setPropertyByPath] leaf:', obj);
				obj[path[i]] = {};
				obj = obj[path[i]];
			}
		}

		//console.log('[setPropertyByPath] obj:', obj, '   k/v:',key, value, 'path:', path[i]);
		if ( $.isHash(obj[path[i]]) ) {
			obj[path[i]].mergeByClone(value, false, true);
		} else {
			if ($.isHash(value)) {
				obj[path[i]] = {};
				obj[path[i]].mergeByClone(value, false, true);
			} else {
				obj[path[i]] = value;
			}
		}
	} else _throw_(new Error('ENV path should be string.'));
});

/** deletePropertyByPath | find property by path in object
 * @param	{string}	Путь к свойству
 * @return	{Object}	Значение
 */
$.defineMethod(Object.prototype, 'deletePropertyByPath', function(path) {
	if (path == '') return this;
	if ( $.isString(path) ) {
		var pathSteps = path.split('.');
		var cur = this;
		var l = pathSteps.length-1;
		var pathStep;
		for (var i = 0; pathStep = pathSteps[i], i < l && pathStep && cur; i++) {
			if (cur.hasOwnProperty && cur.hasOwnProperty(pathStep)) cur = cur[pathStep];
			else break;
		}
		if (i == l) delete cur[pathSteps[l]];
	}
	else _throw_(new Error('getPropertyByPath argument should be string.'));
});


/** @name			forEach
 *	@description	Циклически пробегает по всем ключам объекта, вызывая функцию с параметрами (value, key, num). Умеет пробегаться по ключам хеша, Node.childNodes, Node.attributes, DocumentFragment. Если итератор возвращает false, то происходит остановка цикла (break)
 *	@param			{function}
 *	@return			{Array}
 */
$.defineMethod(Object.prototype, 'forEach', function(callback) {
	if ( this instanceof NodeList || this instanceof HTMLCollection ) {			// if $.isHTMLCollection(this)
		var i, list = Array.prototype.slice.call(this, 0), ln = list.length;	//convert to deadlist
		for (i = 0; i < ln; i++) {
			if (callback(list[i], i, i) === false) break;
		}		
	} else if ( this instanceof DocumentFragment ) {							// if $.isDocumentFragment(this)
		var i, list = Array.prototype.slice.call(this.childNodes, 0), ln = list.length;		//convert to deadlist
		for ( i = 0; i < ln; i++) {
			if (callback(list[i], i, i) === false) break;
		}
	} else if ( this instanceof AttrList ) {									// if $.isAttr(this)
		var i, attr, ln = this.length;
		for (var i = 0; attr = this[i], i < ln; i++) {
			if (callback(attr, attr.name, i) === false) break;
		}
	} else {
		for (var i = 0, keys = Object.keys(this), ln = keys.length, key, value; key = keys[i], value = this[key], i < ln; i++) {
			if (callback(value, key, i) === false) break;
		}
	}
});



/**
 *  @name			map
 *  @description	Аналог map для Array. Циклически пробегает по всем ключам объекта, вызывая функцию с параметрами (value, key, num). Возвращает массив значений, пришедших после отработки функции для каждой итерации. Если итератор возвращает объет notFound, то результат не включается в результирующий массив
 *	@param			{function}
 *	@return			{Array}
 */
$.defineMethod(Object.prototype, 'map', function(callback) {
	//if (!$.isHash(this)) return;
	var ret = [];

	var i,value;

	if ( this instanceof NodeList || this instanceof HTMLCollection ) {			// if $.isHTMLCollection(this)
		var list = Array.prototype.slice.call(this, 0), ln = list.length;	//convert to deadlist
		for (i = 0; i < ln; i++) {
			value = callback(list[i], i, i);
			if ( $.isFound(value) ) ret.push(value);
		}
	} else if ( this instanceof DocumentFragment ) {							// if $.isDocumentFragment(this)
		var list = Array.prototype.slice.call(this.childNodes, 0), ln = list.length;		//convert to deadlist
		for ( i = 0; i < ln; i++) {
			value = callback(list[i], i, i);
			if ( $.isFound(value) ) ret.push(value);
		}
	} else if ( this instanceof AttrList ) {									// if $.isAttr(this)
		var attr, ln = this.length;
		for (i = 0; attr = this[i], i < ln; i++) {
			value = callback(attr, attr.name, i);
			if ( $.isFound(value) ) ret.push(value);
		}
	} else {
		var key, keys = Object.keys(this);
		var l = keys.length;
		for (i = 0; i < l; i++) {
			key = keys[i];
			value = callback(this[key], key, i);
			if ( $.isFound(value) ) ret.push(value);
		}
	}

	return ret;
});



/** @name			forEachRecursive
 *	@description	Рекурсивно пробегает по всем ключам объекта, вызывая функцию с параметрами (value, key, num). Умеет пробегаться по ключам хеша, Node.childNodes, Node.attributes, DocumentFragment
 *	@param			{function}
 *  @cfg 			{hash:true} //default
 *	@return			{Array}
 */
(function() {
	var recursive = function(obj, path, callback, cfg) {
		path += path && '.';

		for (var i = 0, keys = Object.keys(obj), l = keys.length, key, value; i < l; i++) {
			key = keys[i];
			value = obj[key];

			var curPath = path + key;

			if (cfg.hash) { callback(value, curPath); paths.push(curPath); }

			if ($.isHash(value) || $.isArray(value)) {
				recursive(value, curPath, callback, cfg);
			}
			else if (!cfg.hash) { callback(value, curPath); paths.push(curPath); }
		}
	};

	var paths;
	$.defineMethod(Object.prototype, 'forEachRecursive', function(callback, cfg) {
		paths = [];
		cfg = cfg || {hash: true};
		if ($.isHash(this) || $.isArray(this)) {
			recursive(this, '', callback, cfg);
		}
		return paths;
	});
})();


/** @name			forEachBySelector
 *	@description	Рекурсивно  пробегает по всем путям объекта, которые подходят под селекторы
 *	@param			{function}
 *  @cfg 			{hash:true} //default
 *	@return			{Array}
 */
(function() {
	function recursive(obj, path, tailSelector, callback, cfg) {
		if ($.isHash(obj) || $.isArray(obj)) {
			path += path && '.';
			var index = tailSelector.indexOf('*');

			// Если в оставлейся части селектора не нашлось *, значит можно просто сделать getPropertyByPath
			if (index == -1) {
				path += tailSelector;
				obj = obj.getPropertyByPath(tailSelector);
				if ( $.isFound(obj) ) {
					if ( (cfg.hash && $.isHash(obj)) || !$.isHash(obj)) {
						callback(obj, path);
						paths.push(path);
					}
				}
			} else {
				var localPath = tailSelector.substr(0, index - 1);
				if (localPath) {
					obj = obj.getPropertyByPath(localPath);
					path += localPath + '.';
				}

				if ( $.isFound(obj) ) {
					if (tailSelector.charAt(index + 1) == '*') {	//  '**' wide match selector
						var subtreePaths = obj.forEachRecursive(callback, cfg);
						for (var i = 0, l = subtreePaths.length; i < l; i++) {
							subtreePaths[i] = path + subtreePaths[i];
						}
						Array.prototype.push.apply(paths, subtreePaths);
					} else {
						tailSelector = tailSelector.substr(index + 2);	//  '*.path' -> path
						if (tailSelector) {
							for (var i = 0, keys = Object.keys(obj), l = keys.length, key, value; i < l; i++) {	// если * является конечным звеном селектора
								key = keys[i];
								value = obj[key];
								recursive(value, path + key, tailSelector, callback, cfg);
							}
						}
						else {
							for (var i = 0, keys = Object.keys(obj), l = keys.length, key, value; i < l; i++) {	// если после * есть продолжение селектора
								key = keys[i];
								value = obj[key];
								if ( !$.isHash(value) || cfg.hash ) {
									callback(value, path + key);
									paths.push(path + key);
								}
							}
						}
					}
				}
			}
		}
	}

	var paths = [];
	$.defineMethod(Object.prototype, 'forEachBySelector', function(selector, callback, cfg) {
		paths = [];
		cfg = cfg || {hash: true};
		if (!callback) callback = $.noop;
		if (!selector) _throw_(new Error('[forEachBySelector] нельзя вызывать без селектора'));
		recursive(this, '', selector, callback, cfg);
		return paths;
	});
})();



/** DEPRECATED
 *	@method keys | Возвращает массив с ключами объекта
 *	@param	{Array}		Если передан массив, то проивзодит по нему фильтрацию
 *	@return	{Array}		Возвращает массив ключей объекта
*
$.defineMethod(Object.prototype, 'keys', function(keys) {
	var ret = [];
	if ( $.isArray(keys) ) {
		for (var i = 0, l = keys.length, key; i < l, key = keys[i]; i++) {
			if (this.hasOwnProperty(key)) ret.push(key);
		}
	} else {
		ret = Object.keys(this);
	}
	return ret;
});
*/

/** 
*	@name	sort
*	@param	{object}
*	@return	{uint} фактическое количество элементов, оставшихся после фильтрации (до урезания limit'ом). Фильтрует только свойства первого уровля вложенности, getPropertyByPath не юзаем из соображений скорости
*
	cfg:	{
		sortBy:			propertyName 					// [optional] Если не задано, то сортируем хэш по ключу
		sortOrder:		'asc' || 'desc'					// asc по умолчанию
		sortFn:			function(){},
		matchCase:		bool,							// default - true
		limit:	20,
		offset:	0,

		filters: {
			prop1: {				// либо так...
				query: 'ABC',			// если нужен поиск по нескольким значениям, то нужно юзать fn
				matchCase: false,						// default - true
				matchWhole: false						// default - true
			},
			prop2: function(value) {	// либо так...
				return (true || false) 					//Аналогично Array.filter
			}
		}
		exceptKeys:	[]
	},
	fn:		function(value, key, index) {}			// Итератор [обязательный]
 */

/** @function
 *	@name	sort
 *	@description Описалово {@tutorial bind}
 *	@param	{object} [cfg] 						Параметры конфигурации сортировки
 *	@param  {string} [cfg.sortBy=ключ хэша]		Свойство объекта, по которому нужно сортировать хэш
 *	@param  {string} [cfg.sortOrder=desc]		Порядок сортировки, может принимать значения asc, desc
 *	@param  {number} [cfg.limit]				Обозначает, над сколькими отсортированными элементами будет вызываться fn
 *	@param  {number} [cfg.offset]				Сдвиг сортировки
 *	@param  {Object.<string, object>} [cfg.filters]
 *	@param  {object} [cfg.filters.prop1]		Параметр конфигурации строкового фильтра
 *	@param  {string|string[]} cfg.filters.prop1.query Параметр конфигурации строкового фильтра
 *	@param  {boolean} [cfg.filters.prop1.matchCase]		Учитывать ли регистр символов при фильтрации
 *	@param  {boolean} [cfg.filters.prop1.matchWhole]	Учитывать только полное совпадение значения свойства искомому значению без учета регистра (определяется параметром matchCase)
 *	@returns {number} фактическое количество элементов, оставшихся после фильтрации (до урезания limit'ом). Фильтрует только свойства первого уровля вложенности, getPropertyByPath не юзаем из соображений скорости
 *
 * <pre><code>

 var reverse = cfg.sortOrder == 'desc';
 var sortBy = typeof cfg.sortBy == 'string' ? cfg.sortBy : undefined;
 var offset = +cfg.offset || 0;
 var limit = +cfg.limit || undefined;
 var filters = $.isHash(cfg.filters) && {}.extendByClone(cfg.filters);
 var exceptKeys = (cfg.exceptKeys || []).toObject();
 </code></pre>
 */
$.defineMethod(Object.prototype, 'sort', function(cfg, fn) {
	if (!this) return;
	// Если объект пустой, не тратим время
	if (Object.keys(this).length == 0) return;

	// Если итератор не передали, то сортировать тоже смысла нет
	if ( !$.isFunction(fn) ) _throw_(new Error('sort: переданный итератор fn не является функцией'));

	// Принимаем данные из cfg
	var reverse = cfg.sortOrder == 'desc';
	var sortBy = cfg.sortBy;

	// формат sortBy:sortOrder
	if ($.isString(sortBy)) {
		if (sortBy.indexOf(':') != -1) {
			sortBy = sortBy.split(':');
			reverse = sortBy[1] == 'desc';
			sortBy = sortBy[0];
		}
	}

	var matchCase = !(cfg.matchCase === false);

	var sortFn = (typeof cfg.sortFn == 'function' && cfg.sortFn) || function(a, b) {
		if (a.value > b.value) return more;
		else if (a.value < b.value) return less;
		else return 0;
	};

	var offset = +cfg.offset || 0;
	var limit = +cfg.limit || undefined;
	var filters = {}.extendByClone(cfg.filters);
	var exceptKeys = (cfg.exceptKeys || []).toObject();

	if (filters) {
		filters.forEach(function(filterConf, prop) {
			if ($.isHash(filterConf)) {
				// Комментарий по скорости: быстро отрабатывает только сценарий, когда в фильтре есть только свойство query [string] (строгое сравнение со строкой).
				// Это покрывает большую часть кейсов, при этом не разветвляет логику при фильтрации.
				// В остальных случаях генерятся регэкспы
				// Если требуется регэксп, то заворачиваем его в функцию
				filterConf.matchCase = !(filterConf.matchCase === false);
				filterConf.matchWhole = !(filterConf.matchWhole === false);

				if (
					(filterConf.matchCase && filterConf.matchWhole && $.isString(filterConf.query)) ||
					$.isBoolean(filterConf.query)
				) {
					filters[prop] = filterConf.query;
				} else {
					var fn;
					//TODO: Для регов заескейпить небуквенные символы
					// Самый быстрый способ поиска регом - RegExp.test() :: http://jsperf.com/regexp-test-vs-match-m5/4
					if ( filterConf.matchCase && !filterConf.matchWhole) {fn = function(val) {var re = new RegExp(filterConf.query); return re.test(val);};}
					if (!filterConf.matchCase && !filterConf.matchWhole) {fn = function(val) {var re = new RegExp(filterConf.query, 'i'); return re.test(val);};}
					if (!filterConf.matchCase &&  filterConf.matchWhole) {fn = function(val) {var re = new RegExp('^' + filterConf.query + '$', 'i'); return re.test(val);};}

					filters[prop] = fn;
				}
			}
		});
	}

	//console.log('[bind.sort] sortBy:', sortBy, reverse);

	// Фильтруем хэш и скидываем подходящие элементы в массив, который будем потом сортировать.
	var sortArray = [];
	for (var i1 = 0, keys = Object.keys(this), l1 = keys.length, key, value; key = keys[i1], value = this[key], i1 < l1; i1++) {
		// Если ID передан в списке исключений, то дальше не проверяем
		if (exceptKeys[key]) continue;

		// Если элемент не подходит под условия одного из фильтров, его тоже пропускаем
		if (filters) {
			var skip = false;

			// Итерируем по хэшу с фильтрами и накладываем фильтры на
			for (var i2 = 0, fKeys = Object.keys(filters), l2 = fKeys.length, fKey, filter; fKey = fKeys[i2], filter = filters[fKey], i2 < l2; i2++) {
				var val = value[fKey || key];	// получаем значение, которое будет проведено через фильтр

				if (typeof filter == 'function') {
					if (!filter(val)) {
						skip = true;
						break;
					}
				} else if (val != filter) {
					skip = true;
					break;
				}
			}
			if (skip) continue;
		}

		var tmp = (value && sortBy) ? value[sortBy] : key;
		sortArray.push({
			value:	matchCase ? tmp : tmp.toLowerCase(),
			hashKey:	key,
			val:		value
		});
	}

	var more = reverse ? -1: 1;
	var less = more * -1;

	// Сортируем и реверсируем одновременно с помощью XOR
	sortArray.sort(sortFn);

	// Устанавливаем диапазон вывода сортированных элементов
	// Значение ДО:
	//	1) Если limit == undefined, то до конца, т.е. l = sortArray.length;
	//	2) Если cfg.offset + cfg.limit >= sortArray.length, то l = sortArray.length
	//	3) Если cfg.offset + cfg.limit < sortArray.length, то l = cfg.offset + cfg.limit

	var i = offset;
	var l = ( (limit === undefined) || (limit + offset >= sortArray.length) ) ? sortArray.length : (limit + offset);
	for (; i < l; i++) {
		fn (sortArray[i].val, sortArray[i].hashKey, i);
	}

	return sortArray.length;
});



/** extendByClone 
 * @description	Клонирует свойства объекта (прототип не клонируется)
 * @param	{Object}
 * @param	isForce {boolean}	[false] регулирует поводение при совпадении свойств клонируемого объекта. массивы работают так же как скадяры
 * 											если true - то свойства расширяемого объекта заменяются на свойства того, чем расширяется
 * @param	isMutate {boolean}	[false] - если true, то мутирует исходный объект, иначе возвращает новый.
 * @return	{Object}	Клон объекта
 */

(function() {
	var mutate = function (obj1, obj2, force, merge) {
		if ( $.isHash(obj2) && $.isHash(obj1) ) {	// хэш нельзя скопировать в массив
			for (var i = 0, keys = Object.keys(obj2), l = keys.length, key, value; key = keys[i], value = obj2[key], i < l; i++) {
				if (force || !obj1.hasOwnProperty(key)) {
					if ( $.isHash(value) ) {
						if (!merge || (merge && !$.isHash(obj1[key])) ) obj1[key] = {};
						mutate(obj1[key], value, force);
					} else if ( $.isArray(value) ) {
						obj1[key] = [];
						mutate(obj1[key], value, force);
					} else {
						obj1[key] = value;
					}
				}
			}
		} else if ( $.isArray(obj2) ) {
			if (force) {
				obj1 = [];
				for (i = 0, l = obj2.length, value; value = obj2[i], i < l; i++) {
					if ( $.isHash(value) ) {
						obj1[key] = {};
						mutate(obj1[key], value, force);
					} else if ( $.isArray(value) ) {
						obj1[key] = [];
						mutate(obj1[key], value, force);
					} else {
						obj1[i] = value;
					}
				}
			}
		} else {
			// Если предыдущие ветки не отработали, то значит какая-то ошибка...
			;;;console.info('obj1: ' + typeof obj1, obj1, 'obj2: ' + typeof obj2, obj2);
			_throw_(new Error('extendByClone: ошибка расширения объекта'));
		}
	};

	var modify = function (obj1, obj2, force) {
		var newObj;
		var sequence = force ? [obj2, obj1] : [obj1, obj2];

		if ( $.isHash(obj2) && $.isHash(obj1) ) {	// хэш нельзя скопировать в массив
			newObj = {};
			for (var count = 0, curObj; curObj = sequence[count], count < 2; count++) {
				for (var i = 0, keys = Object.keys(curObj), l = keys.length, key, value; key = keys[i], value = curObj[key], i < l; i++) {
					if (count == 0 || !newObj.hasOwnProperty(key)) {
						if ( $.isHash(value) ) {
							newObj[key] = modify({}, value, true);
						} else if ( $.isArray(value) ) {
							newObj[key] = modify([], value, true);
						} else {
							newObj[key] = value;
						}

					}
				}
			}
		} else if ( $.isArray(sequence[0]) ) {
			newObj = [];
			for (var i = 0, curObj = sequence[0], l = curObj.length, value; value = curObj[i], i < l; i++) {
				if ( $.isHash(value) ) {
					newObj[i] = modify({}, value, true);
				} else if ( $.isArray(value) ) {
					newObj[i] = modify([], value, true);
				} else {
					newObj[i] = value;
				}
			}
		} else {
			// Если предыдущие ветки не отработали, то значит какая-то ошибка...
			;;;console.info('obj1: ' + typeof obj1, obj1, 'obj2: ' + typeof obj2, obj2);
			//_throw_(new Error('extendByClone: ошибка расширения объекта'));
		}
		return newObj;
	};

	$.defineMethod(Object.prototype, 'extendByClone', function(obj2, force, mut) {
		if (mut) {
			if (obj2) {
				mutate(this, obj2, force);
			}
		} else {
			if (obj2) {
				return modify(this, obj2, force);
			} else return this;
		}
	});

	$.defineMethod(Object.prototype, 'mergeByClone', function(obj2, force, mut) {
		if (mut) {
			if (obj2) {
				mutate(this, obj2, true, true);
			}
		} else {
			if (obj2) {
				return modify(this, obj2, true, true);
			} else return this;
		}
	});


})();



/** toFlatArray
* @description	Convert data to flat array
* @param data
*/
(function() {
	var flat = function(data, arr) {
		if ( $.isArray(data) ) {
			for (var i = 0, l = data.length; i < l; i++) {
				var el = data[i];
				if ( $.isArray(el) ) {
					flat(el, arr);
				} else {
					arr.push(el);
				}
			}
			return arr;
		} else {
			return [data]; //$.isString(data) ? [data + ""] : $.isNumber(data) ? [data + 0] : [data];
		}
	};

	$.defineMethod(Object.prototype, 'toFlatArray', function() {
		return flat(this, []);
	});
})();


/** any key of hash */
$.defineProperty(Object.prototype, 'anyKey', {
	get: function() {
		return Object.keys(this)[0];
	}
});


/** return any key's value of hash */
$.defineProperty(Object.prototype, 'anyValue', {
	get: function() {
		return this[Object.keys(this)[0]];
	}
});


/*==============================================================================*/
/* Extend methods for `String` 
/*==============================================================================*/

/**
 * @name	uid			Генерирует уникальную строку
 * @return	{string}	Возвращает уникальную строку
 */
$.defineMethod(String, 'uid', function(n) {
	var uuid = "";
	if (!n) n = 16;
	for (var i = 0; i < n; i++) {
		uuid += Math.floor(Math.random() * 16).toString(16);
	}
	return uuid;
});


/** @name 			toJSON		
 *	@description	Convert string to JSON | Конвертирует строку в JSON объект
 *	@return			{Object}
 */
$.defineMethod(String.prototype, 'toJSON', function() {
	try {
		return eval("(" + this + ")");
	} catch(e) {
		;;;console.warn('toJSON: ошибка в данных:', this);
		_throw_(new Error('toJSON failed'));
	}
});

/** @name 			capitalize
 *	@description	UpperCase first letter
 *	@return			{Object}
 */
$.defineMethod(String.prototype, 'capitalize', function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
});


/** @name			splitAs
 *	@description	Сплитит строку и создает обьъект, с свойствами keys и значениями получеными из сплита строки
 *	@param			{string} 	разделитель
 *	@param			{array}		массив с названиями ключей,
 *	@param			{integer}	лимит
 *	@return			{Object}	полученый объект
*/
$.defineMethod(String.prototype, 'splitAs', function(divider, keys, limit) {
	if ( !($.isString(divider) && $.isArray(keys) && (limit === undefined || $.isNumber(limit)) ) ) _throw_(new Error('splitAs: invalid arguments.'));

	var split = this.split(divider, limit);
	var ret = {};
	var arrKey, index, value, key, l = split.length;

	for (var i = 0; i < l; i++) {
		value = split[i];
		key = keys[i];
		if (key && !arrKey) {
			if ( ((index = key.indexOf('[]')) > 0) || ((index = key.indexOf('~'))>0) ) {
				arrKey = key.slice(0, index);
				ret[arrKey] = [];
			}
		}
		if (arrKey) {
			ret[arrKey].push(value);
		} else {
			ret[key] = value;
		}
	}


	var key_ln = keys.length-1;
	if (arrKey && keys[key_ln].indexOf('~') > 0) {
		ret[arrKey] = ret.hasOwnProperty(arrKey) ? ret[arrKey].join(divider) : undefined;
	}

	return ret;
});

/** @name			x
 *	@description	Конкатенирует строку n раз
 *	@param			{integer}	Сколько раз повторить строку
 *	@return			{string}	Итоговая строка
 *  @comment		TODO: для ие работает быстрее через join http://jsperf.com/concat-vs-joina/2
 */
$.defineMethod(String.prototype, 'x', function(n) {
	if ( !$.isNumber(n) ) _throw_(new Error('x: аргумент должен быть числом'));
	for (var i = 0, str = ''; i < n && (str += this); i++);	// Если пустую строку получает, то отваливается на первой итерации
	return str;
});





/*==============================================================================*/
/* Extend methods for `Number` 
/*==============================================================================*/
/**
 * @name	uid			Генерирует уникальный номер
 * @return	{number}	Возвращает уникальный номер
 */

(function() {
	var ucount = 0;
	$.defineMethod(Number, 'uid', function(n) {
		ucount++;
		return ucount;
	});
})();


/** Sprintf */
$.defineMethod(Number.prototype, 'sprintf', function(format) {	//#CHECK
	format = format.replace(/%0*(.*)?d$/, "$1");
	var number = this + '';
	number = "0".x(format-number.length)+number;
	return number;
});


/** match */
$.defineMethod(Number.prototype, 'match', function() {			//#CHECK
	var args = Array.prototype.slice.call(arguments, 0);		
	return String.prototype.match.apply(this.toString(), args);
});




/*==============================================================================*/
/* Extend methods for `Array` 
/*==============================================================================*/

/* Chop array */
$.defineMethod(Array.prototype, 'chop', function(num) {
	// return this.splice(a.length-1, 1);  //for mutate
	return this.slice(0, this.length - (num || 0)- 1);
});


/**
 * @method	Array.unique
 * @return	Array	Возвращает массив уникальных значений от исходного массива
 *  */
$.defineMethod(Array.prototype, 'unique', function() {
	var map = {},
		ret = [],
		len = this.length;
	for (var i = 0; i < len; i++) {
		var value = this[i];
		if ( !map.hasOwnProperty(value) ) {
			map[value] = 1;
			ret.push(value);
		}
	}
	return ret;
});

/**
 * @method	Array.flatLength
 * @return	Array	Возвращает массив уникальных значений от исходного массива
 *  */
$.defineProperty(Array.prototype, 'flatLength', {
	set: $.noop,
	get: function() {
		var len = this.length;
		var c=0;
		for (var i = 0; i < len; i++) {
			if (this[i]!==undefined) c++;
		}
		return c;
	}
});


/**
 * @method	Array.forEachBack
 * @return	Array	Итерирует по массиву в обратном порядке от конца к началу, вызывая fn(value, key);
 */
$.defineMethod(Array.prototype, 'forEachBack', function(fn, scope) {
	var len = this.length;
	for (var i = len-1; i >= 0; i--) {
		fn.call(scope, this[i], i);
	}
});


/* Convert array to object*/
/*
	Если вызвать toObject() без cfg === true
	['a', 1, true, undefined].toObject(true);
	то результат будет
	{'a': true, '1': true, 'true': true, 'undefined': true}

	Если .toObject(false) или .toObject(), то
	{"0": "a", "1": 1, "2": true, "3": undefined}
 */
$.defineMethod(Array.prototype, 'toObject', function(cfg) {
	var obj = {};
	var i = 0, keys = Object.keys(this), l = keys.length, key;

	if (cfg) {
		for (; i < l; i++) { key = keys[i]; obj[key] = this[key]; }
	} else {
		for (; i < l; i++) { key = keys[i]; obj[this[key]] = true; }
	}

	return obj;
});

/** @property
 *	@name			first
 *	@description	Свойство, значение которого ссылается на первый элемент массива
 *	@return			Первый элемент массива
*/
$.defineProperty(Object.prototype, 'first', {
	get: function() {
		return this[0];
	}
});

/** @property
 *	@name			last
 *	@description	Свойство, значение которого ссылается на последний элемент массива
 *	@return			Последний элемент массива
*/
$.defineProperty(Object.prototype, 'last', {
	get: function() {
		return this[this.length-1];
	}
});


(function() {
	['push'].forEach(function(methodName) {
		var fn = Array.prototype[methodName];
		$.defineMethod(Array.prototype, methodName, function() {
			var args = Array.prototype.slice.call(arguments);
			/* TODO: Теоретически должно быть так, разобраться почему оно счас вообще работает без вызова нативного пуша. А если сделать так - то вызывается 2 раза :/
			fn.apply(this, args);
			if (this.hasOwnProperty('_RPDefineProp_')) {
				this._RPDefineProp_.call(null, this, this.length, args);
			}
			*/
			/*
			*/
			if (this.hasOwnProperty('_RPDefineProp_')) {
				this._RPDefineProp_.call(null, this, this.length, args);
			} else {
				fn.apply(this, args);
			}
		});
	});
})();


/*==============================================================================*/
/* Extend methods for `Date` 
/*==============================================================================*/

/**
 *	@property
 *	@name			value
 *	@description	Live object, содержащее в себе свойства year, month, day.
 *	@return			{object}
*/
$.defineProperty(Date.prototype, 'value', {
	get: function() {
		var self = this;
		var date = self._fullValue_;
		if (!date) {	//кеширование
			date = {};
			$.defineProperty(date, 'year', {
				get: function() {
					return self.getFullYear();
				},
				set: function(year) {
					self.setFullYear(year);
				},
				enumerable: true
			});
			$.defineProperty(date, 'month', {
				get: function() {
					return self.getMonth()+1;
				},
				set: function(month) {
					self.setMonth(month-1);
				},
				enumerable: true
			});
			$.defineProperty(date, 'day', {
				get: function() {
					return self.getDate();
				},
				set: function(date) {
					self.setDate(date);
				},
				enumerable: true
			});	
			$.defineProperty(this, '_fullValue_', {
				value:		date
			});
		}
		return date;
	},
	
	set: function(date) {
		if (date.year && date.month && date.day)	{
			this.setFullYear(date.year, date.month-1, date.day);		
		} else {
			//_throw_(new Error('Дата должна быть в формате {year:yyyy, month:mm, day:dd}'));
		}
	}
});


$.defineMethod(Date.prototype, 'get', function(mask) {	// mask = 'dd m yyyy'
	var self = this;
	if ( !mask ) {
		return this.getFullYear() + "-" + (this.getMonth()+1).sprintf("%02d") + "-" + this.getDate().sprintf("%02d");
	} else {
		var date = mask.replace(/(d+|m+|y+)/g, function(reg, name) {
			var prop = { d:'day', m:'month', y:'year' }[name[0]];
			var value = self.value[prop];
			return "0".x(name.length - (value+'').length) + value;
		});
		return date;
	}
});


$.defineProperty(Date.prototype, 'set', {
	writable: true,
	configurable: true
});

$.defineMethod(Date.prototype, 'set', function(date, mask) {						// mask = 'dd m yyyy'
	var self = this;
	if ($.isDate(date)) {
		d = date.value;
		self.setFullYear(d.year, d.month-1, d.day);
	} else if ($.isString(date)) {
		if ( date.match(/today|yesterday|quarter|year|month|week/) ) {
			var d, now = new Date();
			if ( date == 'month') {
				d = new Date().value;
				d.month--;
			} else if (date == 'quarter') {
				d = new Date(now.getFullYear(), parseInt(now.getMonth()/3) * 3, 1).value;
			} else {
				var preset = {
					'today':		0,
					'yesterday':	-1,
					'week':			-7,
					'year':			-365
				}[date];
				var day = 1000 * 3600 * 24;
				d = new Date(+now + (day * preset)).value;
			}
			//console.log('d:',d);
			self.setFullYear(d.year, d.month-1, d.day);
		} else if (mask) {
			var blocks = [];
			mask = mask
				.replace(/([\~\!\@\#\$\%\^\&\*\(\)\_\+\=\/\*\-\[\]\{\}])/gm, "\\$1")
				.replace(/(mm|dd|yyyy|m|d|yy|y)/igm, function(_, name) {
					blocks.push(name.toLowerCase());
					return '(\\d+)';
				});
			if (date) {
				if (date.match(mask)) {
					var now = new Date().value;
					var d = {year: now.year, month: now.month, day: now.day};
					blocks.forEach(function(name, id) {
						var value = RegExp['$'+(id+1)];
						if (name == 'mm' || name == 'm') {
							d.month = +value;
						} else if (name == 'dd' || name == 'd') {
							d.day = +value;
						} else if (name == 'yyyy') {
							d.year = +value;
						} else if (name == 'yy') {
							d.year = +((value > 70 ? '19' : '20') + value);
						}
					});
					self.setFullYear(d.year, d.month-1, d.day);
				} else {
					return new Date('');
					//_throw_(new Error('[Date.set] date не соотвествует заданной маске'));
				}
			} else {
				return new Date('');
				//_throw_(new Error('[Date.set] date is undefined'));
			}


		} else if ( date.match(/(\d{4})\-(\d{2})\-(\d{2})/) ) {
			self.setFullYear(RegExp.$1, RegExp.$2-1, RegExp.$3);
		} else {
			return new Date('invalid');
		}
	} else {
		_throw_(new Error("Дата должна быть в формате yyyy-mm-dd"));
	}
	return this;
});


(function() {
	['setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear', 'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds', 'setYear'].forEach(function(methodName) {
		var fn = Date.prototype[methodName];
		$.defineMethod(Date.prototype, methodName, function() {
			fn.apply(this, Array.prototype.slice.call(arguments));
			if (this.hasOwnProperty('_RPSet_')) {
				this._RPSet_(); //.run();
			}
		});
	});
})();


/*==============================================================================*/
/* Extend methods for `Function`
 /*==============================================================================*/

(function() {
	var fnStash = [0];
	$.defineProperty(Function.prototype, 'fnId', {
		get: function() {
			if (this._fnIdValue_!==undefined) {
				return this._fnIdValue_;
			} else {
				var id = fnStash.length;
				fnStash.push(this);
				$.defineProperty(this, '_fnIdValue_', {value: id, enumerable: false});
				return id;
			}
		}
	});

	$.defineMethod(Function.prototype, 'getFunctionByFnId', function(id) {
		return fnStash[id];
	});
})();


$.defineMethod(Function.prototype, 'setFPS', function(time, idleFn) {
	var fn = this;
	var t;
	return function() {
		var scope = this;
		var args = arguments;
		if (t) clearTimeout(t);
		t = setTimeout(function () {
			fn.apply(scope, args);
		}, time);
		if (idleFn) {return idleFn()}
	};
});

/*==============================================================================*/
/* Extend methods for `Node`
 /*==============================================================================*/

/**
 * @name 			nodeId
 * @description 	Присваивает всем нодам свойство nodeId с уникальным значением {integer}
 */
(function() {
	var nodeStash = [0];
	$.defineProperty(Node.prototype, 'nodeId', {
		get: function() {
			if (this._nodeIdValue_!==undefined) {
				return this._nodeIdValue_;
			} else {
				var id = nodeStash.length;
				nodeStash.push(this);
				$.defineProperty(this, '_nodeIdValue_', {value: id, enumerable: false});
				return id;
			}
		}
	});

	$.defineMethod(Node.prototype, 'getElementByNodeId', function(id) {
		return nodeStash[id];
	});
	 $.defineMethod(Node.prototype, 'hasNodeId', function() {
		 return this._nodeIdValue_ !== undefined;
	 });
})();


/**
 * @name		removeChilds
 * @description Remove all childs
 * @returns		undefined
 */
$.defineMethod(Node.prototype, 'removeChilds', function() {
	var children = this.childNodes;
	while(children.length) {
		if (children[0] && children[0].parentNode) {
			children[0].parentNode.removeChild(children[0]);
		} else {
			break;
		}
	}
});


/**
 * @name		insertAfter
 * @description Inserts the specified node after a reference element as a child of the current node.
 * @returns 	undefined
 */
$.defineMethod(Node.prototype, 'insertAfter', function(newElement, referenceElement) {
	var parent = this;
	var nextNode = referenceElement.nextSibling;
	if (nextNode) {
		parent.insertBefore(newElement, nextNode);
	} else {
		parent.appendChild(newElement);
	}
});


/**
 * @name		appendTo
 * @description Inserts the current node into a reference node.
 * @returns 	undefined
 */
$.defineMethod(Node.prototype, 'appendTo', function(parent) {
	parent.appendChild(this);
});


/**
 * @name		isChildOf
 * @description Inserts the current node into a reference node.
 * @returns 	undefined
 */
$.defineMethod(Node.prototype, 'isChildOf', function(rootNode) {
	var p = this, b = document.body;
	while(p && p!=rootNode && p!=b) p = p.parentNode;
	//return (!(!p || p == b));
	return (p && p != b);
});


/**
 * @name			_rp_
 * @description 	Создает системное свойство _rp_ у всех нод, в которые можно сохранять любые данные
 * */
Object.defineProperty(Element.prototype, '_rp_', {
	get: function() {
		var el = this;
		if (!el._rp_data_) {
			Object.defineProperty(el, '_rp_data_', {
				value: {events:{}},
				configurable: true,
				enumerable: false
			});
		}
		return el._rp_data_;
	},
	configurable: true,
	enumerable: false
});


/**
 * @name		animation
 * @description Анимирует ноду через CSS3
 * @param		cfg
 * @param		cfg.transition	css3 transition property
 * @param		cfg.from	hash или className
 * @param		cfg.to		hash или className
 * @returns 	undefined
 */
$.defineMethod(Element.prototype, 'animation', (function () {		// cfg = {transition:'', from: {}, to: {}, callback:fn} - from и to могут быть либо хэшами стилей, либо классами
	var transitionSupported = 'transition' in document.createElement('div').style;
	// http://www.w3.org/TR/css3-transitions/#properties-from-css-
	var animatableProps = {'backgroundColor':1,'backgroundPosition':1,'borderBottomColor':1,'borderBottomWidth':1,'borderLeftColor':1,'borderLeftWidth':1,'borderRightColor':1,'borderRightWidth':1,'borderSpacing':1,'borderTopColor':1,'borderTopWidth':1,'bottom':1,'clip':1,'color':1,'fontSize':1,'fontWeight':1,'height':1,'left':1,'letterSpacing':1,'lineHeight':1,'marginBottom':1,'marginLeft':1,'marginRight':1,'marginTop':1,'maxHeight':1,'maxWidth':1,'minHeight':1,'minWidth':1,'opacity':1,'outlineColor':1,'outlineWidth':1,'paddingBottom':1,'paddingLeft':1,'paddingRight':1,'paddingTop':1,'right':1,'textIndent':1,'textShadow':1,'top':1,'verticalAlign':1,'visibility':1,'width':1,'wordSpacing':1,'zIndex':1};

	// Моментальная анимация выставляет сначала стили до, потом стили после на случай, если в стилях "до" были какие-то непересекающиеся с "после" стили
	var instantTransition = function(node, cfg) {
		console.log('[bind.animation] Run instantTransition.');
		cfg.from.forEach(function(value, prop) {
			node.style[prop] = value;
		});
		cfg.to.forEach(function(value, prop) {
			node.style[prop] = value;
		});
		cfg.callback && cfg.callback();
	};

	var setRules = function(node, css, animatable) {		// если animatable, то ставит только анимируемые, если false - то только не анимируемые, если не передать - то все
		if (typeof css == 'object') {
			css.forEach(function(value, prop) {
				if ( (animatable && animatableProps[prop]) || (!animatable && !animatableProps[prop]) || animatable === undefined ) node.style[prop] = value;
			});
		} else {
			node.classList.add(css);				//Если в to указан имя класса, который содержит в себе свойства
		}
	};

	// Если браузер не поддерживает анимацию, то просто ставим конечные стили и вызываем колбэк
	if (!transitionSupported) {
		console.warn('[bind.animation] css animation not supported.');
		return function(){
			var node = this;
			instantTransition(node, cfg);
		}
	} else return function(cfg) {
		var node = this;
		// Моментальная анимация теоретически возможна, если from и to - хэши стилей. Если передали класс, то пропускать нельзя никак
		var skipAnimation = typeof cfg.from == 'object' && typeof cfg.to == 'object';

		// Анимацию можно пропустить если в итоговых стилях нет анимируемых свойств, ИЛИ если юзер идиот и он в from и to указал совпадающие значения у анимируемых свойств
		skipAnimation && cfg.to.forEach(function(value, prop) {
			if (animatableProps[prop] && value != cfg.from[prop]) skipAnimation = false;
		});

		if (skipAnimation) {
			instantTransition(node, cfg);
		} else {
			node.style.transition = "none";
			setRules(node, cfg.from);
			setTimeout(function() {
				node.style.transition = cfg.transition;
				// Запускаем анимацию
				setTimeout(function() {
					// не надо вешать эвентлистенеры, если на них нечего вешать (нет колбэка и неанимируемых атрибутов)
					// определяем наличие неанимируемых css правил в конечных стилях
					var hasNonAnimatable = false;
					typeof cfg.to == 'object' && cfg.to.forEach(function(value, prop) {
						if (!animatableProps[prop]) hasNonAnimatable = true;
					});

					var transitionEventId;
					if (cfg.callback || hasNonAnimatable) {
						var transitionEventId = node.addEventListener('transitionend', function(e) {
							node.removeEventListener('transitionend', transitionEventId);
							setRules(node, cfg.to, false);
							if (typeof cfg.from == 'string') node.classList.remove(cfg.from);
							cfg.callback && cfg.callback();
						}, false);
					}

					setRules(node, cfg.to, true);

				}, 40);
			},1);


		}
	};
})());

/**
 * @name 		createDocumentFragment
 * @description Расширяет нативный createDocumentFragment, позволяя в аргументе передать html разметку, которая окажется во фрагменте
 * @returns 	{DocumentFragment}
 */
(function() {
	var createFragment = document.createDocumentFragment;
	var reTag = /<\s*([\w\:]+)/;
	$.defineMethod(document, 'createDocumentFragment', function(frag) {
		if (frag) {

			if ($.isNodeList(frag)) {
				df = createFragment.call(document);
				frag.forEach(function(node) {
					df.appendChild(node);
				})
			} else {

				frag += "";
				var tagWrap = {
					option: ["select"],
					tbody: ["table"],
					thead: ["table"],
					tfoot: ["table"],
					tr: ["table", "tbody"],
					virtualfragment: ["table", "tbody"],
					td: ["table", "tbody", "tr"],
					th: ["table", "thead", "tr"],
					legend: ["fieldset"],
					caption: ["table"],
					colgroup: ["table"],
					col: ["table", "colgroup"],
					li: ["ul"]
				};

				var master = document.createElement("div");
				for (var param in tagWrap) {
					if (tagWrap.hasOwnProperty(param)) {
						var tw = tagWrap[param];
						tw.pre = param == "option" ? '<select multiple="multiple">' : "<" + tw.join("><") + ">";
						tw.post = "</" + tw.reverse().join("></") + ">";
					}
				}

				var match = frag.match(reTag),
					tag = match ? match[1].toLowerCase() : "",
					wrap, i, fc, df;
				if (match && tagWrap[tag]) {
					wrap = tagWrap[tag];
					master.innerHTML = wrap.pre + frag + wrap.post;
					for (i = wrap.length; i; --i) master = master.firstChild;
				} else {
					master.innerHTML = frag;
				}
				df = createFragment.call(document);
				while (fc = master.firstChild) df.appendChild(fc);
			}
		} else {
			df = createFragment.call(document);
		}
		return df;
	});
})();


/**
 * @name addEvent
 * return eventId
 */

(function() {
	var addEventListener			= Node.prototype.addEventListener;
	var removeEventListener			= Node.prototype.removeEventListener;
	var beforeClicks = {};	// {nodeId: fn}
	var clickout = [];		// массив объектов в формате {node, nodeList, one, fn}
	var clickoutIdx = {};	// {fnId: clickout_num}

	document.addEventListener('click', function(e) {
		var el = e.target || e.srcElement;
		var coCfg, num = clickout.length;
		do {
			coCfg = clickout[num];
			num--;
		} while (num >= 0 && !coCfg);
		if ( !coCfg ) return;

		var run = function() {
			coCfg.fn();
			if ( coCfg.one !== false ) {
				//var id = clickout.length-1;
				delete clickout[num+1];		//удаляем последний элемент, но у следующего пуша индекс должен увеличиться, поэтому не pop()
				delete clickoutIdx[coCfg.fnId];
			}
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
			return false;
		};

		if (coCfg.nodeList) {
			var isOut = true;
			coCfg.nodeList.forEach(function(node) {
				if ( el.isChildOf(node) ) {
					isOut = false;
					return false;
				}
			});
			if (isOut) return run();
		} else {
			if ( !el.isChildOf(coCfg.node) ) {
				return run();
			}
		}
	}, true);

	/**
	 * @name addEventListener
	 * @description Добавляет обработчик события
	 * @params eventName
	 * @params fn || fnId
	 * @params useCapture [option]
	 * @return fnId	Возвращает уникальный id функции
	 */


	$.defineMethod(Element.prototype, 'addEventListener', function(eventName, handler, useCapture, cfg) {
		var fn, fnId, node = this;
		if ($.isFunction(handler)) {
			fn = handler;
			fnId = handler.fnId;
		} else if ($.isNumber(handler)){
			fnId = handler;
			fn = Function.getFunctionByFnId(fnId);
		}

		if (eventName == 'beforeClick') {
			beforeClicks[node.nodeId] = fn;
			var originOnclick = node.onclick;
			node.onclick = function(e) {
				var res = fn();
				if (res===false) {
					e.stopPropagation();
					e.stopImmediatePropagation();
				}
				node.blur();
			};
			if (originOnclick) node.addEventListener('click', originOnclick);
		} else if (eventName == 'clickout') {
			clickout.push({node: node, fn: fn, nodeList: cfg.nodeList, one:cfg.one});
			clickoutIdx[fnId] = clickout.length - 1;
		} else if (eventName == 'ready') {
			alert(1);
		} else {
			addEventListener.call(node, eventName, fn, useCapture);

			//console.log('node._rp_:', node._rp_);
			//console.log('eventName:', eventName);


			if (eventName == 'sort') return;
			if (!node._rp_.events.hasOwnProperty(eventName)) node._rp_.events[eventName] = [];
			//if (!$.isArray(node._rp_.events[eventName])) node._rp_.events[eventName] = [];
			//console.log('rp_events:', node, eventName, node._rp_.events[eventName]);
			//console.log('ifpoush: ', node._rp_.events[eventName].push, node._rp_.events[eventName]);

			if (node._rp_.events[eventName].push) {
				node._rp_.events[eventName].push(fnId);
			} else {
				//console.log('cant create events', node._rp_.events[eventName]);
				node._rp_.events[eventName].push(fnId);
			}
			//TODO нужно сделать групID, чтобы грохать только часть евентов одного типа (4й параметр)
		}
		return fnId;
	});



	/**
	 * @name removeEventListener
	 * @description Удаляет обработчик события
	 * @params eventName
	 * @params fn || fnId
	 * @params useCapture [option]
	 * @return true|false	Возвращает true если успешно удалил, false если fn или fnId отсутвует
	 */

	$.defineMethod(Element.prototype, 'removeEventListener', function(eventName, fn, useCapture) {
		var node = this;
		//if ($.isNumber(eventName) && !fn) fn = eventName; //TODO: можно не принимать имя евента, а сохранять его при добавлении евента
		if (fn) {
			if (eventName == 'clickout') {
				if (fn) {
					if ($.isFunction(fn)) fn = fn.fnId;
					var id = clickoutIdx[fn];
					delete clickout[id];
					delete clickoutIdx[fn];
				} else { 	// очистка всех хэндлеров кликаута
					clickout = [];
					clickoutIdx = {};
				}
			} else {
				if ($.isNumber(fn)) fn = Function.getFunctionByFnId(fn);
				removeEventListener.call(node, eventName, fn, useCapture);
			}
		} else {
			if ( !node._rp_.events[eventName] ) return;
			node._rp_.events[eventName].forEach(function(fnId, i) {
				removeEventListener.call(node, eventName, Function.getFunctionByFnId(fnId), useCapture);
			});
			delete node._rp_.events[eventName];
		}
	});


	/**
	 * @name clearEventListeners
	 * @description Удаляет все обработчики в заданном событии. Если имя события не задано - удаляет все обработчики всех событий
	 * @params event
	 */
	$.defineMethod(Element.prototype, 'getEventListeners2', function(event) {

	});
})();

$.defineProperty(Node.prototype, 'cumulativeHeight', {
	get: function () {
		var elm = this;
		var cs = window.getComputedStyle(elm, null);
		return elm.offsetHeight + parseInt(cs.getPropertyValue("margin-top")) + parseInt(cs.getPropertyValue("margin-bottom"));
	},
	set: $.noop
});

$.defineProperty(Node.prototype, 'cumulativeWidth', {
	get: function () {
		var elm = this;
		var cs = window.getComputedStyle(elm, null);
		return elm.offsetWidth + parseInt(cs.getPropertyValue("margin-left")) + parseInt(cs.getPropertyValue("margin-left"));
	},
	set: $.noop
});

$.defineMethod(Node.prototype, 'cumulativeOffsetLeft', function () {
	var elm = this;
	var offset = elm['offsetLeft'];
	while (elm.offsetParent != null){
		elm = elm.offsetParent;
		offset = offset + elm['offsetLeft'];
	}
	return offset;
});

$.defineMethod(Node.prototype, 'cumulativeOffsetTop', function () {
	var elm = this;
	var offset = elm['offsetTop'];
	while (elm.offsetParent != null){
		elm = elm.offsetParent;
		offset = offset + elm['offsetTop'];
	}
	return offset;
});


$.onReady = (function() {
	var readyBuffer = [];
	document.addEventListener("DOMContentLoaded", function() {
		readyBuffer.forEach(function(handler){handler();});
		readyBuffer = [];
	});
	return function(handler) {
		if (document.readyState == 'interactive' || document.readyState=='complete') {
			handler();
		} else {
			readyBuffer.push(handler);
		}
	};
})();


/*==============================================================================*/
/* ENV
 /*==============================================================================*/
/**
 * @class Класс для работы с переменными окружения
 * @description Если в проекте требуется где-то хранить данные, котор
 *
 * переменные можно объявлять из шаблонов
 * в них хранятся локализации
 *
 * @version 0.1
 */

if (!window.ENV) window.ENV = {};

/**
 * @name get
 * @memberOf ENV
 * @description Вытаскивает часть объекта ENV по пути. Если передать пустую строку, вернет весь ENV
 * @param {string} key - Ключ, куда пишем
 * @returns {object} Объект
 */
$.defineMethod(ENV, 'get', Object.prototype.getPropertyByPath);

/**
 * @name set
 * @memberOf ENV
 * @description Записывает в ENV
 * @param {object} Что записать в ENV.
 */
$.defineMethod(ENV, 'set', Object.prototype.mergePropertyByPath);


ENV.set('browser', $.browser);
ENV.set('system.route', {});


})();