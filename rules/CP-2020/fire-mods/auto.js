const Roll = require('roll');
const { HIT_LOCATIONS } = require('../constants');
const { calculateCoverArmorDmg } = require('../services/dmg-to-cover');
const { calculateArmorDmg } = require('../services/dmg-to-armor');

exports.calculateAutoShotDmg = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData }) => {
    //roll if bullet hit target
    //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
    const roller = new Roll();
    const rollResult = roller.roll("1d10").result;
    // CRITICAL FAILURE : WEAPON FUMBLED - END BULLET STORM THEN
    if(rollResult === 1){
        logStr = `${logStr}<div class="shot-landed shot-title">Shooter got Critical Failure on Full Auto Mod!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${rollResult}</span> and his weapon fumbled!</div>`
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
    //check for range
    const rangeMod = Math.floor(battleData.wpnBullets / 10);
    if(battleData.range === "close"){
        accumulatedAim += rangeMod;
    } else {
        accumulatedAim -= rangeMod;
    }

    if(accumulatedAim >= battleData.shotComplexity) {
        //number of bullets = shot complexity - aim roll
        let numberOfBullets = accumulatedAim - battleData.shotComplexity;
        if(numberOfBullets > battleData.wpnBullets) {
            numberOfBullets = battleData.wpnBullets;
        }

        logStr = `${logStr}<div class="shot-landed shot-title">Full Auto bulletstorm got the target!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter rolled in summary <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${battleData.shotComplexity}</span> check value  and got <span class="shot-value">${numberOfBullets}</span> bullets in target!</div>`
        logStr = `${logStr}<div class="shot-landed shot-title">Rolling numbers of bullets that got Target!</div>`
        //get hit location - from called shot if check passed or random roll
        for(let i = 0; i < numberOfBullets; i++) {
            logStr = `${logStr}<div class="shot-landed shot-title">Calculating ${i+1} shot!</div>`
            let hitLocation = '';
            let bulletDmg = roller.roll(battleData.wpnDmg).result; 
            //location from random roll
            const hitRoll = roller.roll("1d10").result;
            hitLocation = HIT_LOCATIONS[hitRoll];
            logStr = `${logStr}<div class="shot-landed location">Shooter rolled <span class="shot-value">${hitRoll}</span> and hit the <span class="shot-part-info">${hitLocation}</span> location with <span class="shot-value">${bulletDmg}</span> damage.</div>`
            
            let targetLocationArmor = targetObj.bodyStats.armor[hitLocation];
            if(battleData.coverValue || battleData.coverValue > 0) {
                //cover armor calculations
                const coverCalculations = calculateCoverArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, i);
                logStr = coverCalculations.logStr;
                targetObj = coverCalculations.targetObj;
            } else {
                //armor calculations
                const armorCalculationsResult = calculateArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, i);
                logStr = armorCalculationsResult.logStr;
                targetObj = armorCalculationsResult.targetObj;
            }
        }
    } else {
        //shot missed
        logStr = `${logStr}<div class="shot-landed shot-title">Full Auto bulletstorm : Missed the target!</div>`;
        logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim} (1d10 result: ${rollResult})</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and missed the shot.</div>`
    }
    return logStr;
}