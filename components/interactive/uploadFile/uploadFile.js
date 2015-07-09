$.Controller.register("ui::uploadFile", {
	start: function(self, $uploadFile, cfg) {
		self.$uploadFile = $uploadFile;
		cfg.attrs.setDefault({
			public: true,
			fileId: ''
		});
		cfg.attrs.setHandler({
			onupload: $.noop,
			onuploadstart: $.noop
		});
		self.onupload = cfg.attrs.onupload;
		self.onuploadstart = cfg.attrs.onuploadstart;
		cfg.attrs.fileId.bridge({destObject: self.$uploadFile, destPath: 'fileId'});
		cfg.attrs.public.bridge({destObject: self.$uploadFile, destPath: 'public'});
		self.$uploadFile.modelSetType({public: 'bool'});
		self.$uploadFile.modelSet('content', cfg.content);
		self.$uploadFile.viewSet('@ui/uploadFile');
	},

	submit: function (self){
		if (self.onuploadstart) self.onuploadstart();
		LPG.blockUI.on();
		var file = self.$uploadFile.shortcuts.myfile.view[0].files[0];
		LPG.form('APP.FILE.upload', {
			type:		'xls',
			public:		self.$uploadFile.model.public
		}, function(res) {
			LPG.blockUI.off();
			self.$uploadFile.model.fileId = res.fileId;
			if (self.onupload) self.onupload();
		}, {
			rootData: {
				file: file
			},
			onError: function() {
				LPG.blockUI.off();
			}
		});
	}
});