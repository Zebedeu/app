var thanks = require('../../controllers/trading/thanks.server.controller.js');
const {
    authenticate_trading
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/trading/thanks/list/:id', authenticate_trading, thanks.list);
};