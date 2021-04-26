var dashboard = require('../../controllers/aggregators/dashboard.server.controller.js');
const {
    authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/aggregators/dashboard', authenticate_aggregators, dashboard.list);
	app.get('/aggregators/dashboard/get-my-products', authenticate_aggregators, dashboard.get_my_products);
	app.get('/aggregators/dashboard/get-ongoing-orders', authenticate_aggregators, dashboard.get_ongoing_orders);
	app.get('/aggregators/dashboard/top-destinations', authenticate_aggregators, dashboard.top_destinations);
	app.get('/aggregators/dashboard/top-producers', authenticate_aggregators, dashboard.top_producers);
};