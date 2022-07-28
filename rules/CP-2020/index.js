const serverCache = require('../../utils/server-cache');
const { validateBattleData, getBattleData, getTargetSummary, resetTargetStatus, validateMeleeData } = require('./services/utils');
const { calculateSingleShot } = require('./fire-mods/single');
const { calculateBurstShotDmg } = require('./fire-mods/burst');
const { calculateAutoShotDmg } = require('./fire-mods/auto');
const { calculateAuthoShotgunDmg } = require('./fire-mods/auto-shotgun');
const { calculateFistHit, calculateCyberFistHit, calculateMeleeHit, calculateKatanaHit } = require ('./fire-mods/melee');

const FIRE_MODS_FUNCTIONS = {
    "single": calculateSingleShot,
    "three-round": calculateBurstShotDmg,
    "full-auto": calculateAutoShotDmg,
    "auto-shotgun": calculateAuthoShotgunDmg
}

const MELEE_MODS_FUNCTIONS = {
    "fist": calculateFistHit,
    "fist-cyber": calculateCyberFistHit,
    "melee": calculateMeleeHit,
    "melee-katana": calculateKatanaHit
}

exports.calculate = (data) => {
    let roomCache = serverCache.get(data.roomId);
    let battleData = data.data;
    if (battleData.isMelee) { 
        validateMeleeData(battleData)
    } else {
        validateBattleData(battleData);
    }

    const { shooter, shooterAimMods, target, targetArr } = getBattleData(battleData, roomCache);
    const shooterName = shooter.additionalStats.name;
    const targetName = target.additionalStats.name;

    let fireFunction;
    if (battleData.isMelee) {
        fireFunction = MELEE_MODS_FUNCTIONS[battleData.meleeMod];
    } else {
        fireFunction = FIRE_MODS_FUNCTIONS[battleData.fireMod];
    }
    
    let logStr = `<div class="shot-landed shot-title">The Shooter : ${shooterName ? shooterName : battleData.shooter} and the Target : ${targetName ? targetName : battleData.target}</div>`;

    const params = { logStr, shooterObj: shooter, targetObj: target, shooterAimMods, battleData };
    logStr = fireFunction(params);
    logStr = getTargetSummary(target, logStr);

    resetTargetStatus(target);
    
    serverCache.set(data.roomId, roomCache);
    data.io.to(data.roomId).emit('calculation-completed', { logStr: logStr });
    data.io.to(data.roomId).emit('goon-updated', { goon: target, type: targetArr[0] });
}