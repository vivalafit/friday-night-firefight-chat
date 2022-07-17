const { calculateSingleMeleeHit } = require ('../services/melee-hit');

exports.calculateSingleShot = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData} ) => {
    for(let i = 0; i < battleData.wpnBullets; i++) {
        const shotCalculations = calculateSingleMeleeHit(logStr, shooterObj, targetObj, shooterAimMods, battleData, i);
        logStr = shotCalculations;
    }
    return logStr;
}