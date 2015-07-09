/*
 * @component		$.Dictionary
 * @description
 * 		Загрузчик и обработчик справочников
 * 		attrs:
 * 			data			Данные вида {cfgName: name, cfgId: id, cfgParent: parentId} || {id: num, name: string}
 * 			value			массив выбранных галочек
 * 			cfg-name:		Название свойства, содержащее название. По умолчанию 'name'
 * 			cfg-id:			Название свойства, содержащее id. По умолчанию 'id'
 * 			cfg-parent:		Название свойства родительского id. По умолчанию 'parent_id'
 * @example
 * 		$.Dictionary('regions', {
 * 			url:			'http://mydata',
 * 			data:			{}						//Вместо урла можно сразу присвоить хеш с данными
 * 			columnId:		'region_id',
 * 			columnName:		'region_name',
 * 			columnParent:	'region_parent',
 * 			oneRady:		function() {}			// Каллбек после асинхронной инициализаци
 * 		})
 *
 * 		var regions = $.Dictionary('regions')
 * 		regions.getById()			//Возвращает объект по columnId
 * 		regions.getByName()			//Возвращает объект по columnName
 * 		regions.getByParentId()		//Возвращает массив объектов, с заданным parentId
 *
 */


$.Dictionary = $.Class({
	constructor: function(self, name, cfg) {
		if (self.static.dictionary[name] && !cfg) {
			if (cfg && cfg.onReady) cfg.onReady();
			return self.static.dictionary[name].ctrl;
		} else if ( cfg ) {
			self.private.dictionaryName = name;
			var isExist = !!self.static.dictionary[name];
			if (!cfg.columnId) cfg.columnId = 'id';
			if (!cfg.columnName) cfg.columnName = 'name';
			if (!cfg.columnParent) cfg.columnParent = 'parentId';

			self.public.cfg = cfg;
			if (!isExist) {
				self.static.dictionary[name] = {
					ctrl:	self.public,
					events: {},
					data:	{}
				};
				['add', 'remove', 'change', 'refresh'].forEach(function (eventName) {
					self.static.dictionary[name].events[eventName] = $.Transaction();
				});
			} else {
				self.static.dictionary[name].ctrl = self.public;
			}
			if (cfg.data) {
				self.private.initDictionary(cfg.data);
				if (isExist) self.static.dictionary[name].events['refresh'].run();
				if (cfg.onReady) cfg.onReady();
			} else if ( cfg && cfg.url) {
				$.Transfer({
					url: 		cfg.url,	//string || [string],	// массив url, которые надо загрузить
					method:		"get",		// post, get
					type:		'json',		// text|template|css|script|json	[default text] тип возвращаемых данных
					onload:		function(data) {
						self.private.initDictionary(data);
						if (cfg.onReady) cfg.onReady();
					}
				}).send();
			} else {
				_throw_('Справочник `'+name+'` не инициализрован');
			}
		} else {
			_throw_('Справочник `'+name+'` не инициализрован');
		}
	},

	chainDisabled:['hasId', 'hasChild', 'getById', 'getByName', 'getChilds'],

	public: {
		cfg:	undefined,

		getAll: function(self) {
			return self.private.idxId;
		},

		hasId: function(self, id) {
			return self.private.idxId.hasOwnProperty(id);
		},

		hasChild: function(self, id) {
			return self.private.idxParent.hasOwnProperty(id);
		},

		getById: function(self, id) {
			if (!id) id="";
			return self.private.idxId[id];
		},

		getNameById: function(self, id) {
			return self.private.idxId[id][self.public.cfg.columnName];
		},

		getParentId: function(self, id) {
			return self.private.idxId[id][self.public.cfg.columnParent];
		},

		getByName: function(self, name) {
			return self.private.idxName[name];
		},

		getByParentId: function(self, parentId) {
			var res = [];
			self.private.idxId.forEach(function(value) {
				if (value.parentId == parentId) {
					res.push(value);
				}
			});
			return res;
		},

		getAllNames: function(self) {
			return self.private.idxName;
		},

		getChilds: function(self, id) {
			var val = self.private.idxParent[id];
			return val ? val : [];
		},

		add: function(self, id, value) {
			if (!$.isHash(value)) {
				var data = {};
				data._id_= id;
				data._name_= value;
				data.addPair(self.public.cfg.columnName, value);
				value = data;
			}
			var parentId = value[self.public.cfg.columnParent];
			self.private.idxId[id] = value;
			self.private.idxName[name] = value;
			if (!self.private.idxParent[parentId]) {self.private.idxParent[parentId] = [];}
			self.private.idxParent[parentId].push(value);
			self.static.dictionary[self.private.dictionaryName].events['add'].run({}, value);
		},

		change: function(self, id, value) {
			if (!$.isHash(value)) {
				var data = {};
				data._id_= id;
				data._name_= value;
				data.addPair(self.public.cfg.columnName, value);
				value = data;
			}
			self.private.idxId[id] = value;
			self.private.idxName[name] = value;
			self.static.dictionary[self.private.dictionaryName].events['change'].run({}, value);
		},

		removeById: function(self, id) {
			var name = self.private.idxId[id][self.public.cfg.columnName];
			var value = self.private.idxId[id];
			delete self.private.idxName[name];
			delete self.private.idxId[id];

			var parentId = value[self.public.cfg.columnParent];
			var childs = self.private.idxParent[parentId];
			if (childs) {
				var i=childs.indexOf(id);
				childs.splice(i,1);
				if (!childs.length) {
					delete self.private.idxParent[parentId];
				}
			}

			self.static.dictionary[self.private.dictionaryName].events['remove'].run({}, value);
		},

		eventAdd: function(self, eventName, handler) {
			self.static.dictionary[self.private.dictionaryName].events[eventName].push(handler);
		}
	},

	private: {
		dictionaryName:		'',
		idxId:		{},
		idxName:	{},
		idxParent:	{},

		initDictionary: function(self, data) {
			var cfg = self.public.cfg;
			self.private.idxId = {};
			self.private.idxName = {};
			if ( $.isArray(data) ) {
				data.forEach(function(value, name) {
					value._id_= value[cfg.columnId];
					self.private.idxId[value[cfg.columnId]] = value;
					self.private.idxName[value[cfg.columnName]] = value;
					if (value.hasOwnProperty(cfg.columnParent)) {
						if (!self.private.idxParent[value[cfg.columnParent]]) self.private.idxParent[value[cfg.columnParent]] = [];
						self.private.idxParent[value[cfg.columnParent]].push(value);
					}
				});
			} else if ( $.isHash(data) ) {
				data.forEach(function(value, id) {
					value[cfg.columnId] = id;
					value._id_= id;
					self.private.idxId[id] = value;
					self.private.idxName[value[cfg.columnName]] = value;
					if (value.hasOwnProperty(cfg.columnParent)) {
						if (!self.private.idxParent[value[cfg.columnParent]]) self.private.idxParent[value[cfg.columnParent]] = [];
						self.private.idxParent[value[cfg.columnParent]].push(value);
					}
				});
			}
		}
	},

	static: {
		dictionary: {}			//		%name: data: {}
	},

	extend: {
		register: function(self, name, cfg) {
			$.Dictionary(name, cfg);
		},
		exist: function(self, name) {
			return self.static.dictionary[name] ? true : false;
		}
	}
});
