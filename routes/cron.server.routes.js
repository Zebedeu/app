let cron = require('../controllers/cron.server.controller.js');

module.exports = function(app) {
	app.post('/clear-cart/', cron.clearCart);
	app.post('/clear-atm-reference/', cron.clearATMReference);
};