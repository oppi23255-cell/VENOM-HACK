export interface TranslationStrings {
  id_placeholder: string;
  code_placeholder: string;
  login_btn: string;
  get_code_btn: string;
  video_btn: string;
  tg_channel: string;
  dev_support: string;
  aff_title: string;
  step1_prefix: string;
  step1_platform: string;
  step2_prefix: string;
  step3_prefix: string;
  step3_amount: string;
  step3_suffix: string;
  step4: string;
  step5: string;
  copy_btn: string;
  copied: string;
  verify_title: string;
  verify_id_place: string;
  deposit_label: string;
  promocode_label: string;
  upload_deposit: string;
  upload_promocode: string;
  platform_label: string;
  download_platform: string;
  verify_btn: string;
  back_btn: string;
  loading_title: string;
  notif_title: string;
  notif_desc: string;
  err_empty: string;
  err_promo_lowercase: string;
  err_promo_invalid: string;
  err_deposit_low: string;
  err_deposit_invalid: string;
  err_server: string;
  dash_account_id: string;
  dash_active: string;
  dash_time_remaining: string;
  dash_success_title: string;
  dash_copy_fast: string;
  dash_close: string;
  dash_quick_login: string;
  dash_error_login: string;
  dash_logout: string;
  dash_waiting_next: string;
  dash_phase_waiting: string;
  dash_phase_flight: string;
  dash_phase_crashed: string;
  dash_db_closed_title: string;
  dash_db_closed_desc: string;
  dash_round_label: string;
  video_title: string;
  days: string[];
}

export const AR_TEXT: TranslationStrings = {
  id_placeholder: 'رقم الـ ID',
  code_placeholder: 'كود التفعيل',
  login_btn: 'تسجيل الدخول',
  get_code_btn: 'احصل على كود تفعيل مجاني 🎁',
  video_btn: 'فيديو الشرح',
  tg_channel: 'قناة تيليجرام الرسمية',
  dev_support: 'التواصل مع المطور:',
  aff_title: 'خطوات التفعيل المجاني 🎁',
  step1_prefix: 'تحميل منصة',
  step1_platform: 'Ultrapari',
  step2_prefix: 'إنشاء حساب جديد باستخدام البروموكود',
  step3_prefix: 'إيداع',
  step3_amount: '180 ج.م',
  step3_suffix: 'كحد أدنى',
  step4: 'إدخال ID الحساب وإرفاق لقطات الشاشة',
  step5: 'الضغط على بدء التحقق للحصول على الكود المجاني',
  copy_btn: 'نسخ الكود',
  copied: 'تم النسخ!',
  verify_title: 'تأكد من الاشتراك',
  verify_id_place: 'أدخل الـ ID',
  deposit_label: 'اسكرين الإيداع (180 ج.م+)',
  promocode_label: 'اسكرين البروموكود (S333)',
  upload_deposit: 'الإيداع',
  upload_promocode: 'البروموكود',
  platform_label: 'Ultrapari',
  download_platform: 'تحميل منصة Ultrapari',
  verify_btn: 'تأكد من الخطوات واحصل على الكود',
  back_btn: 'رجوع لتسجيل الدخول',
  loading_title: 'جاري التحقق...',
  notif_title: 'تحديثات حصرية 🚀',
  notif_desc: 'انضم لقناة تيليجرام لأحدث التوقعات والأكواد المجانية!',
  err_empty: '⚠️ أدخل الـ ID وكود التفعيل أولاً!',
  err_promo_lowercase: '⚠️ يجب كتابة البروموكود S333 بحرف S كبير (S333 وليس s333).',
  err_promo_invalid: '⚠️ صورة البروموكود غير مطابقة أو لا تحتوي على الكود S333.',
  err_deposit_low: '⚠️ مبلغ الإيداع في الصورة أقل من الحد الأدنى المطلوب (180 ج.م).',
  err_deposit_invalid: '⚠️ صورة الإيداع غير واضحة أو لا تحتوي على إيداع 180 ج.م فأكثر.',
  err_server: '⚠️ تعذر التحقق من الصور، يرجى التأكد من الصور والمحاولة مرة أخرى.',
  dash_account_id: 'رقم الحساب',
  dash_active: 'متصل مباشر',
  dash_time_remaining: 'الوقت المتبقي',
  dash_success_title: 'تم توليد الكود!',
  dash_copy_fast: 'نسخ',
  dash_close: 'إغلاق',
  dash_quick_login: '🚀 تسجيل الدخول السريع',
  dash_error_login: '❌ بيانات الدخول غير صحيحة أو الكود منتهي الصلاحية.',
  dash_logout: 'تسجيل الخروج',
  dash_waiting_next: 'في انتظار بداية الجولة الجديدة...',
  dash_phase_waiting: 'قبل الإقلاع · التوقع جاهز',
  dash_phase_flight: 'الطائرة في الجو · التوقع مقفل',
  dash_phase_crashed: 'انتهت الجولة · بانتظار الجولة القادمة',
  dash_db_closed_title: 'قاعدة البيانات مغلقة',
  dash_db_closed_desc: 'تم إيقاف إظهار التوقعات لأن قاعدة البيانات مغلقة حالياً',
  dash_round_label: 'الجولة',
  video_title: 'فيديو الشرح',
  days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};
