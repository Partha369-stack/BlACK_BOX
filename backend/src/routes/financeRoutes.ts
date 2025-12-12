
import express from 'express';
import { financeController } from '../controllers/financeController';

const router = express.Router();

// Middleware to check if user is admin (optional, can add later)
// import { requireAdmin } from '../middleware/auth';

// 1. Summary
router.get('/summary', financeController.getFinanceSummary);

// 2. Machine Stats
router.get('/machines', financeController.getMachineFinance);

// 3. Transactions
router.get('/transactions', financeController.getTransactions);

// 4. Partner Stats
router.get('/partners', financeController.getPartnerFinance);

// 5. Create Payout
router.post('/payouts', financeController.createPayout);

// 6. Export
router.get('/export', financeController.exportTransactions);
router.post('/expenses', financeController.addExpense);
router.put('/expenses/:id', financeController.updateExpense);
router.delete('/expenses/:id', financeController.deleteExpense);
router.post('/refund', financeController.refundOrder);
router.get('/expenses', financeController.getExpenses);

export default router;
