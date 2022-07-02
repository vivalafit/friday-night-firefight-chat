const Roll = require('roll');
const { HIT_LOCATIONS } = require('../constants');
const { calculateCoverArmorDmg } = require('../services/dmg-to-cover');
const { calculateArmorDmg } = require('../services/dmg-to-armor');

exports.calculateBurstShotDmg = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData }) => {
    //roll if bullet hit target
    //generate random seed for every shot - to ensure that every shot at least uses random seed for pseudo-random roll gen
    const roller = new Roll();
    const rollResult = roller.roll("1d10").result;
    // CRITICAL FAILURE : WEAPON FUMBLED - END BULLET STORM THEN
    if (rollResult === 1) {
        logStr = `${logStr}<div class="shot-landed shot-title">Shooter got Critical Failure on Three Burst Mod!</div>`
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
    //check if called shot modifier avaliable -4 for aim
    if (battleData.calledShot) {
        accumulatedAim = accumulatedAim - 4;
    }
    //check for range
    if (battleData.range === "close" || battleData.range === "medium") {
        accumulatedAim += 3
    }

    if (accumulatedAim >= battleData.shotComplexity) {
        logStr = `${logStr}<div class="shot-landed shot-title">Three Burst Shot got the target!</div>`
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${accumulatedAim}</span> vs <span class="shot-value">${battleData.shotComplexity}</span> on <span class="shot-value">${battleData.range}</span> range and got the shot!</div>`
        logStr = `${logStr}<div class="shot-landed shot-title">Rolling numbers of bullets that got Target!</div>`
        //roll numbers of bullets if aim roll passed = 1d6 / 2
        const bulletRoll = roller.roll("1d6").result;
        const numberOfBullets = Math.ceil(bulletRoll / 2);
        logStr = `${logStr}<div class="shot-landed">Shooter rolled <span class="shot-value">${bulletRoll}</span> and got <span class="shot-value">${numberOfBullets}</span> bullets in target!</div>`
        //get hit location - from called shot if check passed or random roll
        for(let i = 0; i < numberOfBullets; i++) {
            logStr = `${logStr}<div class="shot-landed shot-title">Calculating ${i+1} shot!</div>`
            let hitLocation = '';
            let bulletDmg = roller.roll(battleData.wpnDmg).result; 
            if(battleData.calledShot && i === 0){
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
        logStr = `${logStr}<div class="shot-landed shot-title">Three Burst Shot : Missed the target!</div>`;
        logStr = `${logStr}<div class="shot-missed">Shooter rolled <span class="shot-value">${accumulatedAim}</span> vs <span class="shot-value">${battleData.shotComplexity}</span> and missed the shot.</div>`
    }
    return logStr;
}