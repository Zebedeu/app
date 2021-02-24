var user = require('../../controllers/compradors/user.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/user/list', authenticate_compradors, user.list);
	app.get('/compradors/user/add', authenticate_compradors, user.add);
	app.get('/compradors/user/profile', authenticate_compradors, user.profile);
	app.get('/compradors/user/address', authenticate_compradors, user.address);
};