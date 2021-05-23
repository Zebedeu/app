var user = require('../../controllers/farmer/user.server.controller.js');
const {
    authenticate_farmers
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/farmer/user/profile', authenticate_farmers, user.profile);
	app.get('/farmer/user/getUser', authenticate_farmers, user.getUser);
};