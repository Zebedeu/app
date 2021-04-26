var cart = require('../../controllers/trading/cart.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/cart/list', authenticate_trading, cart.list);
	app.post('/trading/cart/update', authenticate_trading, cart.update);
};