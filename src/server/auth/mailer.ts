/**
 * E-posta gönderim soyutlaması. Üretimde SES/Resend/Postmark implementasyonu takılır.
 * ConsoleMailer dev/test için: gönderilen e-postaları bellekte tutar.
 */
export interface Mailer {
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}

export class ConsoleMailer implements Mailer {
  readonly sent: { to: string; type: string; token: string }[] = [];

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.sent.push({ to, type: "verify", token });
  }
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.sent.push({ to, type: "reset", token });
  }
}
