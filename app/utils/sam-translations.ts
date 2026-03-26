type TranslationKey = 
  | 'greeting'
  | 'howAreYou'
  | 'introduction'
  | 'thanks'
  | 'capabilities'
  | 'statusGood'
  | 'statusWarning'
  | 'statusCritical'
  | 'commandExecuted'
  | 'helpMessage'
  | 'defaultResponse';

interface TranslationParams {
  deviceCount?: number;
  threatCount?: number;
  blockedCount?: number;
  alertCount?: number;
  criticalCount?: number;
  targetPage?: string;
}

const translations: Record<string, Record<TranslationKey, string | ((params: TranslationParams) => string)>> = {
  'en-US': {
    greeting: "Hello! I'm SAM, your security assistant. How can I help you today?",
    howAreYou: (p) => `All systems operational. Monitoring ${p.deviceCount} devices with ${p.threatCount} threats tracked.`,
    introduction: (p) => `I'm SAM - Security & Monitoring AI. I'm protecting ${p.deviceCount} devices and have blocked ${p.blockedCount} threats.`,
    thanks: "You're welcome! I'm here to keep your network secure.",
    capabilities: "I can monitor devices, detect threats, analyze vulnerabilities, and answer security questions.",
    statusGood: (p) => `Your network is secure. ${p.deviceCount} devices protected, ${p.blockedCount} threats blocked.`,
    statusWarning: (p) => `Attention needed: ${p.threatCount} active threats detected. ${p.alertCount} unread alerts.`,
    statusCritical: (p) => `Critical alert: ${p.criticalCount} critical threats require immediate action!`,
    commandExecuted: (p) => `Opening ${p.targetPage}...`,
    helpMessage: "Try: 'Go to Dashboard', 'Scan devices', 'Show threats', or 'Generate password'",
    defaultResponse: "I can help with security questions, device monitoring, and threat analysis. What would you like to know?",
  },
  'es-ES': {
    greeting: "¡Hola! Soy SAM, tu asistente de seguridad. ¿Cómo puedo ayudarte hoy?",
    howAreYou: (p) => `Todos los sistemas operativos. Monitoreando ${p.deviceCount} dispositivos con ${p.threatCount} amenazas rastreadas.`,
    introduction: (p) => `Soy SAM - IA de Seguridad y Monitoreo. Estoy protegiendo ${p.deviceCount} dispositivos y he bloqueado ${p.blockedCount} amenazas.`,
    thanks: "¡De nada! Estoy aquí para mantener tu red segura.",
    capabilities: "Puedo monitorear dispositivos, detectar amenazas, analizar vulnerabilidades y responder preguntas de seguridad.",
    statusGood: (p) => `Tu red está segura. ${p.deviceCount} dispositivos protegidos, ${p.blockedCount} amenazas bloqueadas.`,
    statusWarning: (p) => `Atención necesaria: ${p.threatCount} amenazas activas detectadas. ${p.alertCount} alertas sin leer.`,
    statusCritical: (p) => `¡Alerta crítica: ${p.criticalCount} amenazas críticas requieren acción inmediata!`,
    commandExecuted: (p) => `Abriendo ${p.targetPage}...`,
    helpMessage: "Prueba: 'Ir al Panel', 'Escanear dispositivos', 'Mostrar amenazas', o 'Generar contraseña'",
    defaultResponse: "Puedo ayudar con preguntas de seguridad, monitoreo de dispositivos y análisis de amenazas. ¿Qué te gustaría saber?",
  },
  'fr-FR': {
    greeting: "Bonjour! Je suis SAM, votre assistant de sécurité. Comment puis-je vous aider aujourd'hui?",
    howAreYou: (p) => `Tous les systèmes opérationnels. Surveillance de ${p.deviceCount} appareils avec ${p.threatCount} menaces suivies.`,
    introduction: (p) => `Je suis SAM - IA de Sécurité et Surveillance. Je protège ${p.deviceCount} appareils et ai bloqué ${p.blockedCount} menaces.`,
    thanks: "Je vous en prie! Je suis là pour sécuriser votre réseau.",
    capabilities: "Je peux surveiller les appareils, détecter les menaces, analyser les vulnérabilités et répondre aux questions de sécurité.",
    statusGood: (p) => `Votre réseau est sécurisé. ${p.deviceCount} appareils protégés, ${p.blockedCount} menaces bloquées.`,
    statusWarning: (p) => `Attention requise: ${p.threatCount} menaces actives détectées. ${p.alertCount} alertes non lues.`,
    statusCritical: (p) => `Alerte critique: ${p.criticalCount} menaces critiques nécessitent une action immédiate!`,
    commandExecuted: (p) => `Ouverture de ${p.targetPage}...`,
    helpMessage: "Essayez: 'Aller au Tableau de bord', 'Scanner les appareils', 'Afficher les menaces', ou 'Générer mot de passe'",
    defaultResponse: "Je peux aider avec les questions de sécurité, la surveillance des appareils et l'analyse des menaces. Que souhaitez-vous savoir?",
  },
  'de-DE': {
    greeting: "Hallo! Ich bin SAM, Ihr Sicherheitsassistent. Wie kann ich Ihnen heute helfen?",
    howAreYou: (p) => `Alle Systeme betriebsbereit. Überwache ${p.deviceCount} Geräte mit ${p.threatCount} verfolgten Bedrohungen.`,
    introduction: (p) => `Ich bin SAM - Sicherheits- und Überwachungs-KI. Ich schütze ${p.deviceCount} Geräte und habe ${p.blockedCount} Bedrohungen blockiert.`,
    thanks: "Gern geschehen! Ich bin hier, um Ihr Netzwerk sicher zu halten.",
    capabilities: "Ich kann Geräte überwachen, Bedrohungen erkennen, Schwachstellen analysieren und Sicherheitsfragen beantworten.",
    statusGood: (p) => `Ihr Netzwerk ist sicher. ${p.deviceCount} Geräte geschützt, ${p.blockedCount} Bedrohungen blockiert.`,
    statusWarning: (p) => `Aufmerksamkeit erforderlich: ${p.threatCount} aktive Bedrohungen erkannt. ${p.alertCount} ungelesene Warnungen.`,
    statusCritical: (p) => `Kritische Warnung: ${p.criticalCount} kritische Bedrohungen erfordern sofortiges Handeln!`,
    commandExecuted: (p) => `Öffne ${p.targetPage}...`,
    helpMessage: "Versuchen Sie: 'Gehe zum Dashboard', 'Geräte scannen', 'Bedrohungen anzeigen', oder 'Passwort generieren'",
    defaultResponse: "Ich kann bei Sicherheitsfragen, Geräteüberwachung und Bedrohungsanalyse helfen. Was möchten Sie wissen?",
  },
  'zh-CN': {
    greeting: "您好！我是SAM，您的安全助手。今天我能帮您什么？",
    howAreYou: (p) => `所有系统正常运行。正在监控${p.deviceCount}台设备，追踪${p.threatCount}个威胁。`,
    introduction: (p) => `我是SAM - 安全与监控AI。我正在保护${p.deviceCount}台设备，已阻止${p.blockedCount}个威胁。`,
    thanks: "不客气！我在这里保护您的网络安全。",
    capabilities: "我可以监控设备、检测威胁、分析漏洞并回答安全问题。",
    statusGood: (p) => `您的网络安全。${p.deviceCount}台设备受保护，${p.blockedCount}个威胁已阻止。`,
    statusWarning: (p) => `需要注意：检测到${p.threatCount}个活跃威胁。${p.alertCount}个未读警报。`,
    statusCritical: (p) => `严重警报：${p.criticalCount}个严重威胁需要立即处理！`,
    commandExecuted: (p) => `正在打开${p.targetPage}...`,
    helpMessage: "尝试：'去仪表板'、'扫描设备'、'显示威胁'或'生成密码'",
    defaultResponse: "我可以帮助解答安全问题、设备监控和威胁分析。您想了解什么？",
  },
  'ja-JP': {
    greeting: "こんにちは！セキュリティアシスタントのSAMです。今日はどのようなお手伝いができますか？",
    howAreYou: (p) => `全システム正常稼働中。${p.deviceCount}台のデバイスを監視し、${p.threatCount}件の脅威を追跡しています。`,
    introduction: (p) => `私はSAM - セキュリティ＆モニタリングAIです。${p.deviceCount}台のデバイスを保護し、${p.blockedCount}件の脅威をブロックしました。`,
    thanks: "どういたしまして！ネットワークの安全を守るためにここにいます。",
    capabilities: "デバイスの監視、脅威の検出、脆弱性の分析、セキュリティに関する質問への回答ができます。",
    statusGood: (p) => `ネットワークは安全です。${p.deviceCount}台のデバイスが保護され、${p.blockedCount}件の脅威がブロックされました。`,
    statusWarning: (p) => `注意が必要：${p.threatCount}件のアクティブな脅威が検出されました。${p.alertCount}件の未読アラート。`,
    statusCritical: (p) => `重大な警告：${p.criticalCount}件の重大な脅威が即座の対応を必要としています！`,
    commandExecuted: (p) => `${p.targetPage}を開いています...`,
    helpMessage: "試してみてください：'ダッシュボードへ'、'デバイスをスキャン'、'脅威を表示'、または'パスワードを生成'",
    defaultResponse: "セキュリティに関する質問、デバイス監視、脅威分析についてお手伝いできます。何を知りたいですか？",
  },
  'ko-KR': {
    greeting: "안녕하세요! 보안 어시스턴트 SAM입니다. 오늘 무엇을 도와드릴까요?",
    howAreYou: (p) => `모든 시스템 정상 작동 중. ${p.deviceCount}개 장치를 모니터링하고 ${p.threatCount}개 위협을 추적 중입니다.`,
    introduction: (p) => `저는 SAM - 보안 및 모니터링 AI입니다. ${p.deviceCount}개 장치를 보호하고 ${p.blockedCount}개 위협을 차단했습니다.`,
    thanks: "천만에요! 네트워크 보안을 위해 여기 있습니다.",
    capabilities: "장치 모니터링, 위협 감지, 취약점 분석 및 보안 질문에 답변할 수 있습니다.",
    statusGood: (p) => `네트워크가 안전합니다. ${p.deviceCount}개 장치 보호됨, ${p.blockedCount}개 위협 차단됨.`,
    statusWarning: (p) => `주의 필요: ${p.threatCount}개 활성 위협 감지됨. ${p.alertCount}개 읽지 않은 알림.`,
    statusCritical: (p) => `중요 경고: ${p.criticalCount}개 중요 위협이 즉각적인 조치가 필요합니다!`,
    commandExecuted: (p) => `${p.targetPage} 열는 중...`,
    helpMessage: "시도해 보세요: '대시보드로 이동', '장치 스캔', '위협 표시', 또는 '비밀번호 생성'",
    defaultResponse: "보안 질문, 장치 모니터링, 위협 분석에 도움을 드릴 수 있습니다. 무엇을 알고 싶으신가요?",
  },
  'pt-BR': {
    greeting: "Olá! Sou SAM, seu assistente de segurança. Como posso ajudá-lo hoje?",
    howAreYou: (p) => `Todos os sistemas operacionais. Monitorando ${p.deviceCount} dispositivos com ${p.threatCount} ameaças rastreadas.`,
    introduction: (p) => `Sou SAM - IA de Segurança e Monitoramento. Estou protegendo ${p.deviceCount} dispositivos e bloqueei ${p.blockedCount} ameaças.`,
    thanks: "De nada! Estou aqui para manter sua rede segura.",
    capabilities: "Posso monitorar dispositivos, detectar ameaças, analisar vulnerabilidades e responder perguntas de segurança.",
    statusGood: (p) => `Sua rede está segura. ${p.deviceCount} dispositivos protegidos, ${p.blockedCount} ameaças bloqueadas.`,
    statusWarning: (p) => `Atenção necessária: ${p.threatCount} ameaças ativas detectadas. ${p.alertCount} alertas não lidos.`,
    statusCritical: (p) => `Alerta crítico: ${p.criticalCount} ameaças críticas requerem ação imediata!`,
    commandExecuted: (p) => `Abrindo ${p.targetPage}...`,
    helpMessage: "Tente: 'Ir para Painel', 'Escanear dispositivos', 'Mostrar ameaças', ou 'Gerar senha'",
    defaultResponse: "Posso ajudar com questões de segurança, monitoramento de dispositivos e análise de ameaças. O que você gostaria de saber?",
  },
  'ru-RU': {
    greeting: "Здравствуйте! Я SAM, ваш помощник по безопасности. Чем могу помочь сегодня?",
    howAreYou: (p) => `Все системы работают нормально. Мониторинг ${p.deviceCount} устройств, отслеживание ${p.threatCount} угроз.`,
    introduction: (p) => `Я SAM - ИИ безопасности и мониторинга. Защищаю ${p.deviceCount} устройств и заблокировал ${p.blockedCount} угроз.`,
    thanks: "Пожалуйста! Я здесь, чтобы обеспечить безопасность вашей сети.",
    capabilities: "Могу мониторить устройства, обнаруживать угрозы, анализировать уязвимости и отвечать на вопросы безопасности.",
    statusGood: (p) => `Ваша сеть защищена. ${p.deviceCount} устройств под защитой, ${p.blockedCount} угроз заблокировано.`,
    statusWarning: (p) => `Требуется внимание: обнаружено ${p.threatCount} активных угроз. ${p.alertCount} непрочитанных оповещений.`,
    statusCritical: (p) => `Критическое предупреждение: ${p.criticalCount} критических угроз требуют немедленных действий!`,
    commandExecuted: (p) => `Открываю ${p.targetPage}...`,
    helpMessage: "Попробуйте: 'Перейти на панель', 'Сканировать устройства', 'Показать угрозы', или 'Создать пароль'",
    defaultResponse: "Могу помочь с вопросами безопасности, мониторингом устройств и анализом угроз. Что хотите узнать?",
  },
  'ar-SA': {
    greeting: "مرحباً! أنا SAM، مساعدك الأمني. كيف يمكنني مساعدتك اليوم؟",
    howAreYou: (p) => `جميع الأنظمة تعمل. مراقبة ${p.deviceCount} أجهزة مع تتبع ${p.threatCount} تهديدات.`,
    introduction: (p) => `أنا SAM - ذكاء اصطناعي للأمان والمراقبة. أحمي ${p.deviceCount} أجهزة وقد حجبت ${p.blockedCount} تهديدات.`,
    thanks: "على الرحب والسعة! أنا هنا للحفاظ على أمان شبكتك.",
    capabilities: "يمكنني مراقبة الأجهزة، اكتشاف التهديدات، تحليل الثغرات والإجابة على أسئلة الأمان.",
    statusGood: (p) => `شبكتك آمنة. ${p.deviceCount} أجهزة محمية، ${p.blockedCount} تهديدات محجوبة.`,
    statusWarning: (p) => `انتباه مطلوب: تم اكتشاف ${p.threatCount} تهديدات نشطة. ${p.alertCount} تنبيهات غير مقروءة.`,
    statusCritical: (p) => `تنبيه حرج: ${p.criticalCount} تهديدات حرجة تتطلب إجراء فوري!`,
    commandExecuted: (p) => `جاري فتح ${p.targetPage}...`,
    helpMessage: "جرب: 'اذهب للوحة التحكم'، 'فحص الأجهزة'، 'إظهار التهديدات'، أو 'إنشاء كلمة مرور'",
    defaultResponse: "يمكنني المساعدة في أسئلة الأمان ومراقبة الأجهزة وتحليل التهديدات. ماذا تريد أن تعرف؟",
  },
  'hi-IN': {
    greeting: "नमस्ते! मैं SAM हूं, आपका सुरक्षा सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?",
    howAreYou: (p) => `सभी सिस्टम चालू हैं। ${p.deviceCount} उपकरणों की निगरानी और ${p.threatCount} खतरों को ट्रैक कर रहा हूं।`,
    introduction: (p) => `मैं SAM हूं - सुरक्षा और निगरानी AI। मैं ${p.deviceCount} उपकरणों की सुरक्षा कर रहा हूं और ${p.blockedCount} खतरों को रोका है।`,
    thanks: "आपका स्वागत है! मैं आपके नेटवर्क को सुरक्षित रखने के लिए यहां हूं।",
    capabilities: "मैं उपकरणों की निगरानी, खतरों का पता लगाना, कमजोरियों का विश्लेषण और सुरक्षा प्रश्नों का उत्तर दे सकता हूं।",
    statusGood: (p) => `आपका नेटवर्क सुरक्षित है। ${p.deviceCount} उपकरण सुरक्षित, ${p.blockedCount} खतरे अवरुद्ध।`,
    statusWarning: (p) => `ध्यान आवश्यक: ${p.threatCount} सक्रिय खतरे पाए गए। ${p.alertCount} अपठित अलर्ट।`,
    statusCritical: (p) => `गंभीर चेतावनी: ${p.criticalCount} गंभीर खतरों को तुरंत कार्रवाई की आवश्यकता है!`,
    commandExecuted: (p) => `${p.targetPage} खोल रहा हूं...`,
    helpMessage: "कोशिश करें: 'डैशबोर्ड पर जाएं', 'उपकरण स्कैन करें', 'खतरे दिखाएं', या 'पासवर्ड बनाएं'",
    defaultResponse: "मैं सुरक्षा प्रश्नों, उपकरण निगरानी और खतरे विश्लेषण में मदद कर सकता हूं। आप क्या जानना चाहते हैं?",
  },
  'it-IT': {
    greeting: "Ciao! Sono SAM, il tuo assistente di sicurezza. Come posso aiutarti oggi?",
    howAreYou: (p) => `Tutti i sistemi operativi. Monitoraggio di ${p.deviceCount} dispositivi con ${p.threatCount} minacce tracciate.`,
    introduction: (p) => `Sono SAM - AI di Sicurezza e Monitoraggio. Proteggo ${p.deviceCount} dispositivi e ho bloccato ${p.blockedCount} minacce.`,
    thanks: "Prego! Sono qui per mantenere sicura la tua rete.",
    capabilities: "Posso monitorare dispositivi, rilevare minacce, analizzare vulnerabilità e rispondere a domande sulla sicurezza.",
    statusGood: (p) => `La tua rete è sicura. ${p.deviceCount} dispositivi protetti, ${p.blockedCount} minacce bloccate.`,
    statusWarning: (p) => `Attenzione richiesta: ${p.threatCount} minacce attive rilevate. ${p.alertCount} avvisi non letti.`,
    statusCritical: (p) => `Allerta critica: ${p.criticalCount} minacce critiche richiedono azione immediata!`,
    commandExecuted: (p) => `Apertura di ${p.targetPage}...`,
    helpMessage: "Prova: 'Vai alla Dashboard', 'Scansiona dispositivi', 'Mostra minacce', o 'Genera password'",
    defaultResponse: "Posso aiutare con domande sulla sicurezza, monitoraggio dispositivi e analisi delle minacce. Cosa vorresti sapere?",
  },
  'nl-NL': {
    greeting: "Hallo! Ik ben SAM, je beveiligingsassistent. Hoe kan ik je vandaag helpen?",
    howAreYou: (p) => `Alle systemen operationeel. Monitoring van ${p.deviceCount} apparaten met ${p.threatCount} bedreigingen gevolgd.`,
    introduction: (p) => `Ik ben SAM - Beveiliging & Monitoring AI. Ik bescherm ${p.deviceCount} apparaten en heb ${p.blockedCount} bedreigingen geblokkeerd.`,
    thanks: "Graag gedaan! Ik ben hier om je netwerk veilig te houden.",
    capabilities: "Ik kan apparaten monitoren, bedreigingen detecteren, kwetsbaarheden analyseren en beveiligingsvragen beantwoorden.",
    statusGood: (p) => `Je netwerk is veilig. ${p.deviceCount} apparaten beschermd, ${p.blockedCount} bedreigingen geblokkeerd.`,
    statusWarning: (p) => `Aandacht vereist: ${p.threatCount} actieve bedreigingen gedetecteerd. ${p.alertCount} ongelezen waarschuwingen.`,
    statusCritical: (p) => `Kritieke waarschuwing: ${p.criticalCount} kritieke bedreigingen vereisen onmiddellijke actie!`,
    commandExecuted: (p) => `${p.targetPage} openen...`,
    helpMessage: "Probeer: 'Ga naar Dashboard', 'Scan apparaten', 'Toon bedreigingen', of 'Genereer wachtwoord'",
    defaultResponse: "Ik kan helpen met beveiligingsvragen, apparaatmonitoring en bedreigingsanalyse. Wat wil je weten?",
  },
  'pl-PL': {
    greeting: "Cześć! Jestem SAM, twój asystent bezpieczeństwa. Jak mogę ci dzisiaj pomóc?",
    howAreYou: (p) => `Wszystkie systemy działają. Monitoruję ${p.deviceCount} urządzeń i śledzę ${p.threatCount} zagrożeń.`,
    introduction: (p) => `Jestem SAM - AI Bezpieczeństwa i Monitoringu. Chronię ${p.deviceCount} urządzeń i zablokowałem ${p.blockedCount} zagrożeń.`,
    thanks: "Nie ma za co! Jestem tu, aby zapewnić bezpieczeństwo twojej sieci.",
    capabilities: "Mogę monitorować urządzenia, wykrywać zagrożenia, analizować podatności i odpowiadać na pytania o bezpieczeństwo.",
    statusGood: (p) => `Twoja sieć jest bezpieczna. ${p.deviceCount} urządzeń chronionych, ${p.blockedCount} zagrożeń zablokowanych.`,
    statusWarning: (p) => `Uwaga wymagana: wykryto ${p.threatCount} aktywnych zagrożeń. ${p.alertCount} nieprzeczytanych alertów.`,
    statusCritical: (p) => `Krytyczne ostrzeżenie: ${p.criticalCount} krytycznych zagrożeń wymaga natychmiastowego działania!`,
    commandExecuted: (p) => `Otwieranie ${p.targetPage}...`,
    helpMessage: "Spróbuj: 'Idź do Panelu', 'Skanuj urządzenia', 'Pokaż zagrożenia', lub 'Generuj hasło'",
    defaultResponse: "Mogę pomóc z pytaniami o bezpieczeństwo, monitoringiem urządzeń i analizą zagrożeń. Co chciałbyś wiedzieć?",
  },
  'tr-TR': {
    greeting: "Merhaba! Ben SAM, güvenlik asistanınız. Bugün size nasıl yardımcı olabilirim?",
    howAreYou: (p) => `Tüm sistemler çalışıyor. ${p.deviceCount} cihazı izliyor ve ${p.threatCount} tehdidi takip ediyorum.`,
    introduction: (p) => `Ben SAM - Güvenlik ve İzleme AI. ${p.deviceCount} cihazı koruyorum ve ${p.blockedCount} tehdidi engelledim.`,
    thanks: "Rica ederim! Ağınızı güvende tutmak için buradayım.",
    capabilities: "Cihazları izleyebilir, tehditleri tespit edebilir, güvenlik açıklarını analiz edebilir ve güvenlik sorularını yanıtlayabilirim.",
    statusGood: (p) => `Ağınız güvende. ${p.deviceCount} cihaz korunuyor, ${p.blockedCount} tehdit engellendi.`,
    statusWarning: (p) => `Dikkat gerekli: ${p.threatCount} aktif tehdit tespit edildi. ${p.alertCount} okunmamış uyarı.`,
    statusCritical: (p) => `Kritik uyarı: ${p.criticalCount} kritik tehdit acil eylem gerektiriyor!`,
    commandExecuted: (p) => `${p.targetPage} açılıyor...`,
    helpMessage: "Deneyin: 'Panoya git', 'Cihazları tara', 'Tehditleri göster', veya 'Şifre oluştur'",
    defaultResponse: "Güvenlik soruları, cihaz izleme ve tehdit analizi konusunda yardımcı olabilirim. Ne bilmek istersiniz?",
  },
  'vi-VN': {
    greeting: "Xin chào! Tôi là SAM, trợ lý bảo mật của bạn. Hôm nay tôi có thể giúp gì cho bạn?",
    howAreYou: (p) => `Tất cả hệ thống hoạt động bình thường. Đang giám sát ${p.deviceCount} thiết bị với ${p.threatCount} mối đe dọa được theo dõi.`,
    introduction: (p) => `Tôi là SAM - AI Bảo mật và Giám sát. Tôi đang bảo vệ ${p.deviceCount} thiết bị và đã chặn ${p.blockedCount} mối đe dọa.`,
    thanks: "Không có gì! Tôi ở đây để giữ an toàn cho mạng của bạn.",
    capabilities: "Tôi có thể giám sát thiết bị, phát hiện mối đe dọa, phân tích lỗ hổng và trả lời câu hỏi về bảo mật.",
    statusGood: (p) => `Mạng của bạn an toàn. ${p.deviceCount} thiết bị được bảo vệ, ${p.blockedCount} mối đe dọa bị chặn.`,
    statusWarning: (p) => `Cần chú ý: phát hiện ${p.threatCount} mối đe dọa đang hoạt động. ${p.alertCount} cảnh báo chưa đọc.`,
    statusCritical: (p) => `Cảnh báo nghiêm trọng: ${p.criticalCount} mối đe dọa nghiêm trọng cần hành động ngay!`,
    commandExecuted: (p) => `Đang mở ${p.targetPage}...`,
    helpMessage: "Thử: 'Đến Bảng điều khiển', 'Quét thiết bị', 'Hiển thị mối đe dọa', hoặc 'Tạo mật khẩu'",
    defaultResponse: "Tôi có thể giúp về câu hỏi bảo mật, giám sát thiết bị và phân tích mối đe dọa. Bạn muốn biết gì?",
  },
};

const languageFallbacks: Record<string, string> = {
  'en-GB': 'en-US',
  'en-AU': 'en-US',
  'es-MX': 'es-ES',
  'pt-PT': 'pt-BR',
  'zh-TW': 'zh-CN',
  'fr-CA': 'fr-FR',
};

export function getTranslation(
  lang: string,
  key: TranslationKey,
  params: TranslationParams = {}
): string {
  const resolvedLang = languageFallbacks[lang] || lang;
  const langTranslations = translations[resolvedLang] || translations['en-US'];
  const translation = langTranslations[key] || translations['en-US'][key];
  
  if (typeof translation === 'function') {
    return translation(params);
  }
  return translation || translations['en-US'][key] as string;
}

export function getSupportedLanguageCodes(): string[] {
  return Object.keys(translations);
}
