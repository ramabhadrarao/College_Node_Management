// controllers/library.controller.js
const LibraryBook = require('../models/LibraryBook');
const LibraryBookCategory = require('../models/LibraryBookCategory');
const LibraryTransaction = require('../models/LibraryTransaction');
const LibraryReservation = require('../models/LibraryReservation');
const LibrarySetting = require('../models/LibrarySetting');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fileService = require('../services/fileService');

// Create book category
exports.createBookCategory = catchAsync(async (req, res, next) => {
  const { name, description, parent } = req.body;
  
  const category = await LibraryBookCategory.create({
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

// Get book categories
exports.getBookCategories = catchAsync(async (req, res, next) => {
  const categories = await LibraryBookCategory.find()
    .populate('parent', 'name')
    .sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories
    }
  });
});

// Add book
exports.addBook = catchAsync(async (req, res, next) => {
  const {
    title,
    author,
    publisher,
    isbn,
    edition,
    publicationYear,
    subject,
    description,
    pages,
    copiesAvailable,
    totalCopies,
    locationShelf,
    categories,
    authors
  } = req.body;
  
  // Handle cover image upload
  let coverImageAttachment;
  if (req.file) {
    coverImageAttachment = await fileService.uploadFile(req.file, 'library/books');
  }
  
  // Process authors array
  let processedAuthors = [];
  if (authors && typeof authors === 'string') {
    try {
      processedAuthors = JSON.parse(authors);
    } catch (error) {
      // If parsing fails, use the author field
      processedAuthors = [{ authorName: author, isPrimary: true }];
    }
  } else if (author) {
    processedAuthors = [{ authorName: author, isPrimary: true }];
  }
  
  // Process categories array
  let processedCategories = [];
  if (categories && typeof categories === 'string') {
    try {
      processedCategories = JSON.parse(categories);
    } catch (error) {
      // If parsing fails, treat as single category
      if (categories) {
        processedCategories = [categories];
      }
    }
  } else if (Array.isArray(categories)) {
    processedCategories = categories;
  }
  
  // Create book
  const book = await LibraryBook.create({
    title,
    author,
    publisher,
    isbn,
    edition,
    publicationYear: parseInt(publicationYear) || null,
    subject,
    description,
    pages: parseInt(pages) || null,
    copiesAvailable: parseInt(copiesAvailable) || 0,
    totalCopies: parseInt(totalCopies) || 0,
    locationShelf,
    coverImageAttachment,
    categories: processedCategories,
    authors: processedAuthors,
    status: 'available'
  });
  
  // Populate references for response
  await book.populate('categories', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      book
    }
  });
});

// Get books
exports.getBooks = catchAsync(async (req, res, next) => {
  const { title, author, isbn, category, status, search } = req.query;
  
  // Build query
  const query = {};
  
  if (title) query.title = { $regex: title, $options: 'i' };
  if (author) query.author = { $regex: author, $options: 'i' };
  if (isbn) query.isbn = isbn;
  if (category) query.categories = { $in: [category] };
  if (status) query.status = status;
  
  // General search
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { publisher: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [books, total] = await Promise.all([
    LibraryBook.find(query)
      .populate('categories', 'name')
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit),
    LibraryBook.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: books.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      books
    }
  });
});

// Get book by ID
exports.getBookById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const book = await LibraryBook.findById(id)
    .populate('categories', 'name');
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

// Update book
exports.updateBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    author,
    publisher,
    isbn,
    edition,
    publicationYear,
    subject,
    description,
    pages,
    copiesAvailable,
    totalCopies,
    locationShelf,
    categories,
    authors,
    status
  } = req.body;
  
  // Find the book
  const book = await LibraryBook.findById(id);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }
  
  // Handle cover image upload
  if (req.file) {
    // Delete old image if exists
    if (book.coverImageAttachment) {
      await fileService.deleteFile(book.coverImageAttachment);
    }
    
    book.coverImageAttachment = await fileService.uploadFile(req.file, 'library/books');
  }
  
  // Process authors array
  if (authors && typeof authors === 'string') {
    try {
      book.authors = JSON.parse(authors);
    } catch (error) {
      // If parsing fails, don't update authors
    }
  } else if (authors && Array.isArray(authors)) {
    book.authors = authors;
  }
  
  // Process categories array
  if (categories && typeof categories === 'string') {
    try {
      book.categories = JSON.parse(categories);
    } catch (error) {
      // If parsing fails, don't update categories
    }
  } else if (categories && Array.isArray(categories)) {
    book.categories = categories;
  }
  
  // Update basic fields
  if (title) book.title = title;
  if (author) book.author = author;
  if (publisher) book.publisher = publisher;
  if (isbn) book.isbn = isbn;
  if (edition) book.edition = edition;
  if (publicationYear) book.publicationYear = parseInt(publicationYear);
  if (subject) book.subject = subject;
  if (description) book.description = description;
  if (pages) book.pages = parseInt(pages);
  if (copiesAvailable !== undefined) book.copiesAvailable = parseInt(copiesAvailable);
  if (totalCopies !== undefined) book.totalCopies = parseInt(totalCopies);
  if (locationShelf) book.locationShelf = locationShelf;
  if (status) book.status = status;
  
  // Save changes
  await book.save();
  
  // Populate references for response
  await book.populate('categories', 'name');
  
  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

// Delete book
exports.deleteBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const book = await LibraryBook.findById(id);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }
  
  // Check if book has active transactions
  const activeTransactions = await LibraryTransaction.countDocuments({
    book: id,
    status: { $in: ['issued', 'overdue'] }
  });
  
  if (activeTransactions > 0) {
    return next(new AppError('Cannot delete book with active transactions', 400));
  }
  
  // Delete cover image if exists
  if (book.coverImageAttachment) {
    await fileService.deleteFile(book.coverImageAttachment);
  }
  
  // Delete the book
  await LibraryBook.findByIdAndDelete(id);
  
  res.status(200).json({
    status: 'success',
    message: 'Book deleted successfully',
    data: null
  });
});

// Issue book to user
exports.issueBook = catchAsync(async (req, res, next) => {
  const { bookId, userId, dueDate } = req.body;
  
  // Check if book exists and is available
  const book = await LibraryBook.findById(bookId);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }
  
  if (book.copiesAvailable <= 0) {
    return next(new AppError('No copies available for issue', 400));
  }
  
  // Check if user exists
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if user already has this book
  const existingTransaction = await LibraryTransaction.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['issued', 'overdue'] }
  });
  
  if (existingTransaction) {
    return next(new AppError('User already has this book issued', 400));
  }
  
  // Get library settings
  const maxBooksPerUser = 3; // Default value
  const defaultLoanDuration = 14; // Default value in days
  
  // Calculate due date if not provided
  const calculatedDueDate = dueDate 
    ? new Date(dueDate) 
    : new Date(Date.now() + defaultLoanDuration * 24 * 60 * 60 * 1000);
  
  // Create transaction
  const transaction = await LibraryTransaction.create({
    book: bookId,
    user: userId,
    issueDate: new Date(),
    dueDate: calculatedDueDate,
    status: 'issued'
  });
  
  // Update book availability
  book.copiesAvailable -= 1;
  await book.save();
  
  // Fulfill reservation if exists
  const reservation = await LibraryReservation.findOne({
    book: bookId,
    user: userId,
    status: 'active'
  });
  
  if (reservation) {
    reservation.status = 'fulfilled';
    await reservation.save();
  }
  
  // Populate references for response
  await transaction
    .populate('book', 'title isbn')
    .populate('user', 'username email');
  
  res.status(201).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

// Return book
exports.returnBook = catchAsync(async (req, res, next) => {
  const { transactionId, fineAmount, finePaid, remarks } = req.body;
  
  // Find the transaction
  const transaction = await LibraryTransaction.findById(transactionId);
  
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }
  
  if (transaction.status === 'returned') {
    return next(new AppError('Book already returned', 400));
  }
  
  // Update transaction
  transaction.returnDate = new Date();
  transaction.status = 'returned';
  
  if (fineAmount !== undefined) {
    transaction.fineAmount = fineAmount;
  } else {
    // Calculate fine if applicable
    const dueDate = new Date(transaction.dueDate);
    const returnDate = new Date();
    
    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (24 * 60 * 60 * 1000));
      const finePerDay = 5; // Default fine per day
      transaction.fineAmount = daysLate * finePerDay;
    }
  }
  
  if (finePaid !== undefined) {
    transaction.finePaid = finePaid;
  }
  
  if (remarks) {
    transaction.remarks = remarks;
  }
  
  await transaction.save();
  
  // Update book availability
  const book = await LibraryBook.findById(transaction.book);
  if (book) {
    book.copiesAvailable += 1;
    await book.save();
  }
  
  // Populate references for response
  await transaction
    .populate('book', 'title isbn')
    .populate('user', 'username email');
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

// Renew book
exports.renewBook = catchAsync(async (req, res, next) => {
  const { transactionId } = req.body;
  
  // Find the transaction
  const transaction = await LibraryTransaction.findById(transactionId);
  
  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }
  
  if (transaction.status !== 'issued' && transaction.status !== 'overdue') {
    return next(new AppError('Only issued or overdue books can be renewed', 400));
  }
  
  if (transaction.renewedCount >= 2) {
    return next(new AppError('Maximum renewals reached for this book', 400));
  }
  
  // Check for reservations
  const reservationExists = await LibraryReservation.findOne({
    book: transaction.book,
    status: 'active'
  });
  
  if (reservationExists) {
    return next(new AppError('Cannot renew as the book is reserved by another user', 400));
  }
  
  // Update due date (extend by default loan duration)
  const defaultLoanDuration = 14; // Default value in days
  const newDueDate = new Date(Date.now() + defaultLoanDuration * 24 * 60 * 60 * 1000);
  
  transaction.dueDate = newDueDate;
  transaction.renewedCount += 1;
  transaction.status = 'issued'; // Reset to issued if it was overdue
  
  await transaction.save();
  
  // Populate references for response
  await transaction
    .populate('book', 'title isbn')
    .populate('user', 'username email');
  
  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

// Get user transactions
exports.getUserTransactions = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status } = req.query;
  
  // Build query
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  // Execute query
  const transactions = await LibraryTransaction.find(query)
    .populate('book', 'title author isbn coverImageAttachment')
    .sort({ issueDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: transactions.length,
    data: {
      transactions
    }
  });
});

// Reserve book
exports.reserveBook = catchAsync(async (req, res, next) => {
  const { bookId, userId } = req.body;
  
  // Check if book exists
  const book = await LibraryBook.findById(bookId);
  
  if (!book) {
    return next(new AppError('Book not found', 404));
  }
  
  // Check if book has available copies
  if (book.copiesAvailable > 0) {
    return next(new AppError('Book is available for checkout, no need to reserve', 400));
  }
  
  // Check if user exists
  const user = await User.findById(userId);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if user already has this book
  const existingTransaction = await LibraryTransaction.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['issued', 'overdue'] }
  });
  
  if (existingTransaction) {
    return next(new AppError('User already has this book issued', 400));
  }
  
  // Check if user already has a reservation for this book
  const existingReservation = await LibraryReservation.findOne({
    book: bookId,
    user: userId,
    status: 'active'
  });
  
  if (existingReservation) {
    return next(new AppError('User already has an active reservation for this book', 400));
  }
  
  // Calculate expiry date (7 days from now)
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  // Create reservation
  const reservation = await LibraryReservation.create({
    book: bookId,
    user: userId,
    reservationDate: new Date(),
    expiryDate,
    status: 'active'
  });
  
  // Populate references for response
  await reservation
    .populate('book', 'title isbn')
    .populate('user', 'username email');
  
  res.status(201).json({
    status: 'success',
    data: {
      reservation
    }
  });
});

// controllers/library.controller.js (continued)
// Cancel reservation
exports.cancelReservation = catchAsync(async (req, res, next) => {
  const { reservationId } = req.body;
  
  // Find the reservation
  const reservation = await LibraryReservation.findById(reservationId);
  
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }
  
  if (reservation.status !== 'active') {
    return next(new AppError('Only active reservations can be cancelled', 400));
  }
  
  // Update reservation status
  reservation.status = 'cancelled';
  await reservation.save();
  
  res.status(200).json({
    status: 'success',
    message: 'Reservation cancelled successfully',
    data: null
  });
});

// Get user reservations
exports.getUserReservations = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status } = req.query;
  
  // Build query
  const query = { user: userId };
  
  if (status) {
    query.status = status;
  }
  
  // Execute query
  const reservations = await LibraryReservation.find(query)
    .populate('book', 'title author isbn coverImageAttachment')
    .sort({ reservationDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: reservations.length,
    data: {
      reservations
    }
  });
});

// Get library settings
exports.getLibrarySettings = catchAsync(async (req, res, next) => {
  const settings = await LibrarySetting.find().sort('settingKey');
  
  // Convert to key-value object
  const settingsObject = settings.reduce((obj, setting) => {
    obj[setting.settingKey] = setting.settingValue;
    return obj;
  }, {});
  
  res.status(200).json({
    status: 'success',
    data: {
      settings: settingsObject
    }
  });
});

// Update library setting
exports.updateLibrarySetting = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const { value, description } = req.body;
  
  // Find and update or create the setting
  const setting = await LibrarySetting.findOneAndUpdate(
    { settingKey: key },
    {
      settingValue: value,
      description: description
    },
    { upsert: true, new: true }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      setting
    }
  });
});

// Generate library statistics
exports.getLibraryStatistics = catchAsync(async (req, res, next) => {
  // Total books
  const totalBooks = await LibraryBook.countDocuments();
  
  // Total unique titles
  const uniqueTitles = await LibraryBook.distinct('title').length;
  
  // Books by status
  const booksByStatus = await LibraryBook.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Current issues
  const currentIssues = await LibraryTransaction.countDocuments({
    status: { $in: ['issued', 'overdue'] }
  });
  
  // Overdue books
  const overdueBooks = await LibraryTransaction.countDocuments({
    status: 'overdue'
  });
  
  // Total transactions
  const totalTransactions = await LibraryTransaction.countDocuments();
  
  // Active reservations
  const activeReservations = await LibraryReservation.countDocuments({
    status: 'active'
  });
  
  // Books by category
  const booksByCategory = await LibraryBook.aggregate([
    {
      $unwind: '$categories'
    },
    {
      $group: {
        _id: '$categories',
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'librarybookcategories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $project: {
        category: '$categoryInfo.name',
        count: 1
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      totalBooks,
      uniqueTitles,
      booksByStatus,
      currentIssues,
      overdueBooks,
      totalTransactions,
      activeReservations,
      booksByCategory
    }
  });
});