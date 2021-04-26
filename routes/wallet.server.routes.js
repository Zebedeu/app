let wallet = require('../controllers/wallet.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {
	app.get('/wallet', authenticate_common, wallet.list);
	app.get('/wallet-transactions', authenticate_common, wallet.transactions);
	app.get('/wallet-withdrawal-requests', authenticate_common, wallet.withdrawalRequests);
	app.post('/withdrawal-money', authenticate_common, wallet.withdrawalMoney);
};