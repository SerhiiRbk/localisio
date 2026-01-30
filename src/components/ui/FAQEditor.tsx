'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import type { FAQItem } from '@/types/database';

const MAX_FAQ_ITEMS = 5;
const MAX_TOTAL_CHARS = 2500;

// FAQ example placeholders for each language
const FAQ_EXAMPLES: Record<string, { question: string; answer: string }[]> = {
  en: [
    {
      question: 'What services do you offer?',
      answer: 'I provide comprehensive legal consultation for immigration matters, including visa applications, residence permits, and citizenship procedures.',
    },
    {
      question: 'How can I book a consultation?',
      answer: 'You can send me a message through this platform, and I will respond within 24 hours to schedule a convenient time.',
    },
  ],
  ru: [
    {
      question: 'Какие услуги вы предоставляете?',
      answer: 'Я предоставляю комплексные юридические консультации по вопросам иммиграции, включая подачу заявлений на визу, вид на жительство и гражданство.',
    },
    {
      question: 'Как записаться на консультацию?',
      answer: 'Вы можете отправить мне сообщение через эту платформу, и я отвечу в течение 24 часов, чтобы назначить удобное время.',
    },
  ],
  uk: [
    {
      question: 'Які послуги ви надаєте?',
      answer: 'Я надаю комплексні юридичні консультації з питань імміграції, включаючи подачу заяв на візу, посвідку на проживання та громадянство.',
    },
    {
      question: 'Як записатися на консультацію?',
      answer: 'Ви можете надіслати мені повідомлення через цю платформу, і я відповім протягом 24 годин, щоб призначити зручний час.',
    },
  ],
  es: [
    {
      question: '¿Qué servicios ofrece?',
      answer: 'Ofrezco consultas legales integrales para asuntos de inmigración, incluyendo solicitudes de visa, permisos de residencia y procedimientos de ciudadanía.',
    },
    {
      question: '¿Cómo puedo reservar una consulta?',
      answer: 'Puede enviarme un mensaje a través de esta plataforma y responderé dentro de las 24 horas para programar un horario conveniente.',
    },
  ],
};

interface FAQEditorProps {
  value: FAQItem[];
  onChange: (faq: FAQItem[]) => void;
  error?: string;
}

export function FAQEditor({ value, onChange, error }: FAQEditorProps) {
  const t = useTranslations('faq.editor');
  const locale = useLocale();
  const [localItems, setLocalItems] = useState<FAQItem[]>(value);

  useEffect(() => {
    setLocalItems(value);
  }, [value]);

  const examples = FAQ_EXAMPLES[locale] || FAQ_EXAMPLES.en;

  const getTotalCharCount = (items: FAQItem[]) => {
    return items.reduce(
      (sum, item) => sum + item.question.length + item.answer.length,
      0
    );
  };

  const totalChars = getTotalCharCount(localItems);
  const canAddMore = localItems.length < MAX_FAQ_ITEMS && totalChars < MAX_TOTAL_CHARS;

  const handleAddItem = () => {
    if (!canAddMore) return;
    const newItems = [...localItems, { question: '', answer: '' }];
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleUpdateItem = (index: number, field: 'question' | 'answer', value: string) => {
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...localItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setLocalItems(newItems);
    onChange(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === localItems.length - 1) return;
    const newItems = [...localItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setLocalItems(newItems);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{t('description')}</p>
          <p className="text-xs text-slate-500 mt-1">
            {t('charCount', { current: totalChars, max: MAX_TOTAL_CHARS })}
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {localItems.length}/{MAX_FAQ_ITEMS}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {localItems.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-500 mb-4">{t('empty')}</p>
          <Button type="button" variant="outline" onClick={handleAddItem}>
            {t('addFirst')}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {localItems.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {t('itemNumber', { number: index + 1 })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title={t('moveUp')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === localItems.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  title={t('moveDown')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 text-red-400 hover:text-red-600 ml-2"
                  title={t('remove')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <Input
              label={t('question')}
              placeholder={examples[index % examples.length]?.question || t('questionPlaceholder')}
              value={item.question}
              onChange={(e) => handleUpdateItem(index, 'question', e.target.value)}
              maxLength={200}
            />

            <Textarea
              label={t('answer')}
              placeholder={examples[index % examples.length]?.answer || t('answerPlaceholder')}
              value={item.answer}
              onChange={(e) => handleUpdateItem(index, 'answer', e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        ))}
      </div>

      {localItems.length > 0 && canAddMore && (
        <Button type="button" variant="outline" onClick={handleAddItem} className="w-full">
          {t('addMore')}
        </Button>
      )}

      {totalChars > MAX_TOTAL_CHARS && (
        <p className="text-sm text-red-600">
          {t('charLimitExceeded', { excess: totalChars - MAX_TOTAL_CHARS })}
        </p>
      )}
    </div>
  );
}
