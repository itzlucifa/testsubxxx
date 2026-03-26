import type { Route } from "./+types/help";
import { AppLayout } from "~/components/layout/app-layout";
import { BackButton } from "~/components/ui/back-button";
import { HelpCircle, Book, MessageCircle, Phone, Mail, FileText, Video, Shield } from "lucide-react";
import styles from "./help.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Help Center - CYBERSHIELD" },
    { name: "description", content: "Get help and learn about CYBERSHIELD features" },
  ];
}

const faqs = [
  {
    question: "How does automatic remediation work?",
    questionHindi: "स्वचालित सुधार कैसे काम करता है?",
    answer:
      "CYBERSHIELD's auto-remediation system automatically fixes security vulnerabilities without manual intervention. When a threat is detected, the AI swarm analyzes it, determines the best fix, and applies it instantly - like closing open ports, updating firmware, or blocking malicious connections.",
    answerHindi:
      "CYBERSHIELD का स्वचालित सुधार सिस्टम मैनुअल हस्तक्षेप के बिना सुरक्षा कमजोरियों को स्वचालित रूप से ठीक करता है। जब खतरा पहचाना जाता है, तो AI swarm इसका विश्लेषण करता है, सबसे अच्छा समाधान तय करता है, और तुरंत लागू करता है - जैसे खुले पोर्ट बंद करना, फर्मवेयर अपडेट करना, या दुर्भावनापूर्ण कनेक्शन ब्लॉक करना।",
  },
  {
    question: "What is deepfake detection?",
    questionHindi: "डीपफेक डिटेक्शन क्या है?",
    answer:
      "Deepfake detection uses advanced AI to analyze video and audio calls in real-time. It can detect fake voices and AI-generated faces with 98%+ accuracy, protecting you from boss fraud, impersonation scams, and social engineering attacks.",
    answerHindi:
      "डीपफेक डिटेक्शन रियल-टाइम में वीडियो और ऑडियो कॉल का विश्लेषण करने के लिए उन्नत AI का उपयोग करता है। यह 98%+ सटीकता के साथ नकली आवाज़ों और AI-जनित चेहरों का पता लगा सकता है, आपको बॉस धोखाधड़ी, प्रतिरूपण घोटालों और सोशल इंजीनियरिंग हमलों से बचाता है।",
  },
  {
    question: "Is my data encrypted?",
    questionHindi: "क्या मेरा डेटा एन्क्रिप्टेड है?",
    answer:
      "Yes! CYBERSHIELD uses post-quantum cryptography with NIST-approved algorithms (CRYSTALS-Kyber and Dilithium). This means your data is protected not just against current threats, but also future quantum computer attacks.",
    answerHindi:
      "हाँ! CYBERSHIELD NIST-अनुमोदित एल्गोरिदम (CRYSTALS-Kyber और Dilithium) के साथ पोस्ट-क्वांटम क्रिप्टोग्राफी का उपयोग करता है। इसका मतलब है कि आपका डेटा न केवल वर्तमान खतरों से, बल्कि भविष्य के क्वांटम कंप्यूटर हमलों से भी सुरक्षित है।",
  },
  {
    question: "How do WhatsApp alerts work?",
    questionHindi: "WhatsApp अलर्ट कैसे काम करते हैं?",
    answer:
      "When a threat is blocked or action is needed, CYBERSHIELD sends you an instant WhatsApp message in simple language like 'Hack blocked!' or 'Device updated'. You don't need to understand technical terms - just know that you're protected.",
    answerHindi:
      "जब कोई खतरा ब्लॉक होता है या कार्रवाई की ज़रूरत होती है, तो CYBERSHIELD आपको सरल भाषा में तुरंत WhatsApp संदेश भेजता है जैसे 'हैक ब्लॉक हो गया!' या 'डिवाइस अपडेट हो गया'। आपको तकनीकी शब्दों को समझने की ज़रूरत नहीं है - बस जानें कि आप सुरक्षित हैं।",
  },
  {
    question: "Can I use voice commands?",
    questionHindi: "क्या मैं वॉइस कमांड्स का उपयोग कर सकता हूँ?",
    answer:
      "Yes! CYBERSHIELD supports voice commands in both English and Hindi. You can ask 'What's my security status?', 'Scan my network', or 'Show me recent threats' hands-free.",
    answerHindi:
      "हाँ! CYBERSHIELD अंग्रेज़ी और हिंदी दोनों में वॉइस कमांड्स का समर्थन करता है। आप हैंड्स-फ्री पूछ सकते हैं 'मेरी सुरक्षा स्थिति क्या है?', 'मेरे नेटवर्क को स्कैन करो', या 'हाल के खतरे दिखाओ'।",
  },
];

const resources = [
  {
    title: "User Guide",
    description: "Complete documentation on all CYBERSHIELD features",
    icon: Book,
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides in English and Hindi",
    icon: Video,
  },
  {
    title: "Security Best Practices",
    description: "Learn how to stay safe online",
    icon: Shield,
  },
  {
    title: "Technical Documentation",
    description: "Detailed technical specifications and API docs",
    icon: FileText,
  },
];

export default function Help() {
  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <BackButton />
            <h1 className={styles.title}>Help Center</h1>
            <p className={styles.subtitle}>Get support and learn about CYBERSHIELD features</p>
          </div>
        </div>

        <div className={styles.contactSection}>
          <h2 className={styles.sectionTitle}>Contact Support</h2>
          <div className={styles.contactGrid}>
            <div 
              className={styles.contactCard}
              onClick={() => window.open('tel:+918799859591', '_blank')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.contactIcon}>
                <Phone size={24} />
              </div>
              <h3 className={styles.contactTitle}>Phone Support</h3>
              <p className={styles.contactDetail}>+918799859591</p>
              <p className={styles.contactDescription}>Available 24/7 in English & Hindi</p>
            </div>

            <div 
              className={styles.contactCard}
              onClick={() => window.open('mailto:logiclordz07@gmail.com?subject=CYBERSHIELD%20Support%20Request', '_blank')}
              role="button"
              tabIndex={0}
            >
              <div className={styles.contactIcon}>
                <Mail size={24} />
              </div>
              <h3 className={styles.contactTitle}>Email Support</h3>
              <p className={styles.contactDetail}>logiclordz07@gmail.com</p>
              <p className={styles.contactDescription}>Response within 2 hours</p>
            </div>

            <div 
              className={styles.contactCard}
              onClick={() => window.location.href = '/ai-assistant'}
              role="button"
              tabIndex={0}
            >
              <div className={styles.contactIcon}>
                <MessageCircle size={24} />
              </div>
              <h3 className={styles.contactTitle}>Live Chat</h3>
              <p className={styles.contactDetail}>Chat with AI agent</p>
              <p className={styles.contactDescription}>Instant responses</p>
            </div>
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqCard}>
                <div className={styles.faqQuestion}>
                  <HelpCircle size={20} className={styles.faqIcon} />
                  <div>
                    <h3 className={styles.questionText}>{faq.question}</h3>
                    <p className={styles.questionHindi}>{faq.questionHindi}</p>
                  </div>
                </div>
                <div className={styles.faqAnswer}>
                  <p className={styles.answerText}>{faq.answer}</p>
                  <p className={styles.answerHindi}>{faq.answerHindi}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.resourcesSection}>
          <h2 className={styles.sectionTitle}>Learning Resources</h2>
          <div className={styles.resourcesGrid}>
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <div key={index} className={styles.resourceCard}>
                  <div className={styles.resourceIcon}>
                    <Icon size={32} />
                  </div>
                  <h3 className={styles.resourceTitle}>{resource.title}</h3>
                  <p className={styles.resourceDescription}>{resource.description}</p>
                  <button className={styles.resourceButton}>Learn More</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
