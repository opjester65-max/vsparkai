export type AlertTimingOption = '15 mins before' | '1 hour before' | 'Exact time';

export interface EmailNotificationSettings {
  recipientEmail: string;
  alertTiming: AlertTimingOption;
  subjectTemplate: string;
  enabled: boolean;
}

export interface EmailDispatchLogEntry {
  id: string;
  recipientEmail: string;
  subject: string;
  timing: AlertTimingOption;
  channel: 'emailjs' | 'studio-webhook';
  dispatchedAt: string;
}

const SETTINGS_KEY_PREFIX = 'vspark_email_prefs_v1_';
const DISPATCH_LOG_KEY = 'vspark_email_dispatch_log_v1';

export function getDefaultEmailSettings(fallbackEmail: string): EmailNotificationSettings {
  return {
    recipientEmail: fallbackEmail,
    alertTiming: '15 mins before',
    subjectTemplate: 'Reminder: Your [Platform] post goes live!',
    enabled: true,
  };
}

export function readEmailSettings(
  userId: string,
  fallbackEmail: string
): EmailNotificationSettings {
  try {
    const raw = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${userId}`);
    if (raw) {
      return {
        ...getDefaultEmailSettings(fallbackEmail),
        ...(JSON.parse(raw) as Partial<EmailNotificationSettings>),
      };
    }
  } catch {
    // Ignore storage read error
  }
  return getDefaultEmailSettings(fallbackEmail);
}

export function saveEmailSettings(
  userId: string,
  settings: EmailNotificationSettings
): void {
  try {
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${userId}`, JSON.stringify(settings));
  } catch {
    // Ignore storage write error
  }
}

export function readEmailDispatchLogs(): EmailDispatchLogEntry[] {
  try {
    const raw = localStorage.getItem(DISPATCH_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmailDispatchLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendEmailDispatchLog(entry: EmailDispatchLogEntry): EmailDispatchLogEntry[] {
  const updated = [entry, ...readEmailDispatchLogs()].slice(0, 10);
  try {
    localStorage.setItem(DISPATCH_LOG_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage write error
  }
  return updated;
}

export function interpolateSubjectTemplate(
  template: string,
  platform: string,
  timing: string
): string {
  return template
    .replace(/\[Platform\]/gi, platform)
    .replace(/\[Time\]/gi, timing)
    .replace(/\[Status\]/gi, 'Scheduled');
}

export function isEmailJsConfigured(): boolean {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  return Boolean(
    serviceId &&
      templateId &&
      publicKey &&
      !serviceId.includes('your-emailjs') &&
      !templateId.includes('your-emailjs') &&
      !publicKey.includes('your-emailjs')
  );
}

export async function sendTestEmailReminder(params: {
  settings: EmailNotificationSettings;
  platform?: string;
  previewText?: string;
}): Promise<{ entry: EmailDispatchLogEntry; logs: EmailDispatchLogEntry[] }> {
  const { settings, platform = 'LinkedIn', previewText = '' } = params;
  const recipient = settings.recipientEmail.trim();
  if (!recipient || !recipient.includes('@')) {
    throw new Error('Please enter a valid recipient email address.');
  }

  const resolvedSubject = interpolateSubjectTemplate(
    settings.subjectTemplate || 'Reminder: Your [Platform] post goes live!',
    platform,
    settings.alertTiming
  );

  if (isEmailJsConfigured()) {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        template_id: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        user_id: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: recipient,
          subject: resolvedSubject,
          platform,
          timing: settings.alertTiming,
          message:
            previewText ||
            `Your scheduled ${platform} post in Vspark Studio is queued (${settings.alertTiming}).`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `EmailJS API returned HTTP ${response.status}.`);
    }

    const entry: EmailDispatchLogEntry = {
      id: `email-${Date.now()}`,
      recipientEmail: recipient,
      subject: resolvedSubject,
      timing: settings.alertTiming,
      channel: 'emailjs',
      dispatchedAt: new Date().toISOString(),
    };
    return { entry, logs: appendEmailDispatchLog(entry) };
  }

  const webhookRes = await fetch('/api/notifications/test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipientEmail: recipient,
      subject: resolvedSubject,
      platform,
      timing: settings.alertTiming,
      previewText,
    }),
  });

  const payload = await webhookRes.json();
  if (!webhookRes.ok) {
    throw new Error(payload.error || 'Failed to dispatch test email reminder.');
  }

  const entry: EmailDispatchLogEntry = {
    id: `email-${Date.now()}`,
    recipientEmail: recipient,
    subject: resolvedSubject,
    timing: settings.alertTiming,
    channel: 'studio-webhook',
    dispatchedAt: payload.dispatchedAt || new Date().toISOString(),
  };

  return { entry, logs: appendEmailDispatchLog(entry) };
}
