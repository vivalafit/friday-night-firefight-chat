var Roll = require('roll');
exports.calculateRoll = async (userObject) => {
    try {
        const splitted = userObject.roll.split("d");
        if(parseInt(splitted[0]) > 100 || parseInt(splitted[1]) > 100) {
            return userObject.io.to(userObject.roomId).emit('roll-calculated', {
                user: userObject.user,
                specMsg: "Your have tried really hard 🤡"
            });
        }

        const roll = new Roll();
        const rollResult = roll.roll(userObject.roll);
        userObject.io.to(userObject.roomId).emit('roll-calculated', {
            user: userObject.user,
            roll : rollResult.rolled,
            result: rollResult.result
        });
    } catch (e) {
        userObject.io.to(userObject.roomId).emit('roll-calculated', {
            user: userObject.user,
            error: e
        });
    }
}

