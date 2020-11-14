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
        if(!battleData.shooter || !battleData.target){
            //make adequate error handling
            return
        }
        let roomCache = serverCache.get(data.roomId);
        let logStr = "";
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
                    body: 10,
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
                            head: 10,
                            torso: 10,
                            lArm: 10,
                            rArm: 10,
                            lLeg: 5,
                            rLeg: 5
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
                        body: 8,
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
        // 1) SINGLE FIRE MOD
        for(let i = 0; i < battleData.wpnBullets; i++) {
            //roll if bullet hit target
            const rollResult = roller.roll("1d10").result;
            //get total aim of shooter
            let accumulatedAim = 
                  rollResult + 
                  shooterObj.fightStats.ref +  
                  shooterObj.fightStats.wpn + 
                  shooterAimMods +
                  battleData.wpnAcc;
            //check if called shot modifier avaliable -4 for aim
            if(battleData.calledShot){
                accumulatedAim = accumulatedAim - 4;
            }
            //if(accumulatedAim > 0) {
            if(accumulatedAim >= battleData.shotComplexity) {
                logStr = `${logStr}<div class="shot-landed shot-title">Shot ${i+1} got the target!</div>`
                logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim}</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and got the shot!</div>`
                //get hit location - from called shot if check passed or random roll
                let hitLocation = '';
                let bulletDmg = roller.roll(battleData.wpnDmg).result; 
                if(battleData.calledShot){
                    //location from called shot
                    hitLocation = battleData.calledShot;
                    logStr = `${logStr}<div class="shot-landed location">Shooter used a Called Shot and hit <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                } else {
                    //location from random roll
                    const hitRoll = roller.roll("1d10").result;
                    hitLocation = HIT_LOCATIONS[hitRoll];
                    logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                }
                let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                //check if bullet penetrated target`s armor
                if(bulletDmg > targetLocationArmor){
                    //reduce target`s armor if bullet penetrated it + reduce bullet damage with armor`s value
                    logStr = `${logStr}<div class="shot-landed armor-penetration">Target's Armor value(<span class="shot-value">${targetLocationArmor}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - targetLocationArmor}</span>.</div>`
                    logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the armor <span class="shot-value">${targetLocationArmor}</span> on ${hitLocation}.</div>`
                    bulletDmg = bulletDmg - targetLocationArmor;
                    targetObj.bodyStats.armor[hitLocation] = targetLocationArmor - 1 >= 0 ? targetLocationArmor - 1 : 0;

                    //reduced damage - applied btm value to it
                    let BTMedDamage = bulletDmg - targetObj.fightStats.btm <= 0 ? 1 : bulletDmg - targetObj.fightStats.btm;
                    logStr = `${logStr}<div class="shot-landed">Target's BTM value(<span class="shot-value">${targetObj.fightStats.btm}</span>) reduced bullet damage <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${BTMedDamage}</span>.</div>`
                    if(hitLocation === "head") {
                        BTMedDamage = BTMedDamage * 2;
                        logStr = `${logStr}<div class="shot-landed">Bullet has hit the head so the damage is doubled(<span class="shot-value">${BTMedDamage}</span>)!</div>`

                    }
                    let targetLocationHP = targetObj.bodyStats.limbs[hitLocation] - BTMedDamage < 0 ? 0 : targetObj.bodyStats.limbs[hitLocation] - BTMedDamage;
                    logStr = `${logStr}<div class="shot-landed armor-penetration armor-left">Target's armor left on ${hitLocation} : <span class="shot-value">${targetObj.bodyStats.armor[hitLocation]}</span>.</div>`
                    logStr = `${logStr}<div class="shot-landed hp-left">Target's health left on ${hitLocation} : <span class="shot-value">${targetLocationHP}</span>.</div>`
                    //update limb HP value
                    targetObj.bodyStats.limbs[hitLocation] = targetLocationHP;
                } else {
                    //shot does not penetrated armor
                    logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated armor(<span class="shot-value">${targetLocationArmor}</span>) on ${hitLocation}.</div>`
                }
            } else {
                //shot missed
                logStr = `${logStr}<div class="shot-landed shot-title">Shot ${i+1} missed the target!</div>`
                logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim}</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and missed the shot.</div>`
            }
            

        }
        // 1) SINGLE FIRE MOD - END
        //get result
        data.io.to(data.roomId).emit('calculation-completed', {logStr: logStr});
    } catch (e) {
        console.log(e);
        //todo : update error handler later
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}