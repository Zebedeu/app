var favourite = require('../../controllers/compradors/favourite.server.controller.js');
const {
    authenticate_compradors
} = require('../../utils/session.js');

module.exports = function(app) {
	app.get('/compradors/favourite/list', authenticate_compradors, favourite.list);
	app.post('/compradors/favourite/set-unset', authenticate_compradors, favourite.setUnset);
};