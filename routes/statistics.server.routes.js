let statistics = require('../controllers/statistics.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = (app) => {
	app.get('/statistics/total-orders', authenticate_common, statistics.totalOrders);
	app.get('/statistics/total', authenticate_common, statistics.total);
	app.get('/statistics/recommended-products', authenticate_common, statistics.recommendedProducts);
	app.get('/statistics/top-products', authenticate_common, statistics.topProducts);
	app.get('/statistics/top-destinations', authenticate_common, statistics.topDestinations);
	app.get('/statistics/top-farmers', authenticate_common, statistics.topFarmers);
	app.get('/statistics/earnings', authenticate_common, statistics.earnings);
	app.get('/statistics/sales', authenticate_common, statistics.sales);
	app.get('/statistics/outwards', authenticate_common, statistics.outwards);
	app.get('/statistics/purchase', authenticate_common, statistics.purchase);
};