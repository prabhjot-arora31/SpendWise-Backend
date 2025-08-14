import Transaction from "../models/Transaction.js";

// Add new transaction
export const addTransaction = async (req, res) => {
  try {
    const { title, amount, type, date, category, notes } = req.body;
    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount,
      type,
      date,
      category,
      notes,
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get transactions with filters, search, pagination
export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, search, page = 1 } = req.query;
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate && endDate)
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    if (search)
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];

    const limit = 10;
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip);
    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single transaction
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update transaction
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    Object.assign(transaction, req.body);
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete transaction
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Summary dashboard
export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const totalIncome = transactions
      .filter((t) => t.type === "Income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "Expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    res.json({ totalIncome, totalExpense, balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
