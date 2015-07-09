/**
 * @component
 * @description Аудиоплеер
 * 		attrs: доступные аттрибуты для конфигурации аудиоплеера
 * @example
 * 		Из шаблона:
 * 			<audioplayer src='{{filePath}}'>
 * 		 		<span>hello world</span>
 * 			</audioplayer>
 * */





(function() {

	var onloadBuffer = $.Transaction();
	var isAudioCoreLoaded = false;

	var loadAudioCore = function() {
		isAudioCoreLoaded = 1;
		var audioCoreUrl = ENV.system.path.static + 'lib/rp/components/interactive/audioplayer/audio.min.js';
		var scp = document.createElement('script');
		scp.setAttribute('type', 'text/javascript');
		scp.setAttribute('src', audioCoreUrl);
		scp.onload = function() {
			isAudioCoreLoaded = 2;
			onloadBuffer.run();
		};
		document.body.appendChild(scp);
	};

	$.Controller.register("ui::audioplayer", {

		start: function (self, $audio, cfg, parent) {
			self.$audio = $audio;
			cfg.attrs.setDefault({
				src:		'',
				autoplay:	false
			});
			cfg.attrs.src.bridge({destObject:	$audio, destPath: '>>src'});				// ~> self.$audio.model.src
			cfg.attrs.autoplay.bridge({destObject:	$audio, destPath: '>>autoplay'});		// ~> self.$audio.model.autoplay

			self.$audio.modelEventAdd('change', 'src', self.initPlayer.bind(self));
			if (!self.$audio.model.src) return;
			self.initPlayer();
		},

		initPlayer: function(self) {
			if (isAudioCoreLoaded==2) {
				self.renderPlayer();
			} else {
				onloadBuffer.push(self.renderPlayer.bind(self));
				if (!isAudioCoreLoaded) loadAudioCore();
			}
		},

		renderPlayer: function(self) {
			setTimeout((function() {
				//console.warn('init player');
				var audioUrl = self.$audio.model.src;
				var $player = $("!<audio src='" + audioUrl + "' preload='auto' shortcut='audioref'/>");
				self.$audio.appendChild($player);

				audiojs.events.ready(function() {
					self.pipe = audiojs.create($player.shortcuts.audioref.view[0]);
					if (self.$audio.model.autoplay) self.play();
					//console.log('pipe:', self.pipe);
				});
			}).bind(self), 10);	//время чтобы сраный плагин просрался
		},

		play: function(self) {
			//console.log('start play');
			if (self.pipe) {
				try{
					self.pipe.skipTo(0);
				} catch(e) {};
				self.pipe.play();
			}
		},

		stop: function(self) {
			if (self.pipe) self.pipe.stop();
		}
	});

})();
