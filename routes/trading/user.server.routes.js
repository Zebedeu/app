var user = require('../../controllers/trading/user.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/user/list', authenticate_trading, user.list);
	app.get('/trading/user/add', authenticate_trading, user.add);
	app.get('/trading/user/profile', authenticate_trading, user.profile);
	app.get('/trading/user/address', authenticate_trading, user.address);
};