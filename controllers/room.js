
const serverCache = require('../utils/server-cache');
const { AIM_MODS } = require('../rules/CP-2020/constants');

const getRoomCache = (roomId) => {
    let roomCache = serverCache.get(roomId); 
    if(!roomCache){
        roomCache = {
            goons: [],
            men: []
        }
        serverCache.set(roomId, roomCache);
    }
    return roomCache;
}

exports.renderRoom = async (req, res, next) => {
    try {
        let roomCache = getRoomCache(req.params.room); 
        res.render('room', { roomId: req.params.room, room: roomCache, aimMods: AIM_MODS })
    } catch (e) {
        next(e)
    }
}

exports.exportGoons = async (req, res, next) => {
    try {
        let roomCache = getRoomCache(req.params.room); 
        res.json(roomCache.goons);
    } catch (e) {
        next(e)
    }
}

exports.exportBois = async (req, res, next) => {
    try {
        let roomCache = getRoomCache(req.params.room); 
        res.json(roomCache.men);
    } catch (e) {
        next(e)
    }
}


