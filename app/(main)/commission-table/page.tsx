'use client';

import InfoPage from '@/components/InfoPage';
import { useI18n } from '@/components/I18nProvider';

export default function CommissionTablePage() {
  const { t } = useI18n();

  return (
    <InfoPage
      eyebrow={t('commission.eyebrow')}
      title={t('commission.title')}
      description={t('commission.description')}
      highlights={[
        t('commission.highlight1'),
        t('commission.highlight2'),
        t('commission.highlight3'),
      ]}
      primaryAction={{ href: '/counter-market', label: t('commission.primaryAction') }}
      secondaryAction={{ href: '/create-order', label: t('commission.secondaryAction') }}
    />
  );
}
