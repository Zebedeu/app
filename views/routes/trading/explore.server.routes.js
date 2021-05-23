var explore = require('../../controllers/trading/explore.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/explore/list', authenticate_trading, explore.list);
	app.get('/trading/explore/demand', authenticate_trading, explore.demand);
	app.get('/trading/explore/filter_product_items', authenticate_trading, explore.filter_product_items);
	app.get('/trading/explore/details/:id', authenticate_trading, explore.details);
	app.post('/trading/explore/cart', authenticate_trading, explore.cart);
	app.post('/trading/explore/save-search', authenticate_trading, explore.saveSearch);

};