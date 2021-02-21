var dashboard = require('../../controllers/producers/dashboard.server.controller.js');
const {
    authenticate_producers
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/producers/dashboard', authenticate_producers, dashboard.list);
	app.get('/producers/dashboard/get-my-products', authenticate_producers, dashboard.get_my_products);
	app.get('/producers/dashboard/get-ongoing-orders', authenticate_producers, dashboard.get_ongoing_orders);
	app.get('/producers/dashboard/top-destinations', authenticate_producers, dashboard.top_destinations);
};