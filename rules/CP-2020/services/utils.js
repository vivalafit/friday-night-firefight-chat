exports.getBattleData = (battleData, roomCache) => {
    //shoter calculations
    const shooterArr = battleData.shooter.split("-");
    const shooterType = shooterArr[0] === "goon" ? "goons" : "men";
    const shooter = roomCache[shooterType][shooterArr[1]];
    const shooterAimMods = shooter.fightStats.mods
    .split(" ")
    .map(x => {
        const parsed = parseInt(x);
        if (parsed) {
            return parsed;
        }
        return 0
    })
    .reduce((accumulator, currentValue) => {
        return accumulator + currentValue
    }, 0);

    //target calculations
    const targetArr = battleData.target.split("-");
    const targetType = targetArr[0] === "goon" ? "goons" : "men";
    const target = roomCache[targetType][targetArr[1]];

    return {
        shooter,
        shooterAimMods,
        target,
        targetArr
    }
}

exports.getTargetSummary = (target, logStr) => {
    // Check if target is stunned or dead
    let stunDeathSummary = "";
    if(target.stunned) {
        stunDeathSummary = `<div class="title-summary stunned">Target shocked and fainted on ${target.stunnedOn} shot!</div>`;
    }
    if(target.dead) {
        stunDeathSummary = `${stunDeathSummary}<div class="title-summary dead">Target is dead on ${target.deadOn} shot!</div>`;
    } 
    return `${stunDeathSummary}${logStr}`;
}

exports.validateBattleData = (battleData) => {
    if (!battleData.shooter || !battleData.target) {
        throw '<div class="shot-landed armor-penetration">No Shooter or Target Selected.</div>'
    }
    if (!battleData.fireMod) {
        throw '<div class="shot-landed armor-penetration">No Firemod Selected.</div>'
    }
    if ((battleData.fireMod === "three-round" || battleData.fireMod === "full-auto") && !battleData.range) {
        throw '<div class="shot-landed armor-penetration">No Range Selected when Three Round/ Auto Fire mod active.</div>'
    }
    if ((battleData.fireMod === "full-auto" || battleData.fireMod === "single") && !battleData.wpnBullets) {
        throw '<div class="shot-landed armor-penetration">No Bullet Number Selected when Auto Fire/Single Fire mod active.</div>'
    }
    const splitted = battleData.wpnDmg.split("d");
    if (parseInt(splitted[0]) > 100 || parseInt(splitted[1]) > 100) {
        throw '<div class="shot-landed armor-penetration">Your have tried really hard 🤡</div>'
    }
}

exports.resetTargetStatus = (target) => {
    target.stunned = false;
    target.dead = false
}