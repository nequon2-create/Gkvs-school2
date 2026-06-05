import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronLeft, Volume2, BookOpen, BarChart2, User, Settings, RefreshCw } from 'lucide-react';
import { playFlipSound, playCardOpenSound } from '../utils/audio';
import hackerCardImg from '../assets/hacker_card.png';
import './LeaderboardPage.css';

interface SubjectMark {
    subject_name: string;
    subject_code: string;
    marks_obtained: number;
    max_marks: number;
    grade: string;
}

interface LeaderboardStudent {
    student_id: string;
    full_name: string;
    photo_url: string | null;
    avgMarks: number;
    totalObtained: number;
    totalMax: number;
    rank: number;
    subjects: SubjectMark[];
}

interface SchoolClass {
    id: string;
    class_name: string;
    section: string | null;
}

interface Exam {
    id: string;
    exam_name: string;
    exam_type: string;
}

export function LeaderboardPage() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
    const [activeExam, setActiveExam] = useState<Exam | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<LeaderboardStudent | null>(null);
    const [cardFlipped, setCardFlipped] = useState(false);
    const [currentYearId, setCurrentYearId] = useState<string | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            // Fetch current academic year first
            const { data: currentYear } = await supabase
                .from('academic_years')
                .select('id')
                .eq('is_current', true)
                .single();

            const yearId = currentYear?.id || null;
            setCurrentYearId(yearId);

            // Fetch classes for this year
            let query = supabase
                .from('classes')
                .select('id, class_name, section');

            if (yearId) {
                query = query.eq('academic_year_id', yearId);
            }

            const { data, error } = await query.order('class_name');
            if (error) throw error;
            if (data) {
                setClasses(data);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClassSelect = async (cls: SchoolClass) => {
        setLoading(true);
        setSelectedClass(cls);
        setLeaderboard([]);
        setActiveExam(null);
        setSelectedStudent(null);
        setCardFlipped(false);
        
        try {
            // 1. Fetch active students in class
            let studentsQuery = supabase
                .from('students')
                .select('id')
                .eq('class_id', cls.id)
                .eq('is_active', true);

            if (currentYearId) {
                studentsQuery = studentsQuery.eq('academic_year_id', currentYearId);
            }

            const { data: studentsData } = await studentsQuery;

            const studentIds = studentsData?.map(s => s.id) || [];
            
            // 2. Fetch distinct exam_ids with marks for this class's students
            let examsWithMarks: string[] = [];
            if (studentIds.length > 0) {
                const { data: marksExams } = await supabase
                    .from('marks')
                    .select('exam_id')
                    .in('student_id', studentIds);
                
                examsWithMarks = Array.from(new Set(marksExams?.map(m => m.exam_id) || []));
            }

            // 3. Fetch exams published for this class
            let examsQuery = supabase
                .from('exams')
                .select('id, exam_name, exam_type')
                .eq('class_id', cls.id)
                .eq('is_published', true);

            if (currentYearId) {
                examsQuery = examsQuery.eq('academic_year_id', currentYearId);
            }

            const { data: examsData } = await examsQuery.order('exam_date', { ascending: false });

            // 4. Filter exams to only show those that have marks uploaded
            const filteredExams = examsData ? examsData.filter(ex => examsWithMarks.includes(ex.id)) : [];

            if (filteredExams.length > 0) {
                // Auto-select latest published exam with marks
                const latestExam = filteredExams[0];
                setActiveExam(latestExam);
                await fetchLeaderboard(latestExam.id, cls.id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error loading class data:', error);
            setLoading(false);
        }
    };

    const fetchLeaderboard = async (examId: string, classId: string) => {
        setLoading(true);
        try {
            // 1. Fetch active students in class
            let studentsQuery = supabase
                .from('students')
                .select('id, full_name, photo_url')
                .eq('class_id', classId)
                .eq('is_active', true);

            if (currentYearId) {
                studentsQuery = studentsQuery.eq('academic_year_id', currentYearId);
            }

            const { data: studentsData, error: studentsError } = await studentsQuery;

            if (studentsError) throw studentsError;

            // 2. Fetch subjects for class (including global/fallback subjects)
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, subject_name, subject_code')
                .or(`class_id.eq.${classId},class_id.is.null`);

            if (subjectsError) throw subjectsError;

            // 3. Fetch marks for exam
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select('student_id, subject_id, marks_obtained, max_marks, grade')
                .eq('exam_id', examId);

            if (marksError) throw marksError;

            // Map subjects by ID
            const subjectMap = new Map(subjectsData?.map(s => [s.id, s]) || []);

            // Group marks by student
            const studentMap: Record<string, {
                student_id: string;
                full_name: string;
                photo_url: string | null;
                totalObtained: number;
                totalMax: number;
                subjects: SubjectMark[];
            }> = {};

            // Initialize all active students
            (studentsData || []).forEach(student => {
                studentMap[student.id] = {
                    student_id: student.id,
                    full_name: student.full_name,
                    photo_url: student.photo_url,
                    totalObtained: 0,
                    totalMax: 0,
                    subjects: []
                };
            });

            // Process mark records
            (marksData || []).forEach(mark => {
                const student = studentMap[mark.student_id];
                if (!student) return;

                const subject = subjectMap.get(mark.subject_id);
                if (!subject) return;

                student.totalObtained += mark.marks_obtained || 0;
                student.totalMax += mark.max_marks || 100;
                
                student.subjects.push({
                    subject_name: subject.subject_name,
                    subject_code: subject.subject_code,
                    marks_obtained: mark.marks_obtained,
                    max_marks: mark.max_marks,
                    grade: mark.grade || 'N/A'
                });
            });

            // Calculate averages and exclude students with no marks
            const rawList = Object.values(studentMap)
                .map(s => {
                    const avgMarks = s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0;
                    return {
                        ...s,
                        avgMarks
                    };
                })
                .filter(s => s.subjects.length > 0);

            // Sort
            rawList.sort((a, b) => b.avgMarks - a.avgMarks);

            // Assign Ranks
            const rankedList: LeaderboardStudent[] = rawList.map((s, index) => ({
                ...s,
                rank: index + 1
            }));

            setLeaderboard(rankedList);
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (student: LeaderboardStudent) => {
        setSelectedStudent(student);
        setCardFlipped(false);
        if (soundEnabled) {
            playCardOpenSound();
        }
    };

    const handleCardFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCardFlipped(!cardFlipped);
        if (soundEnabled) {
            playFlipSound();
        }
    };

    return (
        <div className="leaderboard-container">
            {/* Header */}
            <div className="cyber-header">
                <h1 className="cyber-title">Cyber Leaderboard</h1>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                    <p className="cyber-subtitle">Futuristic Performance Arena</p>
                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: soundEnabled ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            outline: 'none'
                        }}
                    >
                        <Volume2 size={18} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{soundEnabled ? 'SFX ON' : 'SFX OFF'}</span>
                    </button>
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                    <div className="arena-loading-text">SYNCHRONIZING ARENA METRICS...</div>
                </div>
            )}

            {!loading && !selectedClass && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-start', maxWidth: '1000px', margin: '0 auto 20px auto' }}>
                        <button className="cyber-back-btn" onClick={() => navigate('/dashboard')}>
                            <ChevronLeft size={18} /> BACK TO DASHBOARD
                        </button>
                    </div>
                    <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: '700', letterSpacing: '1px' }}>
                        SELECT A CLASS ZONE
                    </h2>
                    <div className="class-grid">
                        {classes.map((cls) => (
                            <div key={cls.id} className="cyber-class-card" onClick={() => handleClassSelect(cls)}>
                                <div className="class-icon-container">
                                    <BookOpen size={30} className="class-icon-svg" />
                                </div>
                                <h3 className="class-title">{cls.class_name}</h3>
                                <p className="class-subtitle">{cls.section ? `Section: ${cls.section}` : 'Standard Class'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && selectedClass && (
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Controls Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '30px' }}>
                        <button className="cyber-back-btn" onClick={() => setSelectedClass(null)}>
                            <ChevronLeft size={18} /> BACK TO CLASSES
                        </button>
                    </div>

                    {/* Cyber Board Outer Frame */}
                    <div className="cyber-board-outer-frame">
                        {/* 1. Header inside the frame */}
                        <div className="cyber-board-header">
                            {/* Logo Crest Left */}
                            <div className="cyber-header-left">
                                <svg className="cyber-logo-svg" viewBox="0 0 100 100" width="46" height="46">
                                    <defs>
                                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#00f2fe" />
                                            <stop offset="100%" stopColor="#4facfe" />
                                        </linearGradient>
                                    </defs>
                                    <polygon points="50,15 80,30 80,70 50,90 20,70 20,30" fill="none" stroke="#00f2fe" strokeWidth="2.5" filter="drop-shadow(0 0 6px rgba(0, 242, 254, 0.5))" />
                                    <polygon points="50,23 72,34 72,66 50,82 28,66 28,34" fill="none" stroke="#00f2fe" strokeWidth="1" opacity="0.4" />
                                    <path d="M 50,28 L 65,65 L 56,65 L 50,48 L 44,65 L 35,65 Z" fill="url(#logoGrad)" filter="drop-shadow(0 0 4px rgba(0, 242, 254, 0.6))" />
                                    <line x1="40" y1="56" x2="60" y2="56" stroke="#00f2fe" strokeWidth="1.5" />
                                </svg>
                            </div>
                            
                            {/* Title Center */}
                            <div className="cyber-header-center">
                                <div className="cyber-header-subtitle">ACADEMY RANKINGS</div>
                                <h2 className="cyber-header-title">
                                    {selectedClass.class_name.toUpperCase()} CLASS LEADERBOARD
                                </h2>
                            </div>
                            
                            {/* Top 10 Right */}
                            <div className="cyber-header-right">
                                <div className="cyber-top10-pill">TOP 10</div>
                            </div>
                        </div>

                        {/* Active Exam details if present */}
                        {activeExam && (
                            <div className="cyber-board-active-exam-bar">
                                <div className="active-exam-left-lines"></div>
                                <div className="active-exam-pill">
                                    ACTIVE EXAM: {activeExam.exam_name.toUpperCase()}
                                </div>
                                <div className="active-exam-right-lines"></div>
                            </div>
                        )}

                        {leaderboard.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--cyber-panel)', borderRadius: '24px', border: '1px solid var(--cyber-border)', margin: '20px' }}>
                                <Trophy size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
                                <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>
                                    No performance metrics published for this class.
                                </p>
                            </div>
                        ) : (
                            <div className="leaderboard-vertical-board">
                                {leaderboard.map((student) => {
                                    const isGold = student.rank === 1;
                                    const isSilver = student.rank === 2;
                                    const isBronze = student.rank === 3;
                                    const isTop3 = student.rank <= 3;
                                    
                                    let tierClass = "tier-other";
                                    let rankLevelText = "Other";
                                    if (isGold) {
                                        tierClass = "tier-gold";
                                        rankLevelText = "Golden Avg";
                                    } else if (isSilver) {
                                        tierClass = "tier-silver";
                                        rankLevelText = "Silver Avg";
                                    } else if (isBronze) {
                                        tierClass = "tier-bronze";
                                        rankLevelText = "Bronze Avg";
                                    }

                                    return (
                                        <div 
                                            key={student.student_id} 
                                            className={`leaderboard-row-card ${tierClass}`}
                                            onClick={() => handleRowClick(student)}
                                        >
                                            {/* Column 1: Rank Box */}
                                            <div className="row-rank-col">
                                                {isTop3 && (
                                                    <div className="rank-crown-wrapper">
                                                        <svg className="rank-crown-svg" viewBox="0 0 100 100" width="24" height="20">
                                                            <path d="M 10 80 L 15 30 L 35 55 L 50 20 L 65 55 L 85 30 L 90 80 Z" fill="currentColor" />
                                                            <circle cx="15" cy="25" r="4" fill="currentColor" />
                                                            <circle cx="50" cy="15" r="4" fill="currentColor" />
                                                            <circle cx="85" cy="25" r="4" fill="currentColor" />
                                                        </svg>
                                                    </div>
                                                )}
                                                {student.rank === 6 && (
                                                    <div className="rank-wings-wrapper">
                                                        <svg className="wing-left-svg" viewBox="0 0 100 100" width="16" height="16">
                                                            <path d="M 90,80 C 60,60 30,60 10,20 C 30,30 60,40 90,50" fill="none" stroke="#00f2fe" strokeWidth="2" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className="rank-brackets">
                                                    <span className="bracket-left">[</span>
                                                    <span className="rank-number-txt">{student.rank}</span>
                                                    <span className="bracket-right">]</span>
                                                </span>
                                            </div>

                                            {/* Column 2: Student Pic Box */}
                                            <div className="row-photo-col">
                                                {isGold && (
                                                    <div className="photo-crown-wrapper">
                                                        <svg className="photo-crown-svg" viewBox="0 0 100 100" width="20" height="16">
                                                            <path d="M 10 80 L 15 30 L 35 55 L 50 20 L 65 55 L 85 30 L 90 80 Z" fill="#ffd700" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="row-photo-frame">
                                                    {student.photo_url ? (
                                                        <img src={student.photo_url} alt={student.full_name} className="row-photo-img" />
                                                    ) : (
                                                        <div className="row-photo-placeholder">{student.full_name.charAt(0)}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column 3: Name & Rank Level Rectangular Text Box */}
                                            <div className="row-details-col">
                                                <div className="details-header">[STUDENT NAME]</div>
                                                <div className="row-student-name">{student.full_name.toUpperCase()}</div>
                                                <div className="row-rank-label">[{rankLevelText}] {student.rank <= 3 ? 'ELITE I' : 'CHAMP II'}</div>
                                            </div>

                                            {/* Column 4: Badge/Medallion Box */}
                                            <div className="row-badge-col">
                                                <div className="row-medallion-badge">
                                                    <svg className={`medallion-svg ${isGold ? 'gold' : isSilver ? 'silver' : isBronze ? 'bronze' : 'other'}`} viewBox="0 0 100 100" width="46" height="46">
                                                        <defs>
                                                            <radialGradient id="gradInner" cx="50%" cy="50%" r="50%">
                                                                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                                                                <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
                                                            </radialGradient>
                                                        </defs>
                                                        <path d="M 30,75 C 20,60 20,40 30,25 C 32,22 35,25 33,28 C 25,40 25,58 33,72 C 35,75 32,78 30,75 Z" fill="currentColor" opacity="0.8" />
                                                        <path d="M 70,75 C 80,60 80,40 70,25 C 68,22 65,25 67,28 C 75,40 75,58 67,72 C 65,75 68,78 70,75 Z" fill="currentColor" opacity="0.8" />
                                                        <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,3" />
                                                        <circle cx="50" cy="50" r="30" fill="url(#gradInner)" stroke="currentColor" strokeWidth="1" />
                                                        <path d="M 50,32 L 60,40 L 57,55 L 50,63 L 43,55 L 40,40 Z" fill="currentColor" stroke="#fff" strokeWidth="0.5" />
                                                        <polygon points="50,42 52,47 57,47 53,50 55,55 50,52 45,55 47,50 43,47 48,47" fill="#fff" />
                                                    </svg>
                                                    <div className="medallion-label">MASTER RANK</div>
                                                </div>
                                            </div>

                                            {/* Column 5: Average Percentage Box */}
                                            <div className="row-percentage-col">
                                                <span className="percentage-brackets">
                                                    <span className="pct-bracket-left">[</span>
                                                    <span className="percentage-value">{student.avgMarks}</span>
                                                    <span className="pct-bracket-right">]</span>
                                                    <span className="percentage-sign">%</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 3. Footer Bar inside the frame */}
                        <div className="cyber-board-footer">
                            <div className="cyber-footer-nav">
                                <div className="cyber-nav-item">
                                    <User size={16} />
                                    <span>PROFILE</span>
                                </div>
                                <div className="cyber-nav-item active">
                                    <BarChart2 size={16} />
                                    <span>RANKINGS</span>
                                </div>
                                <div className="cyber-nav-item">
                                    <Trophy size={16} />
                                    <span>CHALLENGES</span>
                                </div>
                                <div className="cyber-nav-item">
                                    <Settings size={16} />
                                    <span>SETTINGS</span>
                                </div>
                            </div>
                            <div className="footer-refresh">
                                <span>REFRESH TIME- 33:00</span>
                                <RefreshCw size={12} className="refresh-icon-spin" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Throw Card Popup Overlay */}
            {selectedStudent && (
                <div className="card-popup-overlay" onClick={() => setSelectedStudent(null)}>
                    <div 
                        className={`throw-card-container ${cardFlipped ? 'flipped' : ''}`}
                        onClick={handleCardFlip}
                    >
                        <div className="throw-card-inner">
                            {/* Front Side */}
                            <div className="throw-card-side card-front">
                                {(() => {
                                    const rankClass = selectedStudent.rank === 1 ? 'card-rank-gold' : selectedStudent.rank === 2 ? 'card-rank-silver' : selectedStudent.rank === 3 ? 'card-rank-bronze' : '';
                                    return (
                                <div className={`card-exoskeleton hacker-netrunner-card ${rankClass}`}>
                                    {/* Background image layer — filter applied here only, not to photo */}
                                    <div className="card-bg-image" style={{ backgroundImage: `url(${hackerCardImg})` }} />
                                    {/* Portrait Frame */}
                                    <div className="hacker-portrait-container">
                                        <div className="hacker-tag-circuit">CIRCUIT</div>
                                        {selectedStudent.photo_url ? (
                                            <img src={selectedStudent.photo_url} alt={selectedStudent.full_name} className="hacker-portrait-img" />
                                        ) : (
                                            <div className="hacker-portrait-placeholder">{selectedStudent.full_name.charAt(0)}</div>
                                        )}
                                    </div>
 
                                    {/* Name banner cover overlay */}
                                    <div className="hacker-name-cover">
                                        <div className="hacker-name-text">{selectedStudent.full_name.toUpperCase()}</div>
                                        <div className="hacker-sub-text">{(selectedClass?.class_name || 'CLASS').toUpperCase()}</div>
                                    </div>
 
                                    {/* Bottom terminal display cover overlay */}
                                    <div className="hacker-terminal-cover">
                                        <div className="hacker-stats-grid">
                                            <div className="hacker-stat-box">
                                                <div className="hacker-stat-label">RANK</div>
                                                <div className="hacker-stat-value">#{selectedStudent.rank}</div>
                                            </div>
                                            <div className="hacker-stat-box">
                                                <div className="hacker-stat-label">AVG</div>
                                                <div className="hacker-stat-value">{selectedStudent.avgMarks}%</div>
                                            </div>
                                            <div className="hacker-stat-box">
                                                <div className="hacker-stat-label">TIER</div>
                                                <div className="hacker-stat-value" style={{ fontSize: '0.65rem' }}>{selectedStudent.rank === 1 ? 'ELITE' : selectedStudent.rank <= 3 ? 'ACE' : 'CHAMP'}</div>
                                            </div>
                                        </div>
                                        <div className="hacker-status-line">
                                            STATUS :: {selectedStudent.rank <= 3 ? '[ ACTIVE // ELITE I ]' : '[ ACTIVE // CHAMP II ]'}
                                        </div>
                                    </div>
                                </div>
                                    );
                                })()} 
                            </div>
 
                            {/* Back Side (Subject Breakdown) */}
                            <div className="throw-card-side card-back">
                                {(() => {
                                    const rankClass = selectedStudent.rank === 1 ? 'card-rank-gold' : selectedStudent.rank === 2 ? 'card-rank-silver' : selectedStudent.rank === 3 ? 'card-rank-bronze' : '';
                                    return (
                                <div className={`card-exoskeleton hacker-netrunner-card ${rankClass}`}>
                                    {/* Background image layer — filter applied here only */}
                                    <div className="card-bg-image" style={{ backgroundImage: `url(${hackerCardImg})` }} />
                                    {/* Decrypted terminal cover overlay */}
                                    <div className="card-back-terminal">
                                        <div className="terminal-code-line"><span className="code-bracket">[ SYSTEM CORE // SUBJECT MARKS ]</span></div>
                                        {selectedStudent.subjects.map((sub, i) => (
                                            <div key={i} className="terminal-code-line">
                                                {sub.subject_code.toUpperCase()}_MKS = {sub.marks_obtained} / {sub.max_marks} <span className="code-comment">[{sub.grade}]</span>
                                            </div>
                                        ))}
                                        <div className="terminal-code-line" style={{ marginTop: '6px' }}><span className="code-bracket">[ DECRYPT COMPLETE // STATUS: PASS ]</span></div>
                                        <div className="hacker-tap-hint">
                                            [TAP CARD // DECRYPT FRONT]
                                        </div>
                                    </div>
                                </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    <button className="cyber-close-overlay-btn" onClick={() => setSelectedStudent(null)}>
                        ✕ CLOSE CARD
                    </button>
                </div>
            )}

            {/* Global SVG Gradients for Medallions */}
            <svg style={{ display: 'none' }}>
                <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffe066" />
                        <stop offset="100%" stopColor="#d4af37" />
                    </linearGradient>
                    <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#718096" />
                    </linearGradient>
                    <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f6ad55" />
                        <stop offset="100%" stopColor="#a0522d" />
                    </linearGradient>
                    <linearGradient id="otherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2d3748" />
                        <stop offset="100%" stopColor="#1a202c" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
