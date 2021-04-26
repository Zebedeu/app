var user = require('../../controllers/producers/user.server.controller.js');
const {
    authenticate_producers
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/producers/user/list', authenticate_producers, user.list);
	app.route('/producers/user/add')
		.get(authenticate_producers, user.add)
		.post(authenticate_producers, user.add);
	app.get('/producers/user/display/:id', authenticate_producers, user.display);
	app.get('/producers/user/profile', authenticate_producers, user.profile);
	app.get('/producers/user/address', authenticate_producers, user.address);
	app.post('/producers/user/edit', authenticate_producers, user.edit);
	app.get('/producers/user/remove/:id', authenticate_producers, user.remove);
};