const { calculateArmorDmg, calculateMeleeArmorDmg } = require('./dmg-to-armor');

exports.calculateCoverArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber) => {
    //check if bullet penetrated target's cover value 
    const apMode = battleData.ap;
    let cumulatedCoverValue = battleData.coverValue;
                       
    if (apMode) {
        cumulatedCoverValue =  Math.floor(cumulatedCoverValue / 2);
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shooter Used AP rounds! Cover value halved! <span class="shot-value">(${battleData.coverValue} -> ${cumulatedCoverValue})</span>.</div>`
    }
    if(bulletDmg > cumulatedCoverValue){
        logStr = `${logStr}<div class="shot-landed armor-penetration">Cover Armor value(<span class="shot-value">${cumulatedCoverValue}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - cumulatedCoverValue}</span>.</div>`
        bulletDmg = bulletDmg - cumulatedCoverValue;
        battleData.coverValue = battleData.coverValue - 1 >= 0 ? battleData.coverValue -1 : 0;
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the cover armor!</div>`
        logStr = `${logStr}<div class="shot-landed armor-penetration cover-left">Updated Cover Value: ${battleData.coverValue}</div>`

        //armor calculations
        const armorCalculationResult = calculateArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber);
        logStr = armorCalculationResult.logStr;
        targetObj = armorCalculationResult.targetObj;

    } else {
        //show does not penetrated target's cover armor
        logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated cover armor(<span class="shot-value">${cumulatedCoverValue}</span>).</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}

exports.calculateMeleeCoverArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber) => {
    //check if bullet penetrated target's cover value 
    const apMode = battleData.ap;
    let cumulatedCoverValue = battleData.coverValueMelee;
                       
    if (apMode) {
        cumulatedCoverValue =  Math.floor(cumulatedCoverValue / 2);
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shooter Used AP rounds! Cover value halved! <span class="shot-value">(${battleData.coverValueMelee} -> ${cumulatedCoverValue})</span>.</div>`
    }
    if(bulletDmg > cumulatedCoverValue){
        logStr = `${logStr}<div class="shot-landed armor-penetration">Cover Armor value(<span class="shot-value">${cumulatedCoverValue}</span>) reduced hit damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - cumulatedCoverValue}</span>.</div>`
        bulletDmg = bulletDmg - cumulatedCoverValue;
        battleData.coverValueMelee = battleData.coverValueMelee - 1 >= 0 ? battleData.coverValueMelee -1 : 0;
        logStr = `${logStr}<div class="shot-landed armor-penetration">Hit with damage <span class="shot-value">${bulletDmg}</span> penetrated the cover armor!</div>`
        logStr = `${logStr}<div class="shot-landed armor-penetration cover-left">Updated Cover Value: ${battleData.coverValueMelee}</div>`

        //armor calculations
        const armorCalculationResult = calculateMeleeArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber);
        logStr = armorCalculationResult.logStr;
        targetObj = armorCalculationResult.targetObj;

    } else {
        //show does not penetrated target's cover armor
        logStr = `${logStr}<div class="shot-landed not-armor-penetration">Hit with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated cover armor(<span class="shot-value">${cumulatedCoverValue}</span>).</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}