let dashboard = require('../../controllers/compradors/dashboard.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/dashboard', authenticate_compradors, dashboard.list);
	app.get('/compradors/get-settings', authenticate_compradors, dashboard.settings);
	app.get('/compradors/dashboard/get-ongoing-orders', authenticate_compradors, dashboard.get_ongoing_orders);
	app.get('/compradors/dashboard/get-recently-viewed-products', authenticate_compradors, dashboard.get_recently_viewed_products);
	app.get('/compradors/dashboard/match-products', authenticate_compradors, dashboard.matchProducts);
};