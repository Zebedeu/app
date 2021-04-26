var checkout = require('../../controllers/trading/checkout.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/checkout/get-payment-captions', authenticate_trading, checkout.getPaymentCaptions);
	app.get('/trading/checkout/list', authenticate_trading, checkout.list);
	app.get('/trading/checkout/get-bank-information', authenticate_trading, checkout.getBankInformation);
	app.post('/trading/checkout/transport_fees', authenticate_trading, checkout.transport_fees);
	app.post('/trading/checkout/place_order', authenticate_trading, checkout.placeOrder);
	app.post('/trading/checkout/reserve_order', authenticate_trading, checkout.reserveOrder);
};