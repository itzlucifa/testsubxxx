import { useState } from 'react';
import { Copy, RefreshCw, Lock, Key, Hash, Shield, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { Button } from '../components/ui/button/button';
import { Input } from '../components/ui/input/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card/card';
import { Slider } from '../components/ui/slider/slider';
import { Checkbox } from '../components/ui/checkbox/checkbox';
import { Label } from '../components/ui/label/label';
import { Textarea } from '../components/ui/textarea/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs/tabs';
import { Progress } from '../components/ui/progress/progress';
import { BackButton } from '../components/ui/back-button';
import { Badge } from '../components/ui/badge/badge';
import { passwordGenerator, encryptionService, hashService } from '../lib/security-tools';
import { toast } from '../hooks/use-toast';
import styles from './common-page.module.css';

export default function PasswordTools() {
  // Password Generator
  const [password, setPassword] = useState('');
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });

  // Password Breach Check
  const [passwordToCheck, setPasswordToCheck] = useState('');
  const [breachResult, setBreachResult] = useState<{
    checked: boolean;
    breached: boolean;
    count?: number;
    loading: boolean;
  }>({ checked: false, breached: false, loading: false });

  // Encryption Tool
  const [textToEncrypt, setTextToEncrypt] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [encryptedText, setEncryptedText] = useState('');
  const [textToDecrypt, setTextToDecrypt] = useState('');
  const [decryptionPassword, setDecryptionPassword] = useState('');
  const [decryptedText, setDecryptedText] = useState('');

  // Hash Tool
  const [textToHash, setTextToHash] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [sha512Hash, setSha512Hash] = useState('');

  const generatePassword = () => {
    const newPassword = passwordGenerator.generate({
      length: passwordLength,
      uppercase: includeUppercase,
      lowercase: includeLowercase,
      numbers: includeNumbers,
      symbols: includeSymbols,
    });
    setPassword(newPassword);
    const strength = passwordGenerator.calculateStrength(newPassword);
    setPasswordStrength(strength);
    toast({
      title: 'Password Generated',
      description: `Strength: ${strength.score}% - ${getStrengthLabel(strength.score)}`,
    });
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'var(--color-success-9)';
    if (score >= 60) return 'var(--color-accent-9)';
    if (score >= 40) return 'orange';
    return 'var(--color-error-9)';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  const handleEncrypt = async () => {
    if (!textToEncrypt || !encryptionPassword) {
      toast({
        title: 'Error',
        description: 'Please enter both text and password',
        variant: 'destructive',
      });
      return;
    }

    try {
      const encrypted = await encryptionService.encrypt(textToEncrypt, encryptionPassword);
      setEncryptedText(encrypted);
      toast({
        title: 'Success',
        description: 'Text encrypted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Encryption failed',
        variant: 'destructive',
      });
    }
  };

  const handleDecrypt = async () => {
    if (!textToDecrypt || !decryptionPassword) {
      toast({
        title: 'Error',
        description: 'Please enter both encrypted text and password',
        variant: 'destructive',
      });
      return;
    }

    try {
      const decrypted = await encryptionService.decrypt(textToDecrypt, decryptionPassword);
      setDecryptedText(decrypted);
      toast({
        title: 'Success',
        description: 'Text decrypted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Decryption failed - wrong password or corrupted data',
        variant: 'destructive',
      });
    }
  };

  const handleHash = async () => {
    if (!textToHash) {
      toast({
        title: 'Error',
        description: 'Please enter text to hash',
        variant: 'destructive',
      });
      return;
    }

    const sha256 = await hashService.sha256(textToHash);
    const sha512 = await hashService.sha512(textToHash);
    setSha256Hash(sha256);
    setSha512Hash(sha512);
    toast({
      title: 'Success',
      description: 'Hashes generated successfully',
    });
  };

  const generateEncryptionKey = () => {
    const key = encryptionService.generateKey();
    setEncryptionPassword(key);
    toast({
      title: 'Key Generated',
      description: 'Secure encryption key generated',
    });
  };

  const sha1Hash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  const checkPasswordBreach = async () => {
    if (!passwordToCheck) {
      toast({
        title: 'Error',
        description: 'Please enter a password to check',
        variant: 'destructive',
      });
      return;
    }

    setBreachResult({ checked: false, breached: false, loading: true });

    try {
      const sha1 = await sha1Hash(passwordToCheck);
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const text = await response.text();
      const lines = text.split('\r\n');
      
      let breachCount = 0;
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          breachCount = parseInt(count, 10);
          break;
        }
      }

      const breached = breachCount > 0;
      setBreachResult({
        checked: true,
        breached,
        count: breachCount,
        loading: false,
      });
      toast({
        title: breached ? 'Password Compromised!' : 'Password Safe',
        description: breached 
          ? `This password was found in ${breachCount.toLocaleString()} data breaches` 
          : 'This password has not been found in known data breaches',
        variant: breached ? 'destructive' : 'default',
      });
    } catch (error) {
      setBreachResult({ checked: false, breached: false, loading: false });
      toast({
        title: 'Error',
        description: 'Failed to check password',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <BackButton />
          <h1 className={styles.title}>Security Tools</h1>
          <p className={styles.subtitle}>Professional-grade cryptographic tools</p>
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
          <strong>Real Cryptography:</strong> Uses Web Crypto API for true randomness and AES-256-GCM encryption
        </span>
      </div>

      <Tabs defaultValue="generator" className={styles.content}>
        <TabsList>
          <TabsTrigger value="generator">
            <Key size={16} />
            Password Generator
          </TabsTrigger>
          <TabsTrigger value="breach">
            <Shield size={16} />
            Breach Check
          </TabsTrigger>
          <TabsTrigger value="encryption">
            <Lock size={16} />
            Encryption
          </TabsTrigger>
          <TabsTrigger value="hashing">
            <Hash size={16} />
            Hashing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <Card>
              <CardHeader>
                <CardTitle>Password Generator</CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Input
                    value={password}
                    readOnly
                    placeholder="Generated password will appear here"
                    style={{ flex: 1 }}
                  />
                  <Button onClick={() => copyToClipboard(password, 'Password')} disabled={!password}>
                    <Copy size={16} />
                  </Button>
                  <Button onClick={generatePassword}>
                    <RefreshCw size={16} />
                    Generate
                  </Button>
                </div>

                {password && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <span style={{ fontSize: 'var(--font-size-1)', fontWeight: 'bold' }}>
                        Strength: {getStrengthLabel(passwordStrength.score)}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-1)' }}>{passwordStrength.score}%</span>
                    </div>
                    <Progress value={passwordStrength.score} style={{ backgroundColor: getStrengthColor(passwordStrength.score) }} />
                    {passwordStrength.feedback.length > 0 && (
                      <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-1)' }}>
                        <strong>Suggestions:</strong>
                        <ul style={{ marginTop: 'var(--space-1)', paddingLeft: 'var(--space-4)' }}>
                          {passwordStrength.feedback.map((fb, i) => (
                            <li key={i}>{fb}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label>Length: {passwordLength}</Label>
                  <Slider
                    value={[passwordLength]}
                    onValueChange={(value) => setPasswordLength(value[0])}
                    min={8}
                    max={64}
                    step={1}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Checkbox
                      id="uppercase"
                      checked={includeUppercase}
                      onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
                    />
                    <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Checkbox
                      id="lowercase"
                      checked={includeLowercase}
                      onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
                    />
                    <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Checkbox
                      id="numbers"
                      checked={includeNumbers}
                      onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
                    />
                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Checkbox
                      id="symbols"
                      checked={includeSymbols}
                      onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
                    />
                    <Label htmlFor="symbols">Symbols (!@#$...)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breach">
          <Card>
            <CardHeader>
              <CardTitle>
                <Shield size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Password Breach Checker
              </CardTitle>
              <CardDescription>
                Check if your password has been exposed in known data breaches using Have I Been Pwned API.
                Your password is never sent to the server - only a partial hash is used.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <Label>Password to Check</Label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Input
                    type="password"
                    value={passwordToCheck}
                    onChange={(e) => {
                      setPasswordToCheck(e.target.value);
                      setBreachResult({ checked: false, breached: false, loading: false });
                    }}
                    placeholder="Enter password to check..."
                    style={{ flex: 1 }}
                  />
                  <Button onClick={checkPasswordBreach} disabled={breachResult.loading || !passwordToCheck}>
                    {breachResult.loading ? 'Checking...' : 'Check Breach'}
                  </Button>
                </div>
              </div>

              {breachResult.checked && (
                <div style={{ 
                  padding: 'var(--space-4)', 
                  background: breachResult.breached ? 'var(--color-error-2)' : 'var(--color-success-2)',
                  border: `1px solid ${breachResult.breached ? 'var(--color-error-6)' : 'var(--color-success-6)'}`,
                  borderRadius: 'var(--radius-2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    {breachResult.breached ? (
                      <AlertTriangle size={24} style={{ color: 'var(--color-error-9)' }} />
                    ) : (
                      <CheckCircle size={24} style={{ color: 'var(--color-success-9)' }} />
                    )}
                    <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {breachResult.breached ? 'Password Compromised!' : 'Password Not Found in Breaches'}
                    </span>
                  </div>
                  {breachResult.breached ? (
                    <div>
                      <p style={{ marginBottom: 'var(--space-2)' }}>
                        This password was found in <strong>{breachResult.count?.toLocaleString()}</strong> data breaches.
                      </p>
                      <Badge variant="destructive">Do not use this password</Badge>
                    </div>
                  ) : (
                    <p>This password has not been found in any known data breach databases. However, always use unique passwords for each account.</p>
                  )}
                </div>
              )}

              <div style={{ 
                padding: 'var(--space-3)', 
                background: 'var(--color-neutral-2)',
                borderRadius: 'var(--radius-2)',
                fontSize: '0.875rem'
              }}>
                <strong>How it works:</strong> We use the k-Anonymity model from Have I Been Pwned. 
                Your password is hashed locally using SHA-1, and only the first 5 characters of the hash 
                are sent to check against the breach database. Your actual password is never transmitted.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption">
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <Card>
              <CardHeader>
                <CardTitle>AES-256 Encryption</CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <Label>Encryption Password</Label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Input
                      type="password"
                      value={encryptionPassword}
                      onChange={(e) => setEncryptionPassword(e.target.value)}
                      placeholder="Enter encryption password"
                      style={{ flex: 1 }}
                    />
                    <Button onClick={generateEncryptionKey} variant="outline">
                      Generate Key
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Text to Encrypt</Label>
                  <Textarea
                    value={textToEncrypt}
                    onChange={(e) => setTextToEncrypt(e.target.value)}
                    placeholder="Enter text to encrypt..."
                    rows={4}
                    style={{ marginTop: 'var(--space-2)' }}
                  />
                </div>

                <Button onClick={handleEncrypt}>
                  <Lock size={16} />
                  Encrypt
                </Button>

                {encryptedText && (
                  <div>
                    <Label>Encrypted Text</Label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Textarea value={encryptedText} readOnly rows={4} style={{ flex: 1 }} />
                      <Button onClick={() => copyToClipboard(encryptedText, 'Encrypted text')}>
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AES-256 Decryption</CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <Label>Decryption Password</Label>
                  <Input
                    type="password"
                    value={decryptionPassword}
                    onChange={(e) => setDecryptionPassword(e.target.value)}
                    placeholder="Enter decryption password"
                    style={{ marginTop: 'var(--space-2)' }}
                  />
                </div>

                <div>
                  <Label>Encrypted Text</Label>
                  <Textarea
                    value={textToDecrypt}
                    onChange={(e) => setTextToDecrypt(e.target.value)}
                    placeholder="Paste encrypted text here..."
                    rows={4}
                    style={{ marginTop: 'var(--space-2)' }}
                  />
                </div>

                <Button onClick={handleDecrypt}>
                  <Lock size={16} />
                  Decrypt
                </Button>

                {decryptedText && (
                  <div>
                    <Label>Decrypted Text</Label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Textarea value={decryptedText} readOnly rows={4} style={{ flex: 1 }} />
                      <Button onClick={() => copyToClipboard(decryptedText, 'Decrypted text')}>
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hashing">
          <Card>
            <CardHeader>
              <CardTitle>Hash Generator</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <Label>Text to Hash</Label>
                <Textarea
                  value={textToHash}
                  onChange={(e) => setTextToHash(e.target.value)}
                  placeholder="Enter text to hash..."
                  rows={4}
                  style={{ marginTop: 'var(--space-2)' }}
                />
              </div>

              <Button onClick={handleHash}>
                <Hash size={16} />
                Generate Hashes
              </Button>

              {sha256Hash && (
                <div>
                  <Label>SHA-256 Hash</Label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Input value={sha256Hash} readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
                    <Button onClick={() => copyToClipboard(sha256Hash, 'SHA-256 hash')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {sha512Hash && (
                <div>
                  <Label>SHA-512 Hash</Label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <Input value={sha512Hash} readOnly style={{ flex: 1, fontFamily: 'monospace' }} />
                    <Button onClick={() => copyToClipboard(sha512Hash, 'SHA-512 hash')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-accent-3)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: 'var(--font-size-1)',
                }}
              >
                <strong>Note:</strong> Hash functions are one-way - you cannot decrypt a hash back to the original
                text. They're used for data integrity verification and password storage.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
