let dashboard = require('../../controllers/trading/dashboard.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/dashboard', authenticate_trading, dashboard.list);
	app.get('/trading/get-settings', authenticate_trading, dashboard.settings);
	app.get('/trading/dashboard/get-ongoing-orders', authenticate_trading, dashboard.get_ongoing_orders);
	app.get('/trading/dashboard/get-recently-viewed-products', authenticate_trading, dashboard.get_recently_viewed_products);
	app.get('/trading/dashboard/match-products', authenticate_trading, dashboard.matchProducts);
};