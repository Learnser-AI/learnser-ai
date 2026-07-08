import React from 'react';

/**
 * FullTestReport Component
 * 
 * Consumes the 'TestAnalytics' data object and renders a single-page, vertically-scrolling
 * diagnostic report page with Section 1 (Hero Results/Strengths), Section 2 (Action Plan Insights),
 * and Section 3 (Granular Micro-Skills & Pacing Scatterplot).
 * 
 * @param {Object} props
 * @param {Object} props.analytics - The analytics payload.
 */
export default function FullTestReport({ analytics }) {
  // Safe default mockup fallback if no analytics object is passed
  const reportData = analytics || {
    rawScore: 168,
    maxPossibleScore: 300,
    percentile: 96.42,
    accuracy: 74,
    correctCount: 45,
    incorrectCount: 12,
    unattemptedCount: 18,
    totalTimeSpent: 3600,
    microSkills: [
      { topic: 'Alcohols & Phenols', totalQuestions: 5, totalAttempted: 4, totalCorrect: 4, accuracy: 100, masteryStatus: 'Mastered' },
      { topic: 'Kinematics', totalQuestions: 4, totalAttempted: 3, totalCorrect: 3, accuracy: 100, masteryStatus: 'Mastered' },
      { topic: 'Matrices', totalQuestions: 6, totalAttempted: 5, totalCorrect: 3, accuracy: 60, masteryStatus: 'Proficient' },
      { topic: 'Integration', totalQuestions: 2, totalAttempted: 1, totalCorrect: 0, accuracy: 0, masteryStatus: 'Insufficient Data' }
    ],
    timeAllocation: [
      { questionId: 'q1', topic: 'Kinematics', difficulty: 'Easy', timeSpent: 42, cohortAverageTime: 60, difference: -18, pace: 'Fast', isCorrect: true },
      { questionId: 'q2', topic: 'Matrices', difficulty: 'Medium', timeSpent: 130, cohortAverageTime: 120, difference: 10, pace: 'Average', isCorrect: true },
      { questionId: 'q3', topic: 'Alcohols & Phenols', difficulty: 'Hard', timeSpent: 85, cohortAverageTime: 180, difference: -95, pace: 'Fast', isCorrect: true },
      { questionId: 'q4', topic: 'Integration', difficulty: 'Hard', timeSpent: 420, cohortAverageTime: 180, difference: 240, pace: 'Slow', isCorrect: false }
    ],
    topStrengths: [
      { type: 'micro_skill', name: 'Alcohols & Phenols', description: 'Demonstrated mastery with 100% accuracy across 4 attempted questions.' },
      { type: 'speed_accuracy', name: 'Optimized Pace on Question 3', description: 'Solved correctly in 85 seconds (saving 95s compared to cohort average).' }
    ],
    diagnostics: {
      timeSinks: [
        { questionId: 'q4', type: 'Time Sink - Incorrect', timeSpent: 420, cohortAverageTime: 180 }
      ],
      carelessErrors: [],
      fatigue: {
        quartiles: [80, 85, 75, 45],
        fatigueDetected: true,
        message: 'Fatigue Detected: Performance dropped by 37% in the final quartile compared to the first half.'
      },
      flags: ['Fatigue Detected']
    }
  };

  // Destructure with comprehensive default fallbacks to prevent crashes
  const {
    rawScore = 0,
    maxPossibleScore = 300,
    percentile = 0,
    correctCount = 0,
    incorrectCount = 0,
    unattemptedCount = 0,
    microSkills = [],
    timeAllocation = [],
    topStrengths = [],
    diagnostics = {
      timeSinks: [],
      carelessErrors: [],
      fatigue: { quartiles: [0, 0, 0, 0], fatigueDetected: false, message: '' },
      flags: []
    }
  } = reportData;

  // Process human-readable Action Plan items
  const getActionPlanItems = () => {
    const items = [];

    // Fatigue Insight
    if (diagnostics?.fatigue?.fatigueDetected) {
      items.push({
        id: 'fatigue',
        type: 'fatigue',
        title: 'Pacing Recovery (Fatigue Alert)',
        advice: diagnostics.fatigue.message || 'You experienced a significant drop in accuracy towards the final quarter of the test. To combat cognitive fatigue, simulate real full-length tests and practice taking a 20-second breathing pause halfway through to reset your processing speed.',
        icon: '🔋'
      });
    }

    // Careless Errors Insight
    if (diagnostics?.carelessErrors && diagnostics.carelessErrors.length > 0) {
      diagnostics.carelessErrors.forEach((error, idx) => {
        items.push({
          id: `careless-${idx}`,
          type: 'careless',
          title: `Arithmetic Focus: ${error.topic || 'General'}`,
          advice: error.message || `The proctoring audit logged a high success rate on Hard questions but failures on Easy questions. Focus on checking simple arithmetic and reading easy prompts thoroughly. Do not over-complicate simple setups.`,
          icon: '⚠️'
        });
      });
    }

    // Time Sinks Insight
    if (diagnostics?.timeSinks && diagnostics.timeSinks.length > 0) {
      const incorrectSinks = diagnostics.timeSinks.filter(s => s.type === 'Time Sink - Incorrect').length;
      const correctSinks = diagnostics.timeSinks.filter(s => s.type === 'Time Sink - Correct').length;

      if (incorrectSinks > 0) {
        items.push({
          id: 'sink-incorrect',
          type: 'sink',
          title: 'Speed traps: Time Investment Leaks',
          advice: `You spent over 3x the baseline average time on ${incorrectSinks} question(s) that you ultimately got wrong. Establish a strict 3-minute hard stop during exams. If unsolved, bookmark it and move on.`,
          icon: '⏳'
        });
      }

      if (correctSinks > 0) {
        items.push({
          id: 'sink-correct',
          type: 'sink-info',
          title: 'Efficiency Cost: Solved but Slow',
          advice: `You spent over 3x the baseline average time on ${correctSinks} question(s) that you solved correctly. While accurate, this slows down your overall flow. Practice speed-run drills on these specific chapters to optimize execution speed.`,
          icon: '💡'
        });
      }
    }

    // Default clean score state
    if (items.length === 0) {
      items.push({
        id: 'clean-run',
        type: 'success',
        title: 'Perfect Exam Strategy Executed',
        advice: 'No pacing drains, fatigue drops, or careless errors were detected in your session. You balanced speed and difficulty optimally.',
        icon: '🎯'
      });
    }

    return items;
  };

  const actionItems = getActionPlanItems();

  // Configure SVG Scatterplot geometries
  const svgWidth = 500;
  const svgHeight = 280;
  const margin = { top: 20, right: 30, bottom: 45, left: 60 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  // Safeguard array map calculations
  const maxTime = Math.max(180, 
    ...timeAllocation.map(p => p.timeSpent || 0), 
    ...timeAllocation.map(p => p.cohortAverageTime || 0)
  );
  const xLimit = Math.ceil(maxTime / 60) * 60 || 60; // fallback to 60 to prevent NaN / division by zero

  const diffMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
  const diffLabels = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

  // Calculate Optimal Time Limit line
  const totalCohortAvg = timeAllocation.reduce((acc, curr) => acc + (curr.cohortAverageTime || 0), 0);
  const optimalLimit = timeAllocation.length > 0 ? (totalCohortAvg / timeAllocation.length) : 120;
  const optX = margin.left + (optimalLimit / xLimit) * chartWidth;

  return (
    <div style={styles.container}>
      {/* SECTION 1: THE HERO (Results & Positives) */}
      <section style={styles.heroSection}>
        <div style={styles.heroGrid}>
          <div style={styles.scoreCard}>
            <div style={styles.heroValue}>{rawScore}</div>
            <div style={styles.heroLabel}>Raw Score</div>
            <div style={styles.scoreSubtext}>Out of {maxPossibleScore} Points</div>
          </div>
          
          <div style={styles.percentileCard}>
            <div style={styles.heroValue}>{percentile}%</div>
            <div style={styles.heroLabel}>Percentile Rank</div>
            <div style={styles.scoreSubtext}>Compared to Baseline Cohort</div>
          </div>
        </div>

        {/* Top Strengths Banner */}
        <div style={styles.strengthsPanel}>
          <div style={styles.strengthsHeader}>
            <span style={styles.starIcon}>⭐</span>
            <h2 style={styles.sectionSubTitle}>Top Strengths</h2>
          </div>
          
          <div style={styles.strengthsContainer}>
            {topStrengths && topStrengths.length > 0 ? (
              topStrengths.map((strength, index) => (
                <div key={index} style={styles.strengthPill}>
                  <span style={styles.strengthIcon}>
                    {strength.type === 'micro_skill' ? '🏆' : '⚡'}
                  </span>
                  <div>
                    <h4 style={styles.strengthName}>{strength.name}</h4>
                    <p style={styles.strengthDesc}>{strength.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>Build strength diagnostics by answering more questions per topic.</p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: THE ACTION PLAN (Diagnostic Insights) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Section 2: The Action Plan</h2>
        <p style={styles.sectionDesc}>Coaching advisories generated from exam activities & proctoring logs.</p>
        
        <div style={styles.insightsList}>
          {actionItems.map(item => {
            const itemStyle = styles[item.type] || {};
            return (
              <div key={item.id} style={{ ...styles.insightItem, ...itemStyle }}>
                <div style={styles.insightIcon}>{item.icon}</div>
                <div>
                  <h3 style={styles.insightTitle}>{item.title}</h3>
                  <p style={styles.insightAdvice}>{item.advice}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: THE GRANULAR DATA (Visuals) */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Section 3: Granular Analytics</h2>
        <p style={styles.sectionDesc}>Topic mastery mapping and interactive pacing diagnostics.</p>

        <div style={styles.visualsGrid}>
          {/* Micro-Skill Mastery List */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Micro-Skill Breakdown</h3>
            <div style={styles.skillsList}>
              {microSkills.map((skill, index) => {
                const isInsufficient = skill.masteryStatus === 'Insufficient Data';
                
                // Color codes based on status
                let color = '#64748b'; // insufficient data grey
                if (skill.masteryStatus === 'Mastered') color = '#10b981'; // green
                else if (skill.masteryStatus === 'Proficient') color = '#3b82f6'; // blue
                else if (skill.masteryStatus === 'Needs Improvement') color = '#f59e0b'; // orange

                return (
                  <div key={index} style={styles.skillRow}>
                    <div style={styles.skillLabelRow}>
                      <span style={styles.skillName}>{skill.topic}</span>
                      <span style={{ ...styles.skillStatus, color }}>
                        {skill.masteryStatus} {!isInsufficient && `(${skill.accuracy}%)`}
                      </span>
                    </div>
                    
                    <div style={styles.progressBarBg}>
                      <div 
                        style={{ 
                          ...styles.progressBarFill, 
                          width: `${isInsufficient ? 0 : skill.accuracy}%`,
                          backgroundColor: color 
                        }} 
                      />
                    </div>
                    <div style={styles.attemptsLabel}>
                      {skill.totalAttempted} / {skill.totalQuestions} questions attempted
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pacing Scatterplot SVG */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Pacing Scatterplot</h3>
            <div style={styles.svgWrapper}>
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={styles.svg}>
                {/* Gridlines */}
                {[1, 2, 3].map(val => {
                  const y = margin.top + chartHeight - ((val - 1) / 2) * chartHeight;
                  return (
                    <g key={`y-grid-${val}`}>
                      <line x1={margin.left} y1={y} x2={margin.left + chartWidth} y2={y} stroke="rgba(255,255,255,0.06)" />
                      <text x={margin.left - 12} y={y} fill="#94a3b8" fontSize="11" textAnchor="end" dominantBaseline="middle">
                        {diffLabels[val]}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis lines & labels */}
                {[0, 1, 2, 3, 4].map(idx => {
                  const val = Math.round((xLimit / 4) * idx);
                  const x = margin.left + (val / xLimit) * chartWidth;
                  return (
                    <g key={`x-grid-${idx}`}>
                      <line x1={x} y1={margin.top} x2={x} y2={margin.top + chartHeight} stroke="rgba(255,255,255,0.06)" />
                      <text x={x} y={margin.top + chartHeight + 10} fill="#94a3b8" fontSize="10" textAnchor="middle" dominantBaseline="hanging">
                        {val}s
                      </text>
                    </g>
                  );
                })}

                {/* Optimal Time Limit Line */}
                <line 
                  x1={optX} 
                  y1={margin.top} 
                  x2={optX} 
                  y2={margin.top + chartHeight} 
                  stroke="rgba(129, 140, 248, 0.45)" 
                  strokeWidth="2.5" 
                  strokeDasharray="4,4" 
                />

                {/* Plot points */}
                {timeAllocation.map((point, idx) => {
                  const difficulty = (point.difficulty || 'medium').toLowerCase();
                  const valY = diffMap[difficulty] || 2;
                  const timeSpent = point.timeSpent || 0;
                  const cx = margin.left + (timeSpent / xLimit) * chartWidth;
                  const cy = margin.top + chartHeight - ((valY - 1) / 2) * chartHeight;
                  
                  return (
                    <g key={`point-${idx}`}>
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="8" 
                        fill={point.isCorrect ? '#10b981' : '#ef4444'} 
                        stroke="#0f172a" 
                        strokeWidth="1.5" 
                      />
                      <text x={cx} y={cy} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                        {idx + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Title */}
                <text 
                  x={margin.left + chartWidth / 2} 
                  y={margin.top + chartHeight + 35} 
                  fill="#64748b" 
                  fontSize="11" 
                  fontWeight="600" 
                  textAnchor="middle"
                >
                  Time Spent (seconds)
                </text>
              </svg>
            </div>
            
            {/* Legend */}
            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
                <span>Correct</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#ef4444' }} />
                <span>Incorrect</span>
              </div>
              <div style={styles.legendDivider} />
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendLine, borderTop: '2px dashed #818cf8' }} />
                <span>Optimal Pace Limit</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Styling Object matching enterprise dark mode
const styles = {
  container: {
    width: '100%',
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '24px 16px',
    backgroundColor: '#0b0f19', // slate-950 dark base
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '40px', // large vertical spacing to avoid overcrowding density
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  scoreCard: {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '30px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  percentileCard: {
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(30, 41, 59, 0.5) 100%)',
    border: '1px solid rgba(79, 70, 229, 0.2)',
    borderRadius: '20px',
    padding: '30px 24px',
    textAlign: 'center',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  heroValue: {
    fontSize: '3.5rem',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1.1',
    marginBottom: '8px',
  },
  heroLabel: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  scoreSubtext: {
    fontSize: '0.85rem',
    color: '#64748b',
  },
  strengthsPanel: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '20px',
    padding: '24px',
  },
  strengthsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  starIcon: {
    fontSize: '1.25rem',
    color: '#fbbf24',
  },
  strengthsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  strengthPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.2s ease',
  },
  strengthIcon: {
    fontSize: '2rem',
    flexShrink: 0,
  },
  strengthName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#10b981',
    margin: '0 0 4px 0',
  },
  strengthDesc: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
  },
  sectionSubTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  sectionDesc: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: '0 0 10px 0',
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  insightItem: {
    display: 'flex',
    gap: '18px',
    padding: '20px',
    borderRadius: '16px',
    backgroundColor: 'rgba(30, 41, 59, 0.25)',
    borderLeft: '5px solid #64748b',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: '1.6rem',
    flexShrink: 0,
  },
  insightTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 6px 0',
  },
  insightAdvice: {
    fontSize: '0.88rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5',
  },
  // Diagnostics severity configurations
  success: { borderLeftColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.03)' },
  info: { borderLeftColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.03)' },
  warning: { borderLeftColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.03)' },
  error: { borderLeftColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.03)' },
  fatigue: { borderLeftColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.03)' },
  careless: { borderLeftColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.03)' },
  sink: { borderLeftColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.03)' },
  'sink-info': { borderLeftColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.03)' },

  visualsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  skillsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  skillRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  skillLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  skillName: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  skillStatus: {
    fontSize: '0.82rem',
    fontWeight: '700',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  attemptsLabel: {
    fontSize: '0.78rem',
    color: '#64748b',
    marginTop: '2px',
  },
  svgWrapper: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: '12px',
    padding: '8px',
    border: '1px solid rgba(255, 255, 255, 0.02)',
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginTop: '6px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  legendLine: {
    width: '14px',
    height: '0',
  },
  legendDivider: {
    width: '1px',
    height: '12px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    margin: '0 4px',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '0.9rem',
    margin: 0,
  }
};
