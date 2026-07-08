export interface MicroSkillPerformance {
    topic: string;
    totalQuestions: number;
    totalAttempted: number;
    totalCorrect: number;
    accuracy: number; // percentage (0 - 100)
    masteryStatus: 'Insufficient Data' | 'Mastered' | 'Proficient' | 'Needs Improvement';
}

export interface QuestionTimeAllocation {
    questionId: string;
    topic: string;
    difficulty: string;
    timeSpent: number; // in seconds
    cohortAverageTime: number; // in seconds
    difference: number; // timeSpent - cohortAverageTime
    pace: 'Fast' | 'Average' | 'Slow';
    isCorrect: boolean;
}

export interface StrengthDetail {
    type: 'micro_skill' | 'speed_accuracy';
    name: string;
    description: string;
}

export interface TimeSinkDetail {
    questionId: string;
    type: 'Time Sink - Correct' | 'Time Sink - Incorrect';
    timeSpent: number;
    cohortAverageTime: number;
}

export interface CarelessErrorDetail {
    topic: string;
    easyAccuracy: number;
    hardAccuracy: number;
    message: string;
}

export interface FatigueDetail {
    quartiles: [number, number, number, number];
    fatigueDetected: boolean;
    message: string;
}

export interface TestDiagnostics {
    timeSinks: TimeSinkDetail[];
    carelessErrors: CarelessErrorDetail[];
    fatigue: FatigueDetail;
    flags: string[];
}

export interface TestAnalytics {
    rawScore: number;
    maxPossibleScore: number;
    percentile: number; // 0.00 to 99.99
    accuracy: number; // overall accuracy percentage (0 - 100)
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
    totalTimeSpent: number; // in seconds
    microSkills: MicroSkillPerformance[];
    timeAllocation: QuestionTimeAllocation[];
    topStrengths: StrengthDetail[];
    diagnostics: TestDiagnostics;
}

export function generateTestAnalytics(
    questions: any[],
    answers: { [key: string]: any },
    timeSpentMap: { [key: string]: number }
): TestAnalytics;

export function calculateMockPercentile(score: number, maxScore: number): number;
export function isNumericalAnswerCorrect(userAnswer: string, correctAnswerText: string): boolean;
export function getCohortAverageTime(difficulty: string): number;
