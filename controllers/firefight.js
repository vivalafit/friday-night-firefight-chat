const Roll = require('roll');
const srand = require('srand');
srand.seed(Date.now());
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
const WOUND_LEVEL_MOD = {
    1: 0,
    2: -1,
    3: -2,
    4: -3,
    5: -4,
    6: -5,
    7: -6,
    8: -7,
    9: -8,
    10: -9
}
const WOUND_LEVEL_STR = {
    "0": "LIGHT",
    "-1" : "SERIOUS",
    "-2" : "CRITICAL",
    "-3" : "MORTAL 0",
    "-4" : "MORTAL 1",
    "-5" : "MORTAL 2",
    "-6" : "MORTAL 3",
    "-7" : "MORTAL 4",
    "-8" : "MORTAL 5",
    "-9" : "MORTAL 6"
}
const MAX_WOUND_LEVEL = 40;
const WOUND_LEVEL_BOUND = 4;
const MAXIMUM_STUN_LEVEL = 3;

exports.countBattle = async (data) => {
    try {
        let battleData = data.data;
        if(!battleData.shooter || !battleData.target){
            //make adequate error handling
            data.io.to(data.roomId).emit('calculation-completed', {logStr: `<div class="shot-landed armor-penetration">No Shooter or Target Selected.</div>`});
        }
        let roomCache = serverCache.get(data.roomId);
        let logStr = "";
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
                        body: 6,
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
        let targetObj = roomCache[targetType][targetArr[1]];
        // 1) SINGLE FIRE MOD
        for(let i = 0; i < battleData.wpnBullets; i++) {
            const shotCalculations = calculateShotDmg(logStr, shooterObj, targetObj, shooterAimMods, battleData, i);
            if(shotCalculations.break === true){
                logStr =  shotCalculations.logStr;
                break;
            } else {
                logStr =  shotCalculations.logStr;
                targetObj = shotCalculations.targetObj;
                battleData = shotCalculations.battleData;
            }
        }
        // 1) SINGLE FIRE MOD - END
        // Check if target is stunned or dead
        let stunDeathSummary = "";
       if(targetObj.stunned) {
            stunDeathSummary = `<div class="title-summary stunned">Target shocked and fainted on ${targetObj.stunnedOn} shot!</div>`;
        }
        if(targetObj.dead) {
            stunDeathSummary = `${stunDeathSummary}<div class="title-summary dead">Target is dead on ${targetObj.deadOn} shot!</div>`;
        } 
        logStr = `${stunDeathSummary}${logStr}`
        data.io.to(data.roomId).emit('calculation-completed', {logStr: logStr});
    } catch (e) {
        data.io.to(data.roomId).emit('calculation-completed', {logStr: `<div class="shot-landed armor-penetration">Error ${e}.</div>`});
        //todo : update error handler later
        // userObject.io.to(userObject.roomId).emit('roll-calculated', {
        //     user: userObject.user,
        //     error: e
        // });
    }
}

//uses default rules for Cyberpunk 2020 stun/death saves - modify constants value whatever you want to.
const calculateStunDeathSave = (logStr, targetObj, hitLocation, bulletDmg, shotNumber) => {
    targetObj.woundLevel = targetObj.woundLevel + bulletDmg >= MAX_WOUND_LEVEL ? MAX_WOUND_LEVEL : targetObj.woundLevel + bulletDmg;
    const woundLevel = Math.ceil(targetObj.woundLevel / WOUND_LEVEL_BOUND);
    const woundLevelMod = WOUND_LEVEL_MOD[woundLevel];
    const bodyWithPenalty = targetObj.fightStats.body + woundLevelMod;
    const roller = new Roll(function () {
        return srand.random();
    });
   
    // DEATH ROLL - higher than 3, beginning from MORTAL 0
    if(Math.ceil(targetObj.woundLevel / WOUND_LEVEL_BOUND) > MAXIMUM_STUN_LEVEL && !targetObj.dead) {
        logStr = `${logStr}<div class="stun-save death-stun-title">Target has to roll ${bodyWithPenalty} or lower to pass the DEATH save!</div>`
        logStr = `${logStr}<div class="stun-save hint">(Target's BODY: ${targetObj.fightStats.body}, wound level MOD: ${WOUND_LEVEL_STR[woundLevelMod]}/${woundLevelMod})</div>`
        const rollResult = roller.roll("1d10").result;
        if(rollResult > bodyWithPenalty){
            logStr = `${logStr}<div class="death-save">It is seems like Target <span class="failed-roll">failed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="death-save failed-roll-span">Target is dead!</div>`
            //mutate object with custom flag - to avoid later stun saves 
            targetObj.dead = true;
            targetObj.deadOn = shotNumber + 1;
        } else {
            logStr = `${logStr}<div class="death-save">It is seems like Target <span class="passed-roll">passed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="death-save passed-roll-span">Target is quite alive for this moment!</div>`
        }
    } 
    // If wound level is lower than boundaries of SERIOUS wound (3) - STUN Roll
    else if(!targetObj.stunned && !targetObj.dead) {
        logStr = `${logStr}<div class="stun-save death-stun-title">Target has to roll ${bodyWithPenalty} or lower to pass the STUN save!</div>`
        logStr = `${logStr}<div class="stun-save hint">(Target's BODY: ${targetObj.fightStats.body}, wound level MOD: ${WOUND_LEVEL_STR[woundLevelMod]}/${woundLevelMod})</div>`
        const rollResult = roller.roll("1d10").result;
        if(rollResult > bodyWithPenalty){
            logStr = `${logStr}<div class="stun-save">It is seems like Target <span class="failed-roll">failed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="stun-save failed-roll-span">Target shocked and fainted!</div>`
            //mutate object with custom flag - to avoid later stun saves 
            targetObj.stunned = true;
            targetObj.stunnedOn = shotNumber + 1;
        } else {
            logStr = `${logStr}<div class="stun-save">It is seems like Target <span class="passed-roll">passed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="stun-save passed-roll-span">Target is still conscious!</div>`
        }
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}

const calculateArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, shotNumber) => {
  //check if bullet penetrated target`s armor
    if(bulletDmg > targetLocationArmor){
        //reduce target`s armor if bullet penetrated it + reduce bullet damage with armor`s value
        logStr = `${logStr}<div class="shot-landed armor-penetration">Target's Armor value(<span class="shot-value">${targetLocationArmor}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - targetLocationArmor}</span>.</div>`
        bulletDmg = bulletDmg - targetLocationArmor;
        targetObj.bodyStats.armor[hitLocation] = targetLocationArmor - 1 >= 0 ? targetLocationArmor - 1 : 0;
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the target's armor on <span class="shot-part-info">${hitLocation}</span>.</div>`

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
        //calculate STUN/DEATH save
        const stunDeathSaveResult = calculateStunDeathSave(logStr, targetObj, hitLocation, BTMedDamage, shotNumber);
        logStr = stunDeathSaveResult.logStr;
        targetObj = stunDeathSaveResult.targetObj;
    } else {
        //shot does not penetrated armor
        logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated armor(<span class="shot-value">${targetLocationArmor}</span>) on <span class="shot-part-info">${hitLocation}</span>.</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}

const calculateCoverArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData) => {
    //check if bullet penetrated target's cover value 
    if(bulletDmg > battleData.coverValue){
        logStr = `${logStr}<div class="shot-landed armor-penetration">Cover Armor value(<span class="shot-value">${battleData.coverValue}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - battleData.coverValue}</span>.</div>`
        bulletDmg = bulletDmg - battleData.coverValue;
        battleData.coverValue = battleData.coverValue - 1 >= 0 ? battleData.coverValue -1 : 0;
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the cover armor!</div>`
        //armor calculations
        const armorCalculationResult = calculateArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, shotNumber);
        logStr = armorCalculationResult.logStr;
        targetObj = armorCalculationResult.targetObj;
        logStr = `${logStr}<div class="shot-landed armor-penetration cover-left">Updated Cover Value: ${battleData.coverValue}</div>`

    } else {
        //show does not penetrated target's cover armor
        logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated cover armor(<span class="shot-value">${battleData.coverValue}</span>).</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}

const calculateShotDmg = (logStr, shooterObj, targetObj, shooterAimMods, battleData, shotNumber) => {
    //roll if bullet hit target
    //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
    const roller = new Roll(function () {
        return srand.random();
    });
    const rollResult = roller.roll("1d10").result;
    // CRITICAL FAILURE : WEAPON FUMBLED - END BULLET STORM THEN
    if(rollResult === 1){
        logStr = `${logStr}<div class="shot-landed shot-title">Shot ${shotNumber+1}: Critical Failure!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and his weapon fumbled on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter needs to reload the weapon!</div>`
        return {
            break: true,
            logStr: logStr
        }
    }
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
    //reduce every shot aim with -3 mod for single shot mod when using high ROF weapons
    accumulatedAim = accumulatedAim - (3 * shotNumber);
    if(accumulatedAim >= battleData.shotComplexity) {
        logStr = `${logStr}<div class="shot-landed shot-title">Shot ${shotNumber+1}: Got the target!</div>`
        if(shotNumber > 0){
            logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
        }
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
        if(battleData.coverValue || battleData.coverValue > 0) {
            //cover armor calculations
            const coverCalculations = calculateCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber);
            logStr = coverCalculations.logStr;
            targetObj = coverCalculations.targetObj;
        } else {
            //armor calculations
            const armorCalculationsResult = calculateArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, shotNumber);
            logStr = armorCalculationsResult.logStr;
            targetObj = armorCalculationsResult.targetObj;
        }
    } else {
        //shot missed
        logStr = `${logStr}<div class="shot-landed shot-title">Shot ${shotNumber+1}: Missed the target!</div>`;
        if(shotNumber > 0){
            logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
        }
        logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim}</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and missed the shot.</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj,
        battleData: battleData
    }
}

