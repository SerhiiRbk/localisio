'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { services, getServiceIcon, getServiceLabel } from '@/config/services';
import { createClient } from '@/lib/supabase/client';

// Service categories with descriptions (safe, non-licensed services focus)
const serviceCategories = [
  {
    id: 'documents_consulting',
    icon: '📋',
    services: ['document_assistant', 'immigration_consultant', 'customs_broker', 'accounting_assistant', 'translator'],
  },
  {
    id: 'education',
    icon: '📚',
    services: ['language_teacher', 'school_tutor', 'programming_teacher', 'music_instructor', 'solfeggio_teacher', 'driving_instructor', 'conversation_club', 'acting_coach', 'public_speaking'],
  },
  {
    id: 'real_estate_relocation',
    icon: '🏠',
    services: ['real_estate_agent', 'relocation_assistant', 'business_relocation', 'mover', 'passenger_transport', 'freight_transport', 'goods_delivery'],
  },
  {
    id: 'home_services',
    icon: '🔧',
    services: ['cleaning', 'dry_cleaning', 'handyman', 'electrician', 'plumber', 'interior_design', 'auto_mechanic', 'tech_repair', 'construction_consultant', 'tailor', 'shoe_repair', 'locksmith', 'jeweler', 'glazier', 'furniture_assembly', 'custom_furniture'],
  },
  {
    id: 'creative_digital',
    icon: '🎨',
    services: ['photographer', 'videographer', 'video_editor', 'content_creator', 'copywriter', 'smm_manager', 'designer', 'web_developer', '3d_printing', 'handmade_crafts', 'mobile_app_developer'],
  },
  {
    id: 'personal_services',
    icon: '👤',
    services: ['personal_assistant', 'driver', 'nanny', 'pet_sitter', 'dog_walking', 'courier'],
  },
  {
    id: 'business_it',
    icon: '💼',
    services: ['ai_automation', 'business_consultant', 'it_consultant', 'marketer', 'investment_consultant', 'hr_consultant', 'ml_specialist', 'devops_consultant', 'sales_specialist', 'personal_branding', 'project_manager', 'qa_tester'],
  },
  {
    id: 'events_tourism',
    icon: '🎉',
    services: ['florist', 'event_planner', 'pastry_chef', 'catering', 'mc_host', 'sommelier', 'musician', 'travel_manager', 'tour_guide', 'hiking_organizer'],
  },
  {
    id: 'wellness_lifestyle',
    icon: '🧘',
    services: ['yoga_instructor', 'fitness_trainer', 'sports_instructor', 'dietitian', 'rehabilitation_specialist', 'massage_therapist', 'motivation_consultant', 'tarot_reader', 'shopping_consultant', 'beauty_consultant'],
  },
  {
    id: 'beauty_style',
    icon: '💅',
    services: ['hairdresser', 'makeup_artist', 'nail_technician', 'stylist'],
  },
];

export default function ServicesPage() {
  const t = useTranslations('servicesPage');
  const commonT = useTranslations('common');
  const [locale, setLocale] = useState('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Get locale from document
    const htmlLang = document.documentElement.lang;
    if (htmlLang) setLocale(htmlLang);

    // Check if user is logged in
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch('/api/services/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedback.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send feedback');
      }

      setSubmitSuccess(true);
      setFeedback('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> {t('hero.badge1')}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> {t('hero.badge2')}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> {t('hero.badge3')}
            </span>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">ℹ️</span>
              <span>{t('disclaimer')}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-12">
            {serviceCategories.map((category) => (
              <div key={category.id} className="scroll-mt-20" id={category.id}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {t(`categories.${category.id}.title`)}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      {t(`categories.${category.id}.description`)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {category.services
                    .filter((code) => services.some((s) => s.code === code))
                    .map((serviceCode) => (
                      <Link
                        key={serviceCode}
                        href={`/experts/${serviceCode}`}
                        className="group"
                      >
                        <Card className="h-full hover:shadow-md hover:border-blue-300 transition-all">
                          <CardContent className="p-4 text-center">
                            <span className="text-2xl mb-2 block">
                              {getServiceIcon(serviceCode)}
                            </span>
                            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                              {getServiceLabel(serviceCode, locale)}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {t('feedback.title')}
              </h2>
              <p className="text-slate-600 mb-6">
                {t('feedback.subtitle')}
              </p>

              {isLoggedIn ? (
                <form onSubmit={handleSubmitFeedback}>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={t('feedback.placeholder')}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none min-h-[120px]"
                    maxLength={1000}
                    rows={4}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {feedback.length}/1000
                    </span>
                    <Button
                      type="submit"
                      disabled={!feedback.trim() || isSubmitting}
                      isLoading={isSubmitting}
                    >
                      {t('feedback.submit')}
                    </Button>
                  </div>

                  {submitSuccess && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                      {t('feedback.success')}
                    </div>
                  )}

                  {submitError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {submitError}
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-600 mb-4">{t('feedback.loginRequired')}</p>
                  <Link href="/auth/sign-in">
                    <Button>{t('feedback.signIn')}</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-slate-600 mb-6">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/experts">
              <Button size="lg">{t('cta.findExperts')}</Button>
            </Link>
            <Link href="/auth/sign-up?role=provider">
              <Button size="lg" variant="outline">{t('cta.becomeExpert')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
