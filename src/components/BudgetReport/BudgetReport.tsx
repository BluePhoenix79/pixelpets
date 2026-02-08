import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import type { Expense } from '../../types';
import styles from '../../pages/PetCare/PetCare.module.css';
import moneyBagImg from '../../assets/money_bag.png';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

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
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [savingsInput, setSavingsInput] = useState('');

  const spendingChartData = useMemo(() => {
    const categories = [...new Set(expenses.map(e => e.expense_type))];
    const data = categories.map(type => 
      expenses.filter(e => e.expense_type === type).reduce((sum, e) => sum + e.amount, 0)
    );

    return {
      labels: categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)), 
      datasets: [{
        label: 'Spending by Category',
        data: data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      }]
    };
  }, [expenses]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#cbd5e1' }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        padding: 10,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    } : undefined
  };

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

      {/* Spending Insights Section */}
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
              {insights.topCategory?.name} <span style={{ color: '#ef4444' }}>(${insights.topCategory?.amount.toFixed(2)})</span>
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
             background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
           }}
        >
          Export CSV
        </button>
      </div>

      <div className={styles.budgetChartsGrid}>
        <div className={styles.budgetChartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0 }}>Spending Analysis</h4>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
              <button
                onClick={() => setChartType('pie')}
                style={{
                  background: chartType === 'pie' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: chartType === 'pie' ? '#60a5fa' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                Pie
              </button>
              <button
                onClick={() => setChartType('bar')}
                style={{
                  background: chartType === 'bar' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: chartType === 'bar' ? '#60a5fa' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
              >
                Bar
              </button>
            </div>
          </div>
          
          <div className={styles.chartWrapper} style={{ width: '100%', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {expenses.length > 0 ? (
              chartType === 'pie' ? (
                <div style={{ width: '250px' }}>
                  <Pie data={spendingChartData} options={chartOptions as any} /> 
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%' }}>
                  <Bar data={spendingChartData} options={chartOptions as any} />
                </div>
              )
            ) : (
              <p className={styles.noChartData}>No expenses recorded yet.</p>
            )}
          </div>
        </div>

        <div className={styles.savingsCard}>
          <h4>Savings Goal</h4>
          {!savingsGoal ? (
            <div className={styles.setSavingsGoal}>
              <input 
                type="number" 
                placeholder="Enter goal ($)" 
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
                  Goal Reached!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
