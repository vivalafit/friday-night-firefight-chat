var Roll = require('roll');
const serverCache = require('../utils/server-cache');
const HIT_LOCATIONS = {
    1 : "head",
    2 : "torso",
    3 : "torso",
    4 : "torso",
    5 : "rArm",
    6 : "lArm",
    7 : "rLeg",
    8 : "rLeg",
    9 : "lLeg",
    10: "lLeg"
}

exports.countBattle = async (data) => {
    try {
        let battleData = data.data;
        let roomCache = serverCache.get(data.roomId);
        const roller = new Roll();
        //test cache - BEGIN
        roomCache = {
            goons: [{
                id: 1,
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
                    ref: 6,
                    btm: 4,
                    wpn: 5,
                    mods: "0 -1 +2 -1 +2"
                }
            }],
            men: [{
                    id: 1,
                    woundLevel: 0,
                    bodyStats: {
                        armor: {
                            head: 2,
                            torso: 2,
                            lArm: 2,
                            rArm: 2,
                            lLeg: 2,
                            rLeg: 2
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
                        ref: 5,
                        btm: 3,
                        wpn: 3,
                        mods: "0"
                    }
                }]
        }
        //test cache - END
        //shooter obj
        const shooterArr = battleData.shooter.split("-");
        const shooterType = shooterArr[0] === "goon" ? "goons" : "men";
        const shooterObj = roomCache[shooterType][shooterArr[1]];
        const shooterAimMods = shooterObj.fightStats.mods
        .split(" ")
        .map(x => parseInt(x))
        .reduce((accumulator, currentValue) => {
            return accumulator + currentValue
        }, 0);
        //shooter target
        const targetArr = battleData.target.split("-");
        const targetType = targetArr[0] === "goon" ? "goons" : "men";
        const targetObj = roomCache[targetType][targetArr[1]];
        for(let i = 0; i < battleData.wpnBullets; i++) {
            //roll if bullet hit target
            const rollResult = roller.roll("1d10").result;
            //get total aim of shooter
            const accumulatedAim = rollResult + shooterObj.fightStats.ref +  shooterObj.fightStats.wpn + shooterAimMods;
            if(accumulatedAim > 0) {
            //if(accumulatedAim > battleData.shotComplexity) {
                //roll hit location
                const hitRoll = roller.roll("1d10").result;
                const hitLocation = HIT_LOCATIONS[hitRoll];
                const bulletDmg = roller.roll(battleData.wpnDmg).result; 
                let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                //check if bullet penetrated target`s armor
                if(bulletDmg > targetLocationArmor){
                    //reduce target`s armor if bullet penetrated it
                    targetObj.bodyStats.armor[hitLocation] = targetLocationArmor - 1 >= 0 ? targetLocationArmor - 1 : 0;
                    //reduced damage - applied btm value to it
                    let BTMedDamage = bulletDmg - targetObj.fightStats.btm <= 0 ? 1 : bulletDmg - targetObj.fightStats.btm;
                    if(hitLocation === "head") {
                        BTMedDamage = BTMedDamage * 2;
                    }
                    let targetLocationHP = targetObj.bodyStats.limbs[hitLocation] - BTMedDamage < 0 ? 0 : targetObj.bodyStats.limbs[hitLocation] - BTMedDamage;
                    //update limb HP value
                    targetObj.bodyStats.limbs[hitLocation] = targetLocationHP;
                }
                //if()
               
            } else {
                //shot missed
            }
            

        }
        //get result
        const a = 1;
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