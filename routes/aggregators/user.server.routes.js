var user = require('../../controllers/aggregators/user.server.controller.js');
const {
    authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/aggregators/user/list', authenticate_aggregators, user.list);
	app.route('/aggregators/user/add')
		.get(authenticate_aggregators, user.add)
		.post(authenticate_aggregators, user.add);
	app.get('/aggregators/user/display/:id', authenticate_aggregators, user.display);
	app.get('/aggregators/user/profile', authenticate_aggregators, user.profile);
	app.get('/aggregators/user/address', authenticate_aggregators, user.address);
	app.post('/aggregators/user/edit', authenticate_aggregators, user.edit);
	app.get('/aggregators/user/remove/:id', authenticate_aggregators, user.remove);
};