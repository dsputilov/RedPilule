/**
 * Configure components
 */

$.Component

/* ------------------------------------------------------------------------*/
/* Interactive */
/* ------------------------------------------------------------------------*/
	.register('calendar',		{
		controllerName: 'ui::calendar',
		require:		['lib:contrib'],
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/calendar/calendar.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/calendar/calendar.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/calendar/calendar.js'
	})
	.register('balloon',		{
		controllerName: 'ui::balloon',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.js'
	})
	.register('hint',		{
		controllerName: 'ui::balloon',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/balloon/balloon.js'
	})
	.register('schedule',		{
		controllerName: 'ui::schedule',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/schedule/schedule.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/schedule/schedule.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/schedule/schedule.js'
	})
	.register('tree',		{
		controllerName: 'ui::tree',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/tree/tree.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/tree/tree.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/tree/tree.js'
	})
	.register('tagbar',		{
		controllerName: 'ui::tagbar',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/tagbar/tagbar.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/tagbar/tagbar.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/tagbar/tagbar.js'
	})
	.register('dropdown',		{
		controllerName: 'ui::dropdown',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/dropdown/dropdown.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/dropdown/dropdown.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/dropdown/dropdown.js'
	})
	.register('pager',		{
		controllerName: 'ui::pager',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/pager/pager.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/pager/pager.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/pager/pager.js'
	})
	.register('input:type=datepicker', 	{
		controllerName: 'ui::inputdate',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/inputdate/inputdate.htm',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/inputdate/inputdate.js'
	})
	.register('input:type=colorpicker', 	{
		controllerName: 'ui::colorpicker',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/colorpicker/colorpicker.htm',
		loadCss:	'{{E.system.path.static}}lib/rp/components/interactive/colorpicker/colorpicker.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/colorpicker/colorpicker.js'
	})
	.register('input:suggest', 	{
		controllerName: 'ui::suggest',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/suggest/suggest.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/suggest/suggest.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/suggest/suggest.js'
	})
	.register('overlayer', 	{
		controllerName: 'ui::overlayer',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/overlayer/overlayer.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/overlayer/overlayer.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/overlayer/overlayer.js'
	})
	.register('popup', 	{
		controllerName: 'ui::popup',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/popup/popup.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/popup/popup.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/popup/popup.js'
	})
	.register('prompt',	{
		controllerName: 'ui::prompt',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/prompt/prompt.htm',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/prompt/prompt.js'
	})
	.register('notice',	{
		controllerName: 'ui::notice',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/notice/notice.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/notice/notice.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/notice/notice.js'
	})
	.register('timer',	{
		controllerName: 'ui::timer',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/timer/timer.htm',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/timer/timer.css',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/timer/timer.js'
	})
	.register('audioplayer',	{
		controllerName: 'ui::audioplayer',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/audioplayer/audioplayer.js'
	})
	.register('readmore',	{
		controllerName: 'ui::readmore',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/readmore/readmore.js'
	})
	.register('uploadImage',	{
		controllerName: 'ui::uploadImage',
		require:		['img:imagesource'],
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/uploadImage/uploadImage.htm',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/uploadImage/uploadImage.js',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/uploadImage/uploadImage.css'
	})
	.register('uploadFile',	{
		controllerName: 'ui::uploadFile',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/interactive/uploadFile/uploadFile.htm',
		loadScript:		'{{E.system.path.static}}lib/rp/components/interactive/uploadFile/uploadFile.js',
		loadCss:		'{{E.system.path.static}}lib/rp/components/interactive/uploadFile/uploadFile.css'
	})
	.register('progressBar',	{
		controllerName: 'ui::progressBar',
		loadTemplate:	'/media/app/lib/rp/components/interactive/progressBar/progressBar.htm',
		loadScript:		'/media/app/lib/rp/components/interactive/progressBar/progressBar.js',
		loadCss:		'/media/app/lib/rp/components/interactive/progressBar/progressBar.css'
	})

/* ------------------------------------------------------------------------*/
/* System*/
/* ------------------------------------------------------------------------*/
	.register('include',		{
		controllerName: 'ui::include',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/include/include.js',
		hidden:			true
	})
	.register('if',				{
		controllerName: 'ui::if',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/if/if.js',
		hidden:			true
	})
	.register('for',			{
		controllerName: 'ui::for',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/for/for.js',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/systems/for/for.htm',
		hidden:			true
	})
	.register('scope',			{
		controllerName: 'ui::scope',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/scope/scope.js',
		hidden:			true
	})
	.register('virtualfragment', {
		controllerName: 'ui::virtualfragment',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/virtualfragment/virtualfragment.js',
		hidden:			true
	})
	.register('*:onEnterPress',	{
		controllerName: 'ui::onEnterPress',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/onenterpress/onenterpress.js',
		hidden:			true
	})
	.register('img:source',	{
		controllerName: 'ui::imagesource',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/imagesource/imagesource.js',
		hidden:			true
	})
	.register('*:editable',	{
		controllerName: 'ui::editable',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/editable/editable.js',
		hidden:			true
	})
	.register('input:lock',	{
		controllerName: 'ui::lock',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/lock/lock.js',
		hidden:			true
	})
	.register('button:lock',	{
		controllerName: 'ui::lock',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/lock/lock.js',
		hidden:			true
	})
	.register('*:dragGroup',	{
		controllerName: 'ui::dragGroup',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/draggable/draggable.js',
		hidden:			true
	})
	.register('*:columnSorter',	{
		controllerName: 'ui::columnSorter',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/columnsorter/columnsorter.js',
		hidden:			true
	})
	/*
	.register('testag',		{
		controllerName: 'ui::testag',
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/testag/testag.js'
	})
	*/

/*Libs*/
	.register('lib:contrib',	{
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/contrib/contrib.js'
	})
	.register('lib:dictionary',	{
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/dictionary/dictionary.js'
	})
	.register('lib:validator',	{
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/validator/validator.js',
		loadCss:		'{{E.system.path.static}}lib/rp/components/systems/validator/validator.css',
		loadTemplate:	'{{E.system.path.static}}lib/rp/components/systems/validator/layout.htm'
	})
	.register('lib:keymap',		{
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/keymap/keymap.js'
	})
	.register('lib:abdetect',	{
		loadScript:		'{{E.system.path.static}}lib/rp/components/systems/abdetect/abdetect.js'
	});








