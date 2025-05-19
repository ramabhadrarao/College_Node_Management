// routes/menu.routes.js
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { protect, restrictTo } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validator');

// Public route to get user menu
router.get('/user/:menuName', menuController.getUserMenu);

// All other routes require authentication
router.use(protect);

// Menu routes (Admin only)
router.route('/')
  .get(
    restrictTo('Admin'),
    menuController.getAllMenus
  )
  .post(
    restrictTo('Admin'),
    validateBody([
      'name'
    ]),
    menuController.createMenu
  );

router.route('/:id')
  .patch(
    restrictTo('Admin'),
    menuController.updateMenu
  )
  .delete(
    restrictTo('Admin'),
    menuController.deleteMenu
  );

// Menu item routes (Admin only)
router.route('/:menuId/items')
  .get(menuController.getMenuItems)
  .post(
    restrictTo('Admin'),
    validateBody([
      'title'
    ]),
    menuController.createMenuItem
  );

router.route('/items/:id')
  .patch(
    restrictTo('Admin'),
    menuController.updateMenuItem
  )
  .delete(
    restrictTo('Admin'),
    menuController.deleteMenuItem
  );

module.exports = router;