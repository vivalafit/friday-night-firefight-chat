
exports.renderRoom = async (req, res, next) => {
    try {
        res.render('room', { roomId: req.params.room })
    } catch (e) {
        next(e)
    }

}

