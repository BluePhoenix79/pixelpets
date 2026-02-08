import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { Expense } from '../../types';
import styles from '../../pages/PetCare/PetCare.module.css';
import moneyBagImg from '../../assets/money_bag.png';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

interface BudgetReportProps {
  expenses: Expense[];
  balance: number;
  totalSpent: number;
  savingsGoal: number | null;
  onSetSavingsGoal: (amount: number) => void;
}

export const BudgetReport: React.FC<BudgetReportProps> = ({ 
  expenses, 
  balance, 
  totalSpent, 
  savingsGoal, 
  onSetSavingsGoal 
}) => {
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'food' | 'toy' | 'supplies' | 'vet'>('all');
  const [savingsInput, setSavingsInput] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenseFilter === 'all' 
      ? expenses 
      : expenses.filter(e => e.expense_type === expenseFilter);
  }, [expenses, expenseFilter]);

  const spendingChartData = useMemo(() => ({
    labels: [...new Set(filteredExpenses.map(e => e.expense_type))],
    datasets: [{
      data: [...new Set(filteredExpenses.map(e => e.expense_type))].map(type => 
        filteredExpenses.filter(e => e.expense_type === type).reduce((sum, e) => sum + e.amount, 0)
      ),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    }]
  }), [filteredExpenses]);

  // Insight Calculations
  const insights = useMemo(() => {
    if (expenses.length === 0) return null;
    
    const totalsByType = expenses.reduce((acc, e) => {
      acc[e.expense_type] = (acc[e.expense_type] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(totalsByType).sort(([,a], [,b]) => b - a);
    const topCategory = sortedCategories[0];
    const avgTransaction = totalSpent / expenses.length;
    const mostExpensive = [...expenses].sort((a, b) => b.amount - a.amount)[0];

    return {
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      avgTransaction,
      mostExpensive
    };
  }, [expenses, totalSpent]);

  const handleSetGoal = () => {
    const amount = parseFloat(savingsInput);
    if (!isNaN(amount) && amount > 0) {
      onSetSavingsGoal(amount);
      setSavingsInput('');
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'food', label: 'Food' },
    { id: 'toy', label: 'Toys' },
    { id: 'supplies', label: 'Supplies' },
    { id: 'vet', label: 'Vet' }
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.budgetSummary}>
        <div className={styles.budgetCard}>
          <div className={styles.budgetCardIcon}>
            <img src={moneyBagImg} className={styles.pixelIcon} alt="balance" />
          </div>
          <div className={styles.budgetCardInfo}>
            <span className={styles.budgetLabel}>Current Balance</span>
            <span className={styles.budgetValue}>${balance.toFixed(2)}</span>
          </div>
        </div>
        <div className={styles.budgetCard}>
          <div className={styles.budgetCardInfo}>
            <span className={styles.budgetLabel}>Total Spent</span>
            <span className={`${styles.budgetValue} ${styles.budgetValueRed}`}>-${totalSpent.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Spending Insights Section - NEW */}
      {insights && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px',
          background: 'rgba(30, 41, 59, 0.4)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Top Spending Category</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>
              {insights.topCategory?.name} <span style={{ color: '#ef4444' }}>(${insights.topCategory?.amount})</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Average Purchase</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
              ${insights.avgTransaction.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Largest Purchase</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
              {insights.mostExpensive.item_name} <span style={{ color: '#ef4444' }}>(-${insights.mostExpensive.amount})</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '4px' }}>Total Transactions</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
              {expenses.length} purchases
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Expenses */}
      {expenses.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ color: '#f8fafc', marginBottom: '12px' }}>Top 5 Expenses</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map((expense, i) => (
              <div key={expense.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: i < 3 ? '#0f172a' : '#f8fafc'
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{expense.item_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>{expense.expense_type}</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>-${expense.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
           onClick={() => {
             const csvContent = 'data:text/csv;charset=utf-8,' 
               + 'Date,Category,Item,Amount\n'
               + expenses.map(e => `${new Date(e.created_at).toLocaleDateString()},${e.expense_type},${e.item_name},${e.amount}`).join('\n');
             const link = document.createElement('a');
             link.setAttribute('href', encodeURI(csvContent));
             link.setAttribute('download', `pixelpets_expenses_${new Date().toISOString().split('T')[0]}.csv`);
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
           }}
           style={{ 
             background: '#22c55e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600
           }}
        >
          Export CSV
        </button>
        <button 
           onClick={() => window.print()}
           style={{ 
             background: '#475569', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600
           }}
        >
          Print Report
        </button>
      </div>

      <div className={styles.budgetChartsGrid}>
        <div className={styles.budgetChartCard}>
          <h4>Spending Analysis</h4>
          
          {/* New Toggle Buttons for Filter */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setExpenseFilter(cat.id as any)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: expenseFilter === cat.id ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: expenseFilter === cat.id ? 'white' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className={styles.chartWrapper} style={{ maxWidth: '250px', margin: '0 auto' }}>
            {filteredExpenses.length > 0 ? (
              <Pie data={spendingChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } } }} />
            ) : (
              <p className={styles.noChartData}>No expenses to show for this filter.</p>
            )}
          </div>
        </div>

        <div className={styles.savingsCard}>
          <h4>Savings Goal</h4>
          {!savingsGoal ? (
            <div className={styles.setSavingsGoal}>
              <input 
                type="number" 
                placeholder="Enter goal amount ($)" 
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
              />
              <button onClick={handleSetGoal}>Set Goal</button>
            </div>
          ) : (
            <div className={styles.savingsProgress}>
              <div className={styles.savingsInfo}>
                <span>Goal: ${savingsGoal}</span>
                <span className={styles.savingsPercent}>{Math.min(100, (balance / savingsGoal) * 100).toFixed(0)}%</span>
              </div>
              <div className={styles.savingsBar}>
                <div 
                  className={styles.savingsBarFill} 
                  style={{ width: `${Math.min(100, (balance / savingsGoal) * 100)}%` }} 
                />
              </div>
              {balance >= savingsGoal && (
                <div className={styles.goalReached}>
                  Goal Reached! Great saving habits!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
