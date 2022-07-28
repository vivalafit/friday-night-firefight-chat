var Roll = require('roll');
const serverCache = require('../utils/server-cache');

exports.calculateInitiative = async (userObject) => {
    try {
        let result = '';
        let detailedResult = [];
        const roller = new Roll();
        const roomCache = serverCache.get(userObject.roomId);
        const mergedPeople = [...roomCache.goons, ...roomCache.men]
        .map(x => {
            const roll = roller.roll("1d10").result;
            return {
                name: x.additionalStats.name,
                result: x.fightStats.ref + roll,
                roll: roll,
                ref: x.fightStats.ref
            }
        }).sort((a,b) => { 
            if (b.result === a.result) {
                return b.roll - a.roll;
            } else {
                return b.result - a.result
            }
        });
        for (let i = 0; i < mergedPeople.length; i++) {
            const man = mergedPeople[i];
            let name = man.name;
            if (!name) {
                name = "Man " + i;
            }
            result += ` ${i + 1}) ${name}`;
            detailedResult.push(` ${i + 1}) ${name} (${man.result} -> 1d10 Roll: ${man.roll} + REF: ${man.ref})`);
            if (i !== mergedPeople.length - 1) {
                result += " -->";
            }
        }
        userObject.io.to(userObject.roomId).emit('initiative-calculated', {
            user: userObject.user,
            result: result,
            detailedResult: detailedResult
        });
    } catch (e) {
        userObject.io.to(userObject.roomId).emit('initiative-calculated', {
            user: userObject.user,
            error: e
        });
    }
}

