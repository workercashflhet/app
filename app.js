// Клиентский JS для вашего мини-приложения (заменяет инлайн <script>)
// Предназначен для работы как внутри Telegram WebApp, так и в обычном браузере (fallback).

(() => {
  // Безопасный доступ к Telegram WebApp
  const tg = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;

  let userData = null;
  let currentBet = 0;
  let currentGame = '';

  function parseBalanceText(text) {
    // Убираем все не‑цифры и парсим
    const n = parseInt(String(text).replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }

  function showLoading(show) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    loading.classList.toggle('active', !!show);
  }

  function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }

  function updateProfile(user) {
    const balanceEl = document.getElementById('balance');
    if (balanceEl) balanceEl.textContent = `${user.balance} ⭐`;
    const winsEl = document.getElementById('totalWins');
    if (winsEl) winsEl.textContent = user.totalWins;
    const refsEl = document.getElementById('referrals');
    if (refsEl) refsEl.textContent = user.referrals;
  }

  // Исправлённый setBetAmount — теперь получает элемент, чтобы добавить класс active
  function setBetAmount(amount, el) {
    const buttons = document.querySelectorAll('.amount-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (el && el.classList) el.classList.add('active');

    currentBet = Number(amount) || 0;
    const input = document.getElementById(`${currentGame}BetAmount`);
    if (input) input.value = amount;
  }

  function resetGame() {
    currentBet = 0;
    const betScreens = document.querySelectorAll('[id$="BetScreen"]');
    betScreens.forEach(s => s.style.display = 'block');
    const gameScreens = document.querySelectorAll('[id$="GameScreen"]');
    gameScreens.forEach(s => s.style.display = 'none');
    const resultDivs = document.querySelectorAll('[id$="Result"]');
    resultDivs.forEach(d => d.innerHTML = '');
    const amountInputs = document.querySelectorAll('[id$="BetAmount"]');
    amountInputs.forEach(i => { if (i) i.value = ''; });
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(b => b.classList.remove('active'));
  }

  function openGameModal(gameType) {
    currentGame = gameType;
    const modal = document.getElementById(`${gameType}Modal`);
    if (modal) modal.classList.add('active');
    resetGame();
    if (tg && tg.BackButton && tg.BackButton.show) tg.BackButton.show();
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
    resetGame();
    if (tg && tg.BackButton && tg.BackButton.hide) tg.BackButton.hide();
  }

  async function initUser() {
    showLoading(true);
    try {
      userData = tg ? (tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null) : null;
      // Если нет Telegram — используем демонстрационные данные
      if (!userData) {
        userData = { id: 'demo_1', username: 'demo_user', first_name: 'Demo' };
      }

      // Запрашиваем профиль у сервера (или тестовый ответ)
      const resp = await fetch('/api/init', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          id: userData.id,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code,
          startParam: tg && tg.initDataUnsafe ? tg.initDataUnsafe.start_param : undefined
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.success && data.user) {
          updateProfile(data.user);
        } else {
          // если сервер вернул неудачу — ставим fallback профиль
          updateProfile({ balance: 1000, totalWins: 0, referrals: 0 });
        }
      } else {
        updateProfile({ balance: 1000, totalWins: 0, referrals: 0 });
      }
    } catch (err) {
      console.error('initUser error', err);
      updateProfile({ balance: 1000, totalWins: 0, referrals: 0 });
      showNotification('Ошибка инициализации (сервер недоступен)', 'error');
    } finally {
      showLoading(false);
    }
  }

  async function confirmCoinBet() {
    const input = document.getElementById('coinBetAmount');
    const inputAmount = input ? parseInt(input.value, 10) : 0;
    if (inputAmount && inputAmount >= 10) currentBet = inputAmount;
    if (currentBet < 10) {
      showNotification('Минимальная ставка — 10 ⭐', 'error');
      return;
    }

    // безопасное чтение баланса (из DOM)
    const balanceText = document.getElementById('balance') ? document.getElementById('balance').textContent : '0';
    const balance = parseBalanceText(balanceText);
    if (currentBet > balance) {
      showNotification('Недостаточно средств', 'error');
      return;
    }

    document.getElementById('coinBetScreen').style.display = 'none';
    document.getElementById('coinGameScreen').style.display = 'block';
  }

  async function playCoin(choice) {
    showLoading(true);
    try {
      // отправляем на сервер игровой запрос
      const resp = await fetch('/api/play/coin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          userId: userData ? userData.id : 'demo_1',
          bet: Number(currentBet),
          choice
        })
      });
      const data = await resp.json();

      const resultDiv = document.getElementById('coinResult');
      resultDiv.innerHTML = '';

      // простая анимация монеты
      const coinElement = document.createElement('div');
      coinElement.className = 'coin';
      coinElement.innerHTML = '<div class="coin-side">🪙</div><div class="coin-side back">🪙</div>';
      resultDiv.appendChild(coinElement);

      setTimeout(() => {
        coinElement.classList.add('flipping');
        setTimeout(() => {
          let resultHTML = '';
          if (data.win) {
            resultHTML = `<div class="result result-win"><div class="result-text">🎉 ПОБЕДА!</div><div class="result-amount">+${data.winnings} ⭐</div><p>Выпало: ${data.result}</p><p>Ваш выбор: ${choice}</p></div>`;
          } else {
            resultHTML = `<div class="result result-lose"><div class="result-text">😢 ПРОИГРЫШ</div><div class="result-amount">-${currentBet} ⭐</div><p>Выпало: ${data.result}</p><p>Ваш выбор: ${choice}</p></div>`;
          }
          resultDiv.innerHTML = resultHTML + `<div style="margin-top:20px;"><button class="btn btn-small" onclick="resetGame()">Играть еще</button> <button class="btn btn-small btn-secondary" onclick="closeModal('coinModal')">Выход</button></div>`;

          // обновляем профиль (баланс)
          if (data.newBalance !== undefined) updateProfile({ balance: data.newBalance, totalWins: data.totalWins || 0, referrals: data.referrals || 0 });

          showLoading(false);
        }, 1000);
      }, 100);
    } catch (err) {
      console.error('playCoin error', err);
      showNotification('Ошибка игры (сервер недоступен)', 'error');
      showLoading(false);
    }
  }

  // Экспорт функций в глобальную область для inline onclick (или можно привязать через addEventListener)
  window.openGameModal = openGameModal;
  window.closeModal = closeModal;
  window.setBetAmount = setBetAmount;
  window.confirmCoinBet = confirmCoinBet;
  window.playCoin = playCoin;
  window.resetGame = resetGame;
  window.showDepositModal = () => { if (tg && tg.openInvoice) tg.openInvoice({title: 'Пополнение', description: 'Пополнение тест'}); else alert('Пополнение (демо)'); };
  window.showWithdrawModal = () => { if (tg && tg.showPopup) tg.showPopup({title: 'Вывод', message: 'Демо'}); else alert('Вывод (демо)'); };
  window.showReferralModal = () => { if (tg && tg.showPopup) tg.showPopup({title: 'Реферальная система', message: 'Демо'}); else alert('Реферальная система (демо)'); };
  window.showHistory = () => { if (tg && tg.showAlert) tg.showAlert('История операций'); else alert('История операций (демо)'); };

  // Инициализация после загрузки DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Подключаем кнопки выбора ставки: если в HTML используются onclick="setBetAmount(10, this)"
    // иначе можно навесить делегирование здесь.
    if (tg) {
      try {
        if (tg.expand) tg.expand();
        if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
      } catch (e) { console.warn('Telegram API error', e); }
    }
    initUser();
  });
})();
