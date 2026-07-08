/**
 * Test Analytics Utility Module
 * Enforces academic integrity analytics, micro-skill mastery checks, and time allocation audits.
 */

/**
 * Checks whether a typed numerical answer matches the correct database text answer,
 * accounting for spacing and floating-point approximations.
 * 
 * @param {string} userAnswer - The user's input answer.
 * @param {string} correctAnswerText - The official database answer text.
 * @returns {boolean} True if correct, false otherwise.
 */
function isNumericalAnswerCorrect(userAnswer, correctAnswerText) {
    if (!userAnswer || !correctAnswerText) return false;
    
    const cleanUser = userAnswer.trim().replace(/\s+/g, '');
    const cleanCorrect = correctAnswerText.trim().replace(/\s+/g, '');
    
    if (cleanUser === cleanCorrect) return true;
    
    const userNum = parseFloat(cleanUser);
    const correctNum = parseFloat(cleanCorrect);
    
    if (!isNaN(userNum) && !isNaN(correctNum)) {
        return Math.abs(userNum - correctNum) < 0.01;
    }
    
    return false;
}

/**
 * Calculates a mock percentile based on the raw score relative to maximum possible score,
 * matching JEE distribution approximations.
 * 
 * @param {number} score - The user's raw score.
 * @param {number} maxScore - The maximum possible score.
 * @returns {number} The percentile rank (0.00 to 99.99).
 */
function calculateMockPercentile(score, maxScore) {
    if (maxScore <= 0) return 0;
    
    const ratio = score / maxScore;
    let percentile = 0;
    
    if (ratio >= 0.9) {
        percentile = 98.5 + 1.49 * ((ratio - 0.9) / 0.1);
    } else if (ratio >= 0.7) {
        percentile = 90.0 + 8.5 * ((ratio - 0.7) / 0.2);
    } else if (ratio >= 0.5) {
        percentile = 70.0 + 20.0 * ((ratio - 0.5) / 0.2);
    } else if (ratio >= 0.3) {
        percentile = 40.0 + 30.0 * ((ratio - 0.3) / 0.2);
    } else {
        percentile = Math.max(1.0, 40.0 * ((ratio + 0.25) / 0.55));
    }
    
    return parseFloat(percentile.toFixed(2));
}

/**
 * Gets a baseline cohort average time for a question based on its difficulty.
 * 
 * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard').
 * @returns {number} The average cohort time in seconds.
 */
function getCohortAverageTime(difficulty) {
    const diff = String(difficulty).toLowerCase();
    if (diff === 'easy') return 60;
    if (diff === 'hard') return 180;
    return 120; // default medium
}

/**
 * Aggregates exam raw metrics and returns a detailed TestAnalytics object.
 * 
 * @param {Array<Object>} questions - The array of mapped test questions.
 * @param {Object} answers - Map of question ID to user selected option index (number) or text input (string).
 * @param {Object} timeSpentMap - Map of question ID to time spent in seconds (number).
 * @returns {Object} The aggregated TestAnalytics object conforming to the TypeScript/Data interface.
 */
function generateTestAnalytics(questions, answers, timeSpentMap) {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalTimeSpent = 0;
    
    const maxPossibleScore = questions.length * 4;
    const timeAllocation = [];
    const skillGroups = {};

    questions.forEach((q) => {
        const userAns = answers[q.id];
        const isAttempted = userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
        
        let isCorrect = false;
        if (isAttempted) {
            if (q.is_mcq) {
                isCorrect = userAns === q.correct_answer;
            } else {
                isCorrect = isNumericalAnswerCorrect(String(userAns), String(q.correct_answer));
            }
        }

        const timeSpent = timeSpentMap[q.id] || 0;
        totalTimeSpent += timeSpent;

        if (!isAttempted) {
            unattemptedCount++;
        } else if (isCorrect) {
            correctCount++;
            score += 4;
        } else {
            incorrectCount++;
            score -= 1;
        }

        // Time Allocation calculations
        const cohortAvg = getCohortAverageTime(q.difficulty);
        const diff = timeSpent - cohortAvg;
        let pace = 'Average';
        if (timeSpent < cohortAvg - 15) {
            pace = 'Fast';
        } else if (timeSpent > cohortAvg + 15) {
            pace = 'Slow';
        }

        timeAllocation.push({
            questionId: q.id,
            topic: q.topic || q.chapter || 'General',
            difficulty: q.difficulty || 'Medium',
            timeSpent: timeSpent,
            cohortAverageTime: cohortAvg,
            difference: diff,
            pace: pace,
            isCorrect: isCorrect
        });

        // Skill Breakdown grouping
        const topic = q.topic || q.chapter || 'General';
        if (!skillGroups[topic]) {
            skillGroups[topic] = {
                topic: topic,
                totalQuestions: 0,
                totalAttempted: 0,
                totalCorrect: 0
            };
        }
        
        skillGroups[topic].totalQuestions++;
        if (isAttempted) {
            skillGroups[topic].totalAttempted++;
            if (isCorrect) {
                skillGroups[topic].totalCorrect++;
            }
        }
    });

    // Compute Micro-Skill performance
    const microSkills = Object.values(skillGroups).map(group => {
        const accuracy = group.totalAttempted > 0 ? Math.round((group.totalCorrect / group.totalAttempted) * 100) : 0;
        
        // CRITICAL CONSTRAINT: Minimum sample size check (requires at least 3 attempted questions)
        let masteryStatus = 'Insufficient Data';
        if (group.totalAttempted >= 3) {
            if (accuracy >= 80) masteryStatus = 'Mastered';
            else if (accuracy >= 50) masteryStatus = 'Proficient';
            else masteryStatus = 'Needs Improvement';
        }

        return {
            topic: group.topic,
            totalQuestions: group.totalQuestions,
            totalAttempted: group.totalAttempted,
            totalCorrect: group.totalCorrect,
            accuracy: accuracy,
            masteryStatus: masteryStatus
        };
    });

    // Positive Reinforcement: Top Strengths
    const topStrengths = [];
    
    // 1. Identify top performing micro-skills (accuracy > 80% and sample size >= 3)
    const strongSkills = microSkills
        .filter(s => s.masteryStatus === 'Mastered')
        .sort((a, b) => b.accuracy - a.accuracy || b.totalAttempted - a.totalAttempted);
        
    strongSkills.slice(0, 2).forEach(s => {
        topStrengths.push({
            type: 'micro_skill',
            name: s.topic,
            description: `Demonstrated mastery with ${s.accuracy}% accuracy across ${s.totalAttempted} attempted questions.`
        });
    });

    // 2. Identify fastest correct answers (correct answers faster than average cohort pace)
    const fastCorrectAnswers = timeAllocation
        .filter(t => t.isCorrect && t.pace === 'Fast')
        .sort((a, b) => a.timeSpent - b.timeSpent);

    fastCorrectAnswers.slice(0, 2 - topStrengths.length).forEach((t, index) => {
        const qNum = questions.findIndex(q => q.id === t.questionId) + 1;
        topStrengths.push({
            type: 'speed_accuracy',
            name: `Optimized Pace on Question ${qNum}`,
            description: `Solved correctly in ${t.timeSpent} seconds (saving ${Math.abs(t.difference)}s compared to cohort average).`
        });
    });

    const overallAccuracy = (correctCount + incorrectCount) > 0 
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
        : 0;

    // --- PHASE 2 DIAGNOSTICS ---

    // 1. Pacing & Time-Sink Analysis: Flag questions where time spent >= 3x cohort average.
    const timeSinks = [];
    timeAllocation.forEach(item => {
        if (item.timeSpent >= 3 * item.cohortAverageTime) {
            timeSinks.push({
                questionId: item.questionId,
                type: item.isCorrect ? "Time Sink - Correct" : "Time Sink - Incorrect",
                timeSpent: item.timeSpent,
                cohortAverageTime: item.cohortAverageTime
            });
        }
    });

    // 2. Difficulty Thresholding: Detect careless errors (Hard accuracy > 85% but Easy accuracy < 50% in same skill).
    const carelessErrors = [];
    const difficultyGroups = {};
    questions.forEach(q => {
        const topic = q.topic || q.chapter || 'General';
        if (!difficultyGroups[topic]) {
            difficultyGroups[topic] = {
                easyAttempted: 0,
                easyCorrect: 0,
                hardAttempted: 0,
                hardCorrect: 0
            };
        }
        
        const userAns = answers[q.id];
        const isAttempted = userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
        let isCorrect = false;
        if (isAttempted) {
            if (q.is_mcq) {
                isCorrect = userAns === q.correct_answer;
            } else {
                isCorrect = isNumericalAnswerCorrect(String(userAns), String(q.correct_answer));
            }
        }

        const diff = String(q.difficulty).toLowerCase();
        if (diff === 'easy') {
            if (isAttempted) {
                difficultyGroups[topic].easyAttempted++;
                if (isCorrect) difficultyGroups[topic].easyCorrect++;
            }
        } else if (diff === 'hard') {
            if (isAttempted) {
                difficultyGroups[topic].hardAttempted++;
                if (isCorrect) difficultyGroups[topic].hardCorrect++;
            }
        }
    });

    Object.entries(difficultyGroups).forEach(([topic, stats]) => {
        const easyAccuracy = stats.easyAttempted > 0 ? (stats.easyCorrect / stats.easyAttempted) * 100 : null;
        const hardAccuracy = stats.hardAttempted > 0 ? (stats.hardCorrect / stats.hardAttempted) * 100 : null;
        
        if (easyAccuracy !== null && hardAccuracy !== null && hardAccuracy > 85 && easyAccuracy < 50) {
            carelessErrors.push({
                topic: topic,
                easyAccuracy: Math.round(easyAccuracy),
                hardAccuracy: Math.round(hardAccuracy),
                message: `High Probability of Careless Errors: User demonstrated mastery on Hard questions (${Math.round(hardAccuracy)}%) but failed on Easy questions (${Math.round(easyAccuracy)}%) in ${topic}.`
            });
        }
    });

    // 3. Fatigue Degradation Tracking: Quartile split based on chronologically answered order (using index order as baseline).
    const N = questions.length;
    const quartileAccuracies = [0, 0, 0, 0];
    let fatigueDetected = false;
    let fatigueMessage = "No fatigue detected.";

    if (N >= 4) {
        const qSize = Math.floor(N / 4);
        const quartiles = [
            questions.slice(0, qSize),
            questions.slice(qSize, qSize * 2),
            questions.slice(qSize * 2, qSize * 3),
            questions.slice(qSize * 3)
        ];

        const accuracies = quartiles.map(qs => {
            let attempted = 0;
            let correct = 0;
            qs.forEach(q => {
                const userAns = answers[q.id];
                const isAttempted = userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
                if (isAttempted) {
                    attempted++;
                    let isCorrect = false;
                    if (q.is_mcq) {
                        isCorrect = userAns === q.correct_answer;
                    } else {
                        isCorrect = isNumericalAnswerCorrect(String(userAns), String(q.correct_answer));
                    }
                    if (isCorrect) correct++;
                }
            });
            return attempted > 0 ? (correct / attempted) * 100 : 0;
        });

        for (let i = 0; i < 4; i++) {
            quartileAccuracies[i] = Math.round(accuracies[i]);
        }

        const avgQ1Q2 = (quartileAccuracies[0] + quartileAccuracies[1]) / 2;
        const q4Acc = quartileAccuracies[3];

        if (avgQ1Q2 - q4Acc >= 25 && avgQ1Q2 > 0) {
            fatigueDetected = true;
            fatigueMessage = `Fatigue Detected: Performance dropped by ${Math.round(avgQ1Q2 - q4Acc)}% in the final quartile of the test compared to the first half (Average Q1-Q2: ${Math.round(avgQ1Q2)}%, Q4: ${q4Acc}%).`;
        }
    } else {
        fatigueMessage = "Insufficient test length for fatigue degradation analysis (minimum 4 questions required).";
    }

    const diagnostics = {
        timeSinks: timeSinks,
        carelessErrors: carelessErrors,
        fatigue: {
            quartiles: quartileAccuracies,
            fatigueDetected: fatigueDetected,
            message: fatigueMessage
        },
        flags: []
    };

    if (carelessErrors.length > 0) {
        diagnostics.flags.push("High Probability of Careless Errors");
    }
    if (fatigueDetected) {
        diagnostics.flags.push("Fatigue Detected");
    }

    return {
        rawScore: score,
        maxPossibleScore: maxPossibleScore,
        percentile: calculateMockPercentile(score, maxPossibleScore),
        accuracy: overallAccuracy,
        correctCount: correctCount,
        incorrectCount: incorrectCount,
        unattemptedCount: unattemptedCount,
        totalTimeSpent: totalTimeSpent,
        microSkills: microSkills,
        timeAllocation: timeAllocation,
        topStrengths: topStrengths,
        diagnostics: diagnostics
    };
}

// Export for commonJS or ESM support in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateTestAnalytics,
        calculateMockPercentile,
        isNumericalAnswerCorrect,
        getCohortAverageTime
    };
}
