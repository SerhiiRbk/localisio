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
    code: 'lawyer',
    labels: {
      en: 'Lawyer',
      ru: 'Адвокат',
      uk: 'Адвокат',
      es: 'Abogado',
    },
  },
  {
    code: 'immigration_lawyer',
    labels: {
      en: 'Immigration Lawyer',
      ru: 'Иммиграционный юрист',
      uk: 'Імміграційний юрист',
      es: 'Abogado de Inmigración',
    },
  },
  {
    code: 'immigration_consultant',
    labels: {
      en: 'Immigration Consultant',
      ru: 'Эмиграционный консультант',
      uk: 'Еміграційний консультант',
      es: 'Consultor de Inmigración',
    },
  },
  {
    code: 'accountant',
    labels: {
      en: 'Accountant',
      ru: 'Бухгалтер',
      uk: 'Бухгалтер',
      es: 'Contador',
    },
  },
  {
    code: 'tax_accountant',
    labels: {
      en: 'Tax Accountant',
      ru: 'Налоговый консультант',
      uk: 'Податковий консультант',
      es: 'Contador de Impuestos',
    },
  },
  {
    code: 'notary',
    labels: {
      en: 'Notary',
      ru: 'Нотариус',
      uk: 'Нотаріус',
      es: 'Notario',
    },
  },
  // Healthcare - General
  {
    code: 'general_practitioner',
    labels: {
      en: 'General Practitioner',
      ru: 'Врач общей практики',
      uk: 'Лікар загальної практики',
      es: 'Médico General',
    },
  },
  {
    code: 'psychologist',
    labels: {
      en: 'Psychologist',
      ru: 'Психолог',
      uk: 'Психолог',
      es: 'Psicólogo',
    },
  },
  {
    code: 'psychiatrist',
    labels: {
      en: 'Psychiatrist',
      ru: 'Психиатр',
      uk: 'Психіатр',
      es: 'Psiquiatra',
    },
  },
  {
    code: 'gastroenterologist',
    labels: {
      en: 'Gastroenterologist',
      ru: 'Гастроэнтеролог',
      uk: 'Гастроентеролог',
      es: 'Gastroenterólogo',
    },
  },
  {
    code: 'dermatologist',
    labels: {
      en: 'Dermatologist',
      ru: 'Дерматолог',
      uk: 'Дерматолог',
      es: 'Dermatólogo',
    },
  },
  {
    code: 'neurologist',
    labels: {
      en: 'Neurologist',
      ru: 'Невропатолог',
      uk: 'Невропатолог',
      es: 'Neurólogo',
    },
  },
  {
    code: 'urologist',
    labels: {
      en: 'Urologist',
      ru: 'Уролог',
      uk: 'Уролог',
      es: 'Urólogo',
    },
  },
  {
    code: 'surgeon',
    labels: {
      en: 'Surgeon',
      ru: 'Хирург',
      uk: 'Хірург',
      es: 'Cirujano',
    },
  },
  {
    code: 'ophthalmologist',
    labels: {
      en: 'Ophthalmologist',
      ru: 'Окулист',
      uk: 'Окуліст',
      es: 'Oftalmólogo',
    },
  },
  {
    code: 'traumatologist',
    labels: {
      en: 'Traumatologist',
      ru: 'Травматолог',
      uk: 'Травматолог',
      es: 'Traumatólogo',
    },
  },
  {
    code: 'physiotherapist',
    labels: {
      en: 'Physiotherapist',
      ru: 'Физиотерапевт',
      uk: 'Фізіотерапевт',
      es: 'Fisioterapeuta',
    },
  },
  {
    code: 'gynecologist',
    labels: {
      en: 'Gynecologist',
      ru: 'Гинеколог',
      uk: 'Гінеколог',
      es: 'Ginecólogo',
    },
  },
  {
    code: 'dentist',
    labels: {
      en: 'Dentist',
      ru: 'Стоматолог',
      uk: 'Стоматолог',
      es: 'Dentista',
    },
  },
  {
    code: 'ultrasound_specialist',
    labels: {
      en: 'Ultrasound Specialist',
      ru: 'УЗИ-специалист',
      uk: 'УЗД-спеціаліст',
      es: 'Especialista en Ultrasonido',
    },
  },
  {
    code: 'veterinarian',
    labels: {
      en: 'Veterinarian',
      ru: 'Ветеринар',
      uk: 'Ветеринар',
      es: 'Veterinario',
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
    code: 'translator',
    labels: {
      en: 'Translator',
      ru: 'Переводчик',
      uk: 'Перекладач',
      es: 'Traductor',
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
    code: 'mover',
    labels: {
      en: 'Mover / Transport',
      ru: 'Перевозчик',
      uk: 'Перевізник',
      es: 'Transportista',
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
    code: 'architect',
    labels: {
      en: 'Architect',
      ru: 'Архитектор',
      uk: 'Архітектор',
      es: 'Arquitecto',
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
    code: 'sommelier',
    labels: {
      en: 'Sommelier',
      ru: 'Сомелье',
      uk: 'Сомельє',
      es: 'Sommelier',
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
  lawyer: '⚖️',
  immigration_lawyer: '⚖️',
  immigration_consultant: '🛂',
  accountant: '📊',
  tax_accountant: '📊',
  notary: '📜',
  // Healthcare - General
  general_practitioner: '🏥',
  psychologist: '🧠',
  psychiatrist: '🧠',
  gastroenterologist: '🏥',
  dermatologist: '🏥',
  neurologist: '🏥',
  urologist: '🏥',
  surgeon: '🏥',
  ophthalmologist: '👁️',
  traumatologist: '🦴',
  physiotherapist: '🏥',
  gynecologist: '🏥',
  dentist: '🦷',
  ultrasound_specialist: '🏥',
  veterinarian: '🐾',
  // Education
  language_teacher: '📚',
  translator: '🌍',
  // Real Estate
  real_estate_agent: '🏢',
  relocation_assistant: '📦',
  mover: '🚚',
  // Home Services
  cleaning: '🧹',
  handyman: '🔧',
  electrician: '⚡',
  plumber: '🔩',
  architect: '📐',
  auto_mechanic: '🚗',
  tech_repair: '🔌',
  // Creative & Digital
  photographer: '📷',
  videographer: '🎥',
  content_creator: '📱',
  copywriter: '✍️',
  smm_manager: '📲',
  designer: '🎨',
  web_developer: '💻',
  ai_automation: '🤖',
  // Personal Services
  personal_assistant: '👤',
  driver: '🚗',
  courier: '📬',
  // Pets
  pet_sitter: '🐕',
  // Business & Marketing
  business_consultant: '💼',
  it_consultant: '🖥️',
  marketer: '📈',
  // Events & Lifestyle
  florist: '💐',
  event_planner: '🎉',
  pastry_chef: '🎂',
  sommelier: '🍷',
  // Tourism
  travel_manager: '✈️',
  tour_guide: '🗺️',
  // Fitness & Wellness
  yoga_instructor: '🧘',
  fitness_trainer: '💪',
  dietitian: '🥗',
  rehabilitation_specialist: '🏃',
  massage_therapist: '💆',
  // Beauty & Style
  hairdresser: '💇',
  makeup_artist: '💄',
  nail_technician: '💅',
  stylist: '👗',
};

export function getServiceIcon(code: string): string {
  return serviceIcons[code] || '💼';
}
