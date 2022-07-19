const { calculateSingleShotDmg } = require ('../services/single-bullet');

exports.calculateSingleShot = ({ logStr, shooterObj, targetObj, shooterAimMods, battleData}) => {
    for(let i = 0; i < battleData.wpnBullets; i++) {
        const shotCalculations = calculateSingleShotDmg(logStr, shooterObj, targetObj, shooterAimMods, battleData, i);
        logStr = shotCalculations;
    }
    return logStr;
}