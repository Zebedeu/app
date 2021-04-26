let demand = require('../../controllers/trading/demand.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/demands', authenticate_trading, demand.list);
};