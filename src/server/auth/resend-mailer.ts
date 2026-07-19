/**
 * Resend tabanlı üretim mailer'ı. Doğrulama/şifre-sıfırlama bağlantılarını
 * gerçek e-posta olarak gönderir. RESEND_API_KEY + RESEND_EMAIL_DOMAIN
 * (Vercel marketplace entegrasyonuyla otomatik ayarlanır) gerektirir.
 */
import { Resend } from "resend";
import type { Mailer } from "@/server/auth/mailer";

export class ResendMailer implements Mailer {
  private readonly client: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(apiKey: string, emailDomain: string, appUrl: string) {
    this.client = new Resend(apiKey);
    this.from = `Aura <noreply@${emailDomain}>`;
    this.appUrl = appUrl;
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject: "Aura — E-postanı doğrula",
      html: `
        <p>Merhaba,</p>
        <p>Aura hesabını etkinleştirmek için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Bu bağlantı 24 saat içinde geçerliliğini yitirir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
      `,
    });
    // Resend SDK'sı API hatalarında exception fırlatmaz, {data, error} döner —
    // burada throw etmezsek çağıran taraftaki try/catch hiçbir şey yakalamaz.
    if (error) throw new Error(`Resend: ${error.name} — ${error.message}`);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject: "Aura — Şifreni sıfırla",
      html: `
        <p>Merhaba,</p>
        <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Bu bağlantı 1 saat içinde geçerliliğini yitirir. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin.</p>
      `,
    });
    if (error) throw new Error(`Resend: ${error.name} — ${error.message}`);
  }
}
