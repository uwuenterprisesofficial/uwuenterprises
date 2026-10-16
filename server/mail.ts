import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Optional SMTP mail sending (access data for new talent accounts).
 * Disabled unless SMTP_HOST and MAIL_FROM are set — the dashboard then falls back to "open in my mail program".
 */
const env = process.env;

export const mailConfig = {
  host: env.SMTP_HOST ?? '',
  port: Number(env.SMTP_PORT ?? 587),
  /** true = implicit TLS (usually port 465); false = STARTTLS when the server offers it (port 587) */
  secure: (env.SMTP_SECURE ?? '').toLowerCase() === 'true',
  user: env.SMTP_USER ?? '',
  password: env.SMTP_PASSWORD ?? '',
  from: env.MAIL_FROM ?? '',
  /** public address of the site, used for the login link in mails (falls back to the request's origin) */
  publicUrl: (env.PUBLIC_URL ?? '').replace(/\/+$/, ''),
};

export const mailEnabled = !!(mailConfig.host && mailConfig.from);

let transport: Transporter | null = null;
function getTransport(): Transporter {
  transport ??= nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    ...(mailConfig.user ? { auth: { user: mailConfig.user, pass: mailConfig.password } } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transport;
}

/** Logs whether the SMTP server is reachable (does not stop the app if it is not). */
export async function checkMail(): Promise<void> {
  if (!mailEnabled) {
    console.log('[mail] SMTP not configured – access data can only be sent via the "open in mail program" link.');
    return;
  }
  try {
    await getTransport().verify();
    console.log(`[mail] SMTP ready (${mailConfig.host}:${mailConfig.port}, from ${mailConfig.from})`);
  } catch (e) {
    console.warn(`[mail] SMTP configured but NOT reachable: ${(e as Error).message}`);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface AccessMail { to: string; name: string; username: string; password: string; loginUrl: string; reset: boolean }

export async function sendAccessMail(m: AccessMail): Promise<void> {
  const intro = m.reset
    ? 'dein Zugang zum Creator Space von UwU Enterprises wurde zurückgesetzt.'
    : 'für dich wurde ein Zugang zum Creator Space von UwU Enterprises angelegt. Dort kannst du deine Seite selbst bearbeiten: Texte, Tags, Links, Profilbild und Galerie.';
  const outro = 'Beim ersten Login legst du dein eigenes Passwort fest. Bitte gib das vorläufige Passwort an niemanden weiter.';

  const text = [
    `Hallo ${m.name},`, '', intro, '',
    `Login: ${m.loginUrl}`, `Benutzername: ${m.username}`, `Vorläufiges Passwort: ${m.password}`, '',
    outro, '', 'Viele Grüße', 'UwU Enterprises',
  ].join('\n');

  const html = `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:520px;color:#2a1245">
<p>Hallo ${esc(m.name)},</p>
<p>${esc(intro)}</p>
<table style="border-collapse:collapse;background:#fff2fa;border:2px solid #2a1245;border-radius:12px" cellpadding="8">
<tr><td><b>Login</b></td><td><a href="${esc(m.loginUrl)}">${esc(m.loginUrl)}</a></td></tr>
<tr><td><b>Benutzername</b></td><td><code>${esc(m.username)}</code></td></tr>
<tr><td><b>Vorläufiges Passwort</b></td><td><code>${esc(m.password)}</code></td></tr>
</table>
<p>${esc(outro)}</p>
<p>Viele Grüße<br>UwU Enterprises</p></div>`;

  await getTransport().sendMail({
    from: mailConfig.from,
    to: m.to,
    subject: m.reset ? 'Neues Passwort für den UwU Enterprises Creator Space' : 'Dein Zugang zum UwU Enterprises Creator Space',
    text,
    html,
  });
}
