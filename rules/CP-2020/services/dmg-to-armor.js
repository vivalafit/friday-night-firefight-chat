const { calculateStunDeathSave } = require('./death-stun-save');

exports.calculateArmorDmg = (logStr, bulletDmg, targetLocationArmor, hitLocation, targetObj, battleData, shotNumber) => {
    const apMode = battleData.ap;
    let cumulatedArmorValue = targetLocationArmor;
    if (apMode) {
        cumulatedArmorValue = Math.floor(cumulatedArmorValue / 2);
        logStr = `${logStr}<div class="shot-landed armor-penetration">Shooter used AP rounds! Armor value halved! <span class="shot-value">(${targetLocationArmor} -> ${cumulatedArmorValue})</span>.</div>`
    }
    //check if bullet penetrated target`s armor
      if(bulletDmg > cumulatedArmorValue){
          //reduce target`s armor if bullet penetrated it + reduce bullet damage with armor`s value
          logStr = `${logStr}<div class="shot-landed armor-penetration">Target's Armor value(<span class="shot-value">${cumulatedArmorValue}</span>) reduced bullet damage from <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${bulletDmg - cumulatedArmorValue}</span>.</div>`
          bulletDmg = bulletDmg - cumulatedArmorValue;
          targetObj.bodyStats.armor[hitLocation] = targetLocationArmor - 1 >= 0 ? targetLocationArmor - 1 : 0;
          logStr = `${logStr}<div class="shot-landed armor-penetration">Shot with damage <span class="shot-value">${bulletDmg}</span> penetrated the target's armor on <span class="shot-part-info">${hitLocation}</span>.</div>`

          //if AP rounds halve damage
          if (apMode && apMode !== "shotgun-ap-hard") { 
            logStr = `${logStr}<div class="shot-landed">This is AP round so it's damage to body is halved! <span class="shot-value">(${bulletDmg} -> ${Math.floor(bulletDmg / 2)})</span>.</div>`;
            bulletDmg = Math.floor(bulletDmg / 2);
          }
          //reduced damage - applied btm value to it
          let BTMedDamage = bulletDmg - targetObj.fightStats.btm <= 0 ? 1 : bulletDmg - targetObj.fightStats.btm;
          //check if there is a cyberlimb on hitlocation
          const limbHP = parseInt(targetObj.bodyStats.limbs[hitLocation]);
          if(limbHP){
              let targetLocationHP = targetObj.bodyStats.limbs[hitLocation] - bulletDmg < 0 ? 0 : targetObj.bodyStats.limbs[hitLocation] - bulletDmg;
              logStr = `${logStr}<div class="shot-landed hp-left">Target's cybelimb SDP on ${hitLocation} : <span class="shot-value">${targetLocationHP}</span>.</div>`
              //update limb HP value
              targetObj.bodyStats.limbs[hitLocation] = targetLocationHP;
              if(targetObj.bodyStats.limbs[hitLocation] === 0) {
                  logStr = `${logStr}<div class="shot-landed hp-left">Cyberlimb on ${hitLocation} is broken!</span>.</div>`
              }
          } else {
              //calculate STUN/DEATH save - if location not the Cyberlimb
              logStr = `${logStr}<div class="shot-landed">Target's BTM value(<span class="shot-value">${targetObj.fightStats.btm}</span>) reduced bullet damage <span class="shot-value">${bulletDmg}</span> -> <span class="shot-value">${BTMedDamage}</span>.</div>`
              if(hitLocation === "head") {
                  BTMedDamage = BTMedDamage * 2;
                  logStr = `${logStr}<div class="shot-landed">Bullet has hit the head so the damage is doubled(<span class="shot-value">${BTMedDamage}</span>)!</div>`
              }
              logStr = `${logStr}<div class="shot-landed armor-penetration armor-left">Target's armor left on ${hitLocation} : <span class="shot-value">${targetObj.bodyStats.armor[hitLocation]}</span>.</div>`
              const stunDeathSaveResult = calculateStunDeathSave(logStr, targetObj, hitLocation, BTMedDamage, shotNumber);
              logStr = stunDeathSaveResult.logStr;
              targetObj = stunDeathSaveResult.targetObj;
          }
      } else {
          //shot does not penetrated armor
          logStr = `${logStr}<div class="shot-landed not-armor-penetration">Bullet with damage(<span class="shot-value">${bulletDmg}</span>) does not penetrated armor(<span class="shot-value">${cumulatedArmorValue}</span>) on <span class="shot-part-info">${hitLocation}</span>.</div>`
      }
      return {
          logStr: logStr,
          targetObj: targetObj
      }
}
  