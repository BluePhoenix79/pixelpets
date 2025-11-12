import { supabase } from './supabase.js';
import { increaseBalance } from './finances.js';

const topicSelect = document.getElementById('topic-select');
const startQuizBtn = document.getElementById('start-quiz-btn');
const quizCard = document.querySelector('.quiz-card');
const questionEl = document.getElementById('question');
const answersContainer = document.getElementById('answers-container');
const nextQuestionBtn = document.getElementById('next-question-btn');

let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentUser = null;

const questions = {
    math: [
        { question: 'What is 2 + 2?', answers: ['3', '4', '5'], correct: '4' },
        { question: 'What is 10 * 5?', answers: ['40', '50', '60'], correct: '50' },
    ],
    science: [
        { question: 'What is the chemical symbol for water?', answers: ['H2O', 'CO2', 'O2'], correct: 'H2O' },
        { question: 'What planet is known as the Red Planet?', answers: ['Mars', 'Venus', 'Jupiter'], correct: 'Mars' },
    ],
    history: [
        { question: 'Who was the first president of the United States?', answers: ['Abraham Lincoln', 'George Washington', 'Thomas Jefferson'], correct: 'George Washington' },
        { question: 'In what year did the Titanic sink?', answers: ['1912', '1905', '1920'], correct: '1912' },
    ],
};

async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    currentUser = user;
}

function startQuiz() {
    const topic = topicSelect.value;
    currentQuestions = questions[topic];
    currentQuestionIndex = 0;
    score = 0;

    document.querySelector('.topic-selection-card').style.display = 'none';
    quizCard.style.display = 'block';

    showQuestion();
}

function showQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    questionEl.textContent = question.question;
    answersContainer.innerHTML = '';

    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.classList.add('btn', 'answer-btn');
        button.addEventListener('click', () => selectAnswer(answer, question.correct));
        answersContainer.appendChild(button);
    });
}

function selectAnswer(selected, correct) {
    const answerBtns = document.querySelectorAll('.answer-btn');
    answerBtns.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
            btn.classList.add('correct');
        } else if (btn.textContent === selected) {
            btn.classList.add('incorrect');
        }
    });

    if (selected === correct) {
        score++;
    }

    nextQuestionBtn.style.display = 'block';
}

async function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        showQuestion();
        nextQuestionBtn.style.display = 'none';
    } else {
        await endQuiz();
    }
}

async function endQuiz() {
    const reward = score * 10;
    await increaseBalance(currentUser.id, reward);
    alert(`Quiz finished! You earned $${reward}.`);
    window.location.href = 'pet.html';
}

startQuizBtn.addEventListener('click', startQuiz);
nextQuestionBtn.addEventListener('click', nextQuestion);

checkAuth();
