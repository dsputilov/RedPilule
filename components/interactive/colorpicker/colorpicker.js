/**
 * @component Popup
 * @description Всплывающий небольшой попап, указывающий на элемент
 * 		attrs: доступные аттрибуты для конфигурации попапа
 * 			value:		Значение цвета
 * @example
 * 		Из шаблона:
 * 			<input type='colorpicker' value='{{M.color}}'>
 **/


$.Controller.register("ui::colorpicker", {
	hue:			{x:150 / 8 / 2, y:0},
	sv:				{x:0, y:0},
	size:			150,
	colorOld:		{},
	colorNew:		{},
	eventTarget:	null,
	start: function(self, $input, cfg, parent) {
		self.$input = $input;
		cfg.attrs.setDefault({
			value: ''
		});
		cfg.attrs.value.bridge({destObject:	$input, destPath: 'value'});			// ~> self.$input.model.value
		$input.click(self.showPicker.bind(self));
		$input.modelSet('size', self.size);
		if (!self.$input.model.value){
			self.$input.modelSet('value', 'ffffff', {initiator: 'picking'});
		}
		$input.modelSet('colorData', {
			r:		0,
			g:		0,
			b:		0,
			rgb:	self.$input.model.value,
			h:		0,
			s:		0,
			v:		0
		});
		self.colorOld.color = self.$input.model.value;
		$input.modelEventAdd('change', 'value', function(eventName, path, eventCfg) {
			if (eventCfg.initiator != 'picking' ) {
				if(eventCfg.newValue.length == 6){
					if (self.$input.model.value.match(/^[0-9a-fA-F]{6}$/)) {
						self.$input.model.colorData.rgb = eventCfg.newValue;
					}
				}
			}
		});
		$input.modelEventAdd('change', 'colorData.rgb', function(eventName, path, eventCfg) {
			if (eventCfg.initiator != 'picking' ) {
				if(eventCfg.newValue.length == 6){
					if (self.$input.model.colorData.rgb.match(/^[0-9a-fA-F]{6}$/)) {
						self.colorFromInput();
					}
				}
			}
		});
	},

	showPicker: function(self) {
		if (!self.balloon) {
			self.balloon = $.Component("balloon", {
				attrs: {
					template: 'ui/colorpicker/popup',
					orientation: 'rb'
				}
			}, self.$input)
				.onReady(function(){
					self.balloon.logic.insertOut(self.$input);
					self.$input.view[0].focus();
					setTimeout(function() {
						self.hue.canvas = self.balloon.logic.parent.shortcuts.hue.view[0];
						self.hue.ctx = self.hue.canvas.getContext("2d");

						self.sv.canvas = self.balloon.logic.parent.shortcuts.sv.view[0];
						self.sv.ctx = self.sv.canvas.getContext("2d");

						self.colorOld.canvas = self.balloon.logic.parent.shortcuts.colorOld.view[0];
						self.colorOld.ctx = self.colorOld.canvas.getContext("2d");

						self.colorNew.canvas = self.balloon.logic.parent.shortcuts.colorNew.view[0];
						self.colorNew.ctx = self.colorNew.canvas.getContext("2d");

						document.addEventListener('mousedown', function(e){
							if(e.target == self.hue.canvas || e.target == self.sv.canvas) {
								self.eventTarget = e.target;
								document.addEventListener("mousemove", moveEvent);
							}
						});
						document.addEventListener('mouseup', function(e){
							document.removeEventListener("mousemove", moveEvent);
						});
						function moveEvent(e) {
							var x = e.clientX-self.eventTarget.getBoundingClientRect().left;
							var y = e.clientY-self.eventTarget.getBoundingClientRect().top;
							if ( x < 0 ) x = 0;
							if ( y < 0 ) y = 0;
							if ( x > self.size ) x = self.size;
							if ( y > self.size ) y = self.size;
							if ( self.eventTarget == self.sv.canvas ) {
								self.sv.x = x;
								self.sv.y = y;
							} else if ( self.eventTarget == self.hue.canvas ) {
								self.hue.y = y;
							}
							self.colorFromMouse();
						}

						self.colorFromInput();
						self.colorOld.ctx.fillStyle = '#' + self.$input.model.colorData.rgb;
						self.colorOld.ctx.fillRect(0, 0, 100, 100);
					}, 3);
				});
		} else {
			self.balloon.logic.show();
			self.$input.view[0].focus();
		}
	},

	colorFromInput: function(self) {
		var colorRGB = self.$input.model.colorData.rgb;
		self.$input.modelSet('colorData.r', parseInt(colorRGB[0] + colorRGB[1], 16), {initiator: 'picking'});
		self.$input.modelSet('colorData.g', parseInt(colorRGB[2] + colorRGB[3], 16), {initiator: 'picking'});
		self.$input.modelSet('colorData.b', parseInt(colorRGB[4] + colorRGB[5], 16), {initiator: 'picking'});
		var hsv = self.rgb2hsv(self.$input.model.colorData.r, self.$input.model.colorData.g, self.$input.model.colorData.b);
		self.$input.modelSet('colorData.h',  hsv.h, {initiator: 'picking'});
		self.$input.modelSet('colorData.s',  hsv.s, {initiator: 'picking'});
		self.$input.modelSet('colorData.v',  hsv.v, {initiator: 'picking'});
		self.hue.y = (360-hsv.h)/360*self.size;
		self.sv.x = hsv.s/100*self.size;
		self.sv.y = (100 - hsv.v)/100*self.size;
		self.draw();
	},

	colorFromMouse: function(self) {
		self.$input.modelSet('colorData.h', parseInt((self.size - self.hue.y) / self.size * 360), {initiator: 'picking'});
		self.$input.modelSet('colorData.s', parseInt(self.sv.x / self.size * 100), {initiator: 'picking'});
		self.$input.modelSet('colorData.v', parseInt((self.size - self.sv.y) / self.size * 100), {initiator: 'picking'});
		var rgb = self.hsv2rgb(self.$input.model.colorData.h, self.$input.model.colorData.s, self.$input.model.colorData.v);

		for (var i=0; i<3; i++) {
			self.$input.modelSet('colorData'+'rgb'[i],  rgb[i], {initiator: 'picking'});
			rgb[i] = (rgb[i]<16 ? '0':'') + rgb[i].toString(16);
		}

		self.$input.modelSet('colorData.rgb',  rgb[0] + rgb[1] + rgb[2], {initiator: 'picking'});
		self.draw();
	},

	setNewColor: function (self) {
		self.$input.modelSet('value', self.$input.model.colorData.rgb, {initiator: 'picking'});
		self.colorOld.ctx.fillStyle = '#' + self.$input.model.colorData.rgb;
		self.colorOld.ctx.fillRect(0, 0, 100, 100);
		self.balloon.logic.close();
	},

	draw: function (self) {
		var colorG, grd = self.hue.ctx.createLinearGradient(0, self.size, 0, 0);
		var hueData = [[255,0,0],[255,255,0],[0,255,0],[0,255,255],[0,0,255],[255,0,255],[255,0,0]];
		for (var i=0; i <= 6;i++){
			colorG = 'rgb('+hueData[i][0]+','+hueData[i][1]+','+hueData[i][2]+')';
			grd.addColorStop(i/6, colorG);
		}
		self.hue.ctx.fillStyle = grd;
		self.hue.ctx.fillRect(0, 0, self.size/8, self.size);
		self.hue.ctx.strokeStyle="#000000";
		self.hue.ctx.beginPath();
		self.hue.ctx.arc(self.hue.x, self.hue.y, self.size/35, 0, 2 * Math.PI);
		self.hue.ctx.stroke();
		self.hue.data = self.hue.ctx.getImageData(self.hue.x, self.hue.y == self.size ? self.size-1: self.hue.y, 1, 1).data;
		self.hue.color = "rgb("+self.hue.data[0]+","+self.hue.data[1]+","+self.hue.data[2]+")";

		self.sv.ctx.fillStyle = 'white';
		self.sv.ctx.fillRect(0, 0, self.size, self.size);

		grd = self.sv.ctx.createLinearGradient(0, 0, self.size, 0);
		grd.addColorStop(0, "rgba(255,255,255,1)");
		grd.addColorStop(1, self.hue.color);
		self.sv.ctx.fillStyle = grd;
		self.sv.ctx.fillRect(0, 0, self.size, self.size);

		grd = self.sv.ctx.createLinearGradient(0, 0, 0, self.size);
		grd.addColorStop(0, "rgba(255,255,255,0)");
		grd.addColorStop(0.05, "rgba(0,0,0,0.05)");
		grd.addColorStop(0.2, "rgba(0,0,0,0.2)");
		grd.addColorStop(0.5, "rgba(0,0,0,0.5)");
		grd.addColorStop(1, "rgba(0,0,0,1)");
		self.sv.ctx.fillStyle = grd;
		self.sv.ctx.fillRect(0, 0, self.size, self.size);
		self.sv.ctx.strokeStyle="#000000";
		if(self.sv.y > self.size/2) {
			self.sv.ctx.strokeStyle="#ffffff";
		}
		self.sv.ctx.beginPath();
		self.sv.ctx.arc(self.sv.x, self.sv.y, self.size/35, 0, 2 * Math.PI);
		self.sv.ctx.stroke();

		self.colorNew.ctx.fillStyle = "#" + self.$input.model.colorData.rgb;
		self.colorNew.ctx.fillRect(0, 0, 100, 100);
	},

	hsv2rgb: function(self, H,S,V){
		var f , p, q , t, lH, R, G, B;
		S /=100;
		V /=100;
		lH = Math.floor(H / 60);
		f = H/60 - lH;
		p = V * (1 - S);
		q = V *(1 - S*f);
		t = V* (1 - (1-f)* S);
		switch (lH){
			case 0: R = V; G = t; B = p; break;
			case 1: R = q; G = V; B = p; break;
			case 2: R = p; G = V; B = t; break;
			case 3: R = p; G = q; B = V; break;
			case 4: R = t; G = p; B = V; break;
			case 5: R = V; G = p; B = q; break;
		}
		return [parseInt(R*255), parseInt(G*255), parseInt(B*255)];
	},

	rgb2hsv: function (self, r, g, b) {
		r /= 255;
		g /= 255;
		b /= 255;
		var rr, gg, bb, h, s,
			v = Math.max(r, g, b),
			diff = v - Math.min(r, g, b),
			diffc = function(c){
				return (v - c) / 6 / diff + 1 / 2;
			};
		if (diff == 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(r);
			gg = diffc(g);
			bb = diffc(b);
			if (r === v) {
				h = bb - gg;
			} else if (g === v) {
				h = (1 / 3) + rr - bb;
			} else if (b === v) {
				h = (2 / 3) + gg - rr;
			}
			if (h < 0) {
				h += 1;
			}else if (h > 1) {
				h -= 1;
			}
		}
		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			v: Math.round(v * 100)
		};
	}
});
