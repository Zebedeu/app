exports.list = function(req, res) {
	res.render('producers/explore/list', {
		messages : req.flash('error') || req.flash('info'),
		messages : req.flash('info'),
	});
};