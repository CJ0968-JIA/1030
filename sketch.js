// --- 核心變數 ---
let quizTable;         // 儲存 CSV 數據
let questions = [];    // 格式化後的題目陣列
let currentQuestionIndex = 0;
let score = 0;
let state = 'quiz';    // 狀態機: 'quiz', 'result', 'celebrate', 'encourage'
let totalQuestions = 0;

// --- 特效相關變數 ---
let clickEffectTimer = 0;     // 選項點擊特效計時器
let clickEffectActive = false;
let clickEffectOption = '';   // 記錄被點擊的選項 (A/B/C)
const EFFECT_DURATION = 30;   // 特效持續幀數 (約 0.5 秒)

// --- 資料預載入 ---
function preload() {
    // 必須在 preload 中讀取，確保 setup 執行時資料已準備好
    // 'header' 參數告訴 p5.js CSV 檔案有標題列
    quizTable = loadTable('questions.csv', 'csv', 'header');
}

// --- 初始化 ---
function setup() {
    createCanvas(800, 600);
    angleMode(DEGREES);
    noCursor(); // 隱藏系統游標
    textAlign(CENTER, CENTER);

    // 將 p5.Table 資料轉換為 JS 物件陣列
    for (let r = 0; r < quizTable.getRowCount(); r++) {
        questions.push({
            question: quizTable.getString(r, 'question'),
            options: {
                A: quizTable.getString(r, 'optionA'),
                B: quizTable.getString(r, 'optionB'),
                C: quizTable.getString(r, 'optionC'),
            },
            correct: quizTable.getString(r, 'correctOption'),
        });
    }
    totalQuestions = questions.length;
}

// --- 繪圖迴圈 ---
function draw() {
    background(240);

    // 根據狀態切換畫面
    switch (state) {
        case 'quiz':
            drawQuizScreen();
            break;
        case 'result':
            drawResultScreen();
            break;
        case 'celebrate':
            drawCelebrationAnimation();
            break;
        case 'encourage':
            drawEncouragementAnimation();
            break;
    }

    // 更新並繪製點擊特效
    updateClickEffect();
    // 游標特效始終繪製在最上層
    drawCustomCursor();
}
// --- 繪製測驗畫面 ---
function drawQuizScreen() {
    if (currentQuestionIndex >= totalQuestions) {
        state = 'result'; // 答完所有題目
        return;
    }

    let q = questions[currentQuestionIndex];
    let options = ['A', 'B', 'C'];
    const buttonHeight = 60;
    const w = 450;
    let startY = 150;

    // 顯示題目
    fill(50);
    textSize(28);
    text(`問題 ${currentQuestionIndex + 1} / ${totalQuestions}`, width / 2, 50);
    textSize(20);
    text(q.question, width / 2, 90, width - 100, 80);

    // 繪製選項按鈕
    for (let i = 0; i < options.length; i++) {
        let optionKey = options[i];
        let y = startY + i * (buttonHeight + 20);
        let x = width / 2;

        // 1. 懸停特效
        let isHover = mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y && mouseY < y + buttonHeight;
        
        // 2. 點擊閃爍特效
        if (clickEffectActive && optionKey === clickEffectOption) {
            // 點擊時顏色漸變
            let ratio = clickEffectTimer / EFFECT_DURATION;
            // 從亮綠/紅 (根據答案對錯) 漸變回預設顏色
            let targetColor = optionKey === q.correct ? color(100, 255, 100) : color(255, 100, 100);
            let currentColor = lerpColor(color(180), targetColor, ratio);
            fill(currentColor);
        } else if (isHover) {
            fill(150, 200, 255); // 懸停顏色
        } else {
            fill(180); // 預設顏色
        }

        rectMode(CENTER);
        rect(x, y + buttonHeight / 2, w, buttonHeight, 10);

        // 顯示選項文字
        fill(50);
        textSize(18);
        textAlign(LEFT, CENTER);
        text(`${optionKey}. ${q.options[optionKey]}`, x - w / 2 + 20, y + buttonHeight / 2);
    }
}

// --- 更新點擊特效狀態 (每幀執行) ---
function updateClickEffect() {
    if (clickEffectActive) {
        clickEffectTimer--;
        if (clickEffectTimer <= 0) {
            clickEffectActive = false;
            // 特效結束後才切換到下一題
            currentQuestionIndex++;
        }
    }
}

// --- 滑鼠點擊事件 ---
function mousePressed() {
    if (state === 'quiz' && !clickEffectActive) {
        let q = questions[currentQuestionIndex];
        let options = ['A', 'B', 'C'];
        const buttonHeight = 60;
        let startY = 150;
        const w = 450;
        let x = width / 2;

        for (let i = 0; i < options.length; i++) {
            let optionKey = options[i];
            let y = startY + i * (buttonHeight + 20);

            if (mouseX > x - w / 2 && mouseX < x + w / 2 && mouseY > y && mouseY < y + buttonHeight) {
                // 觸發點擊特效
                clickEffectActive = true;
                clickEffectOption = optionKey;
                clickEffectTimer = EFFECT_DURATION; 

                // 檢查答案
                if (optionKey === q.correct) {
                    score++;
                }

                // 立即退出迴圈，等待特效結束再進入下一題
                return;
            }
        }
    }
    
    // 從結果畫面點擊進入最終動畫
    if (state === 'result') {
        let percentage = score / totalQuestions;
        if (percentage >= 0.7) {
            state = 'celebrate'; // 高分 (70% 或更高)
        } else {
            state = 'encourage'; // 低分
        }
    }
}
// --- 自定義游標特效 ---
let cursorTrail = []; // 儲存游標軌跡的陣列
const MAX_TRAIL_LENGTH = 15;

function drawCustomCursor() {
    // 1. 軌跡效果 (游標選取特效)
    cursorTrail.push({ x: mouseX, y: mouseY });
    if (cursorTrail.length > MAX_TRAIL_LENGTH) {
        cursorTrail.shift(); // 移除最舊的點
    }

    push();
    noFill();
    stroke(50, 150, 255, 100); // 藍色半透明描邊
    strokeWeight(3);
    
    // 繪製軌跡
    beginShape();
    for (let i = 0; i < cursorTrail.length; i++) {
        let p = cursorTrail[i];
        // 軌跡的粗細和透明度隨著 i (時間) 漸變
        let weight = map(i, 0, MAX_TRAIL_LENGTH, 1, 5);
        let alpha = map(i, 0, MAX_TRAIL_LENGTH, 50, 200);
        
        stroke(50, 150, 255, alpha);
        strokeWeight(weight);
        point(p.x, p.y); // 用點而不是線來製作閃爍顆粒感
    }
    endShape();
    pop();

    // 2. 游標本體 (中心點)
    push();
    translate(mouseX, mouseY);
    let size = 10 + sin(frameCount * 10) * 3; // 脈動大小
    fill(255, 100, 100);
    ellipse(0, 0, size, size);
    pop();
}

// --- 成績畫面 (過渡) ---
function drawResultScreen() {
    let percentage = score / totalQuestions;
    
    textAlign(CENTER);
    textSize(40);
    fill(50);
    text('測驗結束！', width / 2, height / 3);
    
    textSize(60);
    fill(0, 150, 0); // 綠色分數
    text(`總分: ${score} / ${totalQuestions}`, width / 2, height / 2);

    textSize(20);
    fill(100);
    text('點擊畫面進入最終動畫', width / 2, height - 100);
}

// --- 稱讚動畫 (高分 $\ge 70\%$) ---
function drawCelebrationAnimation() {
    background(255, 230, 150); // 溫暖的慶祝背景
    
    // 繪製彩帶效果
    for (let i = 0; i < 20; i++) {
        push();
        let angle = (frameCount * 5 + i * 20) % 360;
        let radius = 200 + sin(frameCount * 2) * 50;
        translate(width / 2 + cos(angle) * radius, height / 2 + sin(angle) * radius);
        rotate(angle + frameCount * 10);
        
        // 隨機顏色
        let hue = (frameCount + i * 15) % 255;
        colorMode(HSB, 255);
        fill(hue, 200, 255, 200);
        rect(0, 0, 50, 10);
        colorMode(RGB); // 切回預設
        pop();
    }
    
    // 彈跳文字
    textAlign(CENTER);
    textSize(80);
    fill(255, 50, 0);
    let t = '做得太棒了！';
    for (let i = 0; i < t.length; i++) {
        let yOffset = sin(frameCount * 8 + i * 50) * 15; // 彈跳效果
        text(t[i], width / 2 - 250 + i * 50, height / 2 + yOffset);
    }
}

// --- 鼓勵動畫 (低分 $< 70\%$) ---
function drawEncouragementAnimation() {
    background(100, 100, 150); // 穩定的深色背景
    
    // 繪製緩慢上升的 "學習" 氣泡
    for (let i = 0; i < 10; i++) {
        let x = (i * 80) + sin(frameCount * 0.5 + i * 10) * 50;
        let y = (height - (frameCount * 0.8 + i * 50) % (height + 100));
        let size = 20 + abs(sin(frameCount * 0.5 + i * 10)) * 10;
        
        fill(150, 200, 255, 120); // 鼓勵的淺藍色
        ellipse(x, y, size, size);
        
        if (i % 2 === 0) {
            fill(255);
            textSize(12);
            text('學習', x, y);
        }
    }
    
    // 鼓勵文字 (緩慢呼吸效果)
    textAlign(CENTER);
    let alpha = 200 + sin(frameCount * 3) * 55;
    fill(255, 255, 255, alpha);
    
    textSize(60);
    text('沒關係！', width / 2, height / 2 - 50);
    
    textSize(30);
    text('進步就是最好的成績！', width / 2, height / 2 + 30);
}
