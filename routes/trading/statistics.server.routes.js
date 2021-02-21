let statistics = require('../../controllers/trading/statistics.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/statistics/total_purchase', authenticate_trading, statistics.list);
	app.get('/trading/statistics/get-total-purchase', authenticate_trading, statistics.totalPurchase);
};