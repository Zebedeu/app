let _ = require('underscore');
const authenticate_producers = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'producers') {
        next();
    } else {
        return res.redirect('/');
    }
};

const authenticate_aggregators = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'aggregators') {
        next();
    } else {
        return res.redirect('/');
    }
};

const authenticate_compradors = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'compradors') {
        next();
    } else {
        return res.redirect('/');
    }
};

const authenticate_trading = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'trading') {
        next();
    } else {
        return res.redirect('/');
    }
};

const authenticate_transporters = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'transporters') {
        next();
    } else {
        return res.redirect('/');
    }
};

const authenticate_common = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && _.contains(['producers', 'aggregators', 'compradors', 'trading', 'transporters'], req.session.user_type)) {
        next();
    } else {
        return res.redirect('/');
    }
};

const no_cache = (res) => {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    return;
};

const authenticate_farmers = (req, res, next) => {
    no_cache(res);

    if (req.session.user_id && req.session.user_type == 'self') {
        next();
    } else {
        return res.redirect('/');
    }
};

module.exports = {
    no_cache,
    authenticate_producers,
    authenticate_aggregators,
    authenticate_compradors,
    authenticate_trading,
    authenticate_transporters,
    authenticate_common,
    authenticate_farmers
};