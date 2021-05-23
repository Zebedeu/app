var dashboard = require('../../controllers/farmer/dashboard.server.controller');


const {
    authenticate_farmers
} = require('../../utils/session.js');


module.exports = function(app) {
	app.get('/farmer/dashboard', authenticate_farmers, dashboard.list);
};