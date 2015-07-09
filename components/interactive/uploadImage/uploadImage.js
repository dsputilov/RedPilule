$.Controller.register("ui::uploadImage", {
	start: function(self, $uploadImage, cfg) {
		self.imgSizeList = {
			mini: {width: 16, height: 16}
		};
		self.$uploadImage = $uploadImage;
		cfg.attrs.setDefault({
			size: {},
			convertTo: 'png',
			public: true,
			imageId: '',
			imageUrl: ''
		});
		self.$uploadImage.modelSetType({public: 'bool', imageId: 'int'});
		cfg.attrs.size.bridge({destObject: self.$uploadImage, destPath: 'size'});
		cfg.attrs.convertTo.bridge({destObject: self.$uploadImage, destPath: 'convertTo'});
		cfg.attrs.public.bridge({destObject: self.$uploadImage, destPath: 'public'});
		cfg.attrs.imageId.bridge({destObject: self.$uploadImage, destPath: 'imageId'});
		cfg.attrs.imageUrl.bridge({destObject: self.$uploadImage, destPath: 'imageUrl'});
		self.$uploadImage.viewSet('@ui/uploadImage');
	},

	submit: function (self){
		self.$uploadImage.modelSet('size.preview', {width: 100, height: 100}, {childObserve: false});
		var file = self.$uploadImage.shortcuts.myfile.view[0].files[0];
		LPG.form('APP.FILE.upload', {
			type:		'image',
			size:		self.$uploadImage.model.size,
			convertTo:	self.$uploadImage.model.convertTo,
			public:		self.$uploadImage.model.public
		}, function(res) {
			self.$uploadImage.model.imageId = res.fileId;
			self.$uploadImage.model.imageUrl = res.url;
		}, {
			rootData: {
				file: file
			}
		});
	}
});