import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { deviceScanner } from '../lib/device-scanner';
import { scanForVulnerabilities } from '../lib/vulnerability-service';
import { soarService } from '../lib/soar-service';

interface CommandResult {
  type: 'navigation' | 'action' | 'info' | 'unknown';
  success: boolean;
  message: string;
  target?: string;
}

interface NavigationTarget {
  path: string;
  label: string;
  keywords: Record<string, string[]>;
}

const NAVIGATION_TARGETS: NavigationTarget[] = [
  { 
    path: '/', 
    label: 'Dashboard', 
    keywords: {
      'en': ['dashboard', 'home', 'main', 'overview', 'start'],
      'es': ['panel', 'inicio', 'principal', 'resumen', 'tablero'],
      'fr': ['tableau de bord', 'accueil', 'principal', 'aperçu'],
      'de': ['dashboard', 'startseite', 'übersicht', 'hauptseite'],
      'zh': ['仪表板', '首页', '主页', '概览', '控制台'],
      'ja': ['ダッシュボード', 'ホーム', 'メイン', '概要'],
      'ko': ['대시보드', '홈', '메인', '개요'],
      'pt': ['painel', 'início', 'principal', 'visão geral'],
      'ru': ['панель', 'главная', 'обзор', 'начало'],
      'ar': ['لوحة التحكم', 'الرئيسية', 'نظرة عامة'],
      'hi': ['डैशबोर्ड', 'होम', 'मुख्य', 'अवलोकन'],
      'it': ['pannello', 'home', 'principale', 'panoramica'],
      'nl': ['dashboard', 'home', 'overzicht', 'hoofdpagina'],
      'pl': ['panel', 'strona główna', 'przegląd'],
      'tr': ['pano', 'ana sayfa', 'genel bakış'],
      'vi': ['bảng điều khiển', 'trang chủ', 'tổng quan'],
    }
  },
  { 
    path: '/devices', 
    label: 'Devices', 
    keywords: {
      'en': ['devices', 'device', 'computers', 'hardware', 'endpoints', 'scan devices'],
      'es': ['dispositivos', 'dispositivo', 'computadoras', 'hardware', 'escanear dispositivos'],
      'fr': ['appareils', 'appareil', 'ordinateurs', 'matériel', 'scanner appareils'],
      'de': ['geräte', 'gerät', 'computer', 'hardware', 'geräte scannen'],
      'zh': ['设备', '电脑', '硬件', '扫描设备', '终端'],
      'ja': ['デバイス', 'コンピュータ', 'ハードウェア', 'デバイスをスキャン'],
      'ko': ['장치', '디바이스', '컴퓨터', '하드웨어', '장치 스캔'],
      'pt': ['dispositivos', 'dispositivo', 'computadores', 'hardware', 'escanear dispositivos'],
      'ru': ['устройства', 'устройство', 'компьютеры', 'оборудование', 'сканировать устройства'],
      'ar': ['الأجهزة', 'جهاز', 'أجهزة الكمبيوتر', 'فحص الأجهزة'],
      'hi': ['उपकरण', 'डिवाइस', 'कंप्यूटर', 'हार्डवेयर', 'उपकरण स्कैन करें'],
      'it': ['dispositivi', 'dispositivo', 'computer', 'hardware', 'scansiona dispositivi'],
      'nl': ['apparaten', 'apparaat', 'computers', 'hardware', 'scan apparaten'],
      'pl': ['urządzenia', 'urządzenie', 'komputery', 'sprzęt', 'skanuj urządzenia'],
      'tr': ['cihazlar', 'cihaz', 'bilgisayarlar', 'donanım', 'cihazları tara'],
      'vi': ['thiết bị', 'máy tính', 'phần cứng', 'quét thiết bị'],
    }
  },
  { 
    path: '/network-monitor', 
    label: 'Network Monitor', 
    keywords: {
      'en': ['network', 'monitor', 'traffic', 'bandwidth', 'network monitor', 'scan network'],
      'es': ['red', 'monitor', 'tráfico', 'ancho de banda', 'monitor de red', 'escanear red'],
      'fr': ['réseau', 'moniteur', 'trafic', 'bande passante', 'moniteur réseau', 'scanner réseau'],
      'de': ['netzwerk', 'monitor', 'verkehr', 'bandbreite', 'netzwerk überwachen', 'netzwerk scannen'],
      'zh': ['网络', '监控', '流量', '带宽', '网络监控', '扫描网络'],
      'ja': ['ネットワーク', 'モニター', 'トラフィック', '帯域幅', 'ネットワーク監視'],
      'ko': ['네트워크', '모니터', '트래픽', '대역폭', '네트워크 모니터', '네트워크 스캔'],
      'pt': ['rede', 'monitor', 'tráfego', 'largura de banda', 'monitor de rede', 'escanear rede'],
      'ru': ['сеть', 'монитор', 'трафик', 'пропускная способность', 'сканировать сеть'],
      'ar': ['الشبكة', 'المراقبة', 'حركة المرور', 'عرض النطاق', 'فحص الشبكة'],
      'hi': ['नेटवर्क', 'मॉनिटर', 'ट्रैफ़िक', 'बैंडविड्थ', 'नेटवर्क स्कैन करें'],
      'it': ['rete', 'monitor', 'traffico', 'larghezza di banda', 'monitora rete', 'scansiona rete'],
      'nl': ['netwerk', 'monitor', 'verkeer', 'bandbreedte', 'netwerk monitor', 'scan netwerk'],
      'pl': ['sieć', 'monitor', 'ruch', 'przepustowość', 'skanuj sieć'],
      'tr': ['ağ', 'izleme', 'trafik', 'bant genişliği', 'ağı tara'],
      'vi': ['mạng', 'giám sát', 'lưu lượng', 'băng thông', 'quét mạng'],
    }
  },
  { 
    path: '/threats', 
    label: 'Threats', 
    keywords: {
      'en': ['threats', 'threat', 'danger', 'risks', 'attacks', 'show threats', 'active threats'],
      'es': ['amenazas', 'amenaza', 'peligro', 'riesgos', 'ataques', 'mostrar amenazas'],
      'fr': ['menaces', 'menace', 'danger', 'risques', 'attaques', 'afficher menaces'],
      'de': ['bedrohungen', 'bedrohung', 'gefahr', 'risiken', 'angriffe', 'bedrohungen anzeigen'],
      'zh': ['威胁', '危险', '风险', '攻击', '显示威胁', '查看威胁'],
      'ja': ['脅威', '危険', 'リスク', '攻撃', '脅威を表示', '脅威を見る'],
      'ko': ['위협', '위험', '리스크', '공격', '위협 표시', '위협 보기'],
      'pt': ['ameaças', 'ameaça', 'perigo', 'riscos', 'ataques', 'mostrar ameaças'],
      'ru': ['угрозы', 'угроза', 'опасность', 'риски', 'атаки', 'показать угрозы'],
      'ar': ['التهديدات', 'تهديد', 'خطر', 'مخاطر', 'هجمات', 'إظهار التهديدات'],
      'hi': ['खतरे', 'खतरा', 'जोखिम', 'हमले', 'खतरे दिखाएं'],
      'it': ['minacce', 'minaccia', 'pericolo', 'rischi', 'attacchi', 'mostra minacce'],
      'nl': ['bedreigingen', 'bedreiging', 'gevaar', 'risicos', 'aanvallen', 'toon bedreigingen'],
      'pl': ['zagrożenia', 'zagrożenie', 'niebezpieczeństwo', 'ryzyko', 'ataki', 'pokaż zagrożenia'],
      'tr': ['tehditler', 'tehdit', 'tehlike', 'riskler', 'saldırılar', 'tehditleri göster'],
      'vi': ['mối đe dọa', 'nguy hiểm', 'rủi ro', 'tấn công', 'hiển thị mối đe dọa'],
    }
  },
  { 
    path: '/vulnerabilities', 
    label: 'Vulnerabilities', 
    keywords: {
      'en': ['vulnerabilities', 'vulnerability', 'weaknesses', 'flaws', 'check vulnerabilities', 'scan vulnerabilities'],
      'es': ['vulnerabilidades', 'vulnerabilidad', 'debilidades', 'fallas', 'comprobar vulnerabilidades'],
      'fr': ['vulnérabilités', 'vulnérabilité', 'faiblesses', 'failles', 'vérifier vulnérabilités'],
      'de': ['schwachstellen', 'schwachstelle', 'verwundbarkeiten', 'schwächen', 'schwachstellen prüfen'],
      'zh': ['漏洞', '弱点', '缺陷', '检查漏洞', '扫描漏洞'],
      'ja': ['脆弱性', '弱点', '欠陥', '脆弱性をチェック', '脆弱性スキャン'],
      'ko': ['취약점', '약점', '결함', '취약점 확인', '취약점 스캔'],
      'pt': ['vulnerabilidades', 'vulnerabilidade', 'fraquezas', 'falhas', 'verificar vulnerabilidades'],
      'ru': ['уязвимости', 'уязвимость', 'слабости', 'недостатки', 'проверить уязвимости'],
      'ar': ['الثغرات', 'ثغرة', 'نقاط الضعف', 'عيوب', 'فحص الثغرات'],
      'hi': ['कमजोरियां', 'भेद्यता', 'कमजोरी', 'खामियां', 'कमजोरियां जांचें'],
      'it': ['vulnerabilità', 'debolezze', 'difetti', 'controlla vulnerabilità'],
      'nl': ['kwetsbaarheden', 'kwetsbaarheid', 'zwakke punten', 'gebreken', 'controleer kwetsbaarheden'],
      'pl': ['podatności', 'podatność', 'słabości', 'wady', 'sprawdź podatności'],
      'tr': ['güvenlik açıkları', 'zafiyet', 'zayıflıklar', 'kusurlar', 'açıkları kontrol et'],
      'vi': ['lỗ hổng', 'điểm yếu', 'khiếm khuyết', 'kiểm tra lỗ hổng'],
    }
  },
  { 
    path: '/alerts', 
    label: 'Alerts', 
    keywords: {
      'en': ['alerts', 'alert', 'notifications', 'warnings', 'show alerts', 'my alerts'],
      'es': ['alertas', 'alerta', 'notificaciones', 'advertencias', 'mostrar alertas', 'mis alertas'],
      'fr': ['alertes', 'alerte', 'notifications', 'avertissements', 'afficher alertes', 'mes alertes'],
      'de': ['warnungen', 'warnung', 'benachrichtigungen', 'meldungen', 'warnungen anzeigen'],
      'zh': ['警报', '警告', '通知', '提醒', '显示警报', '我的警报'],
      'ja': ['アラート', '警告', '通知', 'アラートを表示', '私のアラート'],
      'ko': ['알림', '경고', '통지', '알림 표시', '내 알림'],
      'pt': ['alertas', 'alerta', 'notificações', 'avisos', 'mostrar alertas', 'meus alertas'],
      'ru': ['оповещения', 'оповещение', 'уведомления', 'предупреждения', 'показать оповещения'],
      'ar': ['التنبيهات', 'تنبيه', 'إشعارات', 'تحذيرات', 'إظهار التنبيهات'],
      'hi': ['अलर्ट', 'सूचनाएं', 'चेतावनियां', 'अलर्ट दिखाएं', 'मेरे अलर्ट'],
      'it': ['avvisi', 'avviso', 'notifiche', 'mostra avvisi', 'i miei avvisi'],
      'nl': ['waarschuwingen', 'waarschuwing', 'meldingen', 'toon waarschuwingen'],
      'pl': ['alerty', 'alert', 'powiadomienia', 'ostrzeżenia', 'pokaż alerty'],
      'tr': ['uyarılar', 'uyarı', 'bildirimler', 'uyarıları göster'],
      'vi': ['cảnh báo', 'thông báo', 'hiển thị cảnh báo'],
    }
  },
  { 
    path: '/ai-assistant', 
    label: 'SAM AI Assistant', 
    keywords: {
      'en': ['sam', 'assistant', 'ai', 'chat', 'ai assistant'],
      'es': ['sam', 'asistente', 'ia', 'chat', 'asistente ia'],
      'fr': ['sam', 'assistant', 'ia', 'chat', 'assistant ia'],
      'de': ['sam', 'assistent', 'ki', 'chat', 'ki assistent'],
      'zh': ['sam', '助手', 'ai', '聊天', 'ai助手', '人工智能'],
      'ja': ['sam', 'アシスタント', 'ai', 'チャット', 'aiアシスタント'],
      'ko': ['sam', '어시스턴트', 'ai', '채팅', 'ai 어시스턴트'],
      'pt': ['sam', 'assistente', 'ia', 'chat', 'assistente ia'],
      'ru': ['sam', 'ассистент', 'ии', 'чат', 'ии ассистент'],
      'ar': ['sam', 'مساعد', 'ذكاء اصطناعي', 'دردشة'],
      'hi': ['sam', 'सहायक', 'ai', 'चैट', 'ai सहायक'],
      'it': ['sam', 'assistente', 'ia', 'chat', 'assistente ia'],
      'nl': ['sam', 'assistent', 'ai', 'chat', 'ai assistent'],
      'pl': ['sam', 'asystent', 'ai', 'czat', 'asystent ai'],
      'tr': ['sam', 'asistan', 'yapay zeka', 'sohbet'],
      'vi': ['sam', 'trợ lý', 'ai', 'trò chuyện', 'trợ lý ai'],
    }
  },
  { 
    path: '/soar', 
    label: 'SOAR Platform', 
    keywords: {
      'en': ['soar', 'automation', 'orchestration', 'response', 'soar platform'],
      'es': ['soar', 'automatización', 'orquestación', 'respuesta'],
      'fr': ['soar', 'automatisation', 'orchestration', 'réponse'],
      'de': ['soar', 'automatisierung', 'orchestrierung', 'reaktion'],
      'zh': ['soar', '自动化', '编排', '响应', '自动响应'],
      'ja': ['soar', 'オートメーション', 'オーケストレーション', 'レスポンス'],
      'ko': ['soar', '자동화', '오케스트레이션', '대응'],
      'pt': ['soar', 'automação', 'orquestração', 'resposta'],
      'ru': ['soar', 'автоматизация', 'оркестрация', 'реагирование'],
      'ar': ['soar', 'أتمتة', 'تنسيق', 'استجابة'],
      'hi': ['soar', 'स्वचालन', 'ऑर्केस्ट्रेशन', 'प्रतिक्रिया'],
      'it': ['soar', 'automazione', 'orchestrazione', 'risposta'],
      'nl': ['soar', 'automatisering', 'orkestratie', 'respons'],
      'pl': ['soar', 'automatyzacja', 'orkiestracja', 'odpowiedź'],
      'tr': ['soar', 'otomasyon', 'orkestrasyon', 'yanıt'],
      'vi': ['soar', 'tự động hóa', 'điều phối', 'phản hồi'],
    }
  },
  { 
    path: '/forensics', 
    label: 'Digital Forensics', 
    keywords: {
      'en': ['forensics', 'investigation', 'evidence', 'analyze', 'digital forensics'],
      'es': ['forense', 'investigación', 'evidencia', 'analizar', 'forense digital'],
      'fr': ['forensique', 'enquête', 'preuve', 'analyser', 'forensique numérique'],
      'de': ['forensik', 'untersuchung', 'beweise', 'analysieren', 'digitale forensik'],
      'zh': ['取证', '调查', '证据', '分析', '数字取证'],
      'ja': ['フォレンジック', '調査', '証拠', '分析', 'デジタルフォレンジック'],
      'ko': ['포렌식', '조사', '증거', '분석', '디지털 포렌식'],
      'pt': ['forense', 'investigação', 'evidência', 'analisar', 'forense digital'],
      'ru': ['форензика', 'расследование', 'улики', 'анализировать', 'цифровая форензика'],
      'ar': ['الطب الشرعي', 'تحقيق', 'أدلة', 'تحليل'],
      'hi': ['फोरेंसिक', 'जांच', 'सबूत', 'विश्लेषण', 'डिजिटल फोरेंसिक'],
      'it': ['forense', 'indagine', 'prove', 'analizzare', 'forense digitale'],
      'nl': ['forensisch', 'onderzoek', 'bewijs', 'analyseren', 'digitaal forensisch'],
      'pl': ['kryminalistyka', 'śledztwo', 'dowody', 'analizować'],
      'tr': ['adli bilişim', 'soruşturma', 'kanıt', 'analiz'],
      'vi': ['điều tra số', 'điều tra', 'bằng chứng', 'phân tích'],
    }
  },
  { 
    path: '/pentest', 
    label: 'Penetration Testing', 
    keywords: {
      'en': ['pentest', 'penetration', 'testing', 'security test', 'penetration testing'],
      'es': ['pentest', 'penetración', 'pruebas', 'prueba de seguridad'],
      'fr': ['pentest', 'pénétration', 'test', 'test de sécurité'],
      'de': ['pentest', 'penetration', 'tests', 'sicherheitstest'],
      'zh': ['渗透', '渗透测试', '安全测试', '测试'],
      'ja': ['ペンテスト', 'ペネトレーション', 'テスト', 'セキュリティテスト'],
      'ko': ['펜테스트', '침투', '테스트', '보안 테스트'],
      'pt': ['pentest', 'penetração', 'testes', 'teste de segurança'],
      'ru': ['пентест', 'проникновение', 'тестирование', 'тест безопасности'],
      'ar': ['اختبار اختراق', 'اختراق', 'اختبار', 'اختبار أمني'],
      'hi': ['पेंटेस्ट', 'पेनेट्रेशन', 'परीक्षण', 'सुरक्षा परीक्षण'],
      'it': ['pentest', 'penetrazione', 'test', 'test di sicurezza'],
      'nl': ['pentest', 'penetratie', 'testen', 'beveiligingstest'],
      'pl': ['pentest', 'penetracja', 'testy', 'test bezpieczeństwa'],
      'tr': ['sızma testi', 'penetrasyon', 'test', 'güvenlik testi'],
      'vi': ['kiểm tra xâm nhập', 'xâm nhập', 'kiểm tra', 'kiểm tra bảo mật'],
    }
  },
  { 
    path: '/compliance', 
    label: 'Compliance', 
    keywords: {
      'en': ['compliance', 'regulations', 'standards', 'gdpr', 'hipaa', 'check compliance'],
      'es': ['cumplimiento', 'regulaciones', 'estándares', 'gdpr', 'verificar cumplimiento'],
      'fr': ['conformité', 'réglementations', 'normes', 'rgpd', 'vérifier conformité'],
      'de': ['compliance', 'vorschriften', 'standards', 'dsgvo', 'compliance prüfen'],
      'zh': ['合规', '法规', '标准', 'gdpr', '检查合规'],
      'ja': ['コンプライアンス', '規制', '基準', 'gdpr', 'コンプライアンスチェック'],
      'ko': ['규정 준수', '규정', '표준', 'gdpr', '규정 준수 확인'],
      'pt': ['conformidade', 'regulamentos', 'padrões', 'gdpr', 'verificar conformidade'],
      'ru': ['соответствие', 'правила', 'стандарты', 'gdpr', 'проверить соответствие'],
      'ar': ['الامتثال', 'اللوائح', 'المعايير', 'gdpr', 'تحقق من الامتثال'],
      'hi': ['अनुपालन', 'नियम', 'मानक', 'gdpr', 'अनुपालन जांचें'],
      'it': ['conformità', 'regolamenti', 'standard', 'gdpr', 'verifica conformità'],
      'nl': ['compliance', 'regelgeving', 'standaarden', 'avg', 'controleer compliance'],
      'pl': ['zgodność', 'przepisy', 'standardy', 'rodo', 'sprawdź zgodność'],
      'tr': ['uyum', 'düzenlemeler', 'standartlar', 'gdpr', 'uyumu kontrol et'],
      'vi': ['tuân thủ', 'quy định', 'tiêu chuẩn', 'gdpr', 'kiểm tra tuân thủ'],
    }
  },
  { 
    path: '/policies', 
    label: 'Policies', 
    keywords: {
      'en': ['policies', 'policy', 'rules', 'guidelines'],
      'es': ['políticas', 'política', 'reglas', 'directrices'],
      'fr': ['politiques', 'politique', 'règles', 'directives'],
      'de': ['richtlinien', 'richtlinie', 'regeln', 'leitlinien'],
      'zh': ['策略', '政策', '规则', '指南'],
      'ja': ['ポリシー', 'ルール', 'ガイドライン'],
      'ko': ['정책', '규칙', '지침'],
      'pt': ['políticas', 'política', 'regras', 'diretrizes'],
      'ru': ['политики', 'политика', 'правила', 'руководства'],
      'ar': ['السياسات', 'سياسة', 'قواعد', 'إرشادات'],
      'hi': ['नीतियां', 'नीति', 'नियम', 'दिशानिर्देश'],
      'it': ['politiche', 'politica', 'regole', 'linee guida'],
      'nl': ['beleid', 'regels', 'richtlijnen'],
      'pl': ['polityki', 'polityka', 'zasady', 'wytyczne'],
      'tr': ['politikalar', 'politika', 'kurallar', 'yönergeler'],
      'vi': ['chính sách', 'quy tắc', 'hướng dẫn'],
    }
  },
  { 
    path: '/risk-assessment', 
    label: 'Risk Assessment', 
    keywords: {
      'en': ['risk', 'assessment', 'evaluate', 'analysis', 'risk assessment', 'assess risk'],
      'es': ['riesgo', 'evaluación', 'evaluar', 'análisis', 'evaluación de riesgos'],
      'fr': ['risque', 'évaluation', 'évaluer', 'analyse', 'évaluation des risques'],
      'de': ['risiko', 'bewertung', 'bewerten', 'analyse', 'risikobewertung'],
      'zh': ['风险', '评估', '分析', '风险评估'],
      'ja': ['リスク', '評価', '分析', 'リスク評価'],
      'ko': ['위험', '평가', '분석', '위험 평가'],
      'pt': ['risco', 'avaliação', 'avaliar', 'análise', 'avaliação de riscos'],
      'ru': ['риск', 'оценка', 'анализ', 'оценка рисков'],
      'ar': ['المخاطر', 'تقييم', 'تحليل', 'تقييم المخاطر'],
      'hi': ['जोखिम', 'मूल्यांकन', 'विश्लेषण', 'जोखिम मूल्यांकन'],
      'it': ['rischio', 'valutazione', 'analisi', 'valutazione del rischio'],
      'nl': ['risico', 'beoordeling', 'analyse', 'risicobeoordeling'],
      'pl': ['ryzyko', 'ocena', 'analiza', 'ocena ryzyka'],
      'tr': ['risk', 'değerlendirme', 'analiz', 'risk değerlendirmesi'],
      'vi': ['rủi ro', 'đánh giá', 'phân tích', 'đánh giá rủi ro'],
    }
  },
  { 
    path: '/training', 
    label: 'Security Training', 
    keywords: {
      'en': ['training', 'learn', 'education', 'courses', 'start training', 'security training'],
      'es': ['entrenamiento', 'aprender', 'educación', 'cursos', 'iniciar entrenamiento'],
      'fr': ['formation', 'apprendre', 'éducation', 'cours', 'commencer formation'],
      'de': ['training', 'lernen', 'bildung', 'kurse', 'training starten'],
      'zh': ['培训', '学习', '教育', '课程', '开始培训'],
      'ja': ['トレーニング', '学習', '教育', 'コース', 'トレーニング開始'],
      'ko': ['훈련', '학습', '교육', '코스', '훈련 시작'],
      'pt': ['treinamento', 'aprender', 'educação', 'cursos', 'iniciar treinamento'],
      'ru': ['обучение', 'учиться', 'образование', 'курсы', 'начать обучение'],
      'ar': ['التدريب', 'تعلم', 'تعليم', 'دورات', 'بدء التدريب'],
      'hi': ['प्रशिक्षण', 'सीखें', 'शिक्षा', 'पाठ्यक्रम', 'प्रशिक्षण शुरू करें'],
      'it': ['formazione', 'imparare', 'educazione', 'corsi', 'inizia formazione'],
      'nl': ['training', 'leren', 'onderwijs', 'cursussen', 'start training'],
      'pl': ['szkolenie', 'uczyć się', 'edukacja', 'kursy', 'rozpocznij szkolenie'],
      'tr': ['eğitim', 'öğren', 'kurslar', 'eğitim başlat'],
      'vi': ['đào tạo', 'học', 'giáo dục', 'khóa học', 'bắt đầu đào tạo'],
    }
  },
  { 
    path: '/password-tools', 
    label: 'Password Tools', 
    keywords: {
      'en': ['password', 'passwords', 'generator', 'encrypt', 'generate password', 'password tools'],
      'es': ['contraseña', 'contraseñas', 'generador', 'encriptar', 'generar contraseña'],
      'fr': ['mot de passe', 'mots de passe', 'générateur', 'chiffrer', 'générer mot de passe'],
      'de': ['passwort', 'passwörter', 'generator', 'verschlüsseln', 'passwort generieren'],
      'zh': ['密码', '生成器', '加密', '生成密码', '密码工具'],
      'ja': ['パスワード', 'ジェネレータ', '暗号化', 'パスワードを生成'],
      'ko': ['비밀번호', '암호', '생성기', '암호화', '비밀번호 생성'],
      'pt': ['senha', 'senhas', 'gerador', 'criptografar', 'gerar senha'],
      'ru': ['пароль', 'пароли', 'генератор', 'зашифровать', 'создать пароль'],
      'ar': ['كلمة المرور', 'كلمات المرور', 'مولد', 'تشفير', 'إنشاء كلمة مرور'],
      'hi': ['पासवर्ड', 'जनरेटर', 'एन्क्रिप्ट', 'पासवर्ड बनाएं'],
      'it': ['password', 'generatore', 'crittografare', 'genera password'],
      'nl': ['wachtwoord', 'wachtwoorden', 'generator', 'versleutelen', 'genereer wachtwoord'],
      'pl': ['hasło', 'hasła', 'generator', 'szyfrować', 'wygeneruj hasło'],
      'tr': ['şifre', 'parolalar', 'jeneratör', 'şifrele', 'şifre oluştur'],
      'vi': ['mật khẩu', 'trình tạo', 'mã hóa', 'tạo mật khẩu'],
    }
  },
  { 
    path: '/wifi-scanner', 
    label: 'WiFi Scanner', 
    keywords: {
      'en': ['wifi', 'wireless', 'scanner', 'networks', 'wifi scan', 'scan wifi'],
      'es': ['wifi', 'inalámbrico', 'escáner', 'redes', 'escanear wifi'],
      'fr': ['wifi', 'sans fil', 'scanner', 'réseaux', 'scanner wifi'],
      'de': ['wlan', 'wifi', 'drahtlos', 'scanner', 'netzwerke', 'wlan scannen'],
      'zh': ['wifi', '无线', '扫描器', '网络', '扫描wifi'],
      'ja': ['wifi', 'ワイヤレス', 'スキャナー', 'ネットワーク', 'wifiスキャン'],
      'ko': ['와이파이', '무선', '스캐너', '네트워크', 'wifi 스캔'],
      'pt': ['wifi', 'sem fio', 'scanner', 'redes', 'escanear wifi'],
      'ru': ['wifi', 'беспроводной', 'сканер', 'сети', 'сканировать wifi'],
      'ar': ['واي فاي', 'لاسلكي', 'ماسح', 'شبكات', 'فحص واي فاي'],
      'hi': ['वाईफाई', 'वायरलेस', 'स्कैनर', 'नेटवर्क', 'वाईफाई स्कैन करें'],
      'it': ['wifi', 'wireless', 'scanner', 'reti', 'scansiona wifi'],
      'nl': ['wifi', 'draadloos', 'scanner', 'netwerken', 'scan wifi'],
      'pl': ['wifi', 'bezprzewodowy', 'skaner', 'sieci', 'skanuj wifi'],
      'tr': ['wifi', 'kablosuz', 'tarayıcı', 'ağlar', 'wifi tara'],
      'vi': ['wifi', 'không dây', 'máy quét', 'mạng', 'quét wifi'],
    }
  },
  { 
    path: '/zero-trust', 
    label: 'Zero Trust', 
    keywords: {
      'en': ['zero trust', 'zero-trust', 'trust', 'trust architecture'],
      'es': ['confianza cero', 'zero trust', 'arquitectura de confianza'],
      'fr': ['zéro confiance', 'zero trust', 'architecture de confiance'],
      'de': ['zero trust', 'null vertrauen', 'vertrauensarchitektur'],
      'zh': ['零信任', '信任架构', 'zero trust'],
      'ja': ['ゼロトラスト', 'トラスト', 'トラストアーキテクチャ'],
      'ko': ['제로 트러스트', '신뢰', '트러스트 아키텍처'],
      'pt': ['confiança zero', 'zero trust', 'arquitetura de confiança'],
      'ru': ['нулевое доверие', 'zero trust', 'архитектура доверия'],
      'ar': ['الثقة الصفرية', 'zero trust', 'هندسة الثقة'],
      'hi': ['जीरो ट्रस्ट', 'ट्रस्ट आर्किटेक्चर'],
      'it': ['zero trust', 'fiducia zero', 'architettura di fiducia'],
      'nl': ['zero trust', 'nul vertrouwen', 'vertrouwensarchitectuur'],
      'pl': ['zero trust', 'zerowe zaufanie', 'architektura zaufania'],
      'tr': ['sıfır güven', 'zero trust', 'güven mimarisi'],
      'vi': ['zero trust', 'không tin cậy', 'kiến trúc tin cậy'],
    }
  },
  { 
    path: '/asset-inventory', 
    label: 'Asset Inventory', 
    keywords: {
      'en': ['assets', 'inventory', 'catalog', 'asset inventory', 'view assets'],
      'es': ['activos', 'inventario', 'catálogo', 'inventario de activos', 'ver activos'],
      'fr': ['actifs', 'inventaire', 'catalogue', 'inventaire des actifs', 'voir actifs'],
      'de': ['vermögenswerte', 'inventar', 'katalog', 'anlagenübersicht', 'anlagen anzeigen'],
      'zh': ['资产', '库存', '目录', '资产清单', '查看资产'],
      'ja': ['資産', 'インベントリ', 'カタログ', '資産目録', '資産を見る'],
      'ko': ['자산', '인벤토리', '카탈로그', '자산 목록', '자산 보기'],
      'pt': ['ativos', 'inventário', 'catálogo', 'inventário de ativos', 'ver ativos'],
      'ru': ['активы', 'инвентарь', 'каталог', 'инвентаризация активов', 'просмотреть активы'],
      'ar': ['الأصول', 'جرد', 'كتالوج', 'جرد الأصول', 'عرض الأصول'],
      'hi': ['संपत्ति', 'इन्वेंटरी', 'कैटलॉग', 'संपत्ति सूची', 'संपत्ति देखें'],
      'it': ['risorse', 'inventario', 'catalogo', 'inventario risorse', 'visualizza risorse'],
      'nl': ['activa', 'inventaris', 'catalogus', 'activa-inventaris', 'bekijk activa'],
      'pl': ['aktywa', 'inwentarz', 'katalog', 'inwentaryzacja aktywów', 'pokaż aktywa'],
      'tr': ['varlıklar', 'envanter', 'katalog', 'varlık envanteri', 'varlıkları görüntüle'],
      'vi': ['tài sản', 'kiểm kê', 'danh mục', 'kiểm kê tài sản', 'xem tài sản'],
    }
  },
  { 
    path: '/analytics', 
    label: 'Analytics', 
    keywords: {
      'en': ['analytics', 'statistics', 'metrics', 'data', 'view analytics', 'show analytics'],
      'es': ['analíticas', 'estadísticas', 'métricas', 'datos', 'ver analíticas'],
      'fr': ['analytique', 'statistiques', 'métriques', 'données', 'voir analytique'],
      'de': ['analytik', 'statistiken', 'metriken', 'daten', 'analytik anzeigen'],
      'zh': ['分析', '统计', '指标', '数据', '查看分析'],
      'ja': ['アナリティクス', '統計', 'メトリクス', 'データ', 'アナリティクスを見る'],
      'ko': ['분석', '통계', '지표', '데이터', '분석 보기'],
      'pt': ['análises', 'estatísticas', 'métricas', 'dados', 'ver análises'],
      'ru': ['аналитика', 'статистика', 'метрики', 'данные', 'посмотреть аналитику'],
      'ar': ['التحليلات', 'إحصائيات', 'مقاييس', 'بيانات', 'عرض التحليلات'],
      'hi': ['एनालिटिक्स', 'सांख्यिकी', 'मेट्रिक्स', 'डेटा', 'एनालिटिक्स देखें'],
      'it': ['analisi', 'statistiche', 'metriche', 'dati', 'mostra analisi'],
      'nl': ['analyse', 'statistieken', 'metrics', 'data', 'bekijk analyse'],
      'pl': ['analityka', 'statystyki', 'metryki', 'dane', 'pokaż analitykę'],
      'tr': ['analitik', 'istatistikler', 'metrikler', 'veri', 'analitiği göster'],
      'vi': ['phân tích', 'thống kê', 'chỉ số', 'dữ liệu', 'xem phân tích'],
    }
  },
  { 
    path: '/reports', 
    label: 'Reports', 
    keywords: {
      'en': ['reports', 'report', 'summary', 'export', 'run report', 'generate report'],
      'es': ['informes', 'informe', 'resumen', 'exportar', 'generar informe'],
      'fr': ['rapports', 'rapport', 'résumé', 'exporter', 'générer rapport'],
      'de': ['berichte', 'bericht', 'zusammenfassung', 'exportieren', 'bericht erstellen'],
      'zh': ['报告', '报表', '总结', '导出', '生成报告'],
      'ja': ['レポート', '報告', '要約', 'エクスポート', 'レポート生成'],
      'ko': ['보고서', '리포트', '요약', '내보내기', '보고서 생성'],
      'pt': ['relatórios', 'relatório', 'resumo', 'exportar', 'gerar relatório'],
      'ru': ['отчеты', 'отчет', 'сводка', 'экспорт', 'создать отчет'],
      'ar': ['التقارير', 'تقرير', 'ملخص', 'تصدير', 'إنشاء تقرير'],
      'hi': ['रिपोर्ट', 'सारांश', 'निर्यात', 'रिपोर्ट बनाएं'],
      'it': ['rapporti', 'rapporto', 'riepilogo', 'esporta', 'genera rapporto'],
      'nl': ['rapporten', 'rapport', 'samenvatting', 'exporteren', 'genereer rapport'],
      'pl': ['raporty', 'raport', 'podsumowanie', 'eksport', 'generuj raport'],
      'tr': ['raporlar', 'rapor', 'özet', 'dışa aktar', 'rapor oluştur'],
      'vi': ['báo cáo', 'tóm tắt', 'xuất', 'tạo báo cáo'],
    }
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    keywords: {
      'en': ['settings', 'preferences', 'configuration', 'options'],
      'es': ['configuración', 'preferencias', 'ajustes', 'opciones'],
      'fr': ['paramètres', 'préférences', 'configuration', 'options'],
      'de': ['einstellungen', 'präferenzen', 'konfiguration', 'optionen'],
      'zh': ['设置', '偏好', '配置', '选项'],
      'ja': ['設定', 'プリファレンス', '構成', 'オプション'],
      'ko': ['설정', '환경설정', '구성', '옵션'],
      'pt': ['configurações', 'preferências', 'opções'],
      'ru': ['настройки', 'предпочтения', 'конфигурация', 'опции'],
      'ar': ['الإعدادات', 'التفضيلات', 'التكوين', 'الخيارات'],
      'hi': ['सेटिंग्स', 'प्राथमिकताएं', 'कॉन्फ़िगरेशन', 'विकल्प'],
      'it': ['impostazioni', 'preferenze', 'configurazione', 'opzioni'],
      'nl': ['instellingen', 'voorkeuren', 'configuratie', 'opties'],
      'pl': ['ustawienia', 'preferencje', 'konfiguracja', 'opcje'],
      'tr': ['ayarlar', 'tercihler', 'yapılandırma', 'seçenekler'],
      'vi': ['cài đặt', 'tùy chọn', 'cấu hình'],
    }
  },
  { 
    path: '/help', 
    label: 'Help Center', 
    keywords: {
      'en': ['help', 'support', 'faq', 'documentation'],
      'es': ['ayuda', 'soporte', 'preguntas frecuentes', 'documentación'],
      'fr': ['aide', 'support', 'faq', 'documentation'],
      'de': ['hilfe', 'support', 'faq', 'dokumentation'],
      'zh': ['帮助', '支持', '常见问题', '文档'],
      'ja': ['ヘルプ', 'サポート', 'よくある質問', 'ドキュメント'],
      'ko': ['도움말', '지원', 'faq', '문서'],
      'pt': ['ajuda', 'suporte', 'perguntas frequentes', 'documentação'],
      'ru': ['помощь', 'поддержка', 'чзв', 'документация'],
      'ar': ['مساعدة', 'دعم', 'أسئلة شائعة', 'توثيق'],
      'hi': ['मदद', 'सहायता', 'अक्सर पूछे जाने वाले प्रश्न', 'दस्तावेज़ीकरण'],
      'it': ['aiuto', 'supporto', 'faq', 'documentazione'],
      'nl': ['hulp', 'ondersteuning', 'veelgestelde vragen', 'documentatie'],
      'pl': ['pomoc', 'wsparcie', 'faq', 'dokumentacja'],
      'tr': ['yardım', 'destek', 'sss', 'belgeler'],
      'vi': ['trợ giúp', 'hỗ trợ', 'câu hỏi thường gặp', 'tài liệu'],
    }
  },
];

const MULTILANG_NAVIGATION_PHRASES: Record<string, RegExp[]> = {
  'en': [
    /(?:go to|open|show|navigate to|take me to|bring up|display|view)\s+(?:the\s+)?(.+)/i,
    /(?:i want to see|let me see|show me)\s+(?:the\s+)?(.+)/i,
  ],
  'es': [
    /(?:ir a|abrir|mostrar|navegar a|llévame a|ver)\s+(?:el\s+|la\s+)?(.+)/i,
    /(?:quiero ver|muéstrame)\s+(?:el\s+|la\s+)?(.+)/i,
  ],
  'fr': [
    /(?:aller à|ouvrir|afficher|naviguer vers|montrer)\s+(?:le\s+|la\s+|les\s+)?(.+)/i,
    /(?:je veux voir|montre-moi)\s+(?:le\s+|la\s+)?(.+)/i,
  ],
  'de': [
    /(?:gehe zu|öffne|zeige|navigiere zu|zeig mir)\s+(?:das\s+|die\s+|den\s+)?(.+)/i,
    /(?:ich möchte sehen|zeig mir)\s+(?:das\s+|die\s+)?(.+)/i,
  ],
  'zh': [
    /(?:去|打开|显示|前往|跳转到|查看)\s*(.+)/i,
    /(?:我想看|给我看)\s*(.+)/i,
  ],
  'ja': [
    /(?:に行く|開く|表示|移動する)\s*(.+)/i,
    /(.+)(?:を開いて|を見せて|に行って)/i,
  ],
  'ko': [
    /(.+)(?:로 가|열어|보여줘|이동)/i,
    /(?:보여줘|열어)\s*(.+)/i,
  ],
  'pt': [
    /(?:ir para|abrir|mostrar|navegar para|me leve para|ver)\s+(?:o\s+|a\s+)?(.+)/i,
    /(?:quero ver|me mostre)\s+(?:o\s+|a\s+)?(.+)/i,
  ],
  'ru': [
    /(?:перейти|открыть|показать|навигация|покажи)\s+(.+)/i,
    /(?:хочу видеть|покажи мне)\s+(.+)/i,
  ],
  'ar': [
    /(?:اذهب إلى|افتح|اعرض|انتقل إلى)\s+(.+)/i,
  ],
  'hi': [
    /(.+)\s*(?:पर जाएं|खोलें|दिखाएं|देखें)/i,
    /(?:दिखाओ|खोलो)\s*(.+)/i,
  ],
  'it': [
    /(?:vai a|apri|mostra|naviga a|portami a|visualizza)\s+(?:il\s+|la\s+)?(.+)/i,
    /(?:voglio vedere|mostrami)\s+(?:il\s+|la\s+)?(.+)/i,
  ],
  'nl': [
    /(?:ga naar|open|toon|navigeer naar|laat zien)\s+(?:de\s+|het\s+)?(.+)/i,
  ],
  'pl': [
    /(?:idź do|otwórz|pokaż|nawiguj do|przejdź do)\s+(.+)/i,
  ],
  'tr': [
    /(?:git|aç|göster|gözat)\s+(.+)/i,
  ],
  'vi': [
    /(?:đi đến|mở|hiển thị|xem)\s+(.+)/i,
  ],
};

const MULTILANG_COMMAND_PATTERNS: Record<string, RegExp[]> = {
  'en': [
    /^(go to|open|show|navigate|take me|scan|check|run|start|generate|create|find|display|view|help|launch|access)/i,
  ],
  'es': [
    /^(ir a|abrir|mostrar|navegar|llévame|escanear|comprobar|ejecutar|iniciar|generar|crear|buscar|ver|ayuda)/i,
  ],
  'fr': [
    /^(aller|ouvrir|afficher|naviguer|scanner|vérifier|exécuter|démarrer|générer|créer|trouver|aide)/i,
  ],
  'de': [
    /^(gehe|öffne|zeige|navigiere|scannen|prüfen|starten|generieren|erstellen|finden|hilfe)/i,
  ],
  'zh': [
    /^(去|打开|显示|前往|扫描|检查|运行|开始|生成|创建|查找|帮助)/i,
  ],
  'ja': [
    /^(開く|表示|移動|スキャン|チェック|実行|開始|生成|作成|ヘルプ)/i,
  ],
  'ko': [
    /(열어|보여|이동|스캔|확인|실행|시작|생성|만들기|도움말)/i,
  ],
  'pt': [
    /^(ir|abrir|mostrar|navegar|escanear|verificar|executar|iniciar|gerar|criar|ajuda)/i,
  ],
  'ru': [
    /^(перейти|открыть|показать|сканировать|проверить|запустить|создать|помощь)/i,
  ],
  'ar': [
    /^(اذهب|افتح|اعرض|فحص|تشغيل|بدء|إنشاء|مساعدة)/i,
  ],
  'hi': [
    /(जाएं|खोलें|दिखाएं|स्कैन|जांचें|चलाएं|शुरू|बनाएं|मदद)/i,
  ],
  'it': [
    /^(vai|apri|mostra|naviga|scansiona|controlla|esegui|avvia|genera|crea|aiuto)/i,
  ],
  'nl': [
    /^(ga|open|toon|navigeer|scan|controleer|start|genereer|maak|hulp)/i,
  ],
  'pl': [
    /^(idź|otwórz|pokaż|skanuj|sprawdź|uruchom|rozpocznij|generuj|utwórz|pomoc)/i,
  ],
  'tr': [
    /^(git|aç|göster|tara|kontrol|çalıştır|başlat|oluştur|yardım)/i,
  ],
  'vi': [
    /^(đi|mở|hiển thị|quét|kiểm tra|chạy|bắt đầu|tạo|trợ giúp)/i,
  ],
};

export function useVoiceCommands() {
  const navigate = useNavigate();

  const normalizeText = useCallback((text: string): string => {
    return text
      .toLowerCase()
      .replace(/[.,!?;:'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const detectLanguage = useCallback((text: string): string => {
    const normalized = text.toLowerCase();
    
    if (/[\u4e00-\u9fff]/.test(normalized)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(normalized)) return 'ja';
    if (/[\uac00-\ud7af]/.test(normalized)) return 'ko';
    if (/[\u0600-\u06ff]/.test(normalized)) return 'ar';
    if (/[\u0900-\u097f]/.test(normalized)) return 'hi';
    if (/[\u0400-\u04ff]/.test(normalized)) return 'ru';
    if (/[\u1e00-\u1eff]/.test(normalized) || /ñ|¿|¡/.test(normalized)) return 'es';
    if (/ç|œ|æ/.test(normalized)) return 'fr';
    if (/ä|ö|ü|ß/.test(normalized)) return 'de';
    if (/ą|ę|ó|ś|ł|ż|ź|ć|ń/.test(normalized)) return 'pl';
    if (/ş|ğ|ı|ü|ö|ç/.test(normalized)) return 'tr';
    if (/[àảãáạăằẳẵắặâầẩẫấậèẻẽéẹêềểễếệìỉĩíịòỏõóọôồổỗốộơờởỡớợùủũúụưừửữứựỳỷỹýỵđ]/.test(normalized)) return 'vi';
    
    return 'en';
  }, []);

  const findNavigationTarget = useCallback((text: string): NavigationTarget | null => {
    const normalized = normalizeText(text);
    const detectedLang = detectLanguage(text);
    
    const languagesToCheck = [detectedLang, 'en'];
    
    for (const lang of languagesToCheck) {
      const phrases = MULTILANG_NAVIGATION_PHRASES[lang] || MULTILANG_NAVIGATION_PHRASES['en'];
      let targetPhrase = normalized;
      
      for (const pattern of phrases) {
        const match = normalized.match(pattern);
        if (match && match[1]) {
          targetPhrase = match[1].trim();
          break;
        }
      }

      for (const target of NAVIGATION_TARGETS) {
        const keywords = target.keywords[lang] || target.keywords['en'];
        if (keywords) {
          for (const keyword of keywords) {
            if (targetPhrase.includes(keyword.toLowerCase()) || normalized.includes(keyword.toLowerCase())) {
              return target;
            }
          }
        }
      }
    }

    for (const target of NAVIGATION_TARGETS) {
      for (const lang of Object.keys(target.keywords)) {
        const keywords = target.keywords[lang];
        for (const keyword of keywords) {
          if (normalized.includes(keyword.toLowerCase())) {
            return target;
          }
        }
      }
    }

    return null;
  }, [normalizeText, detectLanguage]);

  const executeCommand = useCallback((text: string): CommandResult => {
    const navTarget = findNavigationTarget(text);
    if (navTarget) {
      navigate(navTarget.path);
      return { 
        type: 'navigation', 
        success: true, 
        message: `Opening ${navTarget.label}...`,
        target: navTarget.path 
      };
    }

    const normalized = normalizeText(text);
    const detectedLang = detectLanguage(text);
    
    const helpKeywords: Record<string, string[]> = {
      'en': ['help', 'what can you do', 'commands'],
      'es': ['ayuda', 'qué puedes hacer', 'comandos'],
      'fr': ['aide', 'que peux-tu faire', 'commandes'],
      'de': ['hilfe', 'was kannst du', 'befehle'],
      'zh': ['帮助', '你能做什么', '命令'],
      'ja': ['ヘルプ', '何ができる', 'コマンド'],
      'ko': ['도움말', '뭘 할 수 있어', '명령어'],
      'pt': ['ajuda', 'o que você pode fazer', 'comandos'],
      'ru': ['помощь', 'что ты можешь', 'команды'],
      'hi': ['मदद', 'आप क्या कर सकते हैं', 'कमांड'],
      'ar': ['مساعدة', 'ماذا يمكنك أن تفعل', 'أوامر'],
      'it': ['aiuto', 'cosa puoi fare', 'comandi'],
      'nl': ['hulp', 'wat kun je doen', 'commando'],
      'pl': ['pomoc', 'co możesz zrobić', 'polecenia'],
      'tr': ['yardım', 'ne yapabilirsin', 'komutlar'],
      'vi': ['trợ giúp', 'bạn có thể làm gì', 'lệnh'],
    };
    
    const langHelpKeywords = helpKeywords[detectedLang] || helpKeywords['en'];
    if (langHelpKeywords.some(kw => normalized.includes(kw))) {
      return {
        type: 'info',
        success: true,
        message: `I can help you navigate and control CYBERSHIELD. Try saying:
• "Go to Dashboard" - Navigate to any page
• "Scan my devices" - Start a device scan
• "Show my threats" - View active threats
• "Check vulnerabilities" - Run vulnerability assessment
• "Generate password" - Create secure passwords
• "Show alerts" - View security alerts
• "Run report" - Generate security reports
• "Start training" - Begin security training
• "Scan devices" - Start network device scan
• "Check vulnerabilities" - Run vulnerability assessment
• "Execute playbook" - Run SOAR automation
• "Analyze network" - Open network analyzer
• "Show threats" - View threat dashboard
• "Open forensics" - Access digital forensics
• "Assess risk" - Perform risk assessment
• "Manage assets" - Open asset inventory
• "Configure policies" - Edit security policies
• "Scan WiFi" - Scan wireless networks
• "Enable zero trust" - Configure Zero Trust
• "Open SOAR" - Access SOAR platform
• "Encrypt text" - Encrypt sensitive data
• "Generate key" - Generate encryption keys`
      };
    }

    // Handle security action commands
    if (normalized.includes('scan') && normalized.includes('device')) {
      try {
        deviceScanner.triggerBackendScan(null);
        return {
          type: 'action',
          success: true,
          message: 'Starting device scan...'
        };
      } catch (error) {
        return {
          type: 'action',
          success: false,
          message: 'Failed to start device scan'
        };
      }
    }
    
    if (normalized.includes('scan') && normalized.includes('vulnerabilit')) {
      try {
        // Assuming we have a user ID - in real app this would come from context
        scanForVulnerabilities('demo-user-id');
        return {
          type: 'action',
          success: true,
          message: 'Starting vulnerability scan...'
        };
      } catch (error) {
        return {
          type: 'action',
          success: false,
          message: 'Failed to start vulnerability scan'
        };
      }
    }
    
    if (normalized.includes('execute') && normalized.includes('playbook')) {
      try {
        // Find a playbook ID - in real app this would be more specific
        soarService.getPlaybooks('demo-user-id').then(playbooks => {
          if (playbooks.length > 0) {
            const firstPlaybook = playbooks[0];
            soarService.executePlaybook('demo-user-id', firstPlaybook.id);
          }
        });
        return {
          type: 'action',
          success: true,
          message: 'Executing SOAR playbook...'
        };
      } catch (error) {
        return {
          type: 'action',
          success: false,
          message: 'Failed to execute SOAR playbook'
        };
      }
    }
    
    if (normalized.includes('run') && normalized.includes('report')) {
      // This would typically navigate to the reports page
      navigate('/reports');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening reports...'
      };
    }
    
    if (normalized.includes('start') && normalized.includes('training')) {
      // This would typically navigate to the training page
      navigate('/training');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security training...'
      };
    }
    
    if (normalized.includes('generate') && normalized.includes('password')) {
      // This would typically navigate to the password tools page
      navigate('/password-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening password tools...'
      };
    }
    
    // Additional security actions
    if (normalized.includes('check') && normalized.includes('email') && normalized.includes('breach')) {
      navigate('/security-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security tools to check email breach status...'
      };
    }
    
    if (normalized.includes('scan') && normalized.includes('url')) {
      navigate('/security-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security tools to scan URL...'
      };
    }
    
    if (normalized.includes('scan') && normalized.includes('file')) {
      navigate('/security-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security tools to scan file...'
      };
    }
    
    if (normalized.includes('check') && normalized.includes('ip')) {
      navigate('/security-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security tools to check IP address...'
      };
    }
    
    if (normalized.includes('check') && normalized.includes('domain')) {
      navigate('/security-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security tools to check domain...'
      };
    }
    
    if (normalized.includes('start') && normalized.includes('pentest')) {
      navigate('/pentest');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening penetration testing tools...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('compliance') && (normalized.includes('check') || normalized.includes('scan'))) {
      navigate('/compliance');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening compliance checker...'
      };
    }
    
    if (normalized.includes('analyze') && normalized.includes('network')) {
      navigate('/network-monitor');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening network analyzer...'
      };
    }
    
    if (normalized.includes('show') && normalized.includes('threats')) {
      navigate('/threats');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening threat dashboard...'
      };
    }
    
    if (normalized.includes('show') && normalized.includes('alerts')) {
      navigate('/alerts');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security alerts...'
      };
    }
    
    if (normalized.includes('show') && normalized.includes('forensics')) {
      navigate('/forensics');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening digital forensics tools...'
      };
    }
    
    if (normalized.includes('show') && normalized.includes('analytics')) {
      navigate('/analytics');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security analytics...'
      };
    }
    
    if (normalized.includes('configure') && normalized.includes('policies')) {
      navigate('/policies');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening security policies...'
      };
    }
    
    if (normalized.includes('assess') && normalized.includes('risk')) {
      navigate('/risk-assessment');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening risk assessment tools...'
      };
    }
    
    if (normalized.includes('enable') && normalized.includes('zero') && normalized.includes('trust')) {
      navigate('/zero-trust');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening Zero Trust configuration...'
      };
    }
    
    if (normalized.includes('manage') && normalized.includes('assets')) {
      navigate('/asset-inventory');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening asset inventory...'
      };
    }
    
    if (normalized.includes('scan') && normalized.includes('wifi')) {
      navigate('/wifi-scanner');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening WiFi scanner...'
      };
    }
    
    if (normalized.includes('show') && normalized.includes('settings')) {
      navigate('/settings');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening settings...'
      };
    }
    
    if (normalized.includes('open') && normalized.includes('help')) {
      navigate('/help');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening help center...'
      };
    }
    
    if (normalized.includes('open') && normalized.includes('ai') && normalized.includes('assistant')) {
      navigate('/ai-assistant');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening SAM AI Assistant...'
      };
    }
    
    if (normalized.includes('open') && normalized.includes('soar')) {
      navigate('/soar');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening SOAR platform...'
      };
    }
    
    if (normalized.includes('encrypt') && normalized.includes('text')) {
      navigate('/password-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening encryption tools...'
      };
    }
    
    if (normalized.includes('generate') && normalized.includes('key')) {
      navigate('/password-tools');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening key generation tools...'
      };
    }
    
    // Handle general commands that should trigger specific actions
    if (normalized.includes('refresh') || normalized.includes('update') || normalized.includes('sync')) {
      // Refresh data across the application
      window.location.reload();
      return {
        type: 'action',
        success: true,
        message: 'Refreshing application...'
      };
    }
    
    if (normalized.includes('logout') || normalized.includes('sign out')) {
      // In a real app, this would call an auth service
      return {
        type: 'action',
        success: true,
        message: 'Logging out...'
      };
    }
    
    if (normalized.includes('login') || normalized.includes('sign in')) {
      // In a real app, this would navigate to login
      navigate('/');
      return {
        type: 'navigation',
        success: true,
        message: 'Returning to home for login...'
      };
    }
    
    // Advanced security actions
    if (normalized.includes('isolate') && normalized.includes('device')) {
      // This would isolate a specific device from the network
      return {
        type: 'action',
        success: true,
        message: 'Initiating device isolation procedure...'
      };
    }
    
    if (normalized.includes('quarantine') && normalized.includes('threat')) {
      // This would quarantine a detected threat
      return {
        type: 'action',
        success: true,
        message: 'Initiating threat quarantine procedure...'
      };
    }
    
    if (normalized.includes('block') && normalized.includes('ip')) {
      // This would block an IP address
      return {
        type: 'action',
        success: true,
        message: 'Blocking IP address...'
      };
    }
    
    if (normalized.includes('patch') && normalized.includes('system')) {
      // This would initiate system patching
      return {
        type: 'action',
        success: true,
        message: 'Initiating system patching...'
      };
    }
    
    if (normalized.includes('backup') && normalized.includes('now')) {
      // This would trigger an immediate backup
      return {
        type: 'action',
        success: true,
        message: 'Starting immediate backup...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('forensic') && normalized.includes('analysis')) {
      navigate('/forensics');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening forensic analysis tools...'
      };
    }
    
    if (normalized.includes('initiate') && normalized.includes('incident') && normalized.includes('response')) {
      // This would start an incident response procedure
      return {
        type: 'action',
        success: true,
        message: 'Initiating incident response procedure...'
      };
    }
    
    if (normalized.includes('lock') && normalized.includes('device')) {
      // This would remotely lock a device
      return {
        type: 'action',
        success: true,
        message: 'Locking device remotely...'
      };
    }
    
    if (normalized.includes('wipe') && normalized.includes('device')) {
      // This would remotely wipe a device
      return {
        type: 'action',
        success: true,
        message: 'Wiping device remotely...'
      };
    }
    
    if (normalized.includes('reset') && normalized.includes('password')) {
      // This would initiate a password reset
      return {
        type: 'action',
        success: true,
        message: 'Initiating password reset procedure...'
      };
    }
    
    if (normalized.includes('enable') && normalized.includes('mfa')) {
      // This would enable multifactor authentication
      return {
        type: 'action',
        success: true,
        message: 'Enabling multifactor authentication...'
      };
    }
    
    if (normalized.includes('disable') && normalized.includes('account')) {
      // This would disable an account
      return {
        type: 'action',
        success: true,
        message: 'Disabling account...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('compliance') && normalized.includes('audit')) {
      navigate('/compliance');
      return {
        type: 'navigation',
        success: true,
        message: 'Running compliance audit...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('risk') && normalized.includes('assessment')) {
      navigate('/risk-assessment');
      return {
        type: 'navigation',
        success: true,
        message: 'Running risk assessment...'
      };
    }
    
    if (normalized.includes('update') && normalized.includes('signatures')) {
      // This would update security signatures
      return {
        type: 'action',
        success: true,
        message: 'Updating security signatures...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('malware') && normalized.includes('scan')) {
      // This would run a malware scan
      return {
        type: 'action',
        success: true,
        message: 'Running comprehensive malware scan...'
      };
    }
    
    if (normalized.includes('run') && normalized.includes('antivirus')) {
      // This would run an antivirus scan
      return {
        type: 'action',
        success: true,
        message: 'Running antivirus scan...'
      };
    }
    
    if (normalized.includes('send') && normalized.includes('alert')) {
      // This would send a security alert
      return {
        type: 'action',
        success: true,
        message: 'Sending security alert...'
      };
    }
    
    if (normalized.includes('create') && normalized.includes('report')) {
      navigate('/reports');
      return {
        type: 'navigation',
        success: true,
        message: 'Creating security report...'
      };
    }
    
    if (normalized.includes('export') && normalized.includes('data')) {
      // This would export security data
      return {
        type: 'action',
        success: true,
        message: 'Exporting security data...'
      };
    }
    
    if (normalized.includes('configure') && normalized.includes('firewall')) {
      navigate('/settings');
      return {
        type: 'navigation',
        success: true,
        message: 'Opening firewall configuration...'
      };
    }
    
    if (normalized.includes('enable') && normalized.includes('logging')) {
      // This would enable detailed logging
      return {
        type: 'action',
        success: true,
        message: 'Enabling detailed security logging...'
      };
    }
    
    return {
      type: 'unknown',
      success: false,
      message: ''
    };
  }, [navigate, normalizeText, detectLanguage, findNavigationTarget]);

  const isCommand = useCallback((text: string): boolean => {
    const normalized = normalizeText(text);
    const detectedLang = detectLanguage(text);
    
    const langPatterns = MULTILANG_COMMAND_PATTERNS[detectedLang] || [];
    const enPatterns = MULTILANG_COMMAND_PATTERNS['en'] || [];
    const allPatterns = [...langPatterns, ...enPatterns];
    
    if (allPatterns.some(pattern => pattern.test(normalized))) {
      return true;
    }

    for (const target of NAVIGATION_TARGETS) {
      for (const lang of Object.keys(target.keywords)) {
        const keywords = target.keywords[lang];
        for (const keyword of keywords) {
          if (normalized.includes(keyword.toLowerCase())) {
            return true;
          }
        }
      }
    }

    return false;
  }, [normalizeText, detectLanguage]);

  return {
    executeCommand,
    isCommand,
    findNavigationTarget,
    detectLanguage,
  };
}
