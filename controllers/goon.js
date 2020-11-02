var Roll = require('roll');
const serverCache = require('../utils/server-cache');

exports.addGoon = async (goonObject) => {
    try {
        //daun check
        let roomCache = serverCache.get(goonObject.roomId);
        if(!roomCache){
            roomCache = {
                goons: [],
                men: []
            }
            serverCache.set(goonObject.roomId, roomCache);
        }
        const type = goonObject.type === "goon" ? "goons" : "men";
        roomCache[type].push({
            id: goonObject.goonId,
            bodyStats: {
                armor: {
                    head: 0,
                    torso: 0,
                    lArm: 0,
                    rArm: 0,
                    lLeg: 0,
                    rLeg: 0
                }, 
                limbs: {
                    head: 8,
                    torso: 8,
                    lArm: 8,
                    rArm: 8,
                    lLeg: 8,
                    rLeg: 8
                }
            }
        });    
        serverCache.set(goonObject.roomId, roomCache);
        const test = "a";
        const a = 1;
        // goonObject.io.to(goonObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     roll : rollResult.rolled,
        //     result: rollResult.result
        // });
        //serverCache.set()
    } catch (e) {
        userObject.io.to(userObject.roomId).emit('roll-calculated', {
            user: userObject.user,
            error: e
        });
    }
}

