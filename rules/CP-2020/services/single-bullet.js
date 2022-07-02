const Roll = require('roll');
const { HIT_LOCATIONS } = require('../constants');
const { calculateCoverArmorDmg } = require('./dmg-to-cover');
const { calculateArmorDmg } = require('./dmg-to-armor');

exports.calculateSingleShotDmg = (logStr, shooterObj, targetObj, shooterAimMods, battleData, shotNumber) => {
    //roll if bullet hit target
    //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
    const roller = new Roll();
    const rollResult = roller.roll("1d10").result;
    // CRITICAL FAILURE : WEAPON FUMBLED - END BULLET STORM THEN
    if(rollResult === 1){
        logStr = `${logStr}<div class="shot-landed shot-title">Shot ${shotNumber+1}: Critical Failure!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and his weapon fumbled on the <span class="shot-value">${shotNumber+1}</span> turn!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter needs to reload the weapon!</div>`
        return logStr;
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
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and got the shot!</div>`
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
        logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and missed the shot.</div>`
    }
    return logStr
}