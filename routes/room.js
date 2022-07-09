const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room");

router.get('/:room', async (req, res, next) => {
    roomController.renderRoom(req, res, next);
});

router.get('/:room/export-goons', async (req, res, next) => {
    roomController.exportGoons(req, res, next);
});

router.post('/:room/:roll', async (req, res, next) => {
    roomController.calculateRoll(req, res, next);
});

module.exports = router;