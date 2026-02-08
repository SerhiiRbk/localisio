// ============================================================
// Email Templates - Bilingual content for all email types
// Each template has content in 4 locales: en, ru, uk, es
// ============================================================

export type EmailTemplateName =
  | 'profile_approved'
  | 'profile_verified'
  | 'unread_digest'
  | 'inactive_reminder';

export interface EmailTemplateContent {
  subject: string;
  greeting: string;
  body: string;
  cta?: string;
  ctaUrl?: string;
  closing: string;
}

type LocaleTemplates = Record<string, EmailTemplateContent>;

// ============================================================
// Profile Approved
// ============================================================
const profileApproved: LocaleTemplates = {
  en: {
    subject: 'Your profile has been approved!',
    greeting: 'Great news!',
    body: `Your professional profile on Localisio has been reviewed and approved by our team. Your profile is now live and visible to potential clients in search results.

Here are a few tips to get the most out of your profile:

- Complete all sections of your profile — the more details, the better
- Add photos to make your profile stand out
- Respond to messages promptly — clients appreciate fast replies

We're excited to have you on board and wish you great success!`,
    cta: 'Go to Dashboard',
    closing: 'The Localisio Team',
  },
  ru: {
    subject: 'Ваш профиль одобрен!',
    greeting: 'Отличные новости!',
    body: `Ваш профессиональный профиль на Localisio был проверен и одобрен нашей командой. Ваш профиль теперь доступен и виден потенциальным клиентам в результатах поиска.

Несколько советов, чтобы получить максимум от вашего профиля:

- Заполните все разделы профиля — чем больше деталей, тем лучше
- Добавьте фотографии, чтобы ваш профиль выделялся
- Отвечайте на сообщения оперативно — клиенты ценят быстрые ответы

Мы рады, что вы с нами, и желаем вам успехов!`,
    cta: 'Перейти в кабинет',
    closing: 'Команда Localisio',
  },
  uk: {
    subject: 'Ваш профіль схвалено!',
    greeting: 'Чудові новини!',
    body: `Ваш професійний профіль на Localisio був перевірений та схвалений нашою командою. Ваш профіль тепер доступний і видимий потенційним клієнтам у результатах пошуку.

Кілька порад, щоб отримати максимум від вашого профілю:

- Заповніть усі розділи профілю — чим більше деталей, тим краще
- Додайте фотографії, щоб ваш профіль виділявся
- Відповідайте на повідомлення оперативно — клієнти цінують швидкі відповіді

Ми раді, що ви з нами, і бажаємо вам успіхів!`,
    cta: 'Перейти до кабінету',
    closing: 'Команда Localisio',
  },
  es: {
    subject: '¡Tu perfil ha sido aprobado!',
    greeting: '¡Grandes noticias!',
    body: `Tu perfil profesional en Localisio ha sido revisado y aprobado por nuestro equipo. Tu perfil ahora está visible para clientes potenciales en los resultados de búsqueda.

Algunos consejos para aprovechar al máximo tu perfil:

- Completa todas las secciones de tu perfil — cuantos más detalles, mejor
- Añade fotos para que tu perfil destaque
- Responde a los mensajes rápidamente — los clientes valoran las respuestas rápidas

¡Estamos encantados de tenerte y te deseamos mucho éxito!`,
    cta: 'Ir al panel',
    closing: 'El equipo de Localisio',
  },
};

// ============================================================
// Profile Verified
// ============================================================
const profileVerified: LocaleTemplates = {
  en: {
    subject: 'Your profile is now verified!',
    greeting: 'Congratulations!',
    body: `Your profile on Localisio has been verified by our team. A verification badge now appears on your profile, showing clients that you have been reviewed and trusted by Localisio.

What this means for you:

- Higher visibility in search results
- More trust from potential clients
- Better conversion rates on your profile

Thank you for being a valued member of our community!`,
    cta: 'View My Profile',
    closing: 'The Localisio Team',
  },
  ru: {
    subject: 'Ваш профиль верифицирован!',
    greeting: 'Поздравляем!',
    body: `Ваш профиль на Localisio был верифицирован нашей командой. Значок верификации теперь отображается в вашем профиле, показывая клиентам, что вы были проверены и одобрены Localisio.

Что это значит для вас:

- Более высокая видимость в результатах поиска
- Больше доверия со стороны потенциальных клиентов
- Лучшая конверсия на вашем профиле

Спасибо, что вы ценный участник нашего сообщества!`,
    cta: 'Просмотреть мой профиль',
    closing: 'Команда Localisio',
  },
  uk: {
    subject: 'Ваш профіль верифіковано!',
    greeting: 'Вітаємо!',
    body: `Ваш профіль на Localisio був верифікований нашою командою. Значок верифікації тепер відображається у вашому профілі, показуючи клієнтам, що ви були перевірені та схвалені Localisio.

Що це означає для вас:

- Вища видимість у результатах пошуку
- Більше довіри з боку потенційних клієнтів
- Краща конверсія на вашому профілі

Дякуємо, що ви цінний учасник нашої спільноти!`,
    cta: 'Переглянути мій профіль',
    closing: 'Команда Localisio',
  },
  es: {
    subject: '¡Tu perfil está verificado!',
    greeting: '¡Felicidades!',
    body: `Tu perfil en Localisio ha sido verificado por nuestro equipo. Una insignia de verificación ahora aparece en tu perfil, mostrando a los clientes que has sido revisado y aprobado por Localisio.

Lo que esto significa para ti:

- Mayor visibilidad en los resultados de búsqueda
- Más confianza de clientes potenciales
- Mejores tasas de conversión en tu perfil

¡Gracias por ser un miembro valioso de nuestra comunidad!`,
    cta: 'Ver mi perfil',
    closing: 'El equipo de Localisio',
  },
};

// ============================================================
// Unread Messages Digest
// ============================================================
const unreadDigest: LocaleTemplates = {
  en: {
    subject: 'You have new unread messages',
    greeting: 'Hi there!',
    body: `You have unread messages waiting for you on Localisio. Clients are reaching out — don't miss the opportunity to connect!

Quick responses help you build trust and get more clients. Log in to check your messages and keep the conversation going.`,
    cta: 'Check Messages',
    closing: 'The Localisio Team',
  },
  ru: {
    subject: 'У вас есть непрочитанные сообщения',
    greeting: 'Привет!',
    body: `У вас есть непрочитанные сообщения на Localisio. Клиенты обращаются к вам — не упустите возможность!

Быстрые ответы помогают укрепить доверие и привлечь больше клиентов. Зайдите, чтобы проверить сообщения и продолжить общение.`,
    cta: 'Проверить сообщения',
    closing: 'Команда Localisio',
  },
  uk: {
    subject: 'У вас є непрочитані повідомлення',
    greeting: 'Привіт!',
    body: `У вас є непрочитані повідомлення на Localisio. Клієнти звертаються до вас — не пропустіть можливість!

Швидкі відповіді допомагають зміцнити довіру та залучити більше клієнтів. Зайдіть, щоб перевірити повідомлення та продовжити спілкування.`,
    cta: 'Перевірити повідомлення',
    closing: 'Команда Localisio',
  },
  es: {
    subject: 'Tienes mensajes sin leer',
    greeting: '¡Hola!',
    body: `Tienes mensajes sin leer en Localisio. Los clientes se están comunicando contigo — ¡no pierdas la oportunidad!

Las respuestas rápidas te ayudan a generar confianza y conseguir más clientes. Inicia sesión para revisar tus mensajes y mantener la conversación.`,
    cta: 'Revisar mensajes',
    closing: 'El equipo de Localisio',
  },
};

// ============================================================
// Inactive Provider Reminder
// ============================================================
const inactiveReminder: LocaleTemplates = {
  en: {
    subject: 'We miss you on Localisio!',
    greeting: 'Hey, it\'s been a while!',
    body: `We noticed you haven't visited Localisio in over a week. Your profile is still active and clients may be looking for your services right now.

Here's why it's good to stay active:

- Active profiles rank higher in search results
- Clients prefer providers who respond quickly
- You might have new messages or opportunities waiting

Pop in and see what's new — it only takes a moment!`,
    cta: 'Visit Dashboard',
    closing: 'The Localisio Team',
  },
  ru: {
    subject: 'Мы скучаем по вам на Localisio!',
    greeting: 'Привет, давно не виделись!',
    body: `Мы заметили, что вы не заходили на Localisio больше недели. Ваш профиль по-прежнему активен, и клиенты могут искать ваши услуги прямо сейчас.

Почему важно оставаться активным:

- Активные профили занимают более высокие позиции в поиске
- Клиенты предпочитают провайдеров, которые отвечают быстро
- У вас могут быть новые сообщения или возможности

Загляните и посмотрите, что нового — это займёт всего минуту!`,
    cta: 'Перейти в кабинет',
    closing: 'Команда Localisio',
  },
  uk: {
    subject: 'Ми сумуємо за вами на Localisio!',
    greeting: 'Привіт, давно не бачились!',
    body: `Ми помітили, що ви не заходили на Localisio більше тижня. Ваш профіль все ще активний, і клієнти можуть шукати ваші послуги прямо зараз.

Чому важливо залишатися активним:

- Активні профілі займають вищі позиції в пошуку
- Клієнти надають перевагу провайдерам, які відповідають швидко
- У вас можуть бути нові повідомлення або можливості

Зайдіть і подивіться, що нового — це займе лише хвилину!`,
    cta: 'Перейти до кабінету',
    closing: 'Команда Localisio',
  },
  es: {
    subject: '¡Te extrañamos en Localisio!',
    greeting: '¡Hola, ha pasado un tiempo!',
    body: `Notamos que no has visitado Localisio en más de una semana. Tu perfil sigue activo y los clientes pueden estar buscando tus servicios ahora mismo.

Por qué es bueno mantenerte activo:

- Los perfiles activos aparecen más arriba en los resultados de búsqueda
- Los clientes prefieren proveedores que responden rápido
- Podrías tener nuevos mensajes u oportunidades esperándote

¡Pasa a ver qué hay de nuevo — solo toma un momento!`,
    cta: 'Ir al panel',
    closing: 'El equipo de Localisio',
  },
};

// ============================================================
// Template Registry
// ============================================================
const templates: Record<EmailTemplateName, LocaleTemplates> = {
  profile_approved: profileApproved,
  profile_verified: profileVerified,
  unread_digest: unreadDigest,
  inactive_reminder: inactiveReminder,
};

/**
 * Get email template content for a given template name and locale.
 * Falls back to English if locale is not found.
 */
export function getEmailTemplate(
  templateName: EmailTemplateName,
  locale: string
): EmailTemplateContent {
  const localeTemplates = templates[templateName];
  return localeTemplates[locale] || localeTemplates.en;
}

/**
 * Get the English version of a template (used for the bilingual duplicate).
 */
export function getEnglishTemplate(templateName: EmailTemplateName): EmailTemplateContent {
  return templates[templateName].en;
}
