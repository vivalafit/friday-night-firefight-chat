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
                    head: "-",
                    torso: "-",
                    lArm: "-",
                    rArm: "-",
                    lLeg: "-",
                    rLeg: "-"
                }
            },
            fightStats: {
                ref: 0,
                body: 0,
                btm: 0,
                wpn: 0,
                def: 0,
                mods: "",
                selectedMods: []
            },
            additionalStats: {
                name: ''
            }
        };
        roomCache[type].push(goonTemplate);    
        serverCache.set(goonObject.roomId, roomCache);
        goonObject.io.to(goonObject.roomId).emit('goon-added', {goon: goonTemplate, name: goonObject.name, type: goonObject.type});
    } catch (e) {
        console.log(e);
    }
}

exports.updateGoon = (goonObject) => {
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
    }
}

exports.removeGoon = (goonObject) => {
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
    }
}

exports.importGoons = ({ data, io, roomId }) => {
    try {
        const roomCache = serverCache.get(roomId);
        roomCache.goons = data;
        serverCache.set(roomId, roomCache);
        io.to(roomId).emit('goons-imported', roomCache.goons);
    } catch (e) {
        console.log(e);
    }
}

exports.importBois = ({ data, io, roomId }) => {
    try {
        const roomCache = serverCache.get(roomId);
        roomCache.men = data;
        serverCache.set(roomId, roomCache);
        io.to(roomId).emit('bois-imported', roomCache.men);
    } catch (e) {
        console.log(e);
    }
}