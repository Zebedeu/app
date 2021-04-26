var product = require('../../controllers/transporters/product.server.controller.js');

module.exports = function(app) {
	app.get('/transporters/product/list', product.list);
	app.get('/transporters/product/add', product.add);
};