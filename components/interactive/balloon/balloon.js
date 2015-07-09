/**
 * @component
 * @description Всплывающий небольшой попап, указывающий на элемент
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			orientation: 	match						Позиция, куда будет указывать стрелочка баллона
 * 								tl	- сверху слева
 * 								tr	- сверху справа
 *			 					rt	- справа сверху
 *			 					rb	- справа внизу
 * 								br	- внизу справа
 * 								bl	- внизу слева
 *			 					lb	- слева внизу
 * 								lt	- слева вверху
 * 			on:				enum(click|hover) [optional, default:click]	При клике или при наведении показывать баллон
 * 			width:			number					Ширина всплывающего окна
 * 			template:		templateName [optional]	Имя шаблона, используемого в качестве контента попапа
 * 			content:		string [optional]		Контент шаблона (вместо имени шаблона)
 * 			closeButton:	string [optional]		Контент шаблона (вместо имени шаблона)
 * 			autodestroy	:	boolean					Уничтожать при закрытии
 * 			//onopen:			function
 * 			onclose:		function()
 * 			onbeforeclose	:	function()
 * 		value: 	контент, при клике на который всплывает попап
 * @example
 * 		Из шаблона:
 * 			<ballon on='hover' orientation='tr' shortcut='myballoon' template='tplName' content='content' onclose='self.closed();'>
 * 		 		<span>hello world</span>
 * 			</ballon>
 *
 * 		Из логики:
 * 			var myballoon = $.Component('balloon', {
 *				content: 'my text',
 *				attrs: {
 *					template: 'templateName',
 *					hover: false,
 *					content: 'popup description',
 *					closeButton: true
 *				}
 *			});
 *
 * @todo
 * 		вызов контроллера, а не вставка шаблона
 * 		определение координат, чтоб оптимальнее выводить на экран
* */

(function() {
	var innerNodes = {};

	$.Controller.register("ui::balloon", {

		isRendered:	false,
		attrs:		{},

		start: function(self, balloonWrapper, cfg, parent) {
			self.parent = parent;

			cfg.attrs.setDefault({
				orientation:	cfg.tagName == 'hint' ? 'tr' : 'rb',
				width:			false,
				on:				'click',
				template:		'',
				content:		'',
				isHint:			false,
				closeButton:	false,
				autodestroy:	false,
				class:			'',
				scroll:			'auto',
				autofocus:		''
			});
			cfg.attrs.setHandler({
				onbeforeclose:	$.noop,
				onclose:		$.noop
			});

			self.balloonWrapper = balloonWrapper;

			var isHint = cfg.tagName == 'hint' || cfg.attrs.isHint.value;
			if (isHint && !cfg.content) cfg.content = "<i class='ico info_blue_mini'></i>";
			self.balloonWrapper
				.modelSet('isHint', isHint)
				.viewSet('@ui/balloonWrapper')
				.shortcuts.inner.appendChild($('!' + (cfg.content || ''), parent));
			self.onbeforeclose = cfg.attrs.onbeforeclose;
			self.onclose = cfg.attrs.onclose;
			self.autodestroy = cfg.attrs.autodestroy.value;
			self.autofocus = cfg.attrs.autofocus.value;
			self.balloon = $()
				.modelSet('isHint', isHint)
				.logicSet(self)
				.modelSetType({closeButton: 'bool'})
				.appendTo(self.balloonWrapper.shortcuts.inner);

			cfg.attrs.class.bridge({destObject:	self.balloonWrapper, destPath: '>>class'});		// ~> self.balloon.model.class
			cfg.attrs.orientation.bridge({destObject:	self.balloon, destPath: '>>orientation'});		// ~> self.balloon.model.orientation
			cfg.attrs.scroll.bridge({destObject:		self.balloon, destPath: '>>scroll'});		// ~> self.balloon.model.orientation
			cfg.attrs.width.bridge({destObject:			self.balloon, destPath: '>>width'});			// ~> self.balloon.model.width
			cfg.attrs.template.bridge({destObject:		self.balloon, destPath: '>>balloonTemplate'});	// ~> self.balloon.model.balloonTemplate
			cfg.attrs.content.bridge({destObject:		self.balloon, destPath: '>>balloonContent'});	// ~> self.balloon.model.balloonContent
			cfg.attrs.closeButton.bridge({destObject: 	self.balloon, destPath: '>>closeButton'});		// ~> self.balloon.model.closeButton
			self.balloonWrapper.model.on = cfg.attrs.on.value;

			if ( !self.balloon.model.balloonContent && !self.balloon.model.balloonTemplate ) return;
			self.initBalloon();
		},

		initBalloon: function(self) {
			if ( self.balloonWrapper.model.on == 'hover' ) {
				self.balloon.viewSet('@ui/balloon/hover');
			} else if ( self.balloonWrapper.model.on == 'click' ) {
				self.balloon.viewSet('@ui/balloon'+(self.balloon.model.orientation.indexOf('m')!=-1 ? '/mid':'')+'/click').hide();
				self.balloonWrapper.click(function(e) {
					//console.log('balloon show', self);
					self.renderBalloon();

					if (!self.balloon.isVisible) {
						if (e) {
							e.stopImmediatePropagation();
							e.stopPropagation();
						}
						self.show();
					}
				});
			} else {
				_throw_(new Error('[ui::balloon] аттрибут on содержит недопустимое значение: ' + self.balloonWrapper.model.on));
			}
			self.balloonWrapper.shortcuts = self.balloon.shortcuts;
			//setTimeout(self.renderBalloon.bind(self), 3000);
		},

		renderBalloon: function(self) {
			if (self.isRendered) return;
			self.isRendered = true;
			var popup = $('', self.parent);
			popup.component = self.balloonWrapper.component;			//=self
			if (self.balloon.model.balloonTemplate)	{
				popup.viewSet('@' + self.balloon.model.balloonTemplate);
			} else if (self.balloon.model.balloonContent) {
				popup.viewSet('!' + self.balloon.model.balloonContent);
			}
			popup.appendTo(self.balloon.shortcuts.content.empty());
		},

		show: function(self) {

			if (!self.balloon.model.closeButton) self.clickoutId = self.balloon.clickOut(self.close.bind(self), {one:false});
			self.balloon
				.fadeIn(200);
			if (self.autofocus) {
				self.parent.shortcuts[self.autofocus].view[0].focus();
			}
			if (self.balloon.model.scroll) self.balloon.scrollTo(self.balloon.model.scroll);
		},

		hide: function(self, callback) {
			//console.info('self.hide();');
			self.balloon.fadeOut(200, callback);
		},

		close: function(self, event, instant) {
			if (event) event.stopPropagation();
			if (!self.onbeforeclose()) {
				self.balloon.eventRemove(self.clickoutId);
				self.onclose();
				var afterHide = function() {
					//console.log('[baloon] afterHide');
					self.balloon.hide();
					if (self.autodestroy) {
						var innerNodes = document.createDocumentFragment($(self.balloonWrapper).view[0].childNodes);	//TODO: И тут какая то хрень, при вставке insertBefore(self.balloonWrapper) втыкается в сам враппер. NEEDFIX
						$(innerNodes).insertAfter(self.balloonWrapper);
						self.balloonWrapper.remove();
					} else {
					}
				};
				if (instant) {
					//console.log('[baloon] instant hide');
					self.balloon.hide();
				} else {
					//console.log('[baloon] hide');
					self.hide(afterHide);
				}
			}
		},

		instantClose: function(self, event) {
			self.close(event, true);
		},

		destroy: function(self) {
			self.balloonWrapper.empty();
			delete self.balloonWrapper;
		},

		insertInto: function(self, node) {
			if (innerNodes[node.nodeId] && !self.autodestroy) return;
			innerNodes[node.nodeId] = true;
			var method = self.balloon.model.orientation.indexOf('l') != -1 ? 'insertBefore' : 'insertAfter';
			//alert(self.balloon.model.orientation + method);
			self.balloonWrapper[method](node);
			if (!self.balloon.shortcuts.content) {	//через логику баллона вдруг вручную запустили рендер с пустым попапом
				console.warn('[balloon] content is empty');
				return;
			}
			self.renderBalloon();
			self.show();
		},

		insertOut: function(self, node) {
			if ($.isRP(node)) node = node.view[0];
			if (innerNodes[node.nodeId] && !self.autodestroy) return;
			innerNodes[node.nodeId] = true;
			self.balloonWrapper.insertBefore(node);
			$(self.balloonWrapper).view[0].appendChild(node);		//TODO: Какая то хренотень, почему то в self.balloonWrapper.shortcuts отсутсвует inner. WTF? Пофиксить!
			if (!self.balloon.shortcuts.content) {	//через логику баллона вдруг вручную запустили рендер с пустым попапом
				console.warn('[balloon] content is empty');
				return;
			}
			self.renderBalloon();
			self.show();
		}
	});
})();
