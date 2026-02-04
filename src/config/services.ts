// ============================================================
// Services Configuration
// ============================================================

export interface ServiceConfig {
  code: string;
  labels: {
    en: string;
    ru: string;
    uk: string;
    es: string;
  };
  icon?: string;
}

export const services: ServiceConfig[] = [
  // Legal & Finance
  {
    code: 'document_assistant',
    labels: {
      en: 'Document Filling Assistant',
      ru: 'Помощник по заполнению документов',
      uk: 'Помічник із заповнення документів',
      es: 'Asistente de Llenado de Documentos',
    },
  },
  {
    code: 'immigration_consultant',
    labels: {
      en: 'Immigration Consultant',
      ru: 'Иммиграционный консультант',
      uk: 'Імміграційний консультант',
      es: 'Consultor de Inmigración',
    },
  },
  {
    code: 'customs_broker',
    labels: {
      en: 'Customs Broker',
      ru: 'Таможенный брокер',
      uk: 'Митний брокер',
      es: 'Agente de Aduanas',
    },
  },
  {
    code: 'accounting_assistant',
    labels: {
      en: 'Accounting Assistant',
      ru: 'Бухгалтерский ассистент',
      uk: 'Бухгалтерський асистент',
      es: 'Asistente Contable',
    },
  },
  {
    code: 'translator',
    labels: {
      en: 'Translator',
      ru: 'Переводчик',
      uk: 'Перекладач',
      es: 'Traductor',
    },
  },
// Education & Languages
  {
    code: 'language_teacher',
    labels: {
      en: 'Language Teacher',
      ru: 'Преподаватель языка',
      uk: 'Викладач мови',
      es: 'Profesor de Idiomas',
    },
  },
  {
    code: 'school_tutor',
    labels: {
      en: 'School Tutor',
      ru: 'Репетитор для школьников',
      uk: 'Репетитор для школярів',
      es: 'Tutor Escolar',
    },
  },
  {
    code: 'programming_teacher',
    labels: {
      en: 'Programming Teacher',
      ru: 'Преподаватель программирования',
      uk: 'Викладач програмування',
      es: 'Profesor de Programación',
    },
  },
  {
    code: 'music_instructor',
    labels: {
      en: 'Music Instructor',
      ru: 'Преподаватель музыки',
      uk: 'Викладач музики',
      es: 'Instructor de Música',
    },
  },
  {
    code: 'driving_instructor',
    labels: {
      en: 'Driving Instructor',
      ru: 'Автоинструктор',
      uk: 'Автоінструктор',
      es: 'Instructor de Conducción',
    },
  },
  {
    code: 'solfeggio_teacher',
    labels: {
      en: 'Solfeggio Teacher',
      ru: 'Преподаватель сольфеджио',
      uk: 'Викладач сольфеджіо',
      es: 'Profesor de Solfeo',
    },
  },
  {
    code: 'conversation_club',
    labels: {
      en: 'Conversation Club',
      ru: 'Разговорный клуб',
      uk: 'Розмовний клуб',
      es: 'Club de Conversación',
    },
  },
  {
    code: 'acting_coach',
    labels: {
      en: 'Acting Coach',
      ru: 'Актерское мастерство',
      uk: 'Акторська майстерність',
      es: 'Coach de Actuación',
    },
  },
  {
    code: 'public_speaking',
    labels: {
      en: 'Public Speaking Coach',
      ru: 'Ораторское искусство',
      uk: 'Ораторське мистецтво',
      es: 'Coach de Oratoria',
    },
  },
  // Real Estate & Relocation
  {
    code: 'real_estate_agent',
    labels: {
      en: 'Real Estate Agent',
      ru: 'Риелтор',
      uk: 'Ріелтор',
      es: 'Agente Inmobiliario',
    },
  },
  {
    code: 'relocation_assistant',
    labels: {
      en: 'Relocation Assistant',
      ru: 'Помощник по переезду',
      uk: 'Асистент з переїзду',
      es: 'Asistente de Reubicación',
    },
  },
  {
    code: 'business_relocation',
    labels: {
      en: 'Business Relocation Consultant',
      ru: 'Консультант по релокации бизнеса',
      uk: 'Консультант з релокації бізнесу',
      es: 'Consultor de Reubicación de Negocios',
    },
  },
  {
    code: 'mover',
    labels: {
      en: 'Mover / Transport',
      ru: 'Перевозчик',
      uk: 'Перевізник',
      es: 'Transportista',
    },
  },
  {
    code: 'passenger_transport',
    labels: {
      en: 'Passenger Transportation',
      ru: 'Пассажирские перевозки',
      uk: 'Пасажирські перевезення',
      es: 'Transporte de Pasajeros',
    },
  },
  {
    code: 'freight_transport',
    labels: {
      en: 'Freight Transportation',
      ru: 'Грузовые перевозки',
      uk: 'Вантажні перевезення',
      es: 'Transporte de Carga',
    },
  },
  {
    code: 'goods_delivery',
    labels: {
      en: 'Goods Delivery',
      ru: 'Доставка товаров',
      uk: 'Доставка товарів',
      es: 'Entrega de Productos',
    },
  },
  // Home Services
  {
    code: 'cleaning',
    labels: {
      en: 'Cleaning Service',
      ru: 'Клининг',
      uk: 'Клінінг',
      es: 'Servicio de Limpieza',
    },
  },
  {
    code: 'dry_cleaning',
    labels: {
      en: 'Dry Cleaning',
      ru: 'Химчистка',
      uk: 'Хімчистка',
      es: 'Tintorería',
    },
  },
  {
    code: 'handyman',
    labels: {
      en: 'Handyman',
      ru: 'Мастер по дому',
      uk: 'Майстер по дому',
      es: 'Manitas',
    },
  },
  {
    code: 'electrician',
    labels: {
      en: 'Electrician',
      ru: 'Электрик',
      uk: 'Електрик',
      es: 'Electricista',
    },
  },
  {
    code: 'plumber',
    labels: {
      en: 'Plumber',
      ru: 'Сантехник',
      uk: 'Сантехнік',
      es: 'Fontanero',
    },
  },
  {
    code: 'interior_design',
    labels: {
      en: 'Interior Design',
      ru: 'Дизайн интерьеров',
      uk: 'Дизайн інтер\'єрів',
      es: 'Diseño de Interiores',
    },
  },
  {
    code: 'auto_mechanic',
    labels: {
      en: 'Auto Mechanic',
      ru: 'Автомеханик',
      uk: 'Автомеханік',
      es: 'Mecánico de Autos',
    },
  },
  {
    code: 'tech_repair',
    labels: {
      en: 'Tech Repair',
      ru: 'Ремонт техники',
      uk: 'Ремонт техніки',
      es: 'Reparación de Tecnología',
    },
  },
  {
    code: 'construction_consultant',
    labels: {
      en: 'Construction & Renovation Consultant',
      ru: 'Консультант по строительству и ремонтам',
      uk: 'Консультант з будівництва та ремонту',
      es: 'Consultor de Construcción y Renovación',
    },
  },
  {
    code: 'tailor',
    labels: {
      en: 'Tailor',
      ru: 'Портной',
      uk: 'Кравець',
      es: 'Sastre',
    },
  },
  {
    code: 'shoe_repair',
    labels: {
      en: 'Shoe Repair',
      ru: 'Ремонт обуви',
      uk: 'Ремонт взуття',
      es: 'Reparación de Calzado',
    },
  },
  {
    code: 'locksmith',
    labels: {
      en: 'Locksmith',
      ru: 'Слесарь',
      uk: 'Слюсар',
      es: 'Cerrajero',
    },
  },
  {
    code: 'jeweler',
    labels: {
      en: 'Jeweler',
      ru: 'Ювелир',
      uk: 'Ювелір',
      es: 'Joyero',
    },
  },
  {
    code: 'glazier',
    labels: {
      en: 'Glazier',
      ru: 'Стекольщик',
      uk: 'Скляр',
      es: 'Vidriero',
    },
  },
  {
    code: 'furniture_assembly',
    labels: {
      en: 'Furniture Assembly',
      ru: 'Сборка мебели',
      uk: 'Збирання меблів',
      es: 'Montaje de Muebles',
    },
  },
  {
    code: 'custom_furniture',
    labels: {
      en: 'Custom Furniture',
      ru: 'Мебель на заказ',
      uk: 'Меблі на замовлення',
      es: 'Muebles a Medida',
    },
  },
  // Creative & Digital
  {
    code: 'photographer',
    labels: {
      en: 'Photographer',
      ru: 'Фотограф',
      uk: 'Фотограф',
      es: 'Fotógrafo',
    },
  },
  {
    code: 'videographer',
    labels: {
      en: 'Videographer',
      ru: 'Видеооператор',
      uk: 'Відеооператор',
      es: 'Videógrafo',
    },
  },
  {
    code: 'video_editor',
    labels: {
      en: 'Video Editor',
      ru: 'Видео-монтаж',
      uk: 'Відео-монтаж',
      es: 'Editor de Video',
    },
  },
  {
    code: 'content_creator',
    labels: {
      en: 'Content Creator',
      ru: 'Создатель контента',
      uk: 'Контент-мейкер',
      es: 'Creador de Contenido',
    },
  },
  {
    code: 'copywriter',
    labels: {
      en: 'Copywriter',
      ru: 'Копирайтер',
      uk: 'Копірайтер',
      es: 'Redactor Publicitario',
    },
  },
  {
    code: 'smm_manager',
    labels: {
      en: 'SMM Manager',
      ru: 'SMM менеджер',
      uk: 'SMM менеджер',
      es: 'Gestor de Redes Sociales',
    },
  },
  {
    code: 'designer',
    labels: {
      en: 'Designer',
      ru: 'Дизайнер',
      uk: 'Дизайнер',
      es: 'Diseñador',
    },
  },
  {
    code: 'web_developer',
    labels: {
      en: 'Web Developer',
      ru: 'Создание сайтов',
      uk: 'Створення сайтів',
      es: 'Desarrollador Web',
    },
  },
  {
    code: '3d_printing',
    labels: {
      en: '3D Printing',
      ru: '3D печать',
      uk: '3D друк',
      es: 'Impresión 3D',
    },
  },
  {
    code: 'handmade_crafts',
    labels: {
      en: 'Handmade Crafts',
      ru: 'Хендмейд',
      uk: 'Хендмейд',
      es: 'Artesanías',
    },
  },
  // Personal Services
  {
    code: 'personal_assistant',
    labels: {
      en: 'Personal Assistant',
      ru: 'Персональный помощник',
      uk: 'Персональний помічник',
      es: 'Asistente Personal',
    },
  },
  {
    code: 'driver',
    labels: {
      en: 'Driver',
      ru: 'Водитель',
      uk: 'Водій',
      es: 'Conductor',
    },
  },
  {
    code: 'nanny',
    labels: {
      en: 'Nanny / Babysitter',
      ru: 'Няня',
      uk: 'Няня',
      es: 'Niñera',
    },
  },
  // Pet Services
  {
    code: 'pet_sitter',
    labels: {
      en: 'Pet Sitter',
      ru: 'Передержка животных',
      uk: 'Перетримка тварин',
      es: 'Cuidador de Mascotas',
    },
  },
  {
    code: 'dog_walking',
    labels: {
      en: 'Dog Walking',
      ru: 'Выгул собак',
      uk: 'Вигул собак',
      es: 'Paseo de Perros',
    },
  },
  // Business & Marketing
  {
    code: 'ai_automation',
    labels: {
      en: 'AI Automation Specialist',
      ru: 'AI автоматизатор',
      uk: 'AI автоматизатор',
      es: 'Especialista en Automatización IA',
    },
  },
  {
    code: 'business_consultant',
    labels: {
      en: 'Business Consultant',
      ru: 'Бизнес консультант',
      uk: 'Бізнес консультант',
      es: 'Consultor de Negocios',
    },
  },
  {
    code: 'it_consultant',
    labels: {
      en: 'IT Consultant',
      ru: 'IT консультант',
      uk: 'IT консультант',
      es: 'Consultor de TI',
    },
  },
  {
    code: 'marketer',
    labels: {
      en: 'Marketing Specialist',
      ru: 'Маркетолог',
      uk: 'Маркетолог',
      es: 'Especialista en Marketing',
    },
  },
  {
    code: 'investment_consultant',
    labels: {
      en: 'Investment Consultant',
      ru: 'Консультант по инвестициям',
      uk: 'Консультант з інвестицій',
      es: 'Consultor de Inversiones',
    },
  },
  {
    code: 'hr_consultant',
    labels: {
      en: 'HR Consultant',
      ru: 'HR консультант',
      uk: 'HR консультант',
      es: 'Consultor de Recursos Humanos',
    },
  },
  {
    code: 'ml_specialist',
    labels: {
      en: 'Machine Learning Specialist',
      ru: 'Специалист по машинному обучению',
      uk: 'Спеціаліст з машинного навчання',
      es: 'Especialista en Machine Learning',
    },
  },
  {
    code: 'devops_consultant',
    labels: {
      en: 'DevOps Consultant',
      ru: 'DevOps консультант',
      uk: 'DevOps консультант',
      es: 'Consultor DevOps',
    },
  },
  {
    code: 'sales_specialist',
    labels: {
      en: 'Sales Specialist',
      ru: 'Специалист по продажам',
      uk: 'Спеціаліст з продажів',
      es: 'Especialista en Ventas',
    },
  },
  {
    code: 'personal_branding',
    labels: {
      en: 'Personal Branding Consultant',
      ru: 'Консультант по созданию личного бренда',
      uk: 'Консультант зі створення особистого бренду',
      es: 'Consultor de Marca Personal',
    },
  },
  {
    code: 'project_manager',
    labels: {
      en: 'Project Manager',
      ru: 'Проектный менеджер',
      uk: 'Проєктний менеджер',
      es: 'Gerente de Proyectos',
    },
  },
  {
    code: 'qa_tester',
    labels: {
      en: 'Software Tester / QA',
      ru: 'Тестировщик программного обеспечения',
      uk: 'Тестувальник програмного забезпечення',
      es: 'Probador de Software / QA',
    },
  },
  {
    code: 'mobile_app_developer',
    labels: {
      en: 'Mobile App Developer',
      ru: 'Создание мобильных приложений',
      uk: 'Створення мобільних додатків',
      es: 'Desarrollador de Aplicaciones Móviles',
    },
  },
  // Delivery & Logistics
  {
    code: 'courier',
    labels: {
      en: 'Courier',
      ru: 'Курьер',
      uk: 'Кур\'єр',
      es: 'Mensajero',
    },
  },
  // Events & Lifestyle
  {
    code: 'florist',
    labels: {
      en: 'Florist',
      ru: 'Флорист',
      uk: 'Флорист',
      es: 'Florista',
    },
  },
  {
    code: 'event_planner',
    labels: {
      en: 'Event Planner',
      ru: 'Организатор мероприятий',
      uk: 'Організатор заходів',
      es: 'Organizador de Eventos',
    },
  },
  {
    code: 'pastry_chef',
    labels: {
      en: 'Pastry Chef',
      ru: 'Кондитер',
      uk: 'Кондитер',
      es: 'Pastelero',
    },
  },
  {
    code: 'catering',
    labels: {
      en: 'Catering Service',
      ru: 'Кейтеринг',
      uk: 'Кейтеринг',
      es: 'Servicio de Catering',
    },
  },
  {
    code: 'mc_host',
    labels: {
      en: 'Professional MC / Host',
      ru: 'Профессиональный ведущий',
      uk: 'Професійний ведучий',
      es: 'Presentador Profesional',
    },
  },
  {
    code: 'sommelier',
    labels: {
      en: 'Sommelier',
      ru: 'Сомелье',
      uk: 'Сомельє',
      es: 'Sommelier',
    },
  },
  {
    code: 'musician',
    labels: {
      en: 'Musician',
      ru: 'Музыкант',
      uk: 'Музикант',
      es: 'Músico',
    },
  },
  // Tourism
  {
    code: 'travel_manager',
    labels: {
      en: 'Travel Manager',
      ru: 'Туристический менеджер',
      uk: 'Туристичний менеджер',
      es: 'Gestor de Viajes',
    },
  },
  {
    code: 'tour_guide',
    labels: {
      en: 'Tour Guide',
      ru: 'Экскурсовод',
      uk: 'Екскурсовод',
      es: 'Guía Turístico',
    },
  },
  {
    code: 'hiking_organizer',
    labels: {
      en: 'Hiking / Outdoor Organizer',
      ru: 'Организация походов',
      uk: 'Організація походів',
      es: 'Organizador de Excursiones',
    },
  },
  // Fitness & Wellness
  {
    code: 'yoga_instructor',
    labels: {
      en: 'Yoga Instructor',
      ru: 'Инструктор по йоге',
      uk: 'Інструктор з йоги',
      es: 'Instructor de Yoga',
    },
  },
  {
    code: 'fitness_trainer',
    labels: {
      en: 'Fitness Trainer',
      ru: 'Тренер',
      uk: 'Тренер',
      es: 'Entrenador Personal',
    },
  },
  {
    code: 'sports_instructor',
    labels: {
      en: 'Sports Instructor',
      ru: 'Спортивный инструктор',
      uk: 'Спортивний інструктор',
      es: 'Instructor Deportivo',
    },
  },
  {
    code: 'dietitian',
    labels: {
      en: 'Dietitian',
      ru: 'Диетолог',
      uk: 'Дієтолог',
      es: 'Dietista',
    },
  },
  {
    code: 'rehabilitation_specialist',
    labels: {
      en: 'Rehabilitation Specialist',
      ru: 'Реабилитолог',
      uk: 'Реабілітолог',
      es: 'Especialista en Rehabilitación',
    },
  },
  {
    code: 'massage_therapist',
    labels: {
      en: 'Massage Therapist',
      ru: 'Массажист',
      uk: 'Масажист',
      es: 'Masajista',
    },
  },
  {
    code: 'motivation_consultant',
    labels: {
      en: 'Motivation Consultant',
      ru: 'Консультант по мотивации',
      uk: 'Консультант з мотивації',
      es: 'Consultor de Motivación',
    },
  },
  {
    code: 'tarot_reader',
    labels: {
      en: 'Tarot Reader',
      ru: 'Таролог',
      uk: 'Таролог',
      es: 'Lector de Tarot',
    },
  },
  {
    code: 'shopping_consultant',
    labels: {
      en: 'Shopping Consultant',
      ru: 'Консультант по шоппингу',
      uk: 'Консультант з шопінгу',
      es: 'Consultor de Compras',
    },
  },
  {
    code: 'beauty_consultant',
    labels: {
      en: 'Beauty and Cosmetology Consultant',
      ru: 'Консультант по красоте и косметологии',
      uk: 'Консультант з краси та косметології',
      es: 'Consultor de Belleza y Cosmetología',
    },
  },
  // Beauty & Style
  {
    code: 'hairdresser',
    labels: {
      en: 'Hairdresser',
      ru: 'Парикмахер',
      uk: 'Перукар',
      es: 'Peluquero',
    },
  },
  {
    code: 'makeup_artist',
    labels: {
      en: 'Makeup Artist',
      ru: 'Визажист',
      uk: 'Візажист',
      es: 'Maquillador',
    },
  },
  {
    code: 'nail_technician',
    labels: {
      en: 'Nail Technician',
      ru: 'Мастер маникюра',
      uk: 'Майстер манікюру',
      es: 'Manicurista',
    },
  },
  {
    code: 'stylist',
    labels: {
      en: 'Stylist',
      ru: 'Стилист',
      uk: 'Стиліст',
      es: 'Estilista',
    },
  },
];

export const servicesByCode = services.reduce(
  (acc, service) => {
    acc[service.code] = service;
    return acc;
  },
  {} as Record<string, ServiceConfig>
);

export const serviceCodes = services.map((s) => s.code);

export function getServiceLabel(code: string, locale: string): string {
  const service = servicesByCode[code];
  if (!service) return code;
  return service.labels[locale as keyof typeof service.labels] || service.labels.en;
}

const serviceIcons: Record<string, string> = {
  // Legal & Finance
  document_assistant: '📋',
  immigration_consultant: '🛂',
  customs_broker: '📦',
  accounting_assistant: '📊',
  translator: '🌍',
// Education
  language_teacher: '📚',
  school_tutor: '📖',
  programming_teacher: '💻',
  music_instructor: '🎵',
  solfeggio_teacher: '🎼',
  conversation_club: '💬',
  acting_coach: '🎭',
  public_speaking: '🎤',
  driving_instructor: '🚗',
  // Real Estate & Transport
  real_estate_agent: '🏢',
  relocation_assistant: '📦',
  business_relocation: '🏢',
  mover: '🚚',
  passenger_transport: '🚐',
  freight_transport: '🚛',
  goods_delivery: '📦',
  // Home Services
  cleaning: '🧹',
  dry_cleaning: '👔',
  handyman: '🔧',
  electrician: '⚡',
  plumber: '🚰',
  interior_design: '🏠',
  auto_mechanic: '🚗',
  tech_repair: '🔌',
  construction_consultant: '🏗️',
  tailor: '🧵',
  shoe_repair: '👞',
  locksmith: '🔑',
  jeweler: '💎',
  glazier: '🪟',
  furniture_assembly: '🪑',
  custom_furniture: '🛋️',
  // Creative & Digital
  photographer: '📷',
  videographer: '🎥',
  video_editor: '🎬',
  content_creator: '📱',
  copywriter: '✍️',
  smm_manager: '📲',
  designer: '🎨',
  web_developer: '💻',
  '3d_printing': '🖨️',
  ai_automation: '🤖',
  handmade_crafts: '🧶',
  // Personal Services
  personal_assistant: '👤',
  driver: '🚗',
  nanny: '👶',
  courier: '📬',
  // Pets
  pet_sitter: '🐕',
  dog_walking: '🐕‍🦺',
  // Business & Marketing
  business_consultant: '💼',
  it_consultant: '🖥️',
  marketer: '📈',
  investment_consultant: '💰',
  hr_consultant: '👥',
  ml_specialist: '🤖',
  devops_consultant: '⚙️',
  sales_specialist: '📊',
  personal_branding: '🌟',
  project_manager: '📋',
  qa_tester: '🐞',
  mobile_app_developer: '📱',
  // Events & Lifestyle
  florist: '💐',
  event_planner: '🎉',
  pastry_chef: '🎂',
  catering: '🍽️',
  mc_host: '🎤',
  sommelier: '🍷',
  musician: '🎸',
  // Tourism
  travel_manager: '✈️',
  tour_guide: '🗺️',
  hiking_organizer: '🥾',
  // Fitness & Wellness
  yoga_instructor: '🧘',
  fitness_trainer: '💪',
  sports_instructor: '⚽',
  dietitian: '🥗',
  rehabilitation_specialist: '🏃',
  massage_therapist: '💆',
  motivation_consultant: '🎯',
  tarot_reader: '🔮',
  shopping_consultant: '🛍️',
  beauty_consultant: '🫦',
  // Beauty & Style
  hairdresser: '💇',
  makeup_artist: '💄',
  nail_technician: '💅',
  stylist: '👗',
};

export function getServiceIcon(code: string): string {
  return serviceIcons[code] || '💼';
}
