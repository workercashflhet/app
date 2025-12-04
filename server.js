<script>
    // Telegram Web App API
    let tg = window.Telegram.WebApp;
    let userData = null;
    let currentBet = 0;
    let currentGame = '';
    
    // Данные пользователя (симуляция)
    let user = {
        balance: 1000,
        totalWins: 0,
        referrals: 0
    };
    
    // Инициализация приложения
    tg.expand();
    tg.enableClosingConfirmation();
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        closeAllModals();
    });
    
    // Получение данных пользователя
    async function initUser() {
        showLoading(true);
        
        try {
            // Получаем данные из Telegram
            userData = tg.initDataUnsafe?.user;
            
            if (!userData) {
                console.log('Данные пользователя не получены. Режим демо.');
                userData = {
                    id: 123456789,
                    username: 'demo_user',
                    first_name: 'Демо',
                    last_name: 'Пользователь'
                };
            }
            
            // Симуляция задержки запроса
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Обновляем профиль с демо-данными
            updateProfile(user);
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            showNotification('Режим демонстрации', 'info');
            
            // Демо-данные
            updateProfile(user);
        } finally {
            showLoading(false);
        }
    }
    
    // Обновление профиля
    function updateProfile(userData) {
        document.getElementById('balance').textContent = `${userData.balance} ⭐`;
        document.getElementById('totalWins').textContent = userData.totalWins;
        document.getElementById('referrals').textContent = userData.referrals;
    }
    
    // Открытие модального окна игры
    function openGameModal(gameType) {
        currentGame = gameType;
        document.getElementById(`${gameType}Modal`).classList.add('active');
        resetGame();
        tg.BackButton.show();
    }
    
    // Закрытие всех модальных окон
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
        resetGame();
        tg.BackButton.hide();
    }
    
    // Закрытие модального окна
    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        resetGame();
        tg.BackButton.hide();
    }
    
    // Установка суммы ставки
    function setBetAmount(amount) {
        const buttons = document.querySelectorAll('.amount-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        currentBet = amount;
        const input = document.getElementById(`${currentGame}BetAmount`);
        if (input) input.value = amount;
    }
    
    // Подтверждение ставки для монетки
    function confirmCoinBet() {
        const inputAmount = parseInt(document.getElementById('coinBetAmount').value);
        
        if (inputAmount && inputAmount >= 10) {
            currentBet = inputAmount;
        }
        
        if (currentBet < 10) {
            showNotification('Минимальная ставка - 10 ⭐', 'error');
            return;
        }
        
        // Проверяем баланс
        const balance = parseInt(user.balance);
        if (currentBet > balance) {
            showNotification('Недостаточно средств', 'error');
            return;
        }
        
        document.getElementById('coinBetScreen').style.display = 'none';
        document.getElementById('coinGameScreen').style.display = 'block';
    }
    
    // Игра в монетку
    async function playCoin(choice) {
        showLoading(true);
        
        // Симуляция задержки запроса
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Случайный результат (50/50)
        const isWin = Math.random() > 0.5;
        const result = isWin ? choice : (choice === 'Орел' ? 'Решка' : 'Орел');
        const multiplier = 2; // Выигрыш 2x
        
        // Анимация монетки
        const coinElement = document.createElement('div');
        coinElement.className = 'coin';
        coinElement.innerHTML = `
            <div class="coin-side">🪙</div>
            <div class="coin-side back">🪙</div>
        `;
        
        const resultDiv = document.getElementById('coinResult');
        resultDiv.innerHTML = '';
        resultDiv.appendChild(coinElement);
        
        setTimeout(() => {
            coinElement.classList.add('flipping');
            
            setTimeout(() => {
                let resultHTML = '';
                if (isWin) {
                    const winnings = currentBet * multiplier;
                    user.balance += winnings;
                    user.totalWins++;
                    
                    resultHTML = `
                        <div class="result result-win">
                            <div class="result-text">🎉 ПОБЕДА!</div>
                            <div class="result-amount">+${winnings} ⭐</div>
                            <p>Выпало: ${result}</p>
                            <p>Ваш выбор: ${choice}</p>
                        </div>
                    `;
                } else {
                    user.balance -= currentBet;
                    
                    resultHTML = `
                        <div class="result result-lose">
                            <div class="result-text">😢 ПРОИГРЫШ</div>
                            <div class="result-amount">-${currentBet} ⭐</div>
                            <p>Выпало: ${result}</p>
                            <p>Ваш выбор: ${choice}</p>
                        </div>
                    `;
                }
                
                resultDiv.innerHTML = resultHTML;
                
                // Кнопки для продолжения
                const buttonsHTML = `
                    <div style="margin-top: 20px;">
                        <button class="btn btn-small" onclick="resetGame()">Играть еще</button>
                        <button class="btn btn-small btn-secondary" onclick="closeModal('coinModal')">Выход</button>
                    </div>
                `;
                resultDiv.innerHTML += buttonsHTML;
                
                // Обновляем баланс
                updateProfile(user);
                
                showLoading(false);
            }, 1000);
            
        }, 100);
    }
    
    // Сброс игры
    function resetGame() {
        currentBet = 0;
        const betScreens = document.querySelectorAll('[id$="BetScreen"]');
        betScreens.forEach(screen => screen.style.display = 'block');
        
        const gameScreens = document.querySelectorAll('[id$="GameScreen"]');
        gameScreens.forEach(screen => screen.style.display = 'none');
        
        const resultDivs = document.querySelectorAll('[id$="Result"]');
        resultDivs.forEach(div => div.innerHTML = '');
        
        const amountInputs = document.querySelectorAll('[id$="BetAmount"]');
        amountInputs.forEach(input => {
            if (input) input.value = '';
        });
        
        const amountButtons = document.querySelectorAll('.amount-btn');
        amountButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    // Пополнение баланса
    function showDepositModal() {
        tg.showPopup({
            title: 'Пополнение баланса',
            message: 'В демо-режиме пополнение не доступно. В реальном приложении здесь будет платежная система.',
            buttons: [
                {id: 'ok', type: 'default', text: 'Понятно'},
                {type: 'cancel'}
            ]
        });
    }
    
    // Вывод средств
    function showWithdrawModal() {
        tg.showPopup({
            title: 'Вывод средств',
            message: 'В демо-режиме вывод не доступен.',
            buttons: [
                {id: 'ok', type: 'default', text: 'Понятно'},
                {type: 'cancel'}
            ]
        });
    }
    
    // Реферальная система
    function showReferralModal() {
        const botUsername = tg.initDataUnsafe?.user?.username ? 
            `@${tg.initDataUnsafe.user.username}` : '@ваш_бот';
        
        tg.showPopup({
            title: 'Реферальная система',
            message: `Приглашайте друзей и получайте бонусы!\n\nВаша ссылка: https://t.me/${botUsername}?start=ref${userData?.id || '123'}\n\nНажмите "Копировать" чтобы скопировать ссылку.`,
            buttons: [
                {id: 'copy', type: 'default', text: '📋 Копировать'},
                {type: 'cancel'}
            ]
        }, function(buttonId) {
            if (buttonId === 'copy') {
                navigator.clipboard.writeText(`https://t.me/${botUsername}?start=ref${userData?.id || '123'}`)
                    .then(() => {
                        showNotification('✅ Ссылка скопирована!', 'success');
                    })
                    .catch(() => {
                        showNotification('❌ Не удалось скопировать', 'error');
                    });
            }
        });
    }
    
    // История операций
    function showHistory() {
        tg.showAlert('В демо-режиме история не доступна.');
    }
    
    // Показать уведомление
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Показать/скрыть загрузку
    function showLoading(show) {
        document.getElementById('loading').classList.toggle('active', show);
    }
    
    // Обновление баланса
    function updateBalance(newBalance) {
        user.balance = newBalance;
        document.getElementById('balance').textContent = `${newBalance} ⭐`;
    }
    
    // Обработка вывода
    async function handleWithdraw(amount) {
        tg.showPopup({
            title: 'Вывод средств',
            message: 'В демо-режиме вывод не доступен.',
            buttons: [
                {id: 'ok', type: 'default', text: 'Понятно'},
                {type: 'cancel'}
            ]
        });
    }
    
    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', () => {
        // Проверка, запущено ли в Telegram
        if (typeof window.Telegram === 'undefined' || !window.Telegram.WebApp) {
            document.body.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎮</div>
                    <h1 style="margin-bottom: 20px;">Игровой Бот</h1>
                    <p style="margin-bottom: 30px; opacity: 0.9;">Это приложение работает только в Telegram</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-bottom: 30px; max-width: 400px;">
                        <p style="margin-bottom: 15px;">Чтобы запустить приложение:</p>
                        <ol style="text-align: left; padding-left: 20px; margin-bottom: 20px;">
                            <li style="margin-bottom: 10px;">Откройте Telegram</li>
                            <li style="margin-bottom: 10px;">Найдите бота: <strong>@ваш_бот</strong></li>
                            <li style="margin-bottom: 10px;">Нажмите кнопку "Меню" внизу</li>
                        </ol>
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button onclick="location.reload()" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; cursor: pointer;">Обновить</button>
                        <button onclick="window.open('https://t.me/', '_blank')" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 12px 24px; border-radius: 10px; font-weight: bold; cursor: pointer;">Открыть Telegram</button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Если в Telegram, но нет initData (прямой переход по ссылке)
        if (!tg.initData) {
            tg.ready();
            tg.MainButton.setText('Запустить игру');
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                // Открываем бота для полноценного запуска
                const botUsername = window.location.pathname.includes('github.io') ? 
                    'ваш_бот' : // Замените на username вашего бота
                    'your_bot_username';
                tg.openTelegramLink(`https://t.me/${botUsername}?start=app`);
            });
            
            // Показываем демо-режим
            initUser();
            return;
        }
        
        // Полноценная инициализация в Telegram
        tg.ready();
        initUser();
    });
    
    // Обработка успешной оплаты
    tg.onEvent('invoiceClosed', function(eventData) {
        if (eventData.status === 'paid') {
            showNotification('✅ Оплата прошла успешно!', 'success');
            setTimeout(() => location.reload(), 2000);
        }
    });
</script>
