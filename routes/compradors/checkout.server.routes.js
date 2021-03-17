var checkout = require('../../controllers/compradors/checkout.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/checkout/get-payment-captions', authenticate_compradors, checkout.getPaymentCaptions);
	app.get('/compradors/checkout/list', authenticate_compradors, checkout.list);
	app.get('/compradors/checkout/get-bank-information', authenticate_compradors, checkout.getBankInformation);
	app.post('/compradors/checkout/transport_fees', authenticate_compradors, checkout.transport_fees);
	app.post('/compradors/checkout/place_order', authenticate_compradors, checkout.placeOrder);
	app.post('/compradors/checkout/reserve_order', authenticate_compradors, checkout.reserveOrder);
};