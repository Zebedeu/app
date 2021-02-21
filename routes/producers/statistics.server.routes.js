let statistics = require('../../controllers/producers/statistics.server.controller.js');
const {
    authenticate_producers
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/producers/statistics/total_sales', authenticate_producers, statistics.list);
	app.get('/producers/statistics/get-total-sales', authenticate_producers, statistics.totalSales);
};