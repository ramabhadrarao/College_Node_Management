// routes/room.routes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// All routes require authentication
router.use(protect);

// Room routes
router.route('/')
  .get(roomController.getRooms)
  .post(
    restrictTo('Admin'),
    validateBody([
      'roomNumber',
      'building'
    ]),
    roomController.createRoom
  );

// Room specific routes
router.route('/:id')
  .get(roomController.getRoomById)
  .patch(
    restrictTo('Admin'),
    roomController.updateRoom
  )
  .delete(
    restrictTo('Admin'),
    roomController.deleteRoom
  );

// Room availability
router.get(
  '/:roomId/availability',
  roomController.getRoomAvailability
);

module.exports = router;