var product = require('../../controllers/farmer/product.server.controller.js');
const {
	authenticate_farmers
} = require('../../utils/session.js');

module.exports = function (app) {
	app.get('/farmer/product/list', authenticate_farmers, product.list);
};