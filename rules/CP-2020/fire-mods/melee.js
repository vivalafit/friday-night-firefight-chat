//const { calculateFistHit } = require ('../services/melee-hit');
const Roll = require('roll');
const { HIT_LOCATIONS, BODY_DMG_MOD, MAX_BODY_MOD } = require('../constants');
const { calculateMeleeCoverArmorDmg } = require('../services/dmg-to-cover');
const { calculateMeleeArmorDmg } = require('../services/dmg-to-armor');
const { capitalizeFirstLetter } = require('../services/utils');

exports.calculateFistHit = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData }) => {
    for(let i = 0; i < battleData.wpnHits; i++) {
        let shotNumber = i;
        //roll if bullet hit target
        //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
        const roller = new Roll();
        const rollResult = roller.roll("1d10").result;
        // CRITICAL FAILURE : WEAPON FUMBLED - END HIT STORM
        if(rollResult === 1){
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Critical Failure!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and he failed critically on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter needs to be less loser!</div>`;
            return logStr;
        }
        //get total aim of shooter
        let accumulatedAim = 
            rollResult + 
            shooterObj.fightStats.ref +  
            shooterObj.fightStats.wpn + 
            shooterAimMods +
            battleData.wpnAccMelee;
        //check if called shot modifier avaliable -4 for aim
        if(battleData.calledShotMelee){
            if (battleData.calledShotMelee === "torso") {
                accumulatedAim = accumulatedAim - 1;
            } else {
                accumulatedAim = accumulatedAim - 3;
            }
        }
        if (battleData.defenderAction === "evade") {
            logStr = `${logStr}<div class="shot-landed shot-title">Target used Evade action, Shooter got -2 debuff to attack roll (${accumulatedAim} -> ${accumulatedAim - 2})!</div>`
            accumulatedAim = accumulatedAim - 2;
        }
        //reduce every shot aim with -3 mod for single shot mod when using high ROF weapons
        accumulatedAim = accumulatedAim - (3 * shotNumber);
        //calculateMeleeComplexity
        const defenderResult = roller.roll("1d10").result;
        const meleeComplexity = 
            defenderResult +
            targetObj.fightStats.ref + 
            targetObj.fightStats.def;
        
        if(accumulatedAim >= meleeComplexity) {
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Got the target!</div>`
            logStr = `${logStr}<div class="shot-landed location">Shooter successfully used ${capitalizeFirstLetter(battleData.meleeTechnique)}!</div>`

            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and got the hit!</div>`
            if (battleData.meleeTechnique !== "disarm" && battleData.meleeTechnique !== "hold" && battleData.meleeTechnique !== "trip" && battleData.meleeTechnique !== "grapple") {
                //get hit location - from called shot if check passed or random roll
                let hitLocation = '';
                let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
                //apply body mod or not 
                if (battleData.useBody === "true") {
                    const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                    logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                    bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                    if (bulletDmg <= 0) {
                        bulletDmg = 0;
                        logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                    }
                }
                if(battleData.calledShotMelee){
                    //location from called shot
                    hitLocation = battleData.calledShotMelee;
                    logStr = `${logStr}<div class="shot-landed location">Shooter used a Called Shot and hit <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                } else {
                    //location from random roll
                    const hitRoll = roller.roll("1d10").result;
                    hitLocation = HIT_LOCATIONS[hitRoll];
                    logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                }
                let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                //ignore damage on non-damage sources
                if(battleData.coverValueMelee || battleData.coverValueMelee > 0) {
                    //cover armor calculations
                    const coverCalculations = calculateMeleeCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = coverCalculations.logStr;
                    targetObj = coverCalculations.targetObj;
                } else {
                    //armor calculations
                    const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = armorCalculationsResult.logStr;
                    targetObj = armorCalculationsResult.targetObj;
                }
            }
        } else {
            //hit missed
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber+1}: Missed the target! (Target Succesfully Evaded/Escaped/Parried Attack)</div>`;
            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and missed the hit.</div>`
            if (battleData.defenderAction === "parry") {
                logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Defender succesfully paried and may use hit of opportunity! (or use another action if not dead/shocked)</div>`
                return logStr;
            }
        }
    }
    return logStr;
}

exports.calculateCyberFistHit = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData }) => {
    for(let i = 0; i < battleData.wpnHits; i++) {
        let shotNumber = i;
        //roll if bullet hit target
        //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
        const roller = new Roll();
        const rollResult = roller.roll("1d10").result;
        // CRITICAL FAILURE : WEAPON FUMBLED - END HIT STORM
        if(rollResult === 1){
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Critical Failure!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and he failed critically on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter needs to be less loser!</div>`;
            return logStr;
        }
        //get total aim of shooter
        let accumulatedAim = 
            rollResult + 
            shooterObj.fightStats.ref +  
            shooterObj.fightStats.wpn + 
            shooterAimMods +
            battleData.wpnAccMelee;
        //check if called shot modifier avaliable -4 for aim
        if(battleData.calledShotMelee){
            if (battleData.calledShotMelee === "torso") {
                accumulatedAim = accumulatedAim - 1;
            } else {
                accumulatedAim = accumulatedAim - 3;
            }
        }
        if (battleData.defenderAction === "evade") {
            logStr = `${logStr}<div class="shot-landed shot-title">Target used Evade action, Shooter got -2 debuff to attack roll (${accumulatedAim} -> ${accumulatedAim - 2})!</div>`
            accumulatedAim = accumulatedAim - 2;
        }
        //reduce every shot aim with -3 mod for single shot mod when using high ROF weapons
        accumulatedAim = accumulatedAim - (3 * shotNumber);
        //calculateMeleeComplexity
        const defenderResult = roller.roll("1d10").result;
        const meleeComplexity = 
            defenderResult +
            targetObj.fightStats.ref + 
            targetObj.fightStats.def;
        
        if(accumulatedAim >= meleeComplexity) {
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Got the target!</div>`
            logStr = `${logStr}<div class="shot-landed location">Shooter successfully used ${capitalizeFirstLetter(battleData.meleeTechnique)}!</div>`

            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and got the hit!</div>`
            if (battleData.meleeTechnique !== "disarm" && battleData.meleeTechnique !== "hold" && battleData.meleeTechnique !== "trip" && battleData.meleeTechnique !== "grapple") {
                //get hit location - from called shot if check passed or random roll
                let hitLocation = '';
                let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
                //apply body mod or not 
                if (battleData.useBody === "true") {
                    const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                    logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                    bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                    if (bulletDmg <= 0) {
                        bulletDmg = 0;
                        logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                    }
                }
                if(battleData.calledShotMelee){
                    //location from called shot
                    hitLocation = battleData.calledShotMelee;
                    logStr = `${logStr}<div class="shot-landed location">Shooter used a Called Shot and hit <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                } else {
                    //location from random roll
                    const hitRoll = roller.roll("1d10").result;
                    hitLocation = HIT_LOCATIONS[hitRoll];
                    logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
                }
                let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                //ignore damage on non-damage sources
                if(battleData.coverValueMelee || battleData.coverValueMelee > 0) {
                    //cover armor calculations
                    const coverCalculations = calculateMeleeCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = coverCalculations.logStr;
                    targetObj = coverCalculations.targetObj;
                } else {
                    //armor calculations
                    const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = armorCalculationsResult.logStr;
                    targetObj = armorCalculationsResult.targetObj;
                }
            }
        } else {
            //hit missed
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber+1}: Missed the target! (Target Succesfully Evaded/Escaped/Parried Attack)</div>`;
            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and failed to hit Target.</div>`

            if (battleData.defenderAction === "parry") {
                if (battleData.parryAction === "melee") {
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Melee weapons is broken after parry!</div>`
                    if (breakRoll === 10) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    }
                } else if (battleData.parryAction === "melee-katana") { 
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Targets's Mono weapon is broken/shattered after parry!</div>`
                    if (breakRoll === 1) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else if (breakRoll > 1 && breakRoll <= 4) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is SHATTERED after parry!!! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    } 
                } else {
                    const hitLocation = battleData.parryAction;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Target Decided to parry with own body part and he will receive damage! Location: ${hitLocation}</div>`
                    let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
                    //apply body mod or not 
                    if (battleData.useBody === "true") {
                        const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                        logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                        bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                        if (bulletDmg <= 0) {
                            bulletDmg = 0;
                            logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                        }
                    }
                    //find armor
                    const targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                    //
                    const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = armorCalculationsResult.logStr;
                    targetObj = armorCalculationsResult.targetObj;
                }
                logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Defender succesfully paried and may use hit of opportunity! (or use another action if not dead/shocked)</div>`
                return logStr;
            }
        }
    }
    return logStr;
}

exports.calculateMeleeHit = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData}) => {
    for(let i = 0; i < battleData.wpnHits; i++) {
        let shotNumber = i;
        //roll if bullet hit target
        //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
        const roller = new Roll();
        const rollResult = roller.roll("1d10").result;
        // CRITICAL FAILURE : WEAPON FUMBLED - END HIT STORM
        if(rollResult === 1){
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Critical Failure!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and he failed critically on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter needs to be less loser!</div>`;
            return logStr;
        }
        //get total aim of shooter
        let accumulatedAim = 
            rollResult + 
            shooterObj.fightStats.ref +  
            shooterObj.fightStats.wpn + 
            shooterAimMods +
            battleData.wpnAccMelee;
        //check if called shot modifier avaliable -4 for aim
        if(battleData.calledShotMelee){
            if (battleData.calledShotMelee === "torso") {
                accumulatedAim = accumulatedAim - 1;
            } else {
                accumulatedAim = accumulatedAim - 3;
            }
        }
        if (battleData.defenderAction === "evade") {
            logStr = `${logStr}<div class="shot-landed shot-title">Target used Evade action, Shooter got -2 debuff to attack roll (${accumulatedAim} -> ${accumulatedAim - 2})!</div>`
            accumulatedAim = accumulatedAim - 2;
        }
        //reduce every shot aim with -3 mod for single shot mod when using high ROF weapons
        accumulatedAim = accumulatedAim - (3 * shotNumber);
        //calculateMeleeComplexity
        const defenderResult = roller.roll("1d10").result;
        const meleeComplexity = 
            defenderResult +
            targetObj.fightStats.ref + 
            targetObj.fightStats.def;
        
        if(accumulatedAim >= meleeComplexity) {
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Got the target!</div>`

            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and got the hit!</div>`
            //get hit location - from called shot if check passed or random roll
            let hitLocation = '';
            let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
            //apply body mod or not 
            if (battleData.useBody === "true") {
                const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                if (bulletDmg <= 0) {
                    bulletDmg = 0;
                    logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                }
            }
            if(battleData.calledShotMelee){
                //location from called shot
                hitLocation = battleData.calledShotMelee;
                logStr = `${logStr}<div class="shot-landed location">Shooter used a Called Shot and hit <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
            } else {
                //location from random roll
                const hitRoll = roller.roll("1d10").result;
                hitLocation = HIT_LOCATIONS[hitRoll];
                logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
            }
            let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
            //ignore damage on non-damage sources
            if(battleData.coverValueMelee || battleData.coverValueMelee > 0) {
                //cover armor calculations
                const coverCalculations = calculateMeleeCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                logStr = coverCalculations.logStr;
                targetObj = coverCalculations.targetObj;
            } else {
                //armor calculations
                const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                logStr = armorCalculationsResult.logStr;
                targetObj = armorCalculationsResult.targetObj;
            }
        } else {
            //hit missed
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber+1}: Missed the target! (Target Succesfully Evaded/Escaped/Parried Attack)</div>`;
            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and failed to hit Target.</div>`

            if (battleData.defenderAction === "parry") {
                if (battleData.parryAction === "melee") {
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Melee weapons is broken after parry!</div>`
                    if (breakRoll === 10) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    }
                } else if (battleData.parryAction === "melee-katana") { 
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Target's Mono weapon is broken/shattered after parry!</div>`
                    if (breakRoll === 1) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else if (breakRoll > 1 && breakRoll <= 4) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is SHATTERED after parry!!! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    } 
                } else {
                    const hitLocation = battleData.parryAction;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Target Decided to parry with own body part and he will receive damage! Location: ${hitLocation}</div>`
                    let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
                    //apply body mod or not 
                    if (battleData.useBody === "true") {
                        const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                        logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                        bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                        if (bulletDmg <= 0) {
                            bulletDmg = 0;
                            logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                        }
                    }
                    //find armor
                    const targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                    //
                    const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = armorCalculationsResult.logStr;
                    targetObj = armorCalculationsResult.targetObj;
                }
                logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Defender succesfully paried and may use hit of opportunity! (or use another action if not dead/shocked)</div>`
                return logStr;
            }
        }
    }
    return logStr;
}

exports.calculateKatanaHit = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData}) => {
    for(let i = 0; i < battleData.wpnHits; i++) {
        let shotNumber = i;
        //roll if bullet hit target
        //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
        const roller = new Roll();
        const rollResult = roller.roll("1d10").result;
        // CRITICAL FAILURE : WEAPON FUMBLED - END HIT STORM
        if (rollResult === 1){
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Critical Failure!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and he failed critically on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`;
            logStr = `${logStr}<div class="shot-landed">Shooter needs to be less loser!</div>`;
            return logStr;
        } 
        //get total aim of shooter
        let accumulatedAim = 
            rollResult + 
            shooterObj.fightStats.ref +  
            shooterObj.fightStats.wpn + 
            shooterAimMods +
            battleData.wpnAccMelee;
        //check if called shot modifier avaliable -4 for aim
        if(battleData.calledShotMelee){
            if (battleData.calledShotMelee === "torso") {
                accumulatedAim = accumulatedAim - 1;
            } else {
                accumulatedAim = accumulatedAim - 3;
            }
        }
        if (battleData.defenderAction === "evade") {
            logStr = `${logStr}<div class="shot-landed shot-title">Target used Evade action, Shooter got -2 debuff to attack roll (${accumulatedAim} -> ${accumulatedAim - 2})!</div>`
            accumulatedAim = accumulatedAim - 2;
        }
        //reduce every shot aim with -3 mod for single shot mod when using high ROF weapons
        accumulatedAim = accumulatedAim - (3 * shotNumber);
        //calculateMeleeComplexity
        const defenderResult = roller.roll("1d10").result;
        const meleeComplexity = 
            defenderResult +
            targetObj.fightStats.ref + 
            targetObj.fightStats.def;
        
        if(accumulatedAim >= meleeComplexity) {
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber + 1}: Got the target!</div>`

            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and got the hit!</div>`
            //get hit location - from called shot if check passed or random roll
            let hitLocation = '';
            let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
            //apply body mod or not 
            if (battleData.useBody === "true") {
                const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                if (bulletDmg <= 0) {
                    bulletDmg = 0;
                    logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                }
            }
            if (rollResult === 10) {
                logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">10</span>! His Damage is DOUBLED! <span class="shot-value">(${bulletDmg} -> ${bulletDmg * 2})</span>.</div>`;
                bulletDmg = bulletDmg * 2;
            }
            if(battleData.calledShotMelee){
                //location from called shot
                hitLocation = battleData.calledShotMelee;
                logStr = `${logStr}<div class="shot-landed location">Shooter used a Called Shot and hit <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
            } else {
                //location from random roll
                const hitRoll = roller.roll("1d10").result;
                hitLocation = HIT_LOCATIONS[hitRoll];
                logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
            }
            let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
            //ignore damage on non-damage sources
            if(battleData.coverValueMelee || battleData.coverValueMelee > 0) {
                //cover armor calculations
                const coverCalculations = calculateMeleeCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                logStr = coverCalculations.logStr;
                targetObj = coverCalculations.targetObj;
            } else {
                //armor calculations
                const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                logStr = armorCalculationsResult.logStr;
                targetObj = armorCalculationsResult.targetObj;
            }
        } else {
            //hit missed
            logStr = `${logStr}<div class="shot-landed shot-title">Hit ${shotNumber+1}: Missed the target! (Target Succesfully Evaded/Escaped/Parried Attack)</div>`;
            if(shotNumber > 0){
                logStr = `${logStr}<div class="shot-landed">Aim value was decreased by <span class="shot-value">${3 * shotNumber}</span> as a debuff for consecutive action!</div>`
            }
            logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${meleeComplexity}</span> and failed to hit Target.</div>`

            if (battleData.defenderAction === "parry") {
                if (battleData.parryAction === "melee") {
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Melee weapons is broken after parry!</div>`
                    if (breakRoll === 10) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Melee Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    }
                } else if (battleData.parryAction === "melee-katana") { 
                    const breakRoll = roller.roll("1d10").result;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Checking whether Target's Mono weapon is broken/shattered after parry!</div>`
                    if (breakRoll === 1) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is Broken after parry! Roll Result: ${breakRoll}</div>`
                    } else if (breakRoll > 1 && breakRoll <= 4) {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon is SHATTERED after parry!!! Roll Result: ${breakRoll}</div>`
                    } else {
                        logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Mono Weapon parried attack successfully! Roll Result: ${breakRoll}</div>`
                    } 
                } else {
                    const hitLocation = battleData.parryAction;
                    logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Target Decided to parry with own body part and he will receive damage! Location: ${hitLocation}</div>`
                    let bulletDmg = roller.roll(battleData.wpnDmgMelee).result;
                    //apply body mod or not 
                    if (battleData.useBody === "true") {
                        const bodyMod = shooterObj.fightStats.body >= MAX_BODY_MOD ? MAX_BODY_MOD : shooterObj.fightStats.body;
                        logStr = `${logStr}<div class="shot-landed">Shooter has his BODY stat applied. New Damage is <span class="shot-value">(${bulletDmg + BODY_DMG_MOD[bodyMod]} -> ${bulletDmg} + ${BODY_DMG_MOD[bodyMod]})</span>.</div>`;
                        bulletDmg = bulletDmg + BODY_DMG_MOD[bodyMod];
                        if (bulletDmg <= 0) {
                            bulletDmg = 0;
                            logStr = `${logStr}<div class="shot-landed">Damage cannot be less than 0, so it is rounded to <span class="shot-value">0</span>.</div>`;
                        }
                    }
                    if (rollResult === 10) {
                        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">10</span>! His Damage is DOUBLED! <span class="shot-value">(${bulletDmg} -> ${bulletDmg * 2})</span>.</div>`;
                        bulletDmg = bulletDmg * 2;
                    }
                    //find armor
                    const targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
                    //
                    const armorCalculationsResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber, shooterObj);
                    logStr = armorCalculationsResult.logStr;
                    targetObj = armorCalculationsResult.targetObj;
                }
                logStr = `${logStr}<div class="shot-landed"><span class="shot-value">Defender succesfully paried and may use hit of opportunity! (or use another action if not dead/shocked)</div>`
                return logStr;
            }
        }
    }
    return logStr;
}