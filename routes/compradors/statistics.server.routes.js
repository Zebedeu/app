let statistics = require('../../controllers/compradors/statistics.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/statistics/total_purchase', authenticate_compradors, statistics.list);
	app.get('/compradors/statistics/get-total-purchase', authenticate_compradors, statistics.totalPurchase);
};