import { useConfirm } from '@sk-web-gui/react';
import router from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useRouteGuard(
  showWarning: boolean,
  options?: {
    warningTitle?: string;
    warningText?: string;
    confirmLabel?: string;
    dismissLabel?: string;
  }
): {
  confirm: (options?: {
    warningTitle: string;
    warningText: string;
    confirmLabel?: string;
    dismissLabel?: string;
  }) => Promise<boolean>;
} {
  const { t } = useTranslation();
  const [active, setActive] = useState<boolean>(false);
  const title = options?.warningTitle ?? t('common:unsaved_changes');
  const text = options?.warningText ?? t('common:do_you_want_to_leave');
  const confirmLabel = options?.confirmLabel;
  const dismissLabel = options?.dismissLabel;
  const { showConfirmation } = useConfirm();

  useEffect(() => {
    setActive(showWarning);
  }, [showWarning]);

  useEffect(() => {
    const confirmRouterChange = async (url: string) => {
      const confirm = await showConfirmation(title, text, confirmLabel, dismissLabel, 'info');
      if (confirm) {
        setActive(false);
        void router.push(url);
      }
    };

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!active) return;
      // Modern browsers show the native "leave site?" prompt on preventDefault alone;
      // the legacy `e.returnValue` assignment is deprecated.
      e.preventDefault();
    };

    const handleBrowseAway = (url: string) => {
      if (!active) return;
      void confirmRouterChange(url);
      router.events.emit('routeChangeError');
      throw new Error('routing cancelled. Confirm to continue.');
    };

    window.addEventListener('beforeunload', handleWindowClose);
    router.events.on('routeChangeStart', handleBrowseAway);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [active, showConfirmation, text, title, confirmLabel, dismissLabel]);

  async function confirmer(
    options: {
      warningTitle: string;
      warningText: string;
      confirmLabel?: string;
      dismissLabel?: string;
    } = {
      warningTitle: title,
      warningText: text,
      confirmLabel: confirmLabel,
      dismissLabel: dismissLabel,
    }
  ) {
    if (!active) return true;
    const confirm = await showConfirmation(
      options.warningTitle,
      options.warningText,
      options.confirmLabel,
      options.dismissLabel
    );

    return confirm;
  }

  return { confirm: confirmer };
}
