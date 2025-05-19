// controllers/document.controller.js
const DocumentRepository = require('../models/DocumentRepository');
const DocumentCategory = require('../models/DocumentCategory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');

// Create document category
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, parent } = req.body;
  
  const category = await DocumentCategory.create({
    name,
    description,
    parent
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      category
    }
  });
});

// Get document categories
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = await DocumentCategory.find()
    .populate('parent', 'name')
    .sort({ name: 1 });
  
  // Build hierarchical structure
  const rootCategories = categories.filter(cat => !cat.parent);
  
  // Function to build tree recursively
  const buildTree = (category) => {
    const children = categories.filter(cat => 
      cat.parent && cat.parent._id.toString() === category._id.toString()
    );
    
    return {
      _id: category._id,
      name: category.name,
      description: category.description,
      children: children.map(buildTree)
    };
  };
  
  const categoryTree = rootCategories.map(buildTree);
  
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories,
      categoryTree
    }
  });
});

// Upload document
exports.uploadDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }
  
  const { title, description, documentCategory, accessLevel, allowedRoles } = req.body;
  
  // Upload file
  const attachment = await fileService.uploadFile(req.file, 'documents');
  
  // Create document record
  const document = await DocumentRepository.create({
    title,
    description,
    documentCategory,
    attachment,
    version: req.body.version || '1.0',
    uploadedBy: req.user.id,
    accessLevel: accessLevel || 'public',
    allowedRoles: allowedRoles ? JSON.parse(allowedRoles) : [],
    isArchived: false
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      document
    }
  });
});

// Get documents
exports.getDocuments = catchAsync(async (req, res, next) => {
  const { category, search, accessLevel } = req.query;
  
  // Build query
  const query = { isArchived: false };
  
  if (category) {
    query.documentCategory = category;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Handle access level filtering
  if (accessLevel) {
    query.accessLevel = accessLevel;
  }
  
  // Handle role-based access
  if (!req.user.roles.includes('Admin')) {
    // If not admin, only show public documents or those available to user's roles
    const userRoles = req.user.roles.map(role => role.toString());
    
    query.$or = [
      { accessLevel: 'public' },
      {
        accessLevel: 'restricted',
        allowedRoles: { $in: userRoles }
      },
      { uploadedBy: req.user.id } // User can see their own docs
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [documents, total] = await Promise.all([
    DocumentRepository.find(query)
      .populate('documentCategory', 'name')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DocumentRepository.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: documents.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      documents
    }
  });
});

// Get document by ID
exports.getDocumentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const document = await DocumentRepository.findById(id)
    .populate('documentCategory', 'name')
    .populate('uploadedBy', 'username');
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }
  
  // controllers/document.controller.js (continued)
// Get document by ID (continued)
  // Check access permissions
  if (document.accessLevel === 'restricted' && !req.user.roles.includes('Admin')) {
    const userRoles = req.user.roles.map(role => role.toString());
    const isAllowed = document.allowedRoles.some(role => userRoles.includes(role.toString()));
    const isOwner = document.uploadedBy._id.toString() === req.user.id;
    
    if (!isAllowed && !isOwner) {
      return next(new AppError('You do not have permission to access this document', 403));
    }
  }
  
  if (document.accessLevel === 'private' && 
      document.uploadedBy._id.toString() !== req.user.id && 
      !req.user.roles.includes('Admin')) {
    return next(new AppError('You do not have permission to access this document', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      document
    }
  });
});

// Update document
exports.updateDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, documentCategory, accessLevel, allowedRoles, version } = req.body;
  
  // Find the document
  const document = await DocumentRepository.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }
  
  // Check permissions
  if (document.uploadedBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You do not have permission to update this document', 403));
  }
  
  // Update fields
  if (title) document.title = title;
  if (description) document.description = description;
  if (documentCategory) document.documentCategory = documentCategory;
  if (accessLevel) document.accessLevel = accessLevel;
  if (allowedRoles) document.allowedRoles = JSON.parse(allowedRoles);
  if (version) document.version = version;
  
  // Handle file update if provided
  if (req.file) {
    // Delete old file
    await fileService.deleteFile(document.attachment);
    
    // Upload new file
    document.attachment = await fileService.uploadFile(req.file, 'documents');
  }
  
  // Save changes
  await document.save();
  
  res.status(200).json({
    status: 'success',
    data: {
      document
    }
  });
});

// Archive document
exports.archiveDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Find the document
  const document = await DocumentRepository.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }
  
  // Check permissions
  if (document.uploadedBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You do not have permission to archive this document', 403));
  }
  
  // Archive the document
  document.isArchived = true;
  await document.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Document archived successfully',
    data: null
  });
});

// Delete document
exports.deleteDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Find the document
  const document = await DocumentRepository.findById(id);
  
  if (!document) {
    return next(new AppError('Document not found', 404));
  }
  
  // Check permissions
  if (document.uploadedBy.toString() !== req.user.id && !req.user.roles.includes('Admin')) {
    return next(new AppError('You do not have permission to delete this document', 403));
  }
  
  // Delete the file
  await fileService.deleteFile(document.attachment);
  
  // Delete the document record
  await DocumentRepository.findByIdAndDelete(id);
  
  res.status(200).json({
    status: 'success',
    message: 'Document deleted successfully',
    data: null
  });
});