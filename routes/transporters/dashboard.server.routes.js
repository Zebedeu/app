var dashboard = require('../../controllers/transporters/dashboard.server.controller.js');
const {
    authenticate_transporters
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/transporters/dashboard', authenticate_transporters, dashboard.list);
};