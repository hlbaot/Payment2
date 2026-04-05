'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';
import { getClientPortalRole } from '@/lib/portal';
import flashIcon from '@/images/flash.png';
import lockIcon from '@/images/lock.png';
import shieldIcon from '@/images/khien.png';
import riaStorefrontImage from '@/images/ria.avif';
import mapImage from '@/images/Map.png';
import appleStoreBadge from '@/images/Apple-Store_Primary-Mobile-App-Buttons_S_Illustration.svg';
import googlePlayBadge from '@/images/Google-Play_Primary-Mobile-App-Buttons_S_Illustration.svg';

const TRACK_APP_IMAGE =
  'https://www.riamoneytransfer.com/_next/image/?url=https%3A%2F%2Fimages.prismic.io%2Fria-public-site%2F94d4b38f-c820-4978-a690-4515440649a2_Track-Transfer-App_Homepage-Cards_L_Illustration.png%3Fauto%3Dcompress%2Cformat&w=1920&q=75';

const HUGGING_IMAGE =
  'https://www.riamoneytransfer.com/_next/image/?url=https%3A%2F%2Fimages.prismic.io%2Fria-public-site%2F7a86f830-a271-4298-bbec-c80af964e286_Women-Hugging_Homepage-Cards_L_Image.png%3Fauto%3Dcompress%2Cformat&w=1920&q=75';
const TRUSTPILOT_STARS_IMAGE = 'https://www.riamoneytransfer.com/trustpilotStars.svg';
const FIVE_STARS_IMAGE = 'https://www.riamoneytransfer.com/five-stars.svg';
const APP_STORE_LOGO = 'https://www.riamoneytransfer.com/app-store.svg';
const GOOGLE_PLAY_LOGO = 'https://www.riamoneytransfer.com/google-play.svg';
const TRUSTPILOT_LOGO = 'https://www.riamoneytransfer.com/trustpilot.svg';

const trustCards = [
  {
    icon: 'flash',
    image: flashIcon,
    titleKey: 'home.trust.fast.title',
    descriptionKey: 'home.trust.fast.desc',
  },
  {
    icon: 'lock',
    image: lockIcon,
    titleKey: 'home.trust.safe.title',
    descriptionKey: 'home.trust.safe.desc',
  },
  {
    icon: 'shield',
    image: shieldIcon,
    titleKey: 'home.trust.guaranteed.title',
    descriptionKey: 'home.trust.guaranteed.desc',
  },
];

const sendWays = [
  {
    icon: 'computer',
    titleKey: 'home.sendWays.online.title',
    descriptionKey: 'home.sendWays.online.desc',
  },
  {
    icon: 'phone',
    titleKey: 'home.sendWays.app.title',
    descriptionKey: 'home.sendWays.app.desc',
  },
  {
    icon: 'building',
    titleKey: 'home.sendWays.inPerson.title',
    descriptionKey: 'home.sendWays.inPerson.desc',
  },
];

const paymentMethods = [
  { key: 'Bank', keyLabel: 'home.payment.bank', icon: 'bank' },
  { key: 'Credit card', keyLabel: 'home.payment.creditCard', icon: 'card' },
  { key: 'Debit card', keyLabel: 'home.payment.debitCard', icon: 'card' },
  { key: 'Cash', keyLabel: 'home.payment.cash', icon: 'cash' },
] as const;

const deliveryMethods = [
  { key: 'Cash pickup', keyLabel: 'home.delivery.cashPickup', icon: 'wallet', rate: '1 USD = 18.011760 MXN' },
  { key: 'Bank', keyLabel: 'home.delivery.bank', icon: 'wallet', rate: '1 USD = 18.011760 MXN' },
  { key: 'Mobile wallet', keyLabel: 'home.delivery.mobileWallet', icon: 'wallet', rate: '1 USD = 18.011760 MXN' },
] as const;

const receiveWays = [
  {
    icon: 'cash',
    titleKey: 'home.receiveWays.cashPickup.title',
    descriptionKey: 'home.receiveWays.cashPickup.desc',
  },
  {
    icon: 'bank',
    titleKey: 'home.receiveWays.bank.title',
    descriptionKey: 'home.receiveWays.bank.desc',
  },
  {
    icon: 'wallet',
    titleKey: 'home.receiveWays.mobileWallet.title',
    descriptionKey: 'home.receiveWays.mobileWallet.desc',
  },
];

const reviews = [
  {
    author: 'home.reviews.a1.name',
    body: 'home.reviews.a1.body',
  },
  {
    author: 'home.reviews.a2.name',
    body: 'home.reviews.a2.body',
  },
  {
    author: 'home.reviews.a3.name',
    body: 'home.reviews.a3.body',
  },
];

const ratingLogos = [
  { name: 'App Store', score: '4,9/5, 243.3k', logo: APP_STORE_LOGO },
  { name: 'Google Play', score: '4,8/5, 227.7k', logo: GOOGLE_PLAY_LOGO },
  { name: 'Trustpilot', score: '4,5/5, 34.4k', logo: TRUSTPILOT_LOGO },
];

const countries = [
  { name: 'Afghanistan', colors: ['#101B62', '#D3202A', '#1D1D1D'] },
  { name: 'Albania', colors: ['#E74F0B', '#E74F0B', '#1D1D1D'] },
  { name: 'Algeria', colors: ['#0B8F59', '#FFFFFF', '#E64446'] },
  { name: 'Argentina', colors: ['#7EC3FF', '#FFFFFF', '#7EC3FF'] },
  { name: 'Armenia', colors: ['#D92C27', '#2450A4', '#F69C25'] },
  { name: 'Australia', colors: ['#2343A7', '#2343A7', '#E3393A'] },
  { name: 'Austria', colors: ['#ED4E34', '#FFFFFF', '#ED4E34'] },
  { name: 'Bahamas', colors: ['#0098C5', '#F5C53A', '#1A2A48'] },
  { name: 'Bangladesh', colors: ['#006A52', '#006A52', '#E53E3E'] },
  { name: 'Belgium', colors: ['#1F2937', '#F7C948', '#E3513E'] },
  { name: 'Benin', colors: ['#2FAE63', '#F7C948', '#E3513E'] },
  { name: 'Bolivia', colors: ['#D94747', '#F5C948', '#2FAE63'] },
];



export default function HomePage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const portalRole = getClientPortalRole();
    if (portalRole === 'supporter' || portalRole === 'admin') {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedIn) {
        router.replace('/login');
      } else if (portalRole === 'supporter') {
        router.replace('/supporter');
      } else {
        router.replace('/admin');
      }
    }
  }, [router]);

  const [activeSendTab, setActiveSendTab] = useState<'send' | 'receive'>('send');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<(typeof paymentMethods)[number]['key']>('Debit card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<(typeof deliveryMethods)[number]['key']>('Bank');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const activeWays = activeSendTab === 'send' ? sendWays : receiveWays;
  const sendSectionTitle =
    activeSendTab === 'send'
      ? t('home.sendSection.sendTitle')
      : t('home.sendSection.receiveTitle');

  return (
    <div className="home-remake">
      <section className="hero-remake">
        <div className="hero-remake__inner">
          <div className="hero-remake__copy">
            <h1 className="hero-remake__title">{t('home.hero.title')}</h1>
            <p className="hero-remake__description">
              {t('home.hero.desc')}
            </p>
          </div>

          <aside className="transfer-card" aria-label={t('home.transfer.aria')}>
            <div className="transfer-card__promo">
              <div className="transfer-card__promo-icon" aria-hidden="true">
                <TagIcon />
              </div>
              <div>
                <p className="transfer-card__promo-title">
                  {t('home.transfer.promo')}
                </p>
                <p className="transfer-card__promo-rate">
                  <span>1 USD =</span>
                  <span className="transfer-card__promo-old">17.55</span>
                  <strong>18.011760 MXN</strong>
                </p>
              </div>
            </div>

            <div className="transfer-card__stack">
              <div className="transfer-field">
                <div>
                  <p className="transfer-field__label">{t('home.transfer.youSend')}</p>
                  <div className="transfer-field__currency">
                    <USFlag />
                    <span>USD</span>
                  </div>
                </div>
                <p className="transfer-field__amount">1000</p>
              </div>

              <div className="transfer-field">
                <div>
                  <p className="transfer-field__label">{t('home.transfer.theyReceive')}</p>
                  <div className="transfer-field__currency">
                    <MexicoFlag />
                    <span>MXN</span>
                    <ChevronSoftIcon />
                  </div>
                </div>
                <p className="transfer-field__amount">18,011.76</p>
              </div>
            </div>

            <div className="transfer-card__options">
              <div className="transfer-option-row">
                <span>{t('home.transfer.paymentMethod')}</span>
                <button
                  type="button"
                  className="transfer-pill"
                  onClick={() => setShowPaymentModal(true)}
                >
                  {t(paymentMethods.find((method) => method.key === selectedPaymentMethod)?.keyLabel ?? 'home.payment.debitCard')}
                  <ChevronSoftIcon />
                </button>
              </div>

              <div className="transfer-option-row">
                <span>{t('home.transfer.deliveryMethod')}</span>
                <button
                  type="button"
                  className="transfer-pill"
                  onClick={() => setShowDeliveryModal(true)}
                >
                  {t(deliveryMethods.find((method) => method.key === selectedDeliveryMethod)?.keyLabel ?? 'home.delivery.bank')}
                  <ChevronSoftIcon />
                </button>
              </div>
            </div>

            <div className="transfer-card__divider" />

            <div className="transfer-card__summary">
              <div className="transfer-summary-row">
                <span>{t('home.transfer.fee')}</span>
                <div className="transfer-summary-row__fee">
                  <span className="transfer-summary-row__strike">1.99 USD</span>
                  <span className="transfer-summary-row__free">
                    {t('home.transfer.freeFee')} <InfoIcon />
                  </span>
                </div>
              </div>

              <div className="transfer-summary-row transfer-summary-row--total">
                <span>{t('home.transfer.totalToPay')}</span>
                <strong>1,000 USD</strong>
              </div>
            </div>

            <div className="transfer-card__actions">
              <Link href="/login" className="transfer-card__primary">
                {t('home.transfer.getStarted')}
              </Link>

              <Link href="/contact" className="transfer-card__secondary">
                <WhatsAppIcon />
                <span>{t('home.transfer.sendOnWhatsapp')}</span>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="promo-grid promo-grid--first">
        <div className="home-shell">
          <div className="promo-card promo-card--media">
            <div className="promo-card__whatsapp">
              
              <div className="promo-card__portrait">
                <img
                  src="/home/whatsapp-woman.avif"
                  alt="Woman using WhatsApp to send money"
                  className="promo-card__portrait-image"
                />
              </div>
            </div>
            <div className="promo-copy">
              <h2>{t('home.whatsapp.title')}</h2>
              <p>
                {t('home.whatsapp.desc')}
              </p>
              <div className="promo-copy__actions">
                <Link href="/login" className="promo-button promo-button--primary">
                  {t('home.whatsapp.sendMoney')}
                </Link>
                <Link href="/contact" className="promo-button promo-button--ghost">
                  {t('common.learnMore')}
                </Link>
              </div>
            </div>
          </div>

          <div className="promo-card promo-card--team">
            <div className="promo-copy">
              <h2>
                {t('home.team.titleLine1')}
                <br />
                {t('home.team.titleLine2')}
              </h2>
              <p>
                {t('home.team.descPrefix')}{' '}
                <strong>{t('home.team.descStrong')}</strong>
              </p>
              <div className="promo-copy__actions">
                <Link href="/login" className="promo-button promo-button--primary">
                  {t('home.team.sendToMexico')}
                </Link>
                <Link href="/about" className="promo-button promo-button--ghost">
                  {t('common.learnMore')}
                </Link>
              </div>
            </div>
            <div className="team-poster">
              <img
                src="/home/ria-fmf-sponsor.avif"
                alt="Ria joins the Mexican National Team"
                className="team-poster__image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="trust-section">
        <div className="home-shell">
          <div className="section-heading section-heading--center">
            <p>{t('home.trust.headingTop')}</p>
            <h2>{t('home.trust.headingBottom')}</h2>
          </div>

          <div className="trust-grid">
            {trustCards.map((item) => (
              <article key={item.titleKey} className="trust-card">
                <div className={`trust-card__icon trust-card__icon--${item.icon}`}>
                  <Image
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    className="trust-card__icon-image"
                    sizes="98px"
                  />
                </div>
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cash-section">
        <div className="home-shell cash-section__inner">
          <div className="cash-section__copy">
            <p className="eyebrow">{t('home.cash.eyebrow')}</p>
            <h2>{t('home.cash.title')}</h2>
            <p>
              {t('home.cash.desc')}
            </p>
            <Link href="/counter-market" className="promo-button promo-button--primary">
              {t('home.findLocation')}
            </Link>
          </div>

          <div className="storefront-card" aria-hidden="true">
            <Image
              src={riaStorefrontImage}
              alt=""
              className="storefront-card__image"
              sizes="(max-width: 1024px) 100vw, 56vw"
            />
          </div>
        </div>
      </section>

      <section className="send-section">
        <div className="home-shell">
          <div className="send-tabs" role="tablist" aria-label={t('home.sendTabs.aria')}>
            <button
              type="button"
              className={`send-tabs__item${activeSendTab === 'send' ? ' is-active' : ''}`}
              aria-selected={activeSendTab === 'send'}
              onClick={() => setActiveSendTab('send')}
            >
              {t('home.sendTabs.send')}
            </button>
            <button
              type="button"
              className={`send-tabs__item${activeSendTab === 'receive' ? ' is-active' : ''}`}
              aria-selected={activeSendTab === 'receive'}
              onClick={() => setActiveSendTab('receive')}
            >
              {t('home.sendTabs.receive')}
            </button>
          </div>

          <div className="section-heading section-heading--center section-heading--compact">
            <h2>{sendSectionTitle}</h2>
          </div>

          <div className="send-grid">
            {activeWays.map((item) => (
              <article key={item.titleKey} className="send-card">
                <div className={`send-card__icon send-card__icon--${item.icon}`}>
                  <MethodIcon kind={item.icon} />
                </div>
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="app-section">
        <div className="home-shell app-section__inner">
          <div className="app-section__art">
            <Image
              src={mapImage}
              alt={t('home.app.imageAlt')}
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
          </div>
          <div className="app-section__copy">
            <p className="eyebrow">{t('home.app.eyebrow')}</p>
            <h2>{t('home.app.title')}</h2>
            <p>
              {t('home.app.desc')}
            </p>
            <div className="badge-row">
              <span className="store-badge store-badge--image">
                <Image src={googlePlayBadge} alt={t('home.app.googlePlayAlt')} />
              </span>
              <span className="store-badge store-badge--image">
                <Image src={appleStoreBadge} alt={t('home.app.appStoreAlt')} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="home-shell">
          <div className="section-heading section-heading--center">
            <p>{t('home.reviews.headingTop')}</p>
            <h2>{t('home.reviews.headingBottom')}</h2>
          </div>

          <div className="reviews-grid">
            {reviews.map((review) => (
              <article key={review.author} className="review-card">
                <div className="review-card__stars" aria-label={t('home.reviews.starsAria')}>
                  <img src={TRUSTPILOT_STARS_IMAGE} alt="" className="review-card__stars-image" />
                </div>
                <p>{t(review.body)}</p>
                <span>— {t(review.author)}</span>
              </article>
            ))}
          </div>

          <div className="rating-strip">
            {ratingLogos.map((item) => (
              <div key={item.name} className="rating-strip__item">
                <div className="rating-strip__brand">
                  <img src={item.logo} alt={item.name} className="rating-strip__logo-image" />
                  <img src={FIVE_STARS_IMAGE} alt="" className="rating-strip__stars-image" />
                </div>
                <small>{item.score}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="spotlight-section">
        <div className="home-shell spotlight-grid">
          <article className="spotlight-card spotlight-card--warm">
            <p className="spotlight-card__eyebrow">{t('home.spotlight.cash.eyebrow')}</p>
            <h3>{t('home.spotlight.cash.title')}</h3>
            <div className="spotlight-card__media">
              <img src={HUGGING_IMAGE} alt="People hugging" />
            </div>
            <Link href="/counter-market" className="spotlight-card__link">
              {t('home.findLocation')}
              <ArrowIcon />
            </Link>
          </article>

          <article className="spotlight-card spotlight-card--cool">
            <div className="spotlight-card__art">
              <img src={TRACK_APP_IMAGE} alt="Track transfer illustration" />
            </div>
            <p className="spotlight-card__eyebrow">{t('home.spotlight.track.eyebrow')}</p>
            <h3>{t('home.spotlight.track.title')}</h3>
            <Link href="/orders" className="spotlight-card__link">
              {t('home.trackTransfer')}
              <ArrowIcon />
            </Link>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div className="home-shell cta-section__inner">
          <p>{t('home.cta.top')}</p>
          <h2>{t('home.cta.title')}</h2>
          <Link href="/login" className="promo-button promo-button--primary">
            {t('home.cta.button')}
          </Link>
        </div>
      </section>

      <section className="countries-section">
        <div className="home-shell">
          <div className="section-heading section-heading--center">
            <p>{t('home.countries.top')}</p>
            <h2>{t('home.countries.title')}</h2>
          </div>

          <div className="countries-grid">
            {countries.map((country) => (
              <div key={country.name} className="country-card hover:cursor-pointer">
                <span className="country-flag">
                  <span
                    className="country-flag__band"
                    style={{
                      background: `linear-gradient(180deg, ${country.colors[0]} 0 33%, ${country.colors[1]} 33% 66%, ${country.colors[2]} 66% 100%)`,
                    }}
                  />
                </span>
                <span>{country.name}</span>
              </div>
            ))}
          </div>

          <button type="button" className="countries-section__button">
            {t('home.countries.showAll')} <ChevronSoftIcon />
          </button>
        </div>
      </section>

      {showPaymentModal ? (
        <div
          className="method-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('home.transfer.paymentMethod')}
          onClick={() => setShowPaymentModal(false)}
        >
          <div className="method-modal__card" onClick={(event) => event.stopPropagation()}>
            <div className="method-modal__header">
              <h3>{t('home.transfer.paymentMethod')}</h3>
              <button
                type="button"
                className="method-modal__close"
                onClick={() => setShowPaymentModal(false)}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="method-modal__list">
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod === method.key;

                return (
                  <button
                    key={method.key}
                    type="button"
                    className={`method-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      setSelectedPaymentMethod(method.key);
                      setShowPaymentModal(false);
                    }}
                  >
                    <span className="method-option__icon" aria-hidden="true">
                      <MethodOptionIcon kind={method.icon} />
                    </span>
                    <span className="method-option__label">{t(method.keyLabel)}</span>
                    {isSelected ? (
                      <span className="method-option__check" aria-hidden="true">
                        <CheckCircleIcon />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showDeliveryModal ? (
        <div
          className="method-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('home.transfer.deliveryMethod')}
          onClick={() => setShowDeliveryModal(false)}
        >
          <div className="method-modal__card" onClick={(event) => event.stopPropagation()}>
            <div className="method-modal__header">
              <h3>{t('home.transfer.deliveryMethod')}</h3>
              <button
                type="button"
                className="method-modal__close"
                onClick={() => setShowDeliveryModal(false)}
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="method-modal__list">
              {deliveryMethods.map((method) => {
                const isSelected = selectedDeliveryMethod === method.key;

                return (
                  <button
                    key={method.key}
                    type="button"
                    className={`method-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => {
                      setSelectedDeliveryMethod(method.key);
                      setShowDeliveryModal(false);
                    }}
                  >
                    <span className="method-option__icon" aria-hidden="true">
                      <MethodOptionIcon kind={method.icon} />
                    </span>

                    <span className="method-option__content">
                      <span className="method-option__label">{t(method.keyLabel)}</span>
                      <span className="method-option__rate">{method.rate}</span>
                    </span>

                    {isSelected ? (
                      <span className="method-option__check" aria-hidden="true">
                        <CheckCircleIcon />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.6 13.4 12.8 21.2a2 2 0 0 1-2.8 0L3 14.2V5a2 2 0 0 1 2-2h9.2l7 7a2 2 0 0 1 0 2.8Z"
        stroke="#12723C"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="7.4" cy="7.4" r="1.2" fill="#12723C" />
    </svg>
  );
}

function ChevronSoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.2" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" stroke="#FF6600" strokeWidth="2" />
      <path
        d="m8.4 12.2 2.2 2.2 5-5"
        stroke="#FF6600"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M27.2 15.3c0 6.2-5 11.2-11.2 11.2-1.9 0-3.7-.5-5.3-1.4L5 26.6l1.6-5.5a11.1 11.1 0 0 1-1.8-5.8C4.8 9 9.8 4 16 4s11.2 5 11.2 11.3Z"
        stroke="#25D366"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 10.8c.4-.9.9-.9 1.2-.9.3 0 .7 0 1 .8.3.8 1.1 2.7 1.2 2.9.1.2.2.5 0 .8s-.4.5-.6.8c-.2.2-.4.4-.1.8.3.5 1.3 2.2 3.1 3.1.4.2.7.2.9 0 .2-.2.8-.9 1.1-1.2.2-.3.5-.2.8-.1.3.1 2 .9 2.3 1 .3.2.5.2.6.4.1.2.1 1-.2 1.8-.3.7-1.7 1.6-2.4 1.7-.6.1-1.4.2-4.4-1.2-3.6-1.8-5.8-6.1-6-6.4-.2-.3-1.5-2-.9-3.8Z"
        fill="#25D366"
      />
    </svg>
  );
}

function WhatsAppSolidIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        d="M10.7 23.6 11.8 20a7.2 7.2 0 1 1 2.8 2.6l-3.9 1Zm4.6-4.3c2.4 1.4 4.1 1.5 5 .9.5-.4 1-1.1 1.1-1.6.1-.3 0-.5-.3-.6l-1.8-.8c-.3-.1-.5-.1-.7.1l-.8.9c-.2.2-.4.2-.6.1-.9-.4-2.2-1.6-2.7-2.5-.1-.2-.1-.4.1-.6l.7-.8c.2-.2.2-.4.1-.7l-.8-1.8c-.1-.3-.3-.4-.6-.3-.5.1-1.2.6-1.5 1.1-.6.9-.4 2.6 1 4.9Z"
        fill="#fff"
      />
    </svg>
  );
}

function MethodIcon({ kind }: { kind: string }) {
  if (kind === 'cash') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        💸
      </span>
    );
  }

  if (kind === 'bank') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        🏦
      </span>
    );
  }

  if (kind === 'wallet') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        📲
      </span>
    );
  }

  if (kind === 'computer') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        💻
      </span>
    );
  }

  if (kind === 'phone') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        📱
      </span>
    );
  }

  if (kind === 'building') {
    return (
      <span className="send-card__emoji-icon" aria-hidden="true">
        🏪
      </span>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16v10H4z" stroke="currentColor" strokeWidth="2" />
      <path d="M2 18h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MethodOptionIcon({ kind }: { kind: 'bank' | 'card' | 'cash' | 'wallet' }) {
  if (kind === 'bank') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 9h18M5 21h14M6 9v9M10 9v9M14 9v9M18 9v9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9 12 4l9 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'cash') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="7.5" width="17" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        <path d="M6.5 12h.01M17.5 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'wallet') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="7.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3.5 11h17" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.8" cy="13.7" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="7.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 11h17" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function USFlag() {
  return (
    <span className="flag flag--us" aria-hidden="true">
      <span className="flag__canton" />
    </span>
  );
}

function MexicoFlag() {
  return (
    <span className="flag flag--mx" aria-hidden="true">
      <span className="flag__seal" />
    </span>
  );
}
