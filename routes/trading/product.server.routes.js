var product = require('../../controllers/trading/product.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/product/list', authenticate_trading, product.list);
	app.route('/trading/product/add')
		.get(authenticate_trading, product.add)
		.post(authenticate_trading, product.add);
	app.get('/trading/product/display/:id', authenticate_trading, product.display);
	app.post('/trading/product/edit', authenticate_trading, product.edit);
	app.get('/trading/product/remove/:id', authenticate_trading, product.remove);
	app.get('/trading/product/filter-list', authenticate_trading, product.filterList);
};