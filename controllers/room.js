
const serverCache = require('../utils/server-cache');
exports.renderRoom = async (req, res, next) => {
    try {
        let roomCache = serverCache.get(req.params.room); 
        if(!roomCache){
            roomCache = {
                goons: [],
                men: []
            }
            serverCache.set(req.params.room, roomCache);
        }
        res.render('room', { roomId: req.params.room, room: roomCache })
    } catch (e) {
        next(e)
    }

}

