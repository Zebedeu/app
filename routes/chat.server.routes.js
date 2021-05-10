let chat = require('../controllers/chat.server.controller.js');
const {
    authenticate_common
} = require('../utils/session.js');

module.exports = function(app) {
	app.get('/chat', authenticate_common, chat.list);
};