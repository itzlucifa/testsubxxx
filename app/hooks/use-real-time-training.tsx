import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './use-auth';

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  completed: boolean;
  progress: number;
  certification: boolean;
  lastAccessed?: Date;
}

export interface PhishingTest {
  id: string;
  email: {
    from: string;
    subject: string;
    body: string;
    links: { text: string; url: string; isPhishing: boolean }[];
    attachments: string[];
  };
  isPhishing: boolean;
  indicators: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const demoCourses: TrainingCourse[] = [
  {
    id: '1',
    title: 'Phishing Awareness 101',
    description: 'Learn to identify and report phishing attempts with interactive simulations',
    category: 'Email Security',
    duration: 30,
    completed: false,
    progress: 0,
    certification: true
  },
  {
    id: '2',
    title: 'Password Best Practices',
    description: 'Create and manage strong, secure passwords - includes breach checking',
    category: 'Authentication',
    duration: 20,
    completed: false,
    progress: 0,
    certification: true
  },
  {
    id: '3',
    title: 'Social Engineering Defense',
    description: 'Recognize and defend against social engineering attacks',
    category: 'Awareness',
    duration: 45,
    completed: false,
    progress: 0,
    certification: true
  },
  {
    id: '4',
    title: 'Malware Analysis Basics',
    description: 'Learn to identify malware using real threat intelligence APIs',
    category: 'Threat Analysis',
    duration: 60,
    completed: false,
    progress: 0,
    certification: true
  },
  {
    id: '5',
    title: 'Network Security Fundamentals',
    description: 'Understanding network threats and WiFi security',
    category: 'Network Security',
    duration: 35,
    completed: false,
    progress: 0,
    certification: true
  },
  {
    id: '6',
    title: 'Incident Response Basics',
    description: 'What to do when you detect a security incident',
    category: 'Incident Response',
    duration: 40,
    completed: false,
    progress: 0,
    certification: true
  }
];

const phishingTests: PhishingTest[] = [
  {
    id: 'phish-1',
    email: {
      from: 'security@paypa1.com',
      subject: 'Urgent: Your account has been compromised',
      body: 'Dear Customer,\n\nWe detected suspicious activity on your account. Please click the link below immediately to verify your identity or your account will be suspended.\n\nVerify Now: https://paypa1-secure.com/verify\n\nPayPal Security Team',
      links: [{ text: 'Verify Now', url: 'https://paypa1-secure.com/verify', isPhishing: true }],
      attachments: []
    },
    isPhishing: true,
    indicators: [
      'Misspelled domain (paypa1 instead of paypal)',
      'Urgency tactics to pressure quick action',
      'Suspicious link domain (paypa1-secure.com)',
      'Generic greeting instead of your name'
    ],
    difficulty: 'easy'
  },
  {
    id: 'phish-2',
    email: {
      from: 'noreply@microsoft.com',
      subject: 'Your Microsoft 365 subscription renewal',
      body: 'Hello,\n\nYour Microsoft 365 subscription is due for renewal. Your payment method on file will be charged $99.99.\n\nIf you did not authorize this, please contact support.\n\nMicrosoft Account Team',
      links: [],
      attachments: []
    },
    isPhishing: false,
    indicators: [
      'Legitimate Microsoft domain',
      'No suspicious links or urgent demands',
      'Standard renewal notification format'
    ],
    difficulty: 'medium'
  },
  {
    id: 'phish-3',
    email: {
      from: 'hr@yourcompany-portal.net',
      subject: 'Important: Updated Employee Handbook - Action Required',
      body: 'Dear Employee,\n\nThe HR department has updated the employee handbook with new policies. Please review and sign the attached document within 24 hours to confirm your acknowledgment.\n\nAttachment: Employee_Handbook_2024.pdf.exe\n\nHR Department',
      links: [],
      attachments: ['Employee_Handbook_2024.pdf.exe']
    },
    isPhishing: true,
    indicators: [
      'Executable file disguised as PDF (.pdf.exe)',
      'External domain pretending to be company (yourcompany-portal.net)',
      '24-hour deadline creates pressure',
      'Generic "Dear Employee" greeting'
    ],
    difficulty: 'medium'
  },
  {
    id: 'phish-4',
    email: {
      from: 'support@amazon.com',
      subject: 'Order Confirmation #302-4829163-7482941',
      body: 'Hello,\n\nThank you for your order!\n\nOrder #302-4829163-7482941\nItem: Apple MacBook Pro 16"\nTotal: $2,499.00\n\nExpected delivery: January 20-22\n\nView or manage your order: https://www.amazon.com/orders\n\nAmazon Customer Service',
      links: [{ text: 'View order', url: 'https://www.amazon.com/orders', isPhishing: false }],
      attachments: []
    },
    isPhishing: false,
    indicators: [
      'Legitimate amazon.com domain',
      'Real order confirmation format',
      'Links to actual amazon.com'
    ],
    difficulty: 'hard'
  },
  {
    id: 'phish-5',
    email: {
      from: 'admin@google.support-verify.com',
      subject: 'Security Alert: New sign-in from unknown device',
      body: 'Someone just signed into your Google Account from a new Windows device.\n\nLocation: Moscow, Russia\nDevice: Windows PC\nTime: Just now\n\nIf this was you, you can ignore this email. If not, your account may be compromised.\n\nSecure your account now: https://google.support-verify.com/secure\n\nGoogle Security',
      links: [{ text: 'Secure your account', url: 'https://google.support-verify.com/secure', isPhishing: true }],
      attachments: []
    },
    isPhishing: true,
    indicators: [
      'Fake domain (google.support-verify.com is not google.com)',
      'Link goes to fake domain',
      'Fear tactics about account compromise',
      'Suspicious location (Moscow) to create urgency'
    ],
    difficulty: 'hard'
  }
];

export function useRealTimeTraining() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<TrainingCourse[]>(demoCourses);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const [currentPhishingTest, setCurrentPhishingTest] = useState<PhishingTest | null>(null);
  const [phishingScore, setPhishingScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('training_progress')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCourses(prev => prev.map(course => {
            const progress = data.find(p => p.course_id === course.id);
            if (progress) {
              return {
                ...course,
                completed: progress.completed,
                progress: progress.progress,
                lastAccessed: new Date(progress.last_accessed),
              };
            }
            return course;
          }));
        }
        setLoading(false);
      });
  }, [user]);

  const saveProgress = useCallback(async (courseId: string, progress: number, completed: boolean) => {
    if (!user || !supabase) return;

    await supabase
      .from('training_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        progress,
        completed,
        last_accessed: new Date().toISOString(),
      });
  }, [user]);

  const startCourse = useCallback((courseId: string) => {
    setActiveCourse(courseId);
    
    const simulateProgress = setInterval(() => {
      setCourses(prev => {
        const course = prev.find(c => c.id === courseId);
        if (!course || course.progress >= 100) {
          clearInterval(simulateProgress);
          setActiveCourse(null);
          if (course) {
            saveProgress(courseId, 100, true);
          }
          return prev.map(c =>
            c.id === courseId ? { ...c, completed: true, progress: 100 } : c
          );
        }

        const newProgress = Math.min(course.progress + 10, 100);
        saveProgress(courseId, newProgress, newProgress >= 100);
        
        return prev.map(c =>
          c.id === courseId ? { ...c, progress: newProgress } : c
        );
      });
    }, 1000);

    return () => clearInterval(simulateProgress);
  }, [saveProgress]);

  const startPhishingTest = useCallback(() => {
    const uncompletedTests = phishingTests.filter(
      t => !phishingScore.total || Math.random() > 0.3
    );
    const randomTest = uncompletedTests[Math.floor(Math.random() * uncompletedTests.length)];
    setCurrentPhishingTest(randomTest);
    return randomTest;
  }, [phishingScore.total]);

  const submitPhishingAnswer = useCallback((isPhishing: boolean) => {
    if (!currentPhishingTest) return null;

    const correct = currentPhishingTest.isPhishing === isPhishing;
    
    setPhishingScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));

    const result = {
      correct,
      actuallyPhishing: currentPhishingTest.isPhishing,
      indicators: currentPhishingTest.indicators,
    };

    setCurrentPhishingTest(null);
    return result;
  }, [currentPhishingTest]);

  const checkUrlWithAPI = useCallback(async (url: string) => {
    try {
      const response = await fetch('/api/security-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'check_phishing',
          target: url,
        }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to check URL' };
    }
  }, []);

  const stats = {
    totalCourses: courses.length,
    completedCourses: courses.filter(c => c.completed).length,
    totalCertifications: courses.filter(c => c.completed && c.certification).length,
    avgProgress: Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length),
    phishingAccuracy: phishingScore.total > 0 
      ? Math.round((phishingScore.correct / phishingScore.total) * 100) 
      : 0,
  };

  return {
    courses,
    activeCourse,
    loading,
    stats,
    startCourse,
    currentPhishingTest,
    phishingScore,
    startPhishingTest,
    submitPhishingAnswer,
    checkUrlWithAPI,
    phishingTests,
  };
}
