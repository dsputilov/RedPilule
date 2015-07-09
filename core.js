"use strict";

/*==============================================================================*/
/* Ferna core methods
/*==============================================================================*/
/*
$.when([scope], fn1, fns[], fnN ... ).then(function([ret1, ret2, ..., retN]){ ... });
scope - необязательный параметр
выполняет асинхронные функции, а полученные ответы выстраивает в порядке вызова и отправляет в качестве аргумента функции, переданной в then.
все функции запускатся в контексте scope (указывается опционально первым аргументом, если не задан - то выполняется в глобальном контексте)
* */

$.when = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	var scope = null;

	// Вычленяем scope из списка аргументов
	if ( !$.isArray(args[0]) && !$.isFunction(args[0]) ) {
		scope = args[0];
		args.shift();
	}

	var remaining, then, responses = [];

	// Оставшиеся аргументы, являющиеся функциями, пишем в массив
	var whens = [args].toFlatArray().filter(function(fn){return $.isFunction(fn);});
	if (whens.length) {
		var l = whens.length;
		then = null;
		remaining = l;

		for (var i = 0; i < l; i++) {
			var end = (function(i) {
				return function(data) {
					responses[i] = data;
					remaining--;
					if (!remaining && then) then.call(scope, responses);
				}
			})(i);

			whens[i].call(scope, end);
		}
	} else {
		remaining = 0;
	}

	return {
		then: function(fn) {
			if (remaining) {
				then = fn;	// Если одна из when ушла в асинхрон, то просто присваиваем
			} else {
				fn.apply(scope, responses);	// Если все оказались синхронными, то просто вызываем then
			}
		}
	};
};



$.Stepper = $.Class({
	constructor: function(self, obj, props, checkHandler) {
		self.private.propsOwner = obj;
		self.private.checkHandler = checkHandler;
		self.private.props = props.split('/');
	},
	public: {
		check: function(self) {
			var stateCase = self.private.props.map(function(propName) {
				return self.private.propsOwner[propName];
			}).join('/');
			self.private.checkHandler(stateCase);
		}
	},
	private: {
		propsOwner:	undefined,
		props: []
	}
});

/**
 * @class	Transaction	Обьединяет множество функций в одну транзакцию
 * @constructor	{cfg}
 * @return		{Object}
 *
 * Методы
 * 	include
 *	push
 *	get
 *	clear
 *	remove
 *	run
*/

$.Transaction = $.Class({
	constructor: function(self, cfg) {
		//;;;console.info(self);
		$.defineProperty(self.public, 'length', {
			get: function() {
				return self.private.length;
			},
			enumerable: true
		});
	},
	public: {
		include: function(self, transaction, data, provider) {
			/*
			if ( !transaction || !(transaction instanceof self.public) ) {
				_throw_(new Error('Включать в транзакцию можно только друге объекты транзакций'));
				return;
			}
			*/
			var provider = self.private.getProvider(provider);
			//console.log('include transaction:', provider, self);
			var uid = Number.uid(); //provider.length;
			provider.stash[uid] = {inc: transaction, data: data};
		},

		/*
		 * @method	get			Возвращает {fn, scope, data} по uid
		 * @param	uid			uid функции, который был выдан при пуше
		 * @returns {*}
		 */
		get: function(self, fnId) {
			var cfg = self.private.fnIdx[fnId];
			return cfg.provider.stash[cfg.num];
		},

		/*
		 * @method	push		Пушит в стек функцию, которая запустится при старте транзакции
		 * @param	fn			Функция
		 * @param	scope		Контекст, в котором функция должна выполнится
		 * @param	data		Данные, которые будут отправлены при вызове функции
		 * @param	provider	[optional]	Имя стека функций. Используется для группировки функций внутри одной транзакции. Если не задано - используется стек 'base'.
		 * @returns {number}	Возвращает id функции в стеке
		 */
		push: function(self, fn, scope, data, provider) {
			var fnId;
			if ( $.isArray(fn) ) {
				fn.forEach(function(value) {
					self.public.push(value, scope, data, provider);		// Если массив, то пушим по очереди каждую функцию
				});
				return;
			} else if ( $.isNumber(fn) ) {
				fnId = fn;
				fn = Function.getFunctionByFnId(fnId);
			} else if ( $.isFunction(fn) ) {
				//fnId = fn.fnId;
			} else {
				;;;console.info(fn, scope, data);
				_throw_(new Error('Transaction.push must be with arguments (fn, scope, data[], provider) '));
				return;
			}

			provider = self.private.getProvider(provider);
			var uid = provider.length; //Number.uid();
			provider.stash[uid] = {fn: fn, fnId:fnId, scope: scope, data: data!==undefined ? data : []};
			provider.length++;
			self.private.length++;
			self.private.uidIdx[uid] = provider;
			return uid;
		},

		/*
		 * @method	clear		Очищает стек вызовов. Если имя стека не задано - очищается стек 'base'
		 * @param	provider	[optional]
		 */
		clear: function(self, provider) {
			self.private.getProvider(provider).stash = {};
		},

		/*
		 * @method	remove		Удаляет функцию из транзакции по ее uid, который был выдан при пуше
		 * @param	uid
		 */
		remove: function(self, uid) {
			var provider = self.private.uidIdx[uid];
			if ( provider && provider.stash[uid] ) {
				delete provider.stash[uid];
				delete self.private.uidIdx[uid];
				provider.length--;
				self.private.length--;
			}
		},

		/*
		 * @method	run			Запускает транзакцию, вызывая все функции в стеке. Если имя стека не указано - запускает все функции во всех стеках.
		 * @param	cfg
		 * @param	newdata
		 * @param	provider
		 * @returns	{Array}
		 */
		run: function(self, cfg, newdata) {
			if ( !cfg ) cfg = {};
			var provider = cfg.provider;
			var ret = [];

			var run = function(provider, newdata) {
				if (newdata===undefined) newdata = [];
				var res = provider.stash.map(function(c) {
					var data = c.data ? c.data.concat(newdata) : newdata;
					if (c.fn) {
						return c.fn.apply(c.scope, data);
					} else {
						return c.inc.run(cfg, data);
					}
				});
				ret = ret.concat(res);
			};

			if ( provider ) {
				provider = self.private.providers[provider];
				//console.info('provider', provider);
				if ( !provider ) return;
				run(provider, newdata);
			} else {
				self.private.providers.forEach(function(provider) {
					run(provider, newdata);
				});
			}
			return ret;
		}
	},
	private: {
		providers: {
			system:	{ stash: {}, length: 0 },
			base:	{ stash: {}, length: 0 }
		},
		length: 0,
		getProvider: function(self, provider) {
			if ( provider ) {
				if ( !self.private.providers[provider] ) self.private.providers[provider] = {stash:[], length:0};
				return self.private.providers[provider];
			} else {
				return self.private.providers.base;
			}
		},
		uidIdx: {}
	}
});


/**
 *	@class	$.MTM	Создает базу, по которой можно делать выборки данных "Многие ко многим"
 */

$.MTM = $.Class({
	constructor: function() {

	},
	chainDisabled: ['get'],
	public: {
		get:	function(self, key) {
			return self.private.data[key];
		},
		add: function(self, key1, key2) {
			if (!self.private.data[key1]) self.private.data[key1] = [];
			if (!self.private.data[key2]) self.private.data[key2] = [];


			self.private.data[key1].push(key2);
			self.private.data[key2].push(key1);

			var keys1 = self.public.get(key1).join(',').split(',');
			var keys2 = self.public.get(key2).join(',').split(',');

			//console.log('[add] '+key1+':', keys1, '; '+key2+':', keys2);

			for (var i=0; i<keys1.length; i++) {
				var val = keys1[i];
				if (val != key1 && val!=key2) {
					self.private.data[val].push(key2);
					self.private.data[key2].push(val);
				}
			}

			for (var i=0; i<keys2.length; i++) {
				var val = keys2[i];
				if (val != key1 && val!=key2) {
					self.private.data[val].push(key1);
					self.private.data[key1].push(val);
				}
			}
		},
		remove: function() {

		}
	},

	private: {
		data: {}
	}
});


/**
* Нужен, чтобы находить данные по маске. Используется, например, для навешивания эвентов на пути в модели и последующегго их извлечния.
* '*' - соответствует любому значению звена в пути
* '**' - соответствет любому хвосту
* Надо написать поподробнее, что туда можно записывать и для чего еще можно использовать

	var list = $.Dispatcher({
		create: function () {
			return [];
		},
		add: function(arr, value) {
			arr.push(value);
		}
	});

	Пример использования:

	a.set('a.b.c', [10,5]);
	a.set('a.b.c', 20);
	a.set('a.b.*', 6);
	a.set('*', 100);
	a.set('a.**', 200);

	a.get('a.b.c')	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}'
	a.get('a.*.*')	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}'
	a.get('a.**')	== '{"a.b.c":[[10,5],20],"a.b.*":[6],"a.**":[200]}'
	a.get('**')		== '{"a.b.c":[[10,5],20],"a.b.*":[6],"*":[100],"a.**":[200]}'
	a.get('a.b.c.d')== '{"a.**":[200]}'
	a.get('x.y.z')	== '{}'
	a.get('x')		== '{"*":[100]}'

 	a.get('a.b.c')

 /// Пареметр relevant
    Если не задан, то возвращает все совпадения.
  Если задан, то только один наиболее релевантный результат. Релевантность среди подходящих шаблонов оценивается по количеству совпадений до * слева или справа.
	При поиске наиболее релевантного не может быть wildcard'ов.
 Поиск слева направо. Запрос a.b.c, варианты:
 a.b.* - самый релевантный, потому что у него слева направо наиболее долго совпадали символы а не звездочки
 a.**
 a.*.c
 a.b.** - не тождественный по релевантности лидеру (не совпадает по длине)

 справа налево то же самое, только невозможно a.** - может быть только **.a



 */
$.Dispatcher = $.Class({
	constructor: function(self, handlers, relevant) {	// relevant = left || right
		self.private.create = (handlers && handlers.create) || function() { return []; };
		self.private.add = (handlers && handlers.add) || function(arr, val) { arr.push(val); };
		self.private.get = (handlers && handlers.get) || function(val) { return val; };
		self.private.relevant = relevant;
	},
	chainDisabled: ['get'],
	public: {
		set: function(self, path, val) {
			var data= self.private.data;
			var idx	= self.private.idx;
			var rel = self.private.relevant;

			if (path === '' || path == '~') {
				if (self.private.rootData === undefined) self.private.rootData = self.private.create();
				self.private.add(self.private.rootData, val);
			} else {
				if (path[0] =='~') path = path.substr(2);
				var splitPath = path.split('.');
				if (rel == 'right') splitPath.reverse().join('.');

				for (var i = 0, l = splitPath.length - 1; i < l; i++) {
					if (splitPath[i] == '**') _throw_(new Error('Маркер широкого соответствия ** не может находится на этом месте:' + path));
				}
				path = splitPath.join('.');

				if (!data.hasOwnProperty(path)) {
					data[path] = self.private.create();
					idx[path] = splitPath;
					if (path.indexOf('*') != -1) self.private.wildcards.push(path);
				}
				self.private.add(data[path], val);
			}
		},
		remove: function(self, path){
			delete self.private.data[path];
			if (path.indexOf('*') != -1) {
				delete self.private.idx[path];
				self.private.wildcards.splice(self.private.wildcards.indexOf(path), 1);
			}
			if (path == '~') self.private.rootData = undefined;
		},
		get: function(self, path, all) {	// all - true / false. Если true, то возвращает список подходящих по релевантности
			var rel = self.private.relevant;

			if (path === '' || path === '~') {
				if (!rel) {
					return self.private.rootData ? {'~': self.private.get(self.private.rootData)} :  {};
				} else {	// эта ветка не тестировалась :) тильда не нужна для релевантносли в этих режимах
					if (self.private.rootData) {
						return all ? [self.private.get(self.private.rootData)] : self.private.get(self.private.rootData);
					} else {
						return all ? [] : undefined;
					}
				}
			}
			if (path[0] =='~') path = path.substr(2);

			var idx = self.private.idx;
			var data = self.private.data;

			var original = path.split('.');
			var oLen = original.length;

			// возвращает все подходящие варианты, без учета порядка (релевантности).
			// Запросом может быть как селектор так и просто путь. Селектор по селектору она тоже ищет
			if (!rel) {
				var results = {};
				var checklist;

				if (path.indexOf('*') == -1) {
					if (data.hasOwnProperty(path)) {
						results[path] = data[path];
					}
					checklist = self.private.wildcards;
				} else {
					checklist = Object.keys(data);
				}

				for (var i = 0, l = checklist.length, key, pattern; key = checklist[i], pattern = idx[key], i < l; i++) {
					var match = undefined;

					for (var j = 0, o, p; o = original[j], p = pattern[j], j < oLen; j++) {
						if ( p && (o === '**' || p === '**') ) { match = true; break; }
						if ( !( p && (o === '*' || p === '*' || o === p) ) ) { match = false; break; }
					}

					if ( match || (match === undefined && pattern.length == oLen) ) results[key] = data[key];
				}
				return self.private.get(results);
			}
			// ветка поиска наиболее релевантного значения по маске
			// так же может вернуть все подходящие значения в порядке релевантности (справа и слева).
			else {
				// Быстрая проверка - может быть по этому ключу уже что-то есть, тогда не надо искать
				if (data.hasOwnProperty(path) && !all) {
					return self.private.get(data[path]);
				}
				if (rel == 'right') { original = original.reverse(); }

				var selectors = Object.keys(idx);
				if (selectors.length == 0) {
					return;
				}

				var lookupIdx = [];
				var nextLookupIdx = [];
				var selectorScores = [];

				for (var i = 0, l = selectors.length; i < l; i++) {
					var selector = idx[selectors[i]];
					selectorScores[i] = 0;
					if (selector.length == oLen || selector.length <= oLen && selector[selector.length - 1] == '**') {
						lookupIdx.push(i);
						selectorScores[i] = 1;
					}
				}

				for (var depth = 0, queryPart; queryPart = original[depth]; depth++) {	// [original].forEach(function(queryPart))
					nextLookupIdx = [];
					for (var i = 0, l = lookupIdx.length, selectorPart, index; i < l; i++) {
						index = lookupIdx[i];
						selectorPart = idx[selectors[index]][depth];

						if (selectorPart == queryPart) {
							selectorScores[index] = (selectorScores[index] << 1) + 1;
							nextLookupIdx.push(index);
						} else if (selectorPart == '*' || selectorScores[index] < 0) {
							selectorScores[index] = selectorScores[index] << 1;
							nextLookupIdx.push(index);
						} else if (selectorPart == '**') {
							selectorScores[index] = (selectorScores[index] << 1) * -1;
							nextLookupIdx.push(index);
						} else {selectorScores[index] = 0;}
					}
					if (nextLookupIdx.length < 1) break;	// Дальше искать смысла нет, надо анализировать
					lookupIdx = nextLookupIdx;
				}

				for (var i = 0, l = selectorScores.length; i < l; i++) {
					if (selectorScores[i] < 0) selectorScores[i] *= -1;
				}

				// Теперь надо сформировать ответ
				if (!all) {
					var topRelevant = [], maxRelevance = 0;
					for (var i = 0, l = selectorScores.length, score; score = selectorScores[i], i < l; i++) {
						if (score > maxRelevance) { topRelevant = [i]; maxRelevance = score; }
						else if (score == maxRelevance) { topRelevant.push(i); }
					}
					if (maxRelevance == 0) {
						return;
					}

					if (topRelevant.length == 1) { return self.private.get(data[selectors[topRelevant[0]]]); }
					else {
						for (var i = 0, l = topRelevant.length, selector; selector = selectors[topRelevant[i]], i < l; i++) {
							if (idx[selector][idx[selector].length - 1] == '*') return self.private.get(data[selector]);	// a.* более релевантна, чем a.**
						}
					}
					return self.private.get(data[selectors[topRelevant[0]]]);	// непонятно, зачем нужно, может и не нужно...
				}
				else {	// список самых релевантных
					var scoreToIdxs = {};	// создаем хэш, где ключи - релевантности, а значения - индексы селекторов
					for (var i = 0, l = selectorScores.length; i < l; i++) {
						var score = selectorScores[i];
						if (score > 0) {
							if (!scoreToIdxs.hasOwnProperty(score)) scoreToIdxs[score] = [i];
							else scoreToIdxs[score].push(i);
						}
					}
					var sortedScores = Object.keys(scoreToIdxs).sort(function(a, b) { return b - a; });
					var results = [];
					for (var i = 0, l = sortedScores.length; i < l; i++) {
						var idxs = scoreToIdxs[sortedScores[i]];
						if (idxs.length == 1) {
							results.push(self.private.get(data[selectors[idxs[0]]]));
						}
						else {	// sortedScores[i].length == 2 другого не дано
							var selector1 = selectors[idxs[0]], selector2 = selectors[idxs[1]];
							if (selector1.slice(-2) == '**') {	// менее приоритетный если просто *, или не важно если **
								results.push(self.private.get(data[selector2]));
								results.push(self.private.get(data[selector1]));
							} else {
								results.push(self.private.get(data[selector1]));
								results.push(self.private.get(data[selector2]));
							}
						}
					}
					return results;
				}
			}
		},
		destroy: function(self) {
			self.private.create = undefined;
			self.private.add = undefined;
			self.private.get = undefined;

			self.private.data = {};
			self.private.idx = {};
			self.private.wildcards = [];
		}
	},
	private: {
		create:		undefined,
		add:		undefined,
		get:		undefined,

		data:		{},		// реальные данные по пути;
		idx:		{},		// кэш, {'a.b.*': ['a', 'b', '*']};
		wildcards:	[],		// массив нестатических селекторов ['a.b.*', *.*, ...];
		rootData:	undefined
	}
});



/*
может быть не нужен совсем

$.deferredObject = function(obj, scope) {
	var methods = {}.extendByClone(obj);
	var deffer = {};
	var queue = [];
	obj.forEach(function(fn, methodName) {
		if ( $.isFunction(fn) ) {
			deffer[methodName] = function() {
				queue.push({
					//filenoScope	:this.__fileno__ ? this : null,
					handler		:fn,
					params		:Array.prototype.slice.call(arguments, 0)
				});
			};
		}
	});
	obj.extendByClone(deffer);
	var ret = {
		publish: function() {
			obj.extendByClone(methods);
			ret.execute();
		},
		execute: function() {
			queue.forEach(function(method) {
				method.handler.apply(method.filenoScope ? method.filenoScope : scope, method.params);
			});
		}
	};
	return ret;
};
*/



/**
 Класс $.Transfer используется для обмена данными с сервером. Общая схема использования:

 var loader = $.Transfer({
	url: 		string || [string],	// массив url, которые надо загрузить
	data: 		{},			// В режиме post делается JSON.stringify, в режиме get формируется query string из скалярных свойств объекта, остальные игнорируются
	method:		"post",		// post, get

	onload:		fn(data),	// выполняется после загрузки всех урлов.
	onerror:	fn			// вызывается, если сервер отдал любой код ответа кроме 200.
	ontimeout:	fn() {return action;}		// вызывается, если произошел таймаут ожидания ответа сервера. В ответ функция должна сказать что делать с процессом ожидания: action: 2 - остановить, 1 - подождать еще столько же, 0 - ждать пока не придет ответ.
											// если таймаут произошел и юзеру показали окошко, а пока он думал, пришел ответ от сервера, то нужно в onload и onerror прописывать функционал скрывания такого окошка.
	onprogress: fn() отражает процесс отправки файла на сервер через POST ИЛИ ход загрузки пачки GET запросов

	scope:		{},			// скоуп, в котором нужно вызвать onload, onerror, ontimeout
	type:		'json',		// text|template|css|script|json	[default text] тип возвращаемых данных
	timeout:	100000		// сколько ждать ответа от сервера. Если ontimeout не задано, то просто обрубается ожидание.
});

 Методы
send(data)
  инициирует передачу данных в соответствии с параметрами инициализации $.Transfer

 Работает в 2 разных режимах: Get и Post

 1) Get позволяет грузить много файлов одновременно (но все с одинаковыми остальными параметрами), запросы кэшируются, но метод send в этом режиме игнорирует аргументы
 Если в объект передано много урлов, то все они грузятся асинхронно, а после полной загрузки вызываются callback для каджого ответа в том же порядке, в каком шли URL в массиве.

 2) Post позволяет делать только один запрос за 1 раз, и он не кэшируется, зато можно один раз инициализировать объект, а потом вызывать метод send с параметром data

abort() сбрасывает все запросы, находящиеся в ожидании у данного объекта. Если файл грузится через GET в другом объекте или уже в кэше, то abort не сбросит такую загрузку
*/

$.Transfer = $.Class({
	constructor: function(self, cfg) {
		// Проверяем, чтобы в URL не попала всякая шняга
		var urls = cfg.url
			.toFlatArray()
			.filter(function(url) {return $.isString(url);})
			.unique()
			.map(function(url) {
				url = url.replace(/\{\{([^\}]+)\}\}/g, function(_, value) {
					return eval(value.trim().replace('E.','ENV.'));
				});
				return url;
				//return url.indexOf('http://') == -1 ? ENV.get('uiDomain') + url.applyENV() : url;}
			}); // TODO убрать костыль

		// аргументы на соответствие типам
		if ( cfg.onload && !$.isFunction(cfg.onload) )			_throw_(new Error('$.Transfer: в качестве onload передана не функция: ' + cfg.onload));
		if ( cfg.onerror && !$.isFunction(cfg.onerror) )		_throw_(new Error('$.Transfer: в качестве onerror передана не функция: ' + cfg.onerror));
		if ( cfg.ontimeout && !$.isFunction(cfg.ontimeout) )	_throw_(new Error('$.Transfer: в качестве ontimeout передана не функция: ' + cfg.ontimeout));
		if ( cfg.onprogress && !$.isFunction(cfg.onprogress) )	_throw_(new Error('$.Transfer: в качестве onprogress передана не функция: ' + cfg.onprogress));
		if ( cfg.scope && !$.isObject(cfg.scope) )				_throw_(new Error('$.Transfer: в качестве scope передан не объект: ' + cfg.scope));
		if ( !/text|template|css|script|json/i.test(cfg.type) )	_throw_(new Error('$.Transfer: в качестве type передано недопустимое значение: ' + cfg.type));

		// Инициализируем экземпляр класса
		self.private.urls 		= urls;
		self.private.data		= ($.isHash(cfg.data) && cfg.data) || {};
		self.private.method 	= /^post$/i.test(cfg.method) ? 'POST' : 'GET';

		self.private.onload		= cfg.onload 	 	|| $.noop;		//Вызывается когда все файлы из списка прогрузились.
		self.private.onerror	= cfg.onerror		|| $.noop;		//Вызывается в случае если на любой из файлов сервер вернул ошибку. Загрузка очереди останавливается.
		self.private.ontimeout	= cfg.ontimeout	 	|| $.noop;		//Вызывается если любой из файлов из списка не успел загрузиться за определенное время
		self.private.onprogress	= cfg.onprogress 	|| $.noop;		//Для загрузки файла: Вызывается после загрузки каждого файла с параметрами (procent), при аплоаде файла: (procent)

		self.private.scope 		= cfg.scope		 || null;
		self.private.type 		= (cfg.type		 || 'text').toLowerCase();
		self.private.timeout	= +cfg.timeout	 || 0;
	},

	public: {
		send: function(self, data) {
			$.Transfer.onbeforeload.run();

			if (self.private.urls.length == 0) {
				$.Transfer.onload.run();
				self.private.onload.call(self.private.scope);
				return;
			}

			data = data || self.private.data;

			if (self.private.method == 'GET') {
				if (self.private.position != -1) return;	// Если взывали send повторно, пока еще не отработал предыдущий send, то ничего не происходит
				self.private.position = 0;

				self.private.urls.forEach(function(url) {

						if (!self.static.cache[url]) {
							self.static.cache[url] = {
								state: 0,
								objs: [self]
							}
						} else {
							self.static.cache[url].objs.push(self);
						}
						self.private.load(url, self.private.data, function () {
							self.private.kick(url);
						});

				});
			} else {
				self.private.load(self.private.urls[0], data, function(response) {
					$.Transfer.onload.run();
					self.private.onload.call(self.private.scope, response);
				});
			}
		},

		abort:	function(self) {
			var xhr, xhrs = self.private.xhrs;
			while (xhr = xhrs.pop()) xhr.abort();
		}
	},
	private:	{
		xhrs:		[],
		position:	-1,		// -1 - значит, что send еще не вызывался, а 0 - после первого вызова
		counter: 	0,
		haveCORS:	false,

		load: function(self, url, data, callback) {
			var fullUrl = ENV.system.path.domain + url;
			if (self.static.mocks[fullUrl]) {
				var response = self.static.mocks[fullUrl];
				if ($.isString(response)) response = JSON.parse(response);
				setTimeout(function() {
					console.warn(self.private.method + ' MOCK '+fullUrl, response);
					callback(response);
				}, 1);
				return;
			}

			var xhr;
			var cachedObj = self.static.cache[url];

			var originDomain = ENV.system.path.domain.replace(/.*?([\w\d]+\.[^\.]+)$/, function(_1, domain){ return domain});
			if ( self.private.type=='script' && (url.indexOf("//")==0 || url.indexOf("http://")==0) && url.indexOf(originDomain)==-1) {
				self.private.haveCORS = true;
				console.info('start load cors:', url);
				cachedObj.state = -1;
				var scp = document.createElement('script');
				scp.setAttribute('type', 'text/javascript');
				scp.setAttribute('src', url);
				scp.onload = function() {
					cachedObj.state = 3;
					self.private.kick(url);

					console.log('cors executed:', url);
				};
				document.getElementsByTagName('head')[0].appendChild(scp);
			} else {
				if (self.private.method == 'GET') {
					switch ( cachedObj.state ) {
						case 0:
							xhr = new XMLHttpRequest();
							xhr.onload = function() {
								var percent = Math.round((self.private.urls.counter++ / self.private.urls.length ) * 100);
								$.Transfer.onprogress.run(percent);

								var cachedObj = self.static.cache[url];
								if (this.status != 200) {
									//self.static.onerror(xhr.status, xhr.responseText);		//TODO: разобраться почему static, а не extend
									self.private.onerror(xhr.status, xhr.responseText);
									return;
								}
								cachedObj.responseText = this.responseText;
								cachedObj.state = 2;
								self.private.kick(url);
							};

							cachedObj.state = 1;
							break;
						case 1:
							cachedObj.objs.push(self);
							return;
						// сase 2: не может быть, потому что после выставления 2 вызывается kick и так. Если вдруг сюда попало, значит
						case 3:
							self.private.kick(url);
							return;
						default:
							return;
					}
				} else {
					var form = new FormData();
					(data || self.private.data).forEach(function(value, key) {
						form.append(key, ($.isHash(value) || $.isArray(value)) ? JSON.stringify(value) : value);
					});

					xhr = new XMLHttpRequest();
					xhr.onload = function() {
						if (this.status != 200) {
							//self.static.onerror(xhr.status, xhr.responseText);			//TODO: разобраться почему static, а не extend
							self.private.onerror(xhr.status, xhr.responseText);
						} else if (self.private.type == 'json') {
							callback(JSON.parse(xhr.responseText));
						} else {
							callback(xhr.responseText);
						}
					};
				}

				// Прогресс
				if (self.private.onprogress && self.private.method == 'POST') {
					xhr.upload['onprogress'] = function(e) {
						var percent = Math.round((e.position / e.totalSize) * 100);
						self.private.onprogress(percent);
					};
				}

				// Таймаут
				if (self.private.timeout && self.private.ontimeout) {
					xhr.timeout = self.private.timeout;
					xhr.ontimeout = function() {
						$.Transfer.ontimeout.run();
						var restart = self.private.ontimeout();

						if (restart) {
							// ???
						} else {
							self.public.abort();
						}

					}
				}

				// Ошибка 404 и т.п.
				if (self.private.onerror) {
					xhr.onerror = function() {
						$.Transfer.onerror.run({}, [url, xhr]);
						self.private.onerror();
					}
				}

				var loadURL = url + ((self.private.method == 'GET' && url.indexOf('?')==-1 && ENV.system.version) ? ('?v' + ENV.system.version) : '');
				try {
					xhr.open(self.private.method, loadURL, true);
					xhr.send(form);
				} catch (e) {
					xhr.onerror();
				}
				self.private.xhrs.push(xhr);
			}
		},

		// Функция "проталкивает" очередь GET-запросов, чтобы скрипты и CSS эвалились не все разом когда все прогрузятся, а сразу по мере загрузки
		kick:	function(self, url) {
			var objs = self.static.cache[url].objs;

			objs.forEach(function(obj) {
				var urls = obj.private.urls;
				if ( obj.private.position >= urls.length ) return;


				for (var i = obj.private.position, l = urls.length; i < l; i = obj.private.position) {
					var cachedObj = obj.static.cache[urls[i]];


					if ( !cachedObj ) return;						//send пробегается по урлам, по ним запускает load, а load запускает kick; При очень быстрой загрузке первый kick может отработать еще до того как send добежит до конца по списку урлов, в этот момент обьекты для последних урлов могут быть еще не созданы, поэтому выходим из цикла к следующей итерации objs
					if ( cachedObj.state == 2 ) {
						obj.private.position++;
						cachedObj.state = 3;
						if ( !cachedObj.response ) cachedObj.response = obj.private.processor(cachedObj.responseText);		// Если не отпроцессирован, но загружен
						delete cachedObj.responseText;						// Чистим свойство, дабы не занимало память (больше не потребуется)
					} else if( cachedObj.state == 3 ){
						obj.private.position++;
					} else {
						break;
					}
					//console.log(obj.private.position, urls.length, cachedObj);
				}

				if ( obj.private.position == urls.length ) {
					if (obj.private.haveCORS) {
						setTimeout(function () {obj.private.complete()}, 0);
					} else {
						obj.private.complete();
					}
					obj.private.position++; // чтоб больше не вызывалось
				}
			});
			self.static.cache[url].objs = [];
		},

		processor: function(self, responseText) {
			var response;
			switch (self.private.type) {
				case 'template':
					$.Template.register( responseText );
					break;

				case 'script':
					var scExec = document.createElement('script');
					scExec.type = 'text/javascript';
					scExec.text = responseText;
					document.head.appendChild(scExec);
					break;

				case 'css':
					var cssExec = document.createElement('style');
					cssExec.type = 'text/css';
					cssExec.innerHTML = responseText.replace(/\{\{E\.([\w\d\.]+)\}\}/g, function(reg, path) {return ENV.get(path)}); //.applyENV();
					document.head.appendChild(cssExec);
					break;

				case 'json':
					//console.log('responseText: ', responseText);
					response = responseText ? JSON.parse(responseText) : '';
					break;

				default:
					response = responseText;
			}
			return response;
		},
		complete: function(self) {
			if (self.private.type == 'json' || self.private.type == 'text') {
				var urls = self.private.urls;
				var responses = [];
				for (var i = 0, l = urls.length; i < l; i++) {
					responses.push(self.static.cache[urls[i]].response);
				}
				if (self.private.urls.length == 1) responses = responses[0];
			}

			$.Transfer.onload.run();
			self.private.onload.call(self.private.scope,  (self.private.method == 'POST') ? responses[0] : responses );
			self.private.xhrs = [];	// убираем после себя
		}
	},
	static:	{
		cache:		{},	// кэш ответов GET запросов {objs, response, responseText, state},
		mocks:		{}
	},
	extend: {
		// Дефолтные функции, которые вызываются каждый раз при наступлении события. Чтобы переопределить - $.Transfer.on* = function(){ ... }
		onbeforeload:	$.Transaction(),
		onload:			$.Transaction(),
		onerror:		$.Transaction(),
		ontimeout:		$.Transaction(),
		onprogress:		$.Transaction(),
		defineMock: function(self, url, cfg) {
			console.info('[define mock] ', url);
			self.static.mocks[url] = cfg;
		}
	}
});

/*
(function() {
	var loading = 0;

	$.Transfer.onbeforeload.push(function() {
		if (loading == 0) $(document.body).classAdd('wait');
		loading++;
	});

	$.Transfer.onload.push(function() {
		loading--;
		if (loading == 0) {
			$(document.body).classDel('wait');
		}
	});
})();
*/

$.noop = function() {};

// Принимает произвольную строку и генерирует CRC32 код
$.crc32 = (function() {
	var crc_table = (function() {
		var c;
		var crc_table = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) {
				c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
			}
			crc_table[n] = c;
		}
		return crc_table;
	})();

	return function crc32(str) {
		var crc = -1;
		for (var i = 0, l = str.length; i < l; i++) {
			crc = (crc >>> 8) ^ crc_table[(crc ^ str.charCodeAt(i)) & 0xFF];
		}
		return ((crc ^ (-1)) >>> 0).toString(16);
	};
})();



$.url = $.Class({
	constructor:	function(self, url) {

		$.Core.gsDefine(self.public, 'url', {
			get: function() {
				return self.private.protocol + '//' + self.private.hostname + self.private.port + self.private.pathname + self.private.search + self.private.hash;
			},
			set: function(url) {
				// Фиксим баг юзера, если он без протокола URL вводит
				var slashPos = url.indexOf('//');
				if (slashPos == -1 || slashPos > 6) url = 'http://' + url;

				// http://habrahabr.ru/post/65407/
				var rx = new RegExp("^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$");
				var parts = rx.exec(url);

				self.private.protocol	= parts[1] || "http:";
				self.private.hostname	= parts[5] || "";
				self.private.port		= parts[6] || "";
				self.private.pathname	= parts[7] || "/";
				self.private.search		= parts[8] || "";
				self.private.hash		= parts[10] || "";

				if (parts[8]) {
					parts[8].substr(1).split('&').forEach(function(pair) {
						pair = pair.split('=');
						self.private.params[pair[0]] = pair[1];
					});
				}
			}
		});

		$.Core.gsDefine(self.public, 'host', {
			get: function() {
				return self.private.hostname + self.private.port;
			},
			set: function(host) {
				if (typeof host != string && host.length == 0) return;
				var c = host.splitAs(':', ['hostname', 'port']);
				self.private.hostname = c.hostname;
				self.private.port = c.port;
			}
		});

		['protocol', 'hostname', 'port', 'pathname', 'search', 'hash'].forEach(function(prop) {
			$.Core.gsDefine(self.public, prop, {
				get: function() {
					return self.private[prop];
				},
				set: function(value) {
					self.private[prop] = value;
				}
			});
		});

		self.public.url = url;
	},

	public:		{
		paramsAdd:	function(self, params) {	// {}
			self.private.params = self.private.params.extendByClone(params);
			self.private.updateParams();
		},

		paramsDel:	function(self, keys) {
			var keys = keys.toObject();
			self.private.params.forEach(function(value, key) {
				if (keys[key]) delete self.private.params[key];
			});
			self.private.updateParams();
		},

		paramsGet: function(self) {
			return self.private.params;
		}
	},

	private: {
		protocol:	'', //	the protocol of the URL.	http:
		hostname:	'', //	the host name (without the port number or square brackets).	www.example.com
		port:		'', //	the port number of the URL, if any, otherwise the empty string.	8080
		pathname:	'', //	the path (relative to the host).	/search
		search:		'', //	the part of the URL that follows the ? symbol, including the ? symbol.	?q=devmo
		hash:		'', //	the part of the URL that follows the # symbol, if there is one, including the # symbol.  Empty string if the url does not contain # or has nothing after the #.	#test

		params:		{},

		updateParams: function(self) {
			var search = [];
			self.private.params.forEach(function(value, key) {
				search.push(key + '=' + value);
			});
			self.private.search = search.length ? '?' + search.join('&') : '';
		}
	}
});

// То же, что и нативные методы JSON, но сохраняют исходные типы данных JavaScript (Date, undefined, массивы с дырками и т.п.)
$.JSON = {
	stringify: function(obj) {
		//console.info('$.JSON.stringify in:', obj);
		var recursive = function(src) {
			var target = {};
			if ($.isDate(src)) {
				target = {__rptype__ : 'date', date: src };
			} else if ($.isArray(src) || $.isHash(src)) {
				var keys = Object.keys(src);
				if ($.isArray(src)) {
					if (src.length != keys.length) {
						target = src.toObject(true);
						target.__rptype__ = 'array';
					} else {
						target = src.slice(0);
					}
				}
				for (var i = 0, l = keys.length, key; i < l; i++) {
					key = keys[i];
					target[key] = recursive(src[key]);
				}
			} else if (src === undefined) return {__rptype__: 'undefined'};
			else return src;
			return target;
		};

		//console.info('$.JSON.stringify out:', JSON.stringify(recursive(obj)));
		return JSON.stringify(recursive(obj));
	},
	parse: function(str) {
		//console.info('$.JSON.parse in:', str);

		var recursive = function(subObj) {
			if ($.isHash(subObj)) {
				var type;

				if (type = subObj.__rptype__) {
					switch (type) {
						case 'date':
							return new Date(subObj.date);
						case 'undefined':
							return undefined;
						case 'array':
							var newArr = [];
							delete subObj.__rptype__;
							for (var i = 0, keys = Object.keys(subObj), l = keys.length, key; i < l; i++) {
								key = +keys[i];
								newArr[key] = subObj[key];
							}
							return newArr;
					}
				}

				for (var i = 0, keys = Object.keys(subObj), l = keys.length, key; i < l; i++) {
					key = keys[i];
					subObj[key] = recursive(subObj[key]);
				}
			}

			return subObj;
		};

		//console.info('$.JSON.parse out:', recursive(JSON.parse(str)));
		return recursive(JSON.parse(str));
	}
};




$.WS = $.Class({
	constructor: function (self, addr, cfg) {
		self.private.sendBuffer = $.Transaction();
		var ws = new WebSocket(addr);
		if ( cfg && cfg.onError) {
			ws.onerror = cfg.onError;
		}
		ws.onopen = function() {
			if (cfg.onOpen)	cfg.onOpen();
			console.info('[WS] connected to:', addr, self);
			self.private.ready = true;
			self.private.sendBuffer.run();
		};
		self.private.ws = ws;
		//console.info('[WS] -connect to:', addr, self);
		//ws.open();
	},

	public: {
		send: function(self, msg) {
			if (self.private.ready) {
				console.warn('[Socket] send:', msg);
				self.private.ws.send(JSON.stringify(msg));
			} else {
				self.private.sendBuffer.push(self.public.send.bind(self.public, msg));		//defered send
			}
		},
		get: function(self, handler) {
			self.private.ws.onmessage = handler;
		},
		close: function(self) {
			self.private.ws.close();
		}
	},

	private: {
		ready:		false,
		ws:			undefined,
		sendBuffer:	undefined
	}
});

