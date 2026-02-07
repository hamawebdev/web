// @ts-nocheck
export type PaymentLocale = 'ar' | 'en' | 'fr';

export interface PaymentTranslations {
  // Page titles and headers
  pageTitle: string;
  pageSubtitle: string;
  backButton: string;
  
  // Payment methods section
  paymentMethodTitle: string;
  paymentMethodDescription: string;
  recommended: string;
  processingTime: string;
  securityNote: string;
  
  // Payment method names and descriptions
  edahabia: {
    name: string;
    description: string;
  };
  cib: {
    name: string;
    description: string;
  };
  chargilyApp: {
    name: string;
    description: string;
  };
  
  // Order summary
  orderSummaryTitle: string;
  duration: string;
  pricePerMonth: string;
  pricePerYear: string;
  quantity: string;
  total: string;
  
  // Duration labels
  oneMonth: string;
  oneYear: string;
  months: string;
  years: string;
  
  // Payment button and processing
  payButton: string;
  processing: string;
  
  // Terms and conditions
  termsText: string;
  termsOfService: string;
  privacyPolicy: string;
  
  // Error messages
  missingParameters: string;
  studyPackNotFound: string;
  paymentSetupError: string;
  paymentProcessingError: string;
  
  // Processing times
  instant: string;
  oneToTwoMinutes: string;
}

export const paymentTranslations: Record<PaymentLocale, PaymentTranslations> = {
  ar: {
    // Page titles and headers
    pageTitle: 'إكمال اشتراكك',
    pageSubtitle: 'اختر طريقة الدفع وأكمل عملية الشراء',
    backButton: 'رجوع',
    
    // Payment methods section
    paymentMethodTitle: 'طريقة الدفع',
    paymentMethodDescription: 'اختر طريقة الدفع المفضلة لديك. جميع الطرق آمنة ومشفرة.',
    recommended: 'موصى به',
    processingTime: 'وقت المعالجة',
    securityNote: 'دفعتك محمية بتشفير SSL 256-bit',
    
    // Payment method names and descriptions
    edahabia: {
      name: 'الذهبية',
      description: 'بطاقة مدفوعة مسبقاً جزائرية'
    },
    cib: {
      name: 'سي آي بي',
      description: 'بطاقة بنكية جزائرية'
    },
    chargilyApp: {
      name: 'تطبيق شارجيلي',
      description: 'مدفوعات الهاتف المحمول برمز QR'
    },
    
    // Order summary
    orderSummaryTitle: 'ملخص الطلب',
    duration: 'المدة',
    pricePerMonth: 'السعر شهرياً',
    pricePerYear: 'السعر سنوياً',
    quantity: 'الكمية',
    total: 'المجموع',
    
    // Duration labels
    oneMonth: 'شهر واحد',
    oneYear: 'سنة واحدة',
    months: 'أشهر',
    years: 'سنوات',
    
    // Payment button and processing
    payButton: 'ادفع',
    processing: 'جاري المعالجة...',
    
    // Terms and conditions
    termsText: 'بإكمال هذا الشراء، فإنك توافق على',
    termsOfService: 'شروط الخدمة',
    privacyPolicy: 'سياسة الخصوصية',
    
    // Error messages
    missingParameters: 'معاملات الدفع مفقودة. جاري التوجيه إلى الاشتراكات...',
    studyPackNotFound: 'حزمة الدراسة غير موجودة',
    paymentSetupError: 'خطأ في إعداد الدفع',
    paymentProcessingError: 'فشل في معالجة الدفع. يرجى المحاولة مرة أخرى.',
    
    // Processing times
    instant: 'فوري',
    oneToTwoMinutes: '1-2 دقيقة'
  },
  
  en: {
    // Page titles and headers
    pageTitle: 'Complete Your Subscription',
    pageSubtitle: 'Choose your payment method and complete your purchase',
    backButton: 'Back',
    
    // Payment methods section
    paymentMethodTitle: 'Payment Method',
    paymentMethodDescription: 'Select your preferred payment method. All methods are secure and encrypted.',
    recommended: 'Recommended',
    processingTime: 'Processing time',
    securityNote: 'Your payment is secured with 256-bit SSL encryption',
    
    // Payment method names and descriptions
    edahabia: {
      name: 'EDAHABIA',
      description: 'Algerian prepaid card'
    },
    cib: {
      name: 'CIB',
      description: 'Algerian bank card'
    },
    chargilyApp: {
      name: 'Chargily App',
      description: 'QR code mobile payments'
    },
    
    // Order summary
    orderSummaryTitle: 'Order Summary',
    duration: 'Duration',
    pricePerMonth: 'Price per month',
    pricePerYear: 'Price per year',
    quantity: 'Quantity',
    total: 'Total',
    
    // Duration labels
    oneMonth: '1 Month',
    oneYear: '1 Year',
    months: 'Months',
    years: 'Years',
    
    // Payment button and processing
    payButton: 'Pay',
    processing: 'Processing...',
    
    // Terms and conditions
    termsText: 'By completing this purchase, you agree to our',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    
    // Error messages
    missingParameters: 'Missing payment parameters. Redirecting to subscriptions...',
    studyPackNotFound: 'Study pack not found',
    paymentSetupError: 'Payment Setup Error',
    paymentProcessingError: 'Failed to process payment. Please try again.',
    
    // Processing times
    instant: 'Instant',
    oneToTwoMinutes: '1-2 minutes'
  },
  
  fr: {
    // Page titles and headers
    pageTitle: 'Complétez votre abonnement',
    pageSubtitle: 'Choisissez votre méthode de paiement et finalisez votre achat',
    backButton: 'Retour',
    
    // Payment methods section
    paymentMethodTitle: 'Méthode de paiement',
    paymentMethodDescription: 'Sélectionnez votre méthode de paiement préférée. Toutes les méthodes sont sécurisées et cryptées.',
    recommended: 'Recommandé',
    processingTime: 'Temps de traitement',
    securityNote: 'Votre paiement est sécurisé avec un cryptage SSL 256-bit',
    
    // Payment method names and descriptions
    edahabia: {
      name: 'EDAHABIA',
      description: 'Carte prépayée algérienne'
    },
    cib: {
      name: 'CIB',
      description: 'Carte bancaire algérienne'
    },
    chargilyApp: {
      name: 'App Chargily',
      description: 'Paiements mobiles par code QR'
    },
    
    // Order summary
    orderSummaryTitle: 'Résumé de la commande',
    duration: 'Durée',
    pricePerMonth: 'Prix par mois',
    pricePerYear: 'Prix par an',
    quantity: 'Quantité',
    total: 'Total',
    
    // Duration labels
    oneMonth: '1 Mois',
    oneYear: '1 An',
    months: 'Mois',
    years: 'Ans',
    
    // Payment button and processing
    payButton: 'Payer',
    processing: 'Traitement en cours...',
    
    // Terms and conditions
    termsText: 'En finalisant cet achat, vous acceptez nos',
    termsOfService: 'Conditions de service',
    privacyPolicy: 'Politique de confidentialité',
    
    // Error messages
    missingParameters: 'Paramètres de paiement manquants. Redirection vers les abonnements...',
    studyPackNotFound: 'Pack d\'étude introuvable',
    paymentSetupError: 'Erreur de configuration du paiement',
    paymentProcessingError: 'Échec du traitement du paiement. Veuillez réessayer.',
    
    // Processing times
    instant: 'Instantané',
    oneToTwoMinutes: '1-2 minutes'
  }
};

export function getPaymentTranslations(locale: PaymentLocale): PaymentTranslations {
  return paymentTranslations[locale] || paymentTranslations.ar;
}

export function formatDuration(
  durationType: 'monthly' | 'yearly', 
  duration: number, 
  locale: PaymentLocale
): string {
  const t = getPaymentTranslations(locale);
  
  if (durationType === 'yearly') {
    return duration === 1 ? t.oneYear : `${duration} ${t.years}`;
  } else {
    return duration === 1 ? t.oneMonth : `${duration} ${t.months}`;
  }
}
