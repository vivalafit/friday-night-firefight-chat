var Roll = require('roll');
exports.calculateRoll = async (userObject) => {
    try {
        //io.to(roomId).emit('message-created', messageObj)
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

