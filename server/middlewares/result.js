module.exports = function (req, res, next) {
    if (req._SResult !== undefined) {
        return res.json({
            code: 0,
            data: req._SResult
        });
    } else if (req._SError !== undefined) {
        return res.json(req._SError);
    }
    return next();
};
