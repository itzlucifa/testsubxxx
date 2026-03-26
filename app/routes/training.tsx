import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card/card';
import { Badge } from '../components/ui/badge/badge';
import { Button } from '../components/ui/button/button';
import { Progress } from '../components/ui/progress/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { BackButton } from '../components/ui/back-button';
import { 
  GraduationCap, 
  Play, 
  CheckCircle, 
  Clock, 
  Award, 
  Mail, 
  AlertTriangle, 
  Shield,
  ExternalLink,
  Paperclip,
  Activity
} from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useRealTimeTraining } from '../hooks/use-real-time-training';
import styles from './common-page.module.css';

export default function Training() {
  const {
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
  } = useRealTimeTraining();

  const [showPhishingResult, setShowPhishingResult] = useState<{
    correct: boolean;
    actuallyPhishing: boolean;
    indicators: string[];
  } | null>(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [urlCheckResult, setUrlCheckResult] = useState<any>(null);

  const handleStartCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    
    toast({
      title: "Course Started",
      description: course?.title,
    });

    startCourse(id);
  };

  const handleStartPhishingTest = () => {
    setShowPhishingResult(null);
    setUrlCheckResult(null);
    startPhishingTest();
    toast({
      title: "Phishing Test Started",
      description: "Analyze the email and decide if it's legitimate or phishing",
    });
  };

  const handlePhishingAnswer = (isPhishing: boolean) => {
    const result = submitPhishingAnswer(isPhishing);
    if (result) {
      setShowPhishingResult(result);
      toast({
        title: result.correct ? "Correct!" : "Incorrect",
        description: result.correct 
          ? "You correctly identified this email" 
          : `This email was ${result.actuallyPhishing ? 'phishing' : 'legitimate'}`,
        variant: result.correct ? "default" : "destructive",
      });
    }
  };

  const handleCheckUrl = async (url: string) => {
    setCheckingUrl(true);
    try {
      const result = await checkUrlWithAPI(url);
      setUrlCheckResult(result);
      toast({
        title: "URL Checked",
        description: result.success ? `Verdict: ${result.verdict}` : "Check failed",
        variant: result.verdict === 'malicious' ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check URL",
        variant: "destructive",
      });
    }
    setCheckingUrl(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BackButton />
          <h1 className={styles.title}>Security Training</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <p>Loading training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <BackButton />
          <h1 className={styles.title}>Security Training</h1>
          <p className={styles.subtitle}>Build your security awareness with interactive simulations</p>
        </div>
      </div>

      <div style={{ 
        padding: 'var(--space-3)', 
        background: 'var(--color-accent-2)', 
        border: '1px solid var(--color-accent-6)',
        borderRadius: 'var(--radius-2)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        <Activity size={18} />
        <span>
          <strong>Interactive Training:</strong> Includes real phishing simulations with live URL checking
        </span>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <GraduationCap size={20} />
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <CheckCircle size={20} />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.completedCourses}</div>
            <div className={styles.statSubtext}>{Math.round((stats.completedCourses / stats.totalCourses) * 100)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Award size={20} />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.totalCertifications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={styles.statTitle}>
              <Shield size={20} />
              Phishing Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statValue}>{stats.phishingAccuracy}%</div>
            <div className={styles.statSubtext}>{phishingScore.correct}/{phishingScore.total} correct</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phishing" className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="phishing">
            <Mail size={16} />
            Phishing Simulation
          </TabsTrigger>
          <TabsTrigger value="courses">
            <GraduationCap size={16} />
            Courses
          </TabsTrigger>
          <TabsTrigger value="completed">
            <Award size={16} />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phishing">
          <Card>
            <CardHeader>
              <CardTitle>
                <Mail size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Phishing Email Simulation
              </CardTitle>
              <CardDescription>
                Practice identifying phishing emails with real-world examples. Links can be checked against our security APIs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!currentPhishingTest && !showPhishingResult && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <Mail size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-neutral-11)' }}>
                    Test your ability to spot phishing emails. Each test shows you a realistic email - 
                    you decide if it's legitimate or a phishing attempt.
                  </p>
                  <Button onClick={handleStartPhishingTest} size="lg">
                    <Play size={18} />
                    Start Phishing Test
                  </Button>
                </div>
              )}

              {currentPhishingTest && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    background: 'var(--color-neutral-2)', 
                    borderRadius: 'var(--radius-2)',
                    border: '1px solid var(--color-neutral-6)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: 'var(--space-3)', 
                      background: 'var(--color-neutral-3)',
                      borderBottom: '1px solid var(--color-neutral-6)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600 }}>From:</span>
                        <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.875rem' }}>
                          {currentPhishingTest.email.from}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>Subject:</span>
                        <span>{currentPhishingTest.email.subject}</span>
                      </div>
                    </div>
                    <div style={{ padding: 'var(--space-4)', whiteSpace: 'pre-wrap' }}>
                      {currentPhishingTest.email.body}
                    </div>
                    {currentPhishingTest.email.links.length > 0 && (
                      <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-neutral-6)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                          <ExternalLink size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Links in email:
                        </div>
                        {currentPhishingTest.email.links.map((link, idx) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--space-2)',
                            marginBottom: 'var(--space-1)'
                          }}>
                            <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', color: 'var(--color-accent-9)' }}>
                              {link.url}
                            </span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCheckUrl(link.url)}
                              disabled={checkingUrl}
                            >
                              {checkingUrl ? 'Checking...' : 'Check URL'}
                            </Button>
                          </div>
                        ))}
                        {urlCheckResult && (
                          <div style={{ 
                            marginTop: 'var(--space-2)',
                            padding: 'var(--space-2)',
                            background: urlCheckResult.verdict === 'malicious' ? 'var(--color-error-2)' : 'var(--color-success-2)',
                            borderRadius: 'var(--radius-1)',
                            fontSize: '0.875rem'
                          }}>
                            API Result: {urlCheckResult.verdict || 'Unknown'} - {urlCheckResult.details}
                          </div>
                        )}
                      </div>
                    )}
                    {currentPhishingTest.email.attachments.length > 0 && (
                      <div style={{ padding: 'var(--space-3)', borderTop: '1px solid var(--color-neutral-6)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                          <Paperclip size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          Attachments:
                        </div>
                        {currentPhishingTest.email.attachments.map((att, idx) => (
                          <Badge key={idx} variant="outline" style={{ marginRight: 'var(--space-1)' }}>
                            {att}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <Button 
                      variant="destructive" 
                      size="lg"
                      onClick={() => handlePhishingAnswer(true)}
                    >
                      <AlertTriangle size={18} />
                      This is Phishing
                    </Button>
                    <Button 
                      variant="default" 
                      size="lg"
                      onClick={() => handlePhishingAnswer(false)}
                    >
                      <CheckCircle size={18} />
                      This is Legitimate
                    </Button>
                  </div>

                  <Badge variant="secondary" style={{ alignSelf: 'center' }}>
                    Difficulty: {currentPhishingTest.difficulty.toUpperCase()}
                  </Badge>
                </div>
              )}

              {showPhishingResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ 
                    padding: 'var(--space-4)', 
                    background: showPhishingResult.correct ? 'var(--color-success-2)' : 'var(--color-error-2)',
                    border: `1px solid ${showPhishingResult.correct ? 'var(--color-success-6)' : 'var(--color-error-6)'}`,
                    borderRadius: 'var(--radius-2)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      {showPhishingResult.correct ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                    <p>
                      This email was {showPhishingResult.actuallyPhishing ? 'a PHISHING attempt' : 'LEGITIMATE'}
                    </p>
                  </div>

                  <div style={{ 
                    padding: 'var(--space-3)', 
                    background: 'var(--color-neutral-2)',
                    borderRadius: 'var(--radius-2)'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                      {showPhishingResult.actuallyPhishing ? 'Phishing Indicators:' : 'Why this was legitimate:'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                      {showPhishingResult.indicators.map((indicator, idx) => (
                        <li key={idx} style={{ marginBottom: 'var(--space-1)' }}>{indicator}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <Button onClick={handleStartPhishingTest}>
                      <Play size={16} />
                      Next Test
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <div className={styles.cardGrid}>
            {courses.filter(c => !c.completed).map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Badge variant="outline">{course.category}</Badge>
                      <Badge variant="secondary">
                        <Clock size={14} />
                        {course.duration} min
                      </Badge>
                      {course.certification && (
                        <Badge variant="default">
                          <Award size={14} />
                          Certificate
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.875rem' }}>
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStartCourse(course.id)}
                      disabled={activeCourse !== null}
                    >
                      <Play size={16} />
                      {course.progress > 0 ? 'Continue' : 'Start'} Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className={styles.cardGrid}>
            {courses.filter(c => c.completed).map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Badge variant="outline">{course.category}</Badge>
                      <Badge variant="secondary">
                        <Clock size={14} />
                        {course.duration} min
                      </Badge>
                      {course.certification && (
                        <Badge variant="default">
                          <Award size={14} />
                          Certified
                        </Badge>
                      )}
                      <Badge variant="default">
                        <CheckCircle size={14} />
                        Completed
                      </Badge>
                    </div>

                    <Progress value={100} />

                    {course.certification && (
                      <Button variant="outline" size="sm">
                        Download Certificate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {courses.filter(c => c.completed).length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-neutral-11)', gridColumn: '1 / -1' }}>
                No courses completed yet. Start learning to earn certifications!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
