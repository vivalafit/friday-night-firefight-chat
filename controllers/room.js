
const serverCache = require('../utils/server-cache');
const { AIM_MODS } = require('../rules/CP-2020/constants');

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
        res.render('room', { roomId: req.params.room, room: roomCache, aimMods: AIM_MODS })
    } catch (e) {
        next(e)
    }

}

