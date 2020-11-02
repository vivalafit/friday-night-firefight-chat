
const serverCache = require('../utils/server-cache');
exports.renderRoom = async (req, res, next) => {
    try {
        let roomCache = serverCache.get(req.params.room); 
        res.render('room', { roomId: req.params.room })
    } catch (e) {
        next(e)
    }

}

