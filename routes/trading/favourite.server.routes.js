var favourite = require('../../controllers/trading/favourite.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/favourite/list', authenticate_trading, favourite.list);
	app.post('/trading/favourite/set-unset', authenticate_trading, favourite.setUnset);
};