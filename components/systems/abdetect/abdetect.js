
(function() {

	var isActive = false;
	$.Transfer.onerror.push(function(url, e) {
		//console.warn('ERR:', arguments, '; isActive:', isActive, url);
		if (!isActive && url.indexOf('ads')){
			isActive = true;
			//alert('adblock!');
			var preloader = document.getElementById('mainPreloader');
			if (preloader) {
				preloader.style.display = 'none';
				document.getElementById('mainBody').style.display = 'block';
			}
			$.Router('abdetect:cover').start();		//test adblock
		}
	});
	setTimeout(function() {isActive = false;}, 2000);
})
();