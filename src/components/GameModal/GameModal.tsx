import { useState, useCallback } from 'react';
import type { MiniGame, BudgetPuzzle, MemoryMatch, QuickSort, TriviaGame } from '../../data/miniGames';
import { getGameInstructions, MATCH_COLORS } from '../../data/miniGames';
import styles from './GameModal.module.css';
import moneyBagImg from '../../assets/money_bag.png';
import starImg from '../../assets/star.png';
import expensesImg from '../../assets/expenses.png';
import trophyImg from '../../assets/trophy.png';
import warningImg from '../../assets/warning.png';
import ideaImg from '../../assets/star.png'; // Using star for 'idea/hint' as backup

interface GameModalProps {
  game: MiniGame;
  onComplete: (success: boolean) => void;
  onClose: () => void;
  reward: number;
  generatedBy?: string; // Model name that generated this question
}

export default function GameModal({ game, onComplete, onClose, reward, generatedBy }: GameModalProps) {
  const [result, setResult] = useState<{ text: string; success: boolean } | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);

  const handleSuccess = useCallback(() => {
    setResult({ text: `Correct! You earned $${reward}!`, success: true });
    setWasSuccess(true);
    setIsFinished(true);
  }, [reward]);

  const handleFailure = useCallback((message = "Not quite right. Try again next time!") => {
    setResult({ text: `Incorrect. ${message}`, success: false });
    setWasSuccess(false);
    setIsFinished(true);
  }, []);

  const handleCloseValues = () => {
    if (isFinished) {
      onComplete(wasSuccess);
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleCloseValues}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleCloseValues}>&times;</button>
        
        <div className={styles.gameHeader}>
          <h2>
            {game.type === 'budget_puzzle' && <img src={moneyBagImg} alt="budget" className="pixelated" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '12px' }} />}
            {game.type === 'memory_match' && <img src={starImg} alt="memory" className="pixelated" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '12px' }} />}
            {game.type === 'quick_sort' && <img src={expensesImg} alt="sort" className="pixelated" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '12px' }} />}
            {game.type === 'trivia' && <img src={trophyImg} alt="trivia" className="pixelated" style={{ width: '32px', height: '32px', verticalAlign: 'middle', marginRight: '12px' }} />}
            
            {game.type === 'budget_puzzle' && 'FBLA Budget Challenge'}
            {game.type === 'memory_match' && 'FBLA Memory Match'}
            {game.type === 'quick_sort' && 'FBLA Quick Sort'}
            {game.type === 'trivia' && 'FBLA Trivia'}
          </h2>
          <p className={styles.instructions}>{getGameInstructions(game)}</p>
          <div className={styles.rewardBadge}>Reward: ${reward}</div>
        </div>

        <div className={styles.gameArea}>
          {game.type === 'budget_puzzle' && (
            <BudgetPuzzleGame game={game} onSuccess={handleSuccess} onFailure={handleFailure} />
          )}
          {game.type === 'memory_match' && (
            <MemoryMatchGame game={game} onSuccess={handleSuccess} onFailure={handleFailure} />
          )}
          {game.type === 'quick_sort' && (
            <QuickSortGame game={game} onSuccess={handleSuccess} onFailure={handleFailure} />
          )}
          {game.type === 'trivia' && (
            <TriviaGameComponent game={game} onSuccess={handleSuccess} onFailure={handleFailure} />
          )}
        </div>

        {result && (
          <div className={`${styles.resultMessage} ${result.success ? styles.success : styles.failure}`}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              {result.success ? 'Well Done!' : 'Incorrect'}
            </div>
            {result.success && <img src={trophyImg} alt="success" style={{ width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle' }} />}
            {!result.success && <img src={warningImg} alt="error" style={{ width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle' }} />}
            {result.text}
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
               <button 
                 onClick={handleCloseValues}
                 style={{
                   background: result.success ? '#22c55e' : '#64748b',
                   color: 'white',
                   border: 'none',
                   padding: '8px 16px',
                   borderRadius: '6px',
                   cursor: 'pointer',
                   fontWeight: 'bold'
                 }}
               >
                 {result.success ? 'Collect Reward' : 'Close'}
               </button>
            </div>
          </div>
        )}

        {/* Model Attribution - Always show source */}
        <div className={styles.generatedBy}>
          {generatedBy 
            ? `Question generated by: ${generatedBy}`
            : 'Question made by the developers'
          }
        </div>
      </div>
    </div>
  );
}

// ============================================
// BUDGET PUZZLE GAME
// ============================================
function BudgetPuzzleGame({ game, onSuccess, onFailure }: { game: BudgetPuzzle; onSuccess: () => void; onFailure: (msg?: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const total = game.items.filter(i => selected.has(i.name)).reduce((sum, i) => sum + i.cost, 0);

  const toggleItem = (name: string) => {
    const newSet = new Set(selected);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setSelected(newSet);
  };

  const handleSubmit = () => {
    const selectedArray = Array.from(selected).sort();
    const correctArray = [...game.correctEssentials].sort();
    
    if (JSON.stringify(selectedArray) === JSON.stringify(correctArray) && total <= game.totalBudget) {
      onSuccess();
    } else if (total > game.totalBudget) {
      onFailure("Over budget! Choose only essentials.");
    } else {
      onFailure("Not quite! Focus on what's truly essential.");
    }
  };

  return (
    <div className={styles.budgetGame}>
      <p className={styles.scenario}>{game.scenario}</p>
      <div className={styles.budgetBar}>
        <div className={styles.budgetProgress} style={{ width: `${Math.min(100, (total / game.totalBudget) * 100)}%` }} />
        <span>${total} / ${game.totalBudget}</span>
      </div>
      <div className={styles.itemGrid}>
        {game.items.map(item => (
          <button
            key={item.name}
            className={`${styles.itemBtn} ${selected.has(item.name) ? styles.selected : ''}`}
            onClick={() => toggleItem(item.name)}
          >
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemCost}>${item.cost}</span>
          </button>
        ))}
      </div>
      <button className={styles.submitBtn} onClick={handleSubmit}>
        Check Budget
      </button>
    </div>
  );
}

// ============================================
// MEMORY MATCH GAME - With colored matched pairs
// ============================================

function MemoryMatchGame({ game, onSuccess, onFailure }: { game: MemoryMatch; onSuccess: () => void; onFailure: (msg?: string) => void }) {
  const [matches, setMatches] = useState<Record<string, { def: string; colorIndex: number }>>({});
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const [incorrectMatches, setIncorrectMatches] = useState<Set<string>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState(false);
  const shuffledDefs = useState(() => [...game.pairs.map(p => p.definition)].sort(() => Math.random() - 0.5))[0];

  const handleTermClick = (term: string) => {
    if (isSubmitted) return;

    // If clicking a matched term, unmatch it and make it selected (allow changing)
    if (matches[term]) {
      const { [term]: _removed, ...rest } = matches;
      setMatches(rest);
      // Clean up incorrect status if it was wrong
      const newIncorrect = new Set(incorrectMatches);
      newIncorrect.delete(term);
      setIncorrectMatches(newIncorrect);
      
      setSelectedTerm(term); // Re-select to change
      return;
    }
    
    // If clicking the ALREADY selected term, toggle selection off
    if (selectedTerm === term) {
        setSelectedTerm(null);
        return;
    }

    setSelectedTerm(term);
  };

  const handleDefClick = (def: string) => {
    if (isSubmitted) return;

    // If clicking a definition that is assigned, find its term
    const existingMatch = Object.entries(matches).find(([_, val]) => val.def === def);
    
    // If clicking a matched definition, unmatch it and select the term
    if (existingMatch) {
      const [termKey] = existingMatch;
      // Unmatch
      const { [termKey]: _removed, ...rest } = matches;
      setMatches(rest);
       
      const newIncorrect = new Set(incorrectMatches);
      newIncorrect.delete(termKey);
      setIncorrectMatches(newIncorrect);
      
      // Make that term active again so we can pick a new def
      setSelectedTerm(termKey); 
      return;
    }

    if (!selectedTerm) return;
    
    setMatches(prev => ({ 
      ...prev, 
      [selectedTerm]: { def, colorIndex: nextColorIndex } 
    }));
    setNextColorIndex((nextColorIndex + 1) % MATCH_COLORS.length);
    setSelectedTerm(null);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const newIncorrect = new Set<string>();
    
    game.pairs.forEach(p => {
      // If matched but wrong definition
      if (matches[p.term] && matches[p.term].def !== p.definition) {
        newIncorrect.add(p.term);
      }
    });

    setIncorrectMatches(newIncorrect);

    if (newIncorrect.size === 0) {
      onSuccess();
    } else {
      // Show visual feedback briefly then fail
      setTimeout(() => {
        onFailure("Game Over!");
      }, 2500); 
    }
  };

  const getMatchColor = (term: string): string | undefined => {
    return matches[term] ? MATCH_COLORS[matches[term].colorIndex] : undefined;
  };

  const getDefMatchColor = (def: string): string | undefined => {
    const match = Object.values(matches).find(m => m.def === def);
    return match ? MATCH_COLORS[match.colorIndex] : undefined;
  };

  const allMatched = Object.keys(matches).length === game.pairs.length;

  return (
    <div className={styles.memoryGame}>
      <h4>{game.theme}</h4>
      <div className={styles.matchGrid}>
        <div className={styles.termsColumn}>
          <h5>Terms</h5>
          {game.pairs.map(p => {
            const matchColor = getMatchColor(p.term);
            const isIncorrect = incorrectMatches.has(p.term);
            const isSelected = selectedTerm === p.term;
            
            // "when you click on one of the terms for the first time turn it into the color it will be"
            // If selected but not matched, use the 'next' color
            const displayColor = matchColor || (isSelected ? MATCH_COLORS[nextColorIndex % MATCH_COLORS.length] : undefined);

            return (
              <button
                key={p.term}
                className={`${styles.matchCard} ${isSelected ? styles.selected : ''} ${displayColor ? styles.matchedColored : ''}`}
                style={
                  isIncorrect 
                    ? { borderColor: '#ef4444', borderWidth: '2px' } 
                    : displayColor ? { borderColor: displayColor, borderWidth: '2px' } : undefined
                }
                onClick={() => handleTermClick(p.term)}
                disabled={isSubmitted}
              >
                {/* No matchDot span as requested */}
                {isIncorrect && <img src={warningImg} alt="error" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} />}
                {p.term}
              </button>
            );
          })}
        </div>
        <div className={styles.defsColumn}>
          <h5>Definitions</h5>
          {shuffledDefs.map(def => {
            const matchColor = getDefMatchColor(def);
            const termForDef = Object.keys(matches).find(key => matches[key].def === def);
            const isIncorrect = termForDef ? incorrectMatches.has(termForDef) : false;
            
            return (
              <button
                key={def}
                className={`${styles.matchCard} ${matchColor ? styles.matchedColored : ''}`}
                style={
                  isIncorrect 
                    ? { borderColor: '#ef4444', borderWidth: '2px' }
                    : matchColor ? { borderColor: matchColor, borderWidth: '2px' } : undefined
                }
                onClick={() => handleDefClick(def)}
                disabled={isSubmitted}
              >
                {/* No matchDot span as requested */}
                {isIncorrect && <img src={warningImg} alt="error" style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} />}
                {def}
              </button>
            );
          })}
        </div>
      </div>
      {allMatched && !isSubmitted && (
        <button className={styles.submitBtn} onClick={handleSubmit}>
          Check Matches
        </button>
      )}
    </div>
  );
}

// ============================================
// QUICK SORT GAME
// ============================================
function QuickSortGame({ game, onSuccess, onFailure }: { game: QuickSort; onSuccess: () => void; onFailure: (msg?: string) => void }) {
  const [order, setOrder] = useState(() => [...game.items].sort(() => Math.random() - 0.5));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...order];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= order.length) return;
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setOrder(newOrder);
  };

  const handleSubmit = () => {
    if (JSON.stringify(order) === JSON.stringify(game.correctOrder)) {
      onSuccess();
    } else {
      onFailure("Not in the right order. Try again!");
    }
  };

  return (
    <div className={styles.sortGame}>
      <p className={styles.sortInstruction}>{game.instruction}</p>
      <div className={styles.sortCategory}>Category: {game.category}</div>
      <div className={styles.sortList}>
        {order.map((item, index) => (
          <div key={item} className={styles.sortItem}>
            <span className={styles.sortNumber}>{index + 1}</span>
            <span className={styles.sortText}>{item}</span>
            <div className={styles.sortButtons}>
              <button onClick={() => moveItem(index, 'up')} disabled={index === 0}>Up</button>
              <button onClick={() => moveItem(index, 'down')} disabled={index === order.length - 1}>Down</button>
            </div>
          </div>
        ))}
      </div>
      <button className={styles.submitBtn} onClick={handleSubmit}>
        Check Order
      </button>
    </div>
  );
}

// ============================================
// TRIVIA GAME
// ============================================
function TriviaGameComponent({ game, onSuccess, onFailure }: { game: TriviaGame; onSuccess: () => void; onFailure: (msg?: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    
    if (selected === game.answer) {
      setTimeout(onSuccess, 500);
    } else {
      setTimeout(() => onFailure(game.explanation), 500);
    }
  };

  return (
    <div className={styles.triviaGame}>
      <div className={styles.triviaCategory}>{game.category}</div>
      <p className={styles.triviaQuestion}>{game.question}</p>
      <div className={styles.triviaOptions}>
        {game.options.map((option, index) => (
          <button
            key={index}
            className={`${styles.triviaOption} ${selected === index ? styles.selected : ''} ${submitted && index === game.answer ? styles.correct : ''} ${submitted && selected === index && index !== game.answer ? styles.wrong : ''}`}
            onClick={() => !submitted && setSelected(index)}
            disabled={submitted}
          >
            {option}
          </button>
        ))}
      </div>
      {!submitted && (
        <button className={styles.submitBtn} onClick={handleSubmit} disabled={selected === null}>
          Submit Answer
        </button>
      )}
      {submitted && selected === game.answer && (
        <p className={styles.explanation}>
          <img src={ideaImg} alt="hint" style={{ width: '20px', height: '20px', verticalAlign: 'middle', marginRight: '8px' }} /> 
          {game.explanation}
        </p>
      )}
    </div>
  );
}
