//import your own set of rules and execute calculate();
const CP_2020 = require('../rules/CP-2020/index');

exports.countBattle = async (data) => {
    try {
        CP_2020.calculate(data);
    } catch (e) {
        console.log(e);
        data.io.to(data.roomId).emit('calculation-completed', {logStr: `<div class="shot-landed armor-penetration">Error: ${e}</div>`});
    }
}