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
        //update template for if needed
        const goonTemplate = {
            id: goonObject.goonId,
            woundLevel: 0,
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
            },
            fightStats: {
                ref: 0,
                body: 0,
                btm: 0,
                wpn: 0,
                mods: "0"
            }
        };
        roomCache[type].push(goonTemplate);    
        serverCache.set(goonObject.roomId, roomCache);
        goonObject.io.to(goonObject.roomId).emit('goon-added', {goon: goonTemplate, name: goonObject.name, type: goonObject.type});
    } catch (e) {
        console.log(e);
        //todo : update error handler later
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
        console.log(e);
        //todo : update error handler later
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}

exports.removeGoon = async (goonObject) => {
    try {
        let roomCache = serverCache.get(goonObject.roomId);
        const type = goonObject.type === "goon" ? "goons" : "men";
        const arrayToUpdate = roomCache[type];
        const goonIndex = arrayToUpdate.findIndex(goon => goon.id === parseInt(goonObject.id));
        arrayToUpdate.splice(goonIndex,1);
        if (arrayToUpdate.length > 0) {
            for(let i = goonIndex; i < arrayToUpdate.length; i++){
                arrayToUpdate[i].id = i;
            }
        }
        roomCache[type] = arrayToUpdate;
        serverCache.set(goonObject.roomId, roomCache);
        goonObject.io.to(goonObject.roomId).emit('goon-removed', {name: goonObject.name, type: goonObject.type, id: goonIndex});
    } catch (e) {
        console.log(e);
        //todo : update error handler later
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}
