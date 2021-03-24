let statistics = require('../../controllers/aggregators/statistics.server.controller.js');
const {
    authenticate_aggregators
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/aggregators/statistics/total_sales', authenticate_aggregators, statistics.list);
	app.get('/aggregators/statistics/get-total-sales', authenticate_aggregators, statistics.totalSales);
};