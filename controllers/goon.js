const serverCache = require('../utils/server-cache');

exports.addGoon = async (goonObject) => {
    try {
        let roomCache = serverCache.get(goonObject.roomId);
        if(!roomCache){
            roomCache = {
                goons: [],
                men: []
            }
            serverCache.set(goonObject.roomId, roomCache);
        }
        const type = goonObject.type === "goon" ? "goons" : "men";
        const goonTemplate = {
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
        };
        roomCache[type].push(goonTemplate);    
        serverCache.set(goonObject.roomId, roomCache);
        goonObject.io.to(goonObject.roomId).emit('goon-added', {goon: goonTemplate, name: goonObject.name, type: goonObject.type});
    } catch (e) {
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}

exports.updateGoon = async (goonObject) => {
    try {
        let roomCache = serverCache.get(goonObject.roomId);
        const type = goonObject.type === "goon" ? "goons" : "men";
        const goonTemplate = goonObject.goonTemplate;
        const goonIndex = roomCache[type].findIndex(goon => goon.id === goonTemplate.id);
        roomCache[type][goonIndex] = goonTemplate;
        serverCache.set(goonObject.roomId, roomCache);
        goonObject.io.to(goonObject.roomId).emit('goon-updated', {goon: goonTemplate, name: goonObject.name, type: goonObject.type});
    } catch (e) {
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}

//socket.emit('update-goon', {type: type, goonTemplate: goonTemplate });