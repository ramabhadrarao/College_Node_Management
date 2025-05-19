// controllers/menu.controller.js
const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');
const Permission = require('../models/Permission');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all menus
 * @route GET /api/menus
 * @access Admin
 */
exports.getAllMenus = catchAsync(async (req, res, next) => {
  const menus = await Menu.find().sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: menus.length,
    data: {
      menus
    }
  });
});

/**
 * Create menu
 * @route POST /api/menus
 * @access Admin
 */
exports.createMenu = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  
  // Check if menu already exists
  const existingMenu = await Menu.findOne({ name });
  if (existingMenu) {
    return next(new AppError('Menu with this name already exists', 400));
  }
  
  // Create menu
  const menu = await Menu.create({
    name,
    description
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      menu
    }
  });
});

/**
 * Update menu
 * @route PATCH /api/menus/:id
 * @access Admin
 */
exports.updateMenu = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  
  // Update menu
  const menu = await Menu.findByIdAndUpdate(
    req.params.id,
    { name, description },
    { new: true, runValidators: true }
  );
  
  if (!menu) {
    return next(new AppError('Menu not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      menu
    }
  });
});

/**
 * Delete menu
 * @route DELETE /api/menus/:id
 * @access Admin
 */
exports.deleteMenu = catchAsync(async (req, res, next) => {
  // Check if menu has menu items
  const menuItemCount = await MenuItem.countDocuments({ menu: req.params.id });
  
  if (menuItemCount > 0) {
    return next(new AppError('Cannot delete menu with existing menu items', 400));
  }
  
  // Delete menu
  const menu = await Menu.findByIdAndDelete(req.params.id);
  
  if (!menu) {
    return next(new AppError('Menu not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

/**
 * Get menu items
 * @route GET /api/menus/:menuId/items
 * @access Admin, User
 */
exports.getMenuItems = catchAsync(async (req, res, next) => {
  const { menuId } = req.params;
  
  // Check if menu exists
  const menu = await Menu.findById(menuId);
  if (!menu) {
    return next(new AppError('Menu not found', 404));
  }
  
  // Get menu items
  const menuItems = await MenuItem.find({ menu: menuId })
    .populate('parent', 'title')
    .populate('permissions', 'name description')
    .sort({ itemOrder: 1 });
  
  res.status(200).json({
    status: 'success',
    results: menuItems.length,
    data: {
      menu,
      menuItems
    }
  });
});

/**
 * Create menu item
 * @route POST /api/menus/:menuId/items
 * @access Admin
 */
exports.createMenuItem = catchAsync(async (req, res, next) => {
  const { menuId } = req.params;
  const { title, route, icon, itemOrder, isActive, target, parent, permissions } = req.body;
  
  // Check if menu exists
  const menu = await Menu.findById(menuId);
  if (!menu) {
    return next(new AppError('Menu not found', 404));
  }
  
  // Create menu item
  const menuItem = await MenuItem.create({
    menu: menuId,
    parent,
    title,
    route,
    icon,
    itemOrder: itemOrder || 0,
    isActive: isActive !== undefined ? isActive : true,
    target: target || '_self',
    permissions
  });
  
  // Populate for response
  await menuItem
    .populate('parent', 'title')
    .populate('permissions', 'name description');
  
  res.status(201).json({
    status: 'success',
    data: {
      menuItem
    }
  });
});

/**
 * Update menu item
 * @route PATCH /api/menus/items/:id
 * @access Admin
 */
exports.updateMenuItem = catchAsync(async (req, res, next) => {
  const { title, route, icon, itemOrder, isActive, target, parent, permissions } = req.body;
  
  // Update fields
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (route !== undefined) updates.route = route;
  if (icon !== undefined) updates.icon = icon;
  if (itemOrder !== undefined) updates.itemOrder = itemOrder;
  if (isActive !== undefined) updates.isActive = isActive;
  if (target !== undefined) updates.target = target;
  if (parent !== undefined) updates.parent = parent === 'null' ? null : parent;
  if (permissions !== undefined) updates.permissions = permissions;
  
  // Update menu item
  const menuItem = await MenuItem.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!menuItem) {
    return next(new AppError('Menu item not found', 404));
  }
  
  // Populate for response
  await menuItem
    .populate('parent', 'title')
    .populate('permissions', 'name description');
  
  res.status(200).json({
    status: 'success',
    data: {
      menuItem
    }
  });
});

/**
 * Delete menu item
 * @route DELETE /api/menus/items/:id
 * @access Admin
 */
exports.deleteMenuItem = catchAsync(async (req, res, next) => {
  // Check if menu item is a parent to other items
  const childItemCount = await MenuItem.countDocuments({ parent: req.params.id });
  
  if (childItemCount > 0) {
    return next(new AppError('Cannot delete menu item with existing child items', 400));
  }
  
  // Delete menu item
  const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
  
  if (!menuItem) {
    return next(new AppError('Menu item not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: null
  });
});

/**
 * Get user menu
 * @route GET /api/menus/user/:menuName
 * @access Authenticated User
 */
exports.getUserMenu = catchAsync(async (req, res, next) => {
  const { menuName } = req.params;
  
  // Get menu
  const menu = await Menu.findOne({ name: menuName });
  if (!menu) {
    return next(new AppError('Menu not found', 404));
  }
  
  // Get user permissions
  let userPermissions = [];
  
  if (req.user && req.user.roles) {
    const userRoles = await Role.find({ _id: { $in: req.user.roles } }).populate('permissions');
    
    userRoles.forEach(role => {
      role.permissions.forEach(permission => {
        userPermissions.push(permission._id.toString());
      });
    });
  }
  
  // Get all menu items
  const allMenuItems = await MenuItem.find({ 
    menu: menu._id,
    isActive: true
  }).populate('permissions', 'name');
  
  // Filter items by permission
  const filteredMenuItems = allMenuItems.filter(item => {
    // If no permissions required, show to all
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    
    // Check if user has any of the required permissions
    return item.permissions.some(permission => 
      userPermissions.includes(permission._id.toString())
    );
  });
  
  // Build hierarchical menu
  const rootItems = filteredMenuItems.filter(item => !item.parent);
  
  // Function to build tree recursively
  const buildMenuTree = (parentItem) => {
    const children = filteredMenuItems.filter(item => 
      item.parent && item.parent.toString() === parentItem._id.toString()
    );
    
    const formattedItem = {
      id: parentItem._id,
      title: parentItem.title,
      route: parentItem.route,
      icon: parentItem.icon,
      target: parentItem.target,
      children: children.sort((a, b) => a.itemOrder - b.itemOrder).map(buildMenuTree)
    };
    
    return formattedItem;
  };
  
  // Build the menu structure
  const menuStructure = rootItems
    .sort((a, b) => a.itemOrder - b.itemOrder)
    .map(buildMenuTree);
  
  res.status(200).json({
    status: 'success',
    data: {
      menu: {
        id: menu._id,
        name: menu.name,
        items: menuStructure
      }
    }
  });
});

module.exports = exports;