let currentValue = '0';
let expressionChain = [];
let waitingForOperand = false;
let memory = 0;
let history = [];
const MAX_HISTORY = 5;

const display = document.getElementById('display');
const expression = document.getElementById('expression');
const memoryIndicator = document.getElementById('memoryIndicator');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

document.addEventListener('DOMContentLoaded', () => {
  loadHistory();
  updateDisplay();
  attachEventListeners();
});

function attachEventListeners() {
  document.querySelectorAll('.btn.number').forEach((btn) => {
    btn.addEventListener('click', () => handleNumber(btn.dataset.number));
  });

  document.querySelectorAll('.btn.operator').forEach((btn) => {
    btn.addEventListener('click', () => handleOperator(btn.dataset.operator));
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  clearHistoryBtn.addEventListener('click', clearAllHistory);

  document.addEventListener('keydown', handleKeyboard);
}

function handleNumber(num) {
  if (waitingForOperand) {
    currentValue = num;
    waitingForOperand = false;
  } else {
    if (currentValue === '0' || currentValue === 'Error') {
      currentValue = num;
    } else {
      currentValue += num;
    }
  }
  updateDisplay();
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(currentValue);

  if (isNaN(inputValue)) {
    return;
  }

  if (waitingForOperand && expressionChain.length > 0) {
    expressionChain[expressionChain.length - 1] = nextOperator;
  } else {
    expressionChain.push(inputValue);
    expressionChain.push(nextOperator);
  }

  waitingForOperand = true;
  updateExpression();
}

function handleAction(action) {
  switch (action) {
    case '=':
      handleEquals();
      break;
    case 'c':
      clearAll();
      break;
    case 'ce':
      clearEntry();
      break;
    case '.':
      handleDecimal();
      break;
    case 'mc':
      memoryClear();
      break;
    case 'mr':
      memoryRecall();
      break;
    case 'm+':
      memoryAdd();
      break;
    case 'm-':
      memorySubtract();
      break;
  }
}

function handleEquals() {
  if (expressionChain.length === 0) {
    return;
  }

  const inputValue = parseFloat(currentValue);

  if (isNaN(inputValue)) {
    return;
  }

  if (expressionChain.length % 2 === 0) {
    expressionChain.push(inputValue);
  }

  const result = evaluateExpression(expressionChain);

  if (result === 'Error') {
    currentValue = 'Error';
    display.classList.add('error');
    setTimeout(() => {
      clearAll();
      display.classList.remove('error');
    }, 2000);
    updateDisplay();
    return;
  }

  const expressionText = formatExpressionForHistory(expressionChain);
  addToHistory(expressionText, result);

  currentValue = String(result);
  expressionChain = [];
  waitingForOperand = true;
  expression.textContent = '';

  updateDisplay();
}

function evaluateExpression(chain) {
  if (chain.length === 0) return 0;
  if (chain.length === 1) return chain[0];

  let expr = [...chain];

  let i = 1;
  while (i < expr.length) {
    const operator = expr[i];
    if (operator === '*' || operator === '/') {
      const left = expr[i - 1];
      const right = expr[i + 1];

      if (operator === '/' && right === 0) {
        return 'Error';
      }

      const result = operator === '*' ? left * right : left / right;

      expr.splice(i - 1, 3, result);
    } else {
    }
  }

  i = 1;
  while (i < expr.length) {
    const operator = expr[i];
    if (operator === '+' || operator === '-') {
      const left = expr[i - 1];
      const right = expr[i + 1];

      const result = operator === '+' ? left + right : left - right;

      expr.splice(i - 1, 3, result);
    } else {
      i += 2;
    }
  }

  return Math.round(expr[0] * 100000000) / 100000000;
}

function formatExpressionForHistory(chain) {
  let result = '';
  for (let i = 0; i < chain.length; i++) {
    if (i % 2 === 0) {
      result += chain[i];
    } else {
      result += ' ' + getOperatorSymbol(chain[i]) + ' ';
    }
  }
  return result;
}

function calculate(firstOperand, secondOperand, operator) {
  let result;

  switch (operator) {
    case '+':
      result = firstOperand + secondOperand;
      break;
    case '-':
      result = firstOperand - secondOperand;
      break;
    case '*':
      result = firstOperand * secondOperand;
      break;
    case '/':
      if (secondOperand === 0) {
        return 'Error';
      }
      result = firstOperand / secondOperand;
      break;
    default:
      return secondOperand;
  }

  return Math.round(result * 100000000) / 100000000;
}

function clearAll() {
  currentValue = '0';
  expressionChain = [];
  waitingForOperand = false;
  expression.textContent = '';
  updateDisplay();
}

function clearEntry() {
  currentValue = '0';
  updateDisplay();
}

function handleDecimal() {
  if (currentValue === 'Error') {
    currentValue = '0';
  }

  if (waitingForOperand) {
    currentValue = '0.';
    waitingForOperand = false;
  } else if (currentValue.indexOf('.') === -1) {
    currentValue += '.';
  }

  updateDisplay();
}

function memoryClear() {
  memory = 0;
  updateMemoryIndicator();
}

function memoryRecall() {
  currentValue = String(memory);
  waitingForOperand = true;
  updateDisplay();
}

function memoryAdd() {
  memory += parseFloat(currentValue);
  updateMemoryIndicator();
}

function memorySubtract() {
  memory -= parseFloat(currentValue);
  updateMemoryIndicator();
}

function updateMemoryIndicator() {
  if (memory !== 0) {
    memoryIndicator.textContent = 'M';
  } else {
    memoryIndicator.textContent = '';
  }
}

function addToHistory(expr, result) {
  const historyItem = {
    expression: expr,
    result: result,
    timestamp: new Date().getTime(),
  };

  history.unshift(historyItem);

  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }

  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';

  if (history.length === 0) {
    historyList.innerHTML = '<p class="no-history">Belum ada riwayat</p>';
    return;
  }

  history.forEach((item, index) => {
    const historyItemDiv = document.createElement('div');
    historyItemDiv.className = 'history-item';
    historyItemDiv.innerHTML = `
            <div class="history-expression">${item.expression}</div>
            <div class="history-result">= ${item.result}</div>
        `;

    historyItemDiv.addEventListener('click', () => {
      currentValue = String(item.result);
      waitingForOperand = true;
      updateDisplay();
    });

    historyList.appendChild(historyItemDiv);
  });
}

function clearAllHistory() {
  if (confirm('Hapus semua riwayat perhitungan?')) {
    history = [];
    saveHistory();
    renderHistory();
  }
}

function saveHistory() {
  localStorage.setItem('calculatorHistory', JSON.stringify(history));
}

function loadHistory() {
  const saved = localStorage.getItem('calculatorHistory');
  if (saved) {
    history = JSON.parse(saved);
    renderHistory();
  }
}

function handleKeyboard(e) {
  e.preventDefault();

  if (e.key >= '0' && e.key <= '9') {
    handleNumber(e.key);
  } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
    handleOperator(e.key);
  } else if (e.key === 'Enter' || e.key === '=') {
    handleEquals();
  } else if (e.key === '.' || e.key === ',') {
    handleDecimal();
  } else if (e.key === 'Escape') {
    clearAll();
  } else if (e.key === 'Backspace') {
    if (currentValue.length > 1) {
      currentValue = currentValue.slice(0, -1);
    } else {
      currentValue = '0';
    }
    updateDisplay();
  }
}

function updateDisplay() {
  display.textContent = formatNumber(currentValue);
}

function updateExpression() {
  if (expressionChain.length > 0) {
    let exprText = '';
    for (let i = 0; i < expressionChain.length; i++) {
      if (i % 2 === 0) {
        exprText += expressionChain[i];
      } else {
        exprText += ' ' + getOperatorSymbol(expressionChain[i]) + ' ';
      }
    }
    expression.textContent = exprText;
  } else {
    expression.textContent = '';
  }
}

function formatNumber(value) {
  if (value === 'Error') {
    return 'Error: Tidak dapat dibagi 0';
  }

  const num = parseFloat(value);
  if (isNaN(num)) {
    return value;
  }

  if (Math.abs(num) >= 1000) {
    return num.toLocaleString('id-ID', { maximumFractionDigits: 8 });
  }

  return value;
}

function getOperatorSymbol(op) {
  switch (op) {
    case '+':
      return '+';
    case '-':
      return '-';
    case '*':
      return '×';
    case '/':
      return '÷';
    default:
      return op;
  }
}

document.querySelectorAll('.btn.operator').forEach((btn) => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.btn.operator').forEach((b) => b.classList.remove('active'));
    if (waitingForOperand) {
      this.classList.add('active');
    }
  });
});

document.querySelector('.btn.equals').addEventListener('click', () => {
  document.querySelectorAll('.btn.operator').forEach((b) => b.classList.remove('active'));
});
