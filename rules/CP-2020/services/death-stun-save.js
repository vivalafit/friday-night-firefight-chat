const Roll = require('roll');
const { WOUND_LEVEL_MOD, WOUND_LEVEL_STR, MAX_WOUND_LEVEL, WOUND_LEVEL_BOUND, MAXIMUM_STUN_LEVEL, MORTAL_0_LEVEL } = require('../constants');

exports.calculateStunDeathSave = (logStr, targetObj, hitLocation, bulletDmg, shotNumber) => {
    targetObj.woundLevel = targetObj.woundLevel + bulletDmg >= MAX_WOUND_LEVEL ? MAX_WOUND_LEVEL : targetObj.woundLevel + bulletDmg;
    let woundLevel = Math.ceil(targetObj.woundLevel / WOUND_LEVEL_BOUND);
    let woundLevelMod = WOUND_LEVEL_MOD[woundLevel];
    let bodyWithPenalty = targetObj.fightStats.body + woundLevelMod;
    const roller = new Roll();
    // LIMB LOSS - if not torso, you probably lost some limbs/ minimum MORTAL 0 roll
    if(bulletDmg >= 8 && hitLocation !== "torso" && !targetObj.dead) {
        //if headshot - wow, unlucky for you
        if(hitLocation === "head"){
            logStr = `${logStr}<div class="death-save failed-roll-span">Headshot! Target's head is blown by million pieces!</div>`
            //mutate object with custom flag - to avoid later death saves 
            targetObj.dead = true;
            targetObj.deadOn = shotNumber + 1;
            return {
                logStr: logStr,
                targetObj: targetObj
            }
        }
        //check already if mortal level is higher than MORTAL 0, if higher - than apply it
        targetObj.woundLevel = targetObj.woundLevel < MORTAL_0_LEVEL ? MORTAL_0_LEVEL : targetObj.woundLevel;
        woundLevel = Math.ceil(targetObj.woundLevel / WOUND_LEVEL_BOUND);
        woundLevelMod = WOUND_LEVEL_MOD[woundLevel];
        bodyWithPenalty = targetObj.fightStats.body + woundLevelMod;
        logStr = `${logStr}<div class="death-save limb-loss">${hitLocation} limb is lost! DEATH roll on MORTAL 0 or higher!</div>`
    }
    // DEATH ROLL - higher than 3(MAXIMUM_STUN_LEVEL), beginning from MORTAL 0
    if(woundLevel > MAXIMUM_STUN_LEVEL && !targetObj.dead) {
        logStr = `${logStr}<div class="stun-save death-stun-title">Target has to roll ${bodyWithPenalty} or lower to pass the DEATH save!</div>`
        logStr = `${logStr}<div class="stun-save hint">(Target's BODY: ${targetObj.fightStats.body}, wound level MOD: ${WOUND_LEVEL_STR[woundLevelMod]}/${woundLevelMod})</div>`
        const rollResult = roller.roll("1d10").result;
        if(rollResult > bodyWithPenalty){
            logStr = `${logStr}<div class="death-save">It is seems like Target <span class="failed-roll">failed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="death-save failed-roll-span">Target is dead!</div>`
            //mutate object with custom flag - to avoid later death saves 
            targetObj.dead = true;
            targetObj.deadOn = shotNumber + 1;
        } else {
            logStr = `${logStr}<div class="death-save">It is seems like Target <span class="passed-roll">passed</span> the roll <span class="shot-value">${rollResult}</span> vs <span class="shot-value">${bodyWithPenalty}</span>!</div>`
            logStr = `${logStr}<div class="death-save passed-roll-span">Target is quite alive for this moment!</div>`
        }
    } 
    // STUN ROLL - If wound level is lower than boundaries of SERIOUS wound (3) 
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