exports.set = function(req, res) {
	req.session.language = ((req.params.id) ? req.params.id : 'PT');
	res.send('done');
	return false;
};