const serverCache = require('../../utils/server-cache');
const { validateBattleData, getBattleData, getTargetSummary, resetTargetStatus } = require('./services/utils');
const { calculateSingleShot } = require('./fire-mods/single');
const { calculateBurstShotDmg } = require('./fire-mods/burst');
const { calculateAutoShotDmg } = require('./fire-mods/auto');

const FIRE_MODS_FUNCTIONS = {
    "single": calculateSingleShot,
    "three-round": calculateBurstShotDmg,
    "full-auto": calculateAutoShotDmg
}

exports.calculate = (data) => {
    let roomCache = serverCache.get(data.roomId);
    let battleData = data.data;
    let logStr = `<div class="shot-landed shot-title">The Shooter : ${battleData.shooter} and the Target : ${battleData.target}</div>`;

    validateBattleData(battleData);

    const { shooter, shooterAimMods, target, targetArr } = getBattleData(battleData, roomCache);
    const params = { logStr, shooterObj: shooter, targetObj: target, shooterAimMods, battleData };
    const fireFunction = FIRE_MODS_FUNCTIONS[battleData.fireMod];
    logStr = fireFunction(params);
    logStr = getTargetSummary(target, logStr);

    resetTargetStatus(target);
    
    serverCache.set(data.roomId, roomCache);
    data.io.to(data.roomId).emit('calculation-completed', { logStr: logStr });
    data.io.to(data.roomId).emit('goon-updated', { goon: target, type: targetArr[0] });
}