
const serverCache = require('../utils/server-cache');
const { AIM_MODS } = require('../rules/CP-2020/constants');

const getRoomCache = (roomId) => {
    let roomCache = serverCache.get(roomId); 
    if(!roomCache){
        roomCache = {
            //goons: [],
            goons: [{"id":0,"woundLevel":2,"bodyStats":{"armor":{"head":0,"torso":0,"lArm":0,"rArm":0,"lLeg":0,"rLeg":0},"limbs":{"head":"-","torso":"-","lArm":"-","rArm":"-","lLeg":"-","rLeg":"-"}},"fightStats":{"ref":0,"body":0,"btm":0,"wpn":0,"mods":" -3","selectedMods":["Moving Target REF > 10"]},"additionalStats":{"name":"BUBA"}},{"id":1,"woundLevel":18,"bodyStats":{"armor":{"head":0,"torso":0,"lArm":0,"rArm":0,"lLeg":0,"rLeg":0},"limbs":{"head":"-","torso":"-","lArm":"-","rArm":"-","lLeg":"-","rLeg":"-"}},"fightStats":{"ref":0,"body":0,"btm":0,"wpn":0,"mods":" -4","selectedMods":["Moving Target REF > 12"]},"additionalStats":{"name":"SEH"}},{"id":2,"woundLevel":10,"bodyStats":{"armor":{"head":0,"torso":0,"lArm":0,"rArm":0,"lLeg":0,"rLeg":0},"limbs":{"head":"-","torso":"-","lArm":"-","rArm":"-","lLeg":"-","rLeg":"-"}},"fightStats":{"ref":0,"body":0,"btm":0,"wpn":0,"mods":" -3","selectedMods":["Moving Target REF > 10"]},"additionalStats":{"name":"ASTRA"}},{"id":3,"woundLevel":10,"bodyStats":{"armor":{"head":0,"torso":0,"lArm":0,"rArm":0,"lLeg":0,"rLeg":0},"limbs":{"head":"-","torso":"-","lArm":"-","rArm":"-","lLeg":"-","rLeg":"-"}},"fightStats":{"ref":0,"body":0,"btm":0,"wpn":0,"mods":" -2","selectedMods":["Target Dodging (melee only)"]},"additionalStats":{"name":"SUNO"}}],
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

exports.exportGoons = async (req, res, nex) => {
    try {
        let roomCache = getRoomCache(req.params.room); 
        res.json(roomCache.goons);
    } catch (e) {
        next(e)
    }
}

