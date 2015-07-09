(function() {
	"use strict";

	/*
	* rpData:	{...} 	// экземпляр полной страуктуры данных
	* rpRevisions:	{ oldest: 123, intra: 234 }
	* rpPatch123:	{path: value}
	* */

	// Объявляем хитровыделанный объект $.G
/*
	var g = $('! ');
	$.G = {
		model:  			g.model,
		modelGet:			g.modelGet.bind(g),
		modelSet:			g.modelSet.bind(g),
		modelMerge:			g.modelMerge.bind(g),
		modelDelete:		g.modelDelete.bind(g),
		modelEventAdd:		g.modelEventAdd.bind(g),
		modelEventRemove:	g.modelEventRemove.bind(g),
		modelEventFire:		g.modelEventFire.bind(g),
		modelSetType:		g.modelSetType.bind(g),
		modelValidate:		g.modelValidate.bind(g),
		modelEventClear:	g.modelEventClear.bind(g),
		modelBridge:		g.modelBridge.bind(g)
	};


	$.defineProperty($.G, 'model', {
		get: g.__lookupGetter__('model'),
		set: g.__lookupSetter__('model')
	});

	$.defineProperty($.G, '__self__', {
		value: g.__self__,
		enumerable: false
	});
	return;
*/
	$.G = $('! ');

	$.S = $('! ');

	// Код storage
	var isMaster = true, revisions, latestSyncedRevision = 0;
	window.addEventListener('blur', function() { isMaster = false; });	// не вызываем сохранение изменений, так как это событие может в принципе не быть вызвано в случае крэша итп
	window.addEventListener('focus', function() { isMaster = true; fetchChanges(); });

	// в первый раз считываем весь объект, в дальнейшем только накладываем патчи
	var data = localStorage.getItem('rpData');
	data = (data !== null) ? $.JSON.parse(data) : undefined;

	if (data === undefined) {
		revisions = { oldest: 0, intra: 0 };
		localStorage.setItem('rpData', $.JSON.stringify($.S.model));
		localStorage.setItem('rpRevisions', JSON.stringify(revisions));
	} else {
		revisions = JSON.parse(localStorage.getItem('rpRevisions'));	// { oldest: 123, intra: 234 }
		latestSyncedRevision = revisions.intra;
		$.S.modelSet(data);
	}

	fetchChanges();
	var transIds = 0; // TODO fix

	$.S.modelEventAdd('set delete', '~ **', function(eventName, path, cfg) {
		//console.warn('ARGS:', arguments);
		if (cfg.initiator == 'rp::storage::fetch' || transIds == cfg.transactionId) return;
		transIds = cfg.transactionId;
		//console.info('catch change data: ', $.JSON.stringify(arguments));
		var hash = {
			path: path,
			eventName: eventName
		};
		if (cfg && cfg.hasOwnProperty('newValue')) {
			hash.value = {val: cfg.newValue};
		}

		latestSyncedRevision++;
		localStorage.setItem('rpData', $.JSON.stringify($.S.model));
		//console.log($.G.model, cfg.newValue);
		localStorage.setItem('rpRevision' + latestSyncedRevision, $.JSON.stringify(hash));
	});

	var fn = function() {
		if (isMaster) {
			for (var i = revisions.oldest, l = revisions.intra; i <= l; i++) {
				localStorage.removeItem('rpRevision' + i);
			}
			revisions.oldest = revisions.intra;
			revisions.intra = latestSyncedRevision;
			localStorage.setItem('rpRevisions', JSON.stringify(revisions));
		}
		fetchChanges();
		window.setTimeout(fn, 100);
	};
	window.setTimeout(fn, 100);

	function fetchChanges() {
		revisions = JSON.parse(localStorage.getItem('rpRevisions'));	// { oldest: 123, intra: 234 }

		//console.log('latestSyncedRevision: ', latestSyncedRevision);
		var patch;
		while (patch = localStorage.getItem('rpRevision' + (latestSyncedRevision + 1))) {
			latestSyncedRevision++;

			patch = $.JSON.parse(patch);
			//;;;console.info('applying patch', patch);
			if (patch.eventName == 'set') {
				var val = patch.value.val;
				$.S.modelSet(patch.path, val, {initiator: 'rp::storage::fetch'});
			} else if (patch.eventName == 'delete') {
				$.S.modelDelete(patch.path, {initiator: 'rp::storage::fetch'});
			}
		}
	}
})();