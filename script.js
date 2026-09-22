let chartInstance = null;
let globalRawData = [];    
let fullForecastData = []; 
let availableMetrics = []; // Хранит названия всех столбцов-показателей
let currentLang = 'ru'; 

let monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
let dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const i18n = {
    ru: {
        title: "Прогнозер", filters: "Фильтры", metrics: "Показатели", years: "Годы", months: "Месяцы", days: "Дни недели",
        clear: "🗙 Очистить", yoy: "Сравнение (YoY)", chooseFile: "Выбрать файл", horizon: "Горизонт:",
        calcBtn: "⚡ Рассчитать прогноз", saveBtn: "💾 Скачать Excel", themeDark: "🌙 Темная тема", themeLight: "☀️ Светлая",
        statusAnalyze: "Анализ файла...", statusLoaded: (count) => `База загружена: ${count} дн.`,
        errNeedMore: "Нужно хотя бы 14 дней.", errNoDate: "Укажите крайнюю дату.", errFuture: "Дата должна быть в будущем.",
        successCalc: "Прогноз построен успешно!",
        monthNamesArr: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        dayNamesArr: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        chartFact: " (Факт)", chartForecast: " (Прогноз)",
        // Новые ключи
        algoLabel: "Алгоритм:", 
        algoCombo: "Комбо (Тренд + Прошлый год)", 
        algoExcel: "Только Тренд + Сезонность", 
        algoNaive: "Только Аналог прошлого года"
    },
    en: {
        title: "Forecaster", filters: "Filters", metrics: "Metrics", years: "Years", months: "Months", days: "Days of week",
        clear: "🗙 Clear", yoy: "Comparison (YoY)", chooseFile: "Choose file", horizon: "Horizon:",
        calcBtn: "⚡ Calculate forecast", saveBtn: "💾 Download Excel", themeDark: "🌙 Dark theme", themeLight: "☀️ Light",
        statusAnalyze: "Analyzing file...", statusLoaded: (count) => `Database loaded: ${count} days`,
        errNeedMore: "Need at least 14 days.", errNoDate: "Specify the end date.", errFuture: "Date must be in the future.",
        successCalc: "Forecast built successfully!",
        monthNamesArr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        dayNamesArr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        chartFact: " (Fact)", chartForecast: " (Forecast)",
        // Новые ключи
        algoLabel: "Algorithm:", 
        algoCombo: "Combo (Trend + Last Year)", 
        algoExcel: "Trend + Seasonality Only", 
        algoNaive: "Last Year Analog Only"
    },
    uk: {
        title: "Прогнозер", filters: "Фільтри", metrics: "Показники", years: "Роки", months: "Місяці", days: "Дні тижня",
        clear: "🗙 Очистити", yoy: "Порівняння (YoY)", chooseFile: "Обрати файл", horizon: "Горизонт:",
        calcBtn: "⚡ Розрахувати прогноз", saveBtn: "💾 Завантажити Excel", themeDark: "🌙 Темна тема", themeLight: "☀️ Світла",
        statusAnalyze: "Аналіз файлу...", statusLoaded: (count) => `Базу завантажено: ${count} дн.`,
        errNeedMore: "Потрібно хоча б 14 днів.", errNoDate: "Вкажіть кінцеву дату.", errFuture: "Дата має бути в майбутньому.",
        successCalc: "Прогноз побудовано успішно!",
        monthNamesArr: ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"],
        dayNamesArr: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        chartFact: " (Факт)", chartForecast: " (Прогноз)",
        // Новые ключи
        algoLabel: "Алгоритм:", 
        algoCombo: "Комбо (Тренд + Минулий рік)", 
        algoExcel: "Тільки Тренд + Сезонність", 
        algoNaive: "Тільки Аналог минулого року"
    }
};

// === ВОССТАНОВЛЕНИЕ НАСТРОЕК ИЗ ПАМЯТИ ===
document.addEventListener('DOMContentLoaded', () => {
    // 1. Восстанавливаем язык
    const savedLang = localStorage.getItem('savedLang');
    if (savedLang) {
        const langSelect = document.getElementById('langSelect');
        langSelect.value = savedLang;
        // Искусственно вызываем событие 'change', чтобы интерфейс перевелся
        langSelect.dispatchEvent(new Event('change'));
    }

    // 2. Восстанавливаем тему
    const savedTheme = localStorage.getItem('savedTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        // Текст кнопки обновится с учетом текущего языка
        document.getElementById('themeToggle').innerText = i18n[currentLang].themeLight;
    }
});

document.getElementById('langSelect').addEventListener('change', function() {
    currentLang = this.value;
    localStorage.setItem('savedLang', currentLang);
    const dict = i18n[currentLang];
    document.title = dict.title;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.innerText = dict[key];
    });
    const fileLabel = document.getElementById('fileLabelText');
    if ([i18n.ru.chooseFile, i18n.en.chooseFile, i18n.uk.chooseFile].includes(fileLabel.innerText)) {
        fileLabel.innerText = dict.chooseFile;
    }
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeToggle').innerText = isDark ? dict.themeLight : dict.themeDark;
    const statusDiv = document.getElementById('status');
    const state = statusDiv.dataset.state;
    if (state) {
        if (state === 'statusLoaded') statusDiv.innerText = dict.statusLoaded(globalRawData.length);
        else if (dict[state]) statusDiv.innerText = dict[state];
    }
    monthNames = dict.monthNamesArr;
    dayNames = dict.dayNamesArr;
    if (globalRawData.length > 0) {
        updateSlicerTexts('monthSlicer', monthNames);
        updateSlicerTexts('daySlicer', dayNames);
        updateView(); 
    }
});

function updateSlicerTexts(containerId, namesArray) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.slicer-btn').forEach(btn => {
        btn.innerText = namesArray[parseInt(btn.dataset.value)];
    });
}

document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('savedTheme', isDark ? 'dark' : 'light');
    this.innerText = isDark ? i18n[currentLang].themeLight : i18n[currentLang].themeDark;
    if (chartInstance) {
        chartInstance.options.scales.x.ticks.color = isDark ? '#9ca3af' : '#6b7280';
        chartInstance.options.scales.y.ticks.color = isDark ? '#9ca3af' : '#6b7280';
        chartInstance.options.scales.x.grid.color = isDark ? '#374151' : '#e5e7eb';
        chartInstance.options.scales.y.grid.color = isDark ? '#374151' : '#e5e7eb';
        chartInstance.update();
    }
});
document.getElementById('yoyToggle').addEventListener('change', updateView);

// === ЗАГРУЗКА И ПАРСИНГ МНОЖЕСТВЕННЫХ СТОЛБЦОВ ===
document.getElementById('excelFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    let displayName = file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name;
    document.getElementById('fileLabelText').innerText = displayName;
    
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = 'block';
    statusDiv.dataset.state = 'statusAnalyze';
    statusDiv.innerText = i18n[currentLang].statusAnalyze;
    statusDiv.style.color = "var(--text-main)";
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        // Отключаем cellDates, чтобы избежать багов SheetJS с часовыми поясами
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        globalRawData = [];
        fullForecastData = [];
        availableMetrics = [];
        document.getElementById('exportBtn').style.display = "none";
        
        if (rows.length < 2) return;

        // Извлекаем заголовки показателей (пропускаем столбец А с датой)
        const headers = rows[0];
        for (let j = 1; j < headers.length; j++) {
            if (headers[j]) availableMetrics.push(String(headers[j]).trim());
        }

        let years = new Set(), months = new Set(), days = new Set();

        // Парсим строки
        for (let i = 1; i < rows.length; i++) {
            let dateVal = rows[i][0];
            let rowMetrics = {};
            let hasValidData = false;

            for (let j = 0; j < availableMetrics.length; j++) {
                let v = parseFloat(rows[i][j + 1]);
                if (!isNaN(v)) {
                    rowMetrics[availableMetrics[j]] = v;
                    hasValidData = true;
                }
            }

            if (typeof dateVal === 'number' && hasValidData) {
                // Математическая конвертация из формата Excel, игнорируя часовые пояса ПК
                let utcMs = Math.round((dateVal - 25569) * 86400 * 1000);
                let d = new Date(utcMs);
                let safeDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
                
                globalRawData.push({ date: safeDate, metrics: rowMetrics });
                years.add(safeDate.getFullYear());
                months.add(safeDate.getMonth());
                days.add(safeDate.getDay());
            }
        }

        globalRawData.sort((a, b) => a.date - b.date);

        // Строим срезы
        buildSlicerStr('metricSlicer', availableMetrics, m => m, m => m); // Срез показателей (строки)
        buildSlicer('yearSlicer', Array.from(years).sort((a,b)=>a-b), y => y, y => y);
        buildSlicer('monthSlicer', Array.from(months).sort((a,b)=>a-b), m => monthNames[m], m => m);
        let sortedDays = Array.from(days).sort((a,b) => (a===0?7:a) - (b===0?7:b));
        buildSlicer('daySlicer', sortedDays, d => dayNames[d], d => d);

        document.getElementById('slicersContainer').style.display = 'block';
        statusDiv.dataset.state = 'statusLoaded';
        statusDiv.innerText = i18n[currentLang].statusLoaded(globalRawData.length);
        statusDiv.style.color = "#10b981";
        updateView(); 
    };
    reader.readAsArrayBuffer(file);
});

// === ЛОГИКА СРЕЗОВ ===
function buildSlicer(containerId, items, labelFn, valueFn) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        const btn = document.createElement('div');
        btn.className = 'slicer-btn active';
        btn.innerText = labelFn(item);
        btn.dataset.value = valueFn(item);
        btn.addEventListener('click', function() { handleSlicerClick(this, containerId); });
        container.appendChild(btn);
    });
}

function buildSlicerStr(containerId, items, labelFn, valueFn) {
    buildSlicer(containerId, items, labelFn, valueFn); // Для строк логика та же
}

function handleSlicerClick(clickedBtn, containerId) {
    const container = document.getElementById(containerId);
    const allBtns = Array.from(container.querySelectorAll('.slicer-btn'));
    const activeBtns = allBtns.filter(b => b.classList.contains('active'));
    
    if (activeBtns.length === allBtns.length) {
        allBtns.forEach(b => b.classList.remove('active'));
        clickedBtn.classList.add('active');
    } else {
        clickedBtn.classList.toggle('active');
        if (allBtns.filter(b => b.classList.contains('active')).length === 0) {
            allBtns.forEach(b => b.classList.add('active'));
        }
    }
    updateView(); 
}

window.clearSlicer = function(containerId) {
    document.querySelectorAll(`#${containerId} .slicer-btn`).forEach(b => b.classList.add('active'));
    updateView();
}

function getActiveSlicerValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .slicer-btn.active`)).map(tag => parseInt(tag.dataset.value));
}
function getActiveSlicerValuesStr(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .slicer-btn.active`)).map(tag => tag.dataset.value);
}

// === РАСЧЕТ ПРОГНОЗА ДЛЯ ВСЕХ ПОКАЗАТЕЛЕЙ ===
// === РАСЧЕТ ПРОГНОЗА ДЛЯ ВСЕХ ПОКАЗАТЕЛЕЙ ===
document.getElementById('processBtn').addEventListener('click', () => {
    const endDateInput = document.getElementById('endDate').value;
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = 'block';

    if (globalRawData.length < 14) { 
        statusDiv.dataset.state = 'errNeedMore'; statusDiv.innerText = i18n[currentLang].errNeedMore; statusDiv.style.color = "#ef4444"; return; 
    }
    if (!endDateInput) { 
        statusDiv.dataset.state = 'errNoDate'; statusDiv.innerText = i18n[currentLang].errNoDate; statusDiv.style.color = "#ef4444"; return; 
    }
    
    let minDate = globalRawData[0].date;
    let lastDate = globalRawData[globalRawData.length - 1].date;
    
    const [y, m, d] = endDateInput.split('-');
    let targetEndDate = new Date(y, m - 1, d, 12, 0, 0);

    if (targetEndDate <= lastDate) { 
        statusDiv.dataset.state = 'errFuture'; statusDiv.innerText = i18n[currentLang].errFuture; statusDiv.style.color = "#ef4444"; return; 
    }

    const daysToForecast = Math.round((targetEndDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    
    // Рассчитываем прогноз независимо для каждой выбранной/доступной величины
    // Считываем выбранный алгоритм
    const selectedAlgo = document.getElementById('algoSelect').value;

    // Рассчитываем прогноз независимо для каждой выбранной/доступной величины
    let forecastsByMetric = {};
    availableMetrics.forEach(metric => {
        let hist = globalRawData.filter(row => row.metrics[metric] !== undefined).map(row => ({ date: row.date, volume: row.metrics[metric] }));
        
        if (hist.length >= 14) {
            if (selectedAlgo === 'combo') {
                // Считаем обе модели
                let fExcel = excelModelForecast(hist, hist[0].date, daysToForecast, lastDate);
                let fNaive = naiveSeasonalForecast(hist, hist[0].date, daysToForecast, lastDate);
                
                // Усредняем результаты (день ко дню)
                let fCombo = [];
                for (let i = 0; i < daysToForecast; i++) {
                    fCombo.push({
                        date: fExcel[i].date,
                        volume: (fExcel[i].volume + fNaive[i].volume) / 2
                    });
                }
                forecastsByMetric[metric] = fCombo;
                
            } else if (selectedAlgo === 'naive') {
                forecastsByMetric[metric] = naiveSeasonalForecast(hist, hist[0].date, daysToForecast, lastDate);
            } else {
                forecastsByMetric[metric] = excelModelForecast(hist, hist[0].date, daysToForecast, lastDate);
            }
        }
    });

    // Объединяем прогнозы обратно по датам
    fullForecastData = [];
    for (let i = 1; i <= daysToForecast; i++) {
        let targetDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + i, 12, 0, 0);
        let mObj = {};
        availableMetrics.forEach(metric => {
            if (forecastsByMetric[metric] && forecastsByMetric[metric][i-1]) {
                mObj[metric] = forecastsByMetric[metric][i-1].volume;
            }
        });
        fullForecastData.push({ date: targetDate, metrics: mObj });
    }

    // --- НОВЫЙ БЛОК: ОБНОВЛЕНИЕ ФИЛЬТРА ГОДОВ ---
    let activeYearsBefore = getActiveSlicerValues('yearSlicer'); // Запоминаем, какие года юзер оставил включенными
    let historicalYears = Array.from(new Set(globalRawData.map(d => d.date.getFullYear())));
    
    let allYears = new Set(historicalYears);
    fullForecastData.forEach(d => allYears.add(d.date.getFullYear())); // Докидываем года из прогноза (например, 2027)
    
    let sortedYears = Array.from(allYears).sort((a,b) => a - b);
    buildSlicer('yearSlicer', sortedYears, year => year, year => year); // Перерисовываем кнопки
    
    // Восстанавливаем состояние кнопок
    document.querySelectorAll('#yearSlicer .slicer-btn').forEach(btn => {
        let yearVal = parseInt(btn.dataset.value);
        // Если год был в истории, но юзер его отключил до расчета - снова выключаем
        if (historicalYears.includes(yearVal) && !activeYearsBefore.includes(yearVal)) {
            btn.classList.remove('active');
        }
    });
    // ----------------------------------------------

    statusDiv.dataset.state = 'successCalc';
    statusDiv.style.color = "#10b981"; 
    statusDiv.innerText = i18n[currentLang].successCalc;
    document.getElementById('exportBtn').style.display = "inline-flex";
    
    updateView(); 
});

function updateView() {
    if (globalRawData.length === 0) return;
    let activeYears = getActiveSlicerValues('yearSlicer');
    let activeMonths = getActiveSlicerValues('monthSlicer');
    let activeDays = getActiveSlicerValues('daySlicer');

    const filterLogic = d => activeYears.includes(d.date.getFullYear()) && activeMonths.includes(d.date.getMonth()) && activeDays.includes(d.date.getDay());

    let displayHistory = globalRawData.filter(filterLogic);
    let displayForecast = fullForecastData.length > 0 ? fullForecastData.filter(filterLogic) : [];
    drawChart(displayHistory, displayForecast);
}

// === МАТЕМАТИКА ПРОГНОЗА ===
function getSeason(month) {
    if (month === 11 || month === 0 || month === 1) return 'Зима';
    if (month >= 2 && month <= 4) return 'Весна';
    if (month >= 5 && month <= 7) return 'Лето';
    return 'Осень';
}

function excelModelForecast(history, minDate, daysToForecast, historyLastDate) {
    const msInDay = 1000 * 3600 * 24;
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    history.forEach(p => {
        let dayNumber = Math.round((p.date - minDate) / msInDay); 
        p.dayNumber = dayNumber;
        sumX += dayNumber; sumY += p.volume;
        sumXY += dayNumber * p.volume; sumX2 += dayNumber * dayNumber;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    let devByDay = {0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
    let devByMonth = {0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[], 10:[], 11:[]};
    let devBySeason = {'Зима':[], 'Весна':[], 'Лето':[], 'Осень':[]};

    history.forEach(p => {
        let trend = Math.round(intercept + slope * p.dayNumber);
        if (trend > 0) {
            let deviation = (p.volume - trend) / trend; 
            devByDay[p.date.getDay()].push(deviation);
            devByMonth[p.date.getMonth()].push(deviation);
            devBySeason[getSeason(p.date.getMonth())].push(deviation);
        }
    });

    const getAvg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    let adjDay = {}; for(let i=0; i<7; i++) adjDay[i] = getAvg(devByDay[i]);
    let adjMonth = {}; for(let i=0; i<12; i++) adjMonth[i] = getAvg(devByMonth[i]);
    let adjSeason = {}; for(let s of ['Зима', 'Весна', 'Лето', 'Осень']) adjSeason[s] = getAvg(devBySeason[s]);

    let forecast = [];
    for (let i = 1; i <= daysToForecast; i++) {
        let targetDate = new Date(historyLastDate.getFullYear(), historyLastDate.getMonth(), historyLastDate.getDate() + i, 12, 0, 0);
        let targetDayNum = Math.round((targetDate.getTime() - minDate.getTime()) / msInDay);
        let trendVal = intercept + slope * targetDayNum;
        let pDay = adjDay[targetDate.getDay()];
        let pMonth = adjMonth[targetDate.getMonth()];
        let pSeason = adjSeason[getSeason(targetDate.getMonth())];
        
        let totalAdjustment = Math.max(pDay + pMonth + pSeason, -0.97);
        let finalVolume = trendVal * (1 + totalAdjustment);
        forecast.push({ date: targetDate, volume: Math.max(0, finalVolume) });
    }
    return forecast;
}

// Алгоритм 2: Скользящее среднее (SMA-14)
function smaModelForecast(history, minDate, daysToForecast, historyLastDate) {
    let forecast = [];
    let windowSize = 14;
    // Берем последние 14 значений факта
    let lastValues = history.slice(-windowSize).map(h => h.volume);
    let avg = lastValues.length > 0 ? lastValues.reduce((a,b) => a + b, 0) / lastValues.length : 0;

    for (let i = 1; i <= daysToForecast; i++) {
        let targetDate = new Date(historyLastDate.getFullYear(), historyLastDate.getMonth(), historyLastDate.getDate() + i, 12, 0, 0);
        // Проецируем среднее значение стабильной линией
        forecast.push({ date: targetDate, volume: Math.max(0, avg) });
    }
    return forecast;
}

// Алгоритм 3: Наивный сезонный прогноз (сдвиг на 52 недели / 364 дня)
function naiveSeasonalForecast(history, minDate, daysToForecast, historyLastDate) {
    let forecast = [];
    const msInDay = 1000 * 3600 * 24;
    
    // Считаем фолбэк (среднее за 14 дней), если истории за прошлый год не окажется
    let lastValues = history.slice(-14).map(h => h.volume);
    let fallbackAvg = lastValues.length > 0 ? lastValues.reduce((a,b) => a + b, 0) / lastValues.length : 0;

    for (let i = 1; i <= daysToForecast; i++) {
        let targetDate = new Date(historyLastDate.getFullYear(), historyLastDate.getMonth(), historyLastDate.getDate() + i, 12, 0, 0);
        
        // Отматываем ровно на 364 дня назад (52 недели). 
        // Это гарантирует, что понедельник спрогнозируется по понедельнику.
        let pastTargetTime = targetDate.getTime() - (364 * msInDay);
        let pastTargetDate = new Date(pastTargetTime);
        
        // Ищем точное совпадение в истории
        let closestHist = history.find(h => 
            h.date.getFullYear() === pastTargetDate.getFullYear() &&
            h.date.getMonth() === pastTargetDate.getMonth() &&
            h.date.getDate() === pastTargetDate.getDate()
        );

        let finalVolume = closestHist ? closestHist.volume : fallbackAvg;
        forecast.push({ date: targetDate, volume: Math.max(0, finalVolume) });
    }
    return forecast;
}


// === ВЫГРУЗКА (С УЧЕТОМ ПОКАЗАТЕЛЕЙ) ===
document.getElementById('exportBtn').addEventListener('click', () => {
    if (fullForecastData.length === 0) return;
    
    let activeYears = getActiveSlicerValues('yearSlicer');
    let activeMonths = getActiveSlicerValues('monthSlicer');
    let activeDays = getActiveSlicerValues('daySlicer');
    let activeMetrics = getActiveSlicerValuesStr('metricSlicer'); // Только активные
    
    let filteredForecast = fullForecastData.filter(d => activeYears.includes(d.date.getFullYear()) && activeMonths.includes(d.date.getMonth()) && activeDays.includes(d.date.getDay()));
    
    const exportData = filteredForecast.map(item => {
        let row = { 'Дата': item.date.toLocaleDateString('ru-RU') };
        activeMetrics.forEach(m => {
            if (item.metrics[m] !== undefined) row[`Прогноз ${m}`] = Math.round(item.metrics[m]);
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Прогноз");
    XLSX.writeFile(workbook, "Forecast_Multi.xlsx");
});

// === ОТРИСОВКА ГРАФИКОВ (МНОЖЕСТВО ЛИНИЙ) ===
function drawChart(displayHistory, displayForecast) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const isYoyMode = document.getElementById('yoyToggle').checked;
    const chartContainer = document.getElementById('chartContainer');

    if (chartInstance) chartInstance.destroy();

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            x: { ticks: { color: isDark ? '#9ca3af' : '#6b7280' }, grid: { color: isDark ? '#374151' : '#e5e7eb' } },
            y: { beginAtZero: true, ticks: { color: isDark ? '#9ca3af' : '#6b7280' }, grid: { color: isDark ? '#374151' : '#e5e7eb' } }
        },
        elements: { point: { radius: 2 } },
        plugins: { legend: { labels: { color: isDark ? '#f9fafb' : '#111827' } }, tooltip: { mode: 'index', intersect: false } }
    };

    const activeMetrics = getActiveSlicerValuesStr('metricSlicer');
    // Палитра цветов для разных линий
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

    if (isYoyMode) {
        // --- РЕЖИМ ГОД К ГОДУ (YoY) ---
        const yoyLabels = [];
        const leapYear = 2024; 
        let d = new Date(leapYear, 0, 1);
        while (d.getFullYear() === leapYear) {
            yoyLabels.push(d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
            d.setDate(d.getDate() + 1);
        }

        const activeYears = getActiveSlicerValues('yearSlicer');
        const datasets = [];

        activeMetrics.forEach((metric, mIdx) => {
            activeYears.forEach((year, yIdx) => {
                // Если выбран 1 показатель, раскрашиваем годы разными цветами. Если несколько — цвета по показателям.
                const color = activeMetrics.length === 1 ? palette[yIdx % palette.length] : palette[mIdx % palette.length];
                
                const yearHist = displayHistory.filter(item => item.date.getFullYear() === year && item.metrics[metric] !== undefined);
                const yearFore = displayForecast.filter(item => item.date.getFullYear() === year && item.metrics[metric] !== undefined);

                if (yearHist.length === 0 && yearFore.length === 0) return;

                const histData = new Array(366).fill(null);
                const foreData = new Array(366).fill(null);

                yearHist.forEach(item => {
                    const idx = yoyLabels.indexOf(item.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
                    if (idx !== -1) histData[idx] = item.metrics[metric];
                });

                yearFore.forEach(item => {
                    const idx = yoyLabels.indexOf(item.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
                    if (idx !== -1) foreData[idx] = item.metrics[metric];
                });
                
                if (yearHist.length > 0 && yearFore.length > 0) {
                     let idx = yoyLabels.indexOf(yearHist[yearHist.length-1].date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
                     if(idx !== -1) foreData[idx] = yearHist[yearHist.length-1].metrics[metric];
                }

                let labelPrefix = activeMetrics.length > 1 ? `[${year}] ${metric}` : `[${year}]`;
                
                if (yearHist.length > 0) {
                    datasets.push({ label: labelPrefix + i18n[currentLang].chartFact, data: histData, borderColor: color, backgroundColor: color, borderWidth: 2, fill: false, tension: 0.1, spanGaps: true });
                }
                if (yearFore.length > 0) {
                    datasets.push({ label: labelPrefix + i18n[currentLang].chartForecast, data: foreData, borderColor: color, backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 5], fill: false, tension: 0.1, spanGaps: true });
                }
            });
        });

        chartContainer.style.width = (366 * 5 > chartContainer.parentElement.clientWidth) ? (366 * 5) + 'px' : '100%';
        chartOptions.animation = false;
        chartInstance = new Chart(ctx, { type: 'line', data: { labels: yoyLabels, datasets: datasets }, options: chartOptions });
        setTimeout(() => { document.querySelector('.chart-scroll-wrapper').scrollLeft = 0; }, 50);

    } else {
        // --- ОБЫЧНЫЙ РЕЖИМ ---
        const labels = [
            ...displayHistory.map(d => d.date.toLocaleDateString('ru-RU')),
            ...displayForecast.map(d => d.date.toLocaleDateString('ru-RU'))
        ];

        const calculatedWidth = labels.length * 5; 
        chartContainer.style.width = (calculatedWidth > chartContainer.parentElement.clientWidth) ? calculatedWidth + 'px' : '100%';
        chartOptions.animation = labels.length > 300 ? false : true;

        const datasets = [];
        
        activeMetrics.forEach((metric, idx) => {
            const color = palette[idx % palette.length];
            
            const historyVolumes = displayHistory.map(d => d.metrics[metric] !== undefined ? d.metrics[metric] : null);
            const padding = Array(displayForecast.length).fill(null);
            const fullHistory = [...historyVolumes, ...padding];
            
            let forecastVolumes = [];
            if (displayForecast.length > 0) {
                forecastVolumes = Array(displayHistory.length > 0 ? displayHistory.length - 1 : 0).fill(null);
                let lastHist = displayHistory.length > 0 ? displayHistory[displayHistory.length - 1].metrics[metric] : null;
                forecastVolumes.push(lastHist !== undefined ? lastHist : null);
                forecastVolumes = forecastVolumes.concat(displayForecast.map(d => d.metrics[metric] !== undefined ? d.metrics[metric] : null));
            }

            datasets.push({
                label: metric + i18n[currentLang].chartFact, data: fullHistory, 
                borderColor: color, backgroundColor: 'transparent', 
                borderWidth: 2, fill: false, tension: 0.1, spanGaps: true
            });
            if (displayForecast.length > 0) {
                datasets.push({
                    label: metric + i18n[currentLang].chartForecast, data: forecastVolumes, 
                    borderColor: color, borderDash: [5, 5], 
                    borderWidth: 2, fill: false, tension: 0.1, spanGaps: true
                });
            }
        });

        chartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: datasets }, options: chartOptions });
        setTimeout(() => { 
            const scrollWrapper = document.querySelector('.chart-scroll-wrapper');
            if (scrollWrapper) scrollWrapper.scrollLeft = scrollWrapper.scrollWidth; 
        }, 100);
    }
}