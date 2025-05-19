// controllers/fee.controller.js
const StudentFeeInvoice = require('../models/StudentFeeInvoice');
const StudentFeePayment = require('../models/StudentFeePayment');
const FeeWaiver = require('../models/FeeWaiver');
const FeeStructure = require('../models/FeeStructure');
const FeeType = require('../models/FeeType');
const Student = require('../models/Student');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateUniqueId } = require('../utils/helpers');

// Create fee structure
exports.createFeeStructure = catchAsync(async (req, res, next) => {
  const { batch, program, feeType, amount, effectiveFrom, effectiveTo } = req.body;
  
  const feeStructure = await FeeStructure.create({
    batch,
    program,
    feeType,
    amount,
    effectiveFrom: new Date(effectiveFrom),
    effectiveTo: effectiveTo ? new Date(effectiveTo) : null
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      feeStructure
    }
  });
});

// Get fee structures
exports.getFeeStructures = catchAsync(async (req, res, next) => {
  const { batch, program, feeType } = req.query;
  
  // Build query
  const query = {};
  if (batch) query.batch = batch;
  if (program) query.program = program;
  if (feeType) query.feeType = feeType;
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  
  // Execute query
  const [feeStructures, total] = await Promise.all([
    FeeStructure.find(query)
      .populate('batch', 'name')
      .populate('program', 'name code')
      .populate('feeType', 'name')
      .sort({ effectiveFrom: -1 })
      .skip(skip)
      .limit(limit),
    FeeStructure.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    results: feeStructures.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    },
    data: {
      feeStructures
    }
  });
});

// Create fee type
exports.createFeeType = catchAsync(async (req, res, next) => {
  const { name, description, isRecurring, recurringPeriod } = req.body;
  
  const feeType = await FeeType.create({
    name,
    description,
    isRecurring,
    recurringPeriod
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      feeType
    }
  });
});

// Get fee types
exports.getFeeTypes = catchAsync(async (req, res, next) => {
  const feeTypes = await FeeType.find().sort({ name: 1 });
  
  res.status(200).json({
    status: 'success',
    results: feeTypes.length,
    data: {
      feeTypes
    }
  });
});

// Generate invoice for student
exports.generateInvoice = catchAsync(async (req, res, next) => {
  const { student, semester, academicYear, items, dueDate } = req.body;
  
  // Validate items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Fee items are required', 400));
  }
  
  // Calculate total amount
  let totalAmount = 0;
  
  // Process each fee item
  const processedItems = [];
  
  for (const item of items) {
    // Get fee type
    const feeType = await FeeType.findById(item.feeType);
    if (!feeType) {
      return next(new AppError(`Fee type not found: ${item.feeType}`, 404));
    }
    
    // Check for waivers
    const waiver = await FeeWaiver.findOne({
      student,
      feeType: feeType._id,
      academicYear,
      status: 'active'
    });
    
    let waiverAmount = 0;
    if (waiver) {
      waiverAmount = (item.amount * waiver.waiverPercentage) / 100;
    }
    
    const netAmount = item.amount - waiverAmount;
    totalAmount += netAmount;
    
    processedItems.push({
      feeType: feeType._id,
      amount: item.amount,
      waiverAmount,
      netAmount
    });
  }
  
  // Generate invoice number
  const invoiceNumber = generateUniqueId('INV');
  
  // Create invoice
  const invoice = await StudentFeeInvoice.create({
    student,
    semester,
    academicYear,
    invoiceNumber,
    invoiceDate: new Date(),
    totalAmount,
    dueDate: new Date(dueDate),
    status: 'pending',
    items: processedItems
  });
  
  // Populate references for response
  await invoice
    .populate('student', 'name admissionNo email')
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('items.feeType', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      invoice
    }
  });
});

// Get student invoices
exports.getStudentInvoices = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  const { status } = req.query;
  
  // Build query
  const query = { student: studentId };
  if (status) query.status = status;
  
  // Execute query
  const invoices = await StudentFeeInvoice.find(query)
    .populate('semester', 'name')
    .populate('academicYear', 'yearName')
    .populate('items.feeType', 'name')
    .sort({ invoiceDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: invoices.length,
    data: {
      invoices
    }
  });
});

// Record fee payment
exports.recordPayment = catchAsync(async (req, res, next) => {
  const { invoice, paymentMethod, transactionId, paymentDate, amount } = req.body;
  
  // Check if invoice exists
  const invoiceRecord = await StudentFeeInvoice.findById(invoice);
  if (!invoiceRecord) {
    return next(new AppError('Invoice not found', 404));
  }
  
  // Create payment record
  const payment = await StudentFeePayment.create({
    invoice,
    paymentMethod,
    transactionId,
    paymentDate: new Date(paymentDate),
    amount,
    verified: false
  });
  
  // Update invoice status
  const totalPaid = await StudentFeePayment.aggregate([
    { $match: { invoice: mongoose.Types.ObjectId(invoice) } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const paidAmount = totalPaid.length > 0 ? totalPaid[0].total : 0;
  
  if (paidAmount >= invoiceRecord.totalAmount) {
    invoiceRecord.status = 'paid';
  } else if (paidAmount > 0) {
    invoiceRecord.status = 'partially_paid';
  }
  
  await invoiceRecord.save();
  
  res.status(201).json({
    status: 'success',
    data: {
      payment,
      invoiceStatus: invoiceRecord.status
    }
  });
});

// Get invoice payments
exports.getInvoicePayments = catchAsync(async (req, res, next) => {
  const { invoiceId } = req.params;
  
  const payments = await StudentFeePayment.find({ invoice: invoiceId })
    .populate('paymentMethod', 'name')
    .sort({ paymentDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: {
      payments
    }
  });
});

// Create fee waiver
exports.createWaiver = catchAsync(async (req, res, next) => {
  const { student, feeType, academicYear, semester, waiverPercentage, waiverReason } = req.body;
  
  // Validate waiver percentage
  if (waiverPercentage < 0 || waiverPercentage > 100) {
    return next(new AppError('Waiver percentage must be between 0 and 100', 400));
  }
  
  // Create waiver
  const waiver = await FeeWaiver.create({
    student,
    feeType,
    academicYear,
    semester,
    waiverPercentage,
    waiverReason,
    approvedBy: req.user.id,
    approvedDate: new Date(),
    isActive: true
  });
  
  // Populate references for response
  await waiver
    .populate('student', 'name admissionNo')
    .populate('feeType', 'name')
    .populate('academicYear', 'yearName')
    .populate('semester', 'name');
  
  res.status(201).json({
    status: 'success',
    data: {
      waiver
    }
  });
});

// Get student fee waivers
exports.getStudentWaivers = catchAsync(async (req, res, next) => {
  const { studentId } = req.params;
  
  const waivers = await FeeWaiver.find({ student: studentId })
    .populate('feeType', 'name')
    .populate('academicYear', 'yearName')
    .populate('semester', 'name')
    .populate('approvedBy', 'username')
    .sort({ approvedDate: -1 });
  
  res.status(200).json({
    status: 'success',
    results: waivers.length,
    data: {
      waivers
    }
  });
});

// Generate fee report
exports.generateFeeReport = catchAsync(async (req, res, next) => {
  const { program, batch, semester, academicYear, status } = req.query;
  
  // Build aggregation pipeline
  const pipeline = [
    {
      $match: {}
    }
  ];
  
  // Add filters
  if (program || batch) {
    pipeline.push({
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    });
    
    pipeline.push({
      $unwind: '$studentInfo'
    });
    
    if (program) {
      pipeline.push({
        $match: { 'studentInfo.program': mongoose.Types.ObjectId(program) }
      });
    }
    
    if (batch) {
      pipeline.push({
        $match: { 'studentInfo.batch': mongoose.Types.ObjectId(batch) }
      });
    }
  }
  
  // More filters
  if (semester) {
    pipeline.push({
      $match: { semester: mongoose.Types.ObjectId(semester) }
    });
  }
  
  if (academicYear) {
    pipeline.push({
      $match: { academicYear: mongoose.Types.ObjectId(academicYear) }
    });
  }
  
  if (status) {
    pipeline.push({
      $match: { status }
    });
  }
  
  // Group by status
  pipeline.push({
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalAmount: { $sum: '$totalAmount' }
    }
  });
  
  // Sort by count
  pipeline.push({
    $sort: { count: -1 }
  });
  
  // Execute aggregation
  const statusReport = await StudentFeeInvoice.aggregate(pipeline);
  
  // Calculate totals
  const totalInvoices = statusReport.reduce((acc, curr) => acc + curr.count, 0);
  const totalAmount = statusReport.reduce((acc, curr) => acc + curr.totalAmount, 0);
  
  res.status(200).json({
    status: 'success',
    data: {
      totalInvoices,
      totalAmount,
      statusReport
    }
  });
});