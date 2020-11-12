var Roll = require('roll');
const serverCache = require('../utils/server-cache');

exports.countBattle = async (data) => {
    try {
        let battleData = data.data;
        let roomCache = serverCache.get(data.roomId);
        const roller = new Roll();


        if(!roomCache){
            roomCache = {
                goons: [],
                men: []
            }
            serverCache.set(data.roomId, roomCache);
        }
        for(let i = 0; i < battleData.wpnBullets; i++) {
            //roll if bullet hit target
            const rollResult = roller.roll("1d10");
            const result = rollResult.result;
            if()
            const a = 1;

        }
        // const type = goonObject.type === "goon" ? "goons" : "men";
        // //update template for if needed
        // const goonTemplate = {
        //     id: goonObject.goonId,
        //     woundLevel: 0,
        //     bodyStats: {
        //         armor: {
        //             head: 0,
        //             torso: 0,
        //             lArm: 0,
        //             rArm: 0,
        //             lLeg: 0,
        //             rLeg: 0
        //         }, 
        //         limbs: {
        //             head: 8,
        //             torso: 8,
        //             lArm: 8,
        //             rArm: 8,
        //             lLeg: 8,
        //             rLeg: 8
        //         }
        //     },
        //     fightStats: {
        //         ref: 0,
        //         btm: 0,
        //         wpn: 0,
        //         mods: "0"
        //     }
        // };
        // roomCache[type].push(goonTemplate);    
        // serverCache.set(goonObject.roomId, roomCache);
        // goonObject.io.to(goonObject.roomId).emit('goon-added', {goon: goonTemplate, name: goonObject.name, type: goonObject.type});
    } catch (e) {
        console.log(e);
        //todo : update error handler later
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}