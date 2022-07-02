const { calculateArmorDmg } = require('./dmg-to-armor');

exports.calculateCoverArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber) => {
    //check if bullet penetrated target's cover value 
    if(bulletDmg > battleData.coverValue){
        logStr = `${logStr}<div class="shot-landed armor-penetration">Cover Armor value(<span class="shot-value">${battleData.coverValue}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - battleData.coverValue}</span>.</div>`
        bulletDmg = bulletDmg - battleData.coverValue;
        battleData.coverValue = battleData.coverValue - 1 >= 0 ? battleData.coverValue -1 : 0;
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the cover armor!</div>`
        logStr = `${logStr}<div class="shot-landed armor-penetration cover-left">Updated Cover Value: ${battleData.coverValue}</div>`

        //armor calculations
        const armorCalculationResult = calculateArmorDmg(logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, shotNumber);
        logStr = armorCalculationResult.logStr;
        targetObj = armorCalculationResult.targetObj;

    } else {
        //show does not penetrated target's cover armor
        logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated cover armor(<span class="shot-value">${battleData.coverValue}</span>).</div>`
    }
    return {
        logStr: logStr,
        targetObj: targetObj
    }
}