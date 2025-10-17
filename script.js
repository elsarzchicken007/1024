// --- 전역 변수 설정 ---
let targetTime = 0;      // 카운트다운: 설정된 총 시간 | 스탑워치: 사용 안함 (밀리초)
let timeRemaining = 0;   // 카운트다운: 남은 시간 | 스탑워치: 경과 시간 (밀리초)
let isRunning = false;
let startTime = 0;       // 타이머 시작/재개 시점의 performance.now() 값
let animationFrameId;
let currentMode = 'countdown'; // 초기 모드 설정

let lapCounter = 0;          // 랩 횟수 카운터
let lastLapTime = 0;         // 마지막 랩타임이 기록된 시점의 timeRemaining 값

const display = document.getElementById('timer-display');
const alarmSound = document.getElementById('alarm-sound');
const presetsDiv = document.getElementById('countdown-presets');
const lapList = document.getElementById('lap-list');  // 랩 리스트 요소
const lapBtn = document.getElementById('lap-btn');    // 랩 버튼 요소
const lapContainer = document.getElementById('lap-times-container'); // 랩타임 컨테이너
const timerWrapper = document.getElementById('timer-display-wrapper'); // 타이머 래퍼 요소
const defaultTime = 30 * 1000;

// 초기 설정 실행
setMode(currentMode);


// --- 모드 제어 함수 ---

/**
 * 타이머 모드를 설정하고 UI를 업데이트합니다.
 * @param {string} mode - 'countdown' 또는 'stopwatch'
 */
function setMode(mode) {
    pauseTimer(); 
    currentMode = mode;
    
    // 모드 버튼 스타일 업데이트
    document.getElementById('mode-countdown').classList.remove('active');
    document.getElementById('mode-stopwatch').classList.remove('active');
    document.getElementById(`mode-${mode}`).classList.add('active');

    if (mode === 'countdown') {
        presetsDiv.style.display = 'block';
        lapBtn.style.display = 'none';
        lapContainer.classList.add('hidden'); // 랩타임 컨테이너 숨김
        
        timerWrapper.classList.add('full-center'); // 타이머 가운데 정렬 클래스 적용
        
        setPreset(targetTime > 0 ? targetTime : defaultTime); 
    } else { // stopwatch
        presetsDiv.style.display = 'none';
        lapBtn.style.display = 'inline-block';
        lapContainer.classList.remove('hidden'); // 랩타임 컨테이너 표시
        
        timerWrapper.classList.remove('full-center'); // 타이머 정렬 클래스 제거 (분할 복원)
        
        // 스탑워치 모드 초기화 및 랩 데이터 리셋
        resetLapData();
        updateDisplay(timeRemaining);
    }
}


// --- 랩타임 기능 함수 ---

/**
 * 랩타임 관련 데이터를 초기화합니다. (빈 목록 생성 로직 제거)
 */
function resetLapData() {
    timeRemaining = 0; 
    lapCounter = 0;
    lastLapTime = 0;
    lapList.innerHTML = ''; // 랩 목록 비우기
    
    // 랩 기록은 lapTime() 함수 호출 시점에 새로 생성되어 추가됩니다.
}

/**
 * 현재 경과 시간을 랩 타임으로 기록합니다. (스탑워치 모드 전용)
 */
function lapTime() {
    if (currentMode !== 'stopwatch' || !isRunning) {
        return;
    }

    lapCounter++;
    
    const totalElapsedTime = timeRemaining; 
    const currentLapTime = totalElapsedTime - lastLapTime;
    
    lastLapTime = totalElapsedTime; // 마지막 랩 시간 업데이트

    const lapNumber = lapCounter;
    
    const lapItem = document.createElement('li'); 
    lapItem.innerHTML = `
        <span>랩 ${lapNumber}</span>
        <span>( ${formatTime(currentLapTime)} )</span>
        <span>${formatTime(totalElapsedTime)}</span>
    `;
    
    // 🚨 최신 랩이 목록의 맨 위(랩 1, 랩 2, ... 순으로)에 추가되도록 prepend 사용
    lapList.prepend(lapItem);
}


// --- 타이머 제어 함수 ---

/**
 * 미리 설정된 시간으로 카운트다운 타이머를 설정합니다.
 * @param {number} ms - 설정할 시간 (밀리초)
 */
function setPreset(ms) {
    if (isRunning) {
        pauseTimer();
    }
    
    targetTime = ms;
    timeRemaining = ms;  // 남은 시간 초기화
    
    updateDisplay(timeRemaining);
}

/**
 * 타이머를 시작/재개합니다. (시작 시 비프음)
 */
function startTimer() {
    if (isRunning) {
        return;
    }
    
    if (currentMode === 'countdown' && timeRemaining <= 0) {
        return;
    }
    
    // 시작 시 비프음 재생
    //alarmSound.currentTime = 0; 
    //alarmSound.play().catch(e => {
    //    console.warn("시작 알람 재생 실패:", e);
    //});

    isRunning = true;
    
    if (currentMode === 'stopwatch') {
        startTime = performance.now() - timeRemaining;
    } else {
        startTime = performance.now();
        targetTime = timeRemaining;
    }
    
    tick();
}

/**
 * 타이머를 일시 정지합니다.
 */
function pauseTimer() {
    if (!isRunning) {
        return;
    }
    
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
    
    const elapsedTime = performance.now() - startTime;
    
    if (currentMode === 'countdown') {
        timeRemaining = targetTime - elapsedTime;
    } else { // stopwatch
        timeRemaining = elapsedTime;
    }
    
    updateDisplay(timeRemaining);
}

/**
 * 타이머를 초기 설정값으로 리셋합니다.
 */
function resetTimer() {
    pauseTimer();
    
    if (currentMode === 'countdown') {
        timeRemaining = targetTime;
    } else { // stopwatch
        resetLapData(); // 랩 데이터 초기화 함수 사용
    }
    
    updateDisplay(timeRemaining);
}


// --- 핵심 로직: 시간 업데이트 및 표시 ---

/**
 * 매 프레임마다 시간을 업데이트하고 표시합니다.
 * requestAnimationFrame을 사용하여 정밀도를 높입니다.
 */
function tick() {
    if (!isRunning) return;

    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;
    
    if (currentMode === 'countdown') {
        // 카운트다운: 시간이 감소
        timeRemaining = targetTime - elapsedTime;
        
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
            updateDisplay(timeRemaining);
            
            // 🚨 타이머 종료 시 비프음 재생
            alarmSound.currentTime = 0; 
            alarmSound.play().catch(e => {
                console.error("타이머 종료 알람 재생 실패:", e);
            });
            
            alert("타이머 종료!");
            return;
        }
        
    } else { // stopwatch
        // 스탑워치: 시간이 증가 (종료 조건 없음)
        timeRemaining = elapsedTime;
    }
    
    updateDisplay(timeRemaining);
    
    // 다음 프레임에 다시 tick 함수 호출
    animationFrameId = requestAnimationFrame(tick);
}

/**
 * 밀리초를 '분:초.1/100초' 형식으로 변환하여 화면에 표시합니다.
 * @param {number} ms - 표시할 시간 (밀리초)
 * @returns {string} 형식화된 시간 문자열
 */
function formatTime(ms) {
    ms = Math.max(0, ms);

    const centiseconds = Math.floor((ms % 1000) / 10);
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedCentiseconds = String(centiseconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}.${formattedCentiseconds}`;
}

/**
 * 메인 타이머 디스플레이를 업데이트합니다.
 * @param {number} ms - 남은/경과 시간 (밀리초)
 */
function updateDisplay(ms) {
    display.textContent = formatTime(ms);
}