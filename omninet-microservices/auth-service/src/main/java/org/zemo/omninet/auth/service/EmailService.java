package org.zemo.omninet.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@omninet.com}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String to, String otp) {
        log.info("Sending OTP email to: {} (Code: {})", to, otp);
        String subject = "OmniNet - Email Verification Code";
        String content = buildOtpEmailContent(otp);
        sendHtmlEmail(to, subject, content);
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        log.info("Sending welcome email to: {}", to);
        String subject = "Welcome to OmniNet, " + name + "!";
        String content = buildWelcomeEmailContent(name);
        sendHtmlEmail(to, subject, content);
    }

    @Async
    public void sendAccountMergeNotification(String to, String name, String newProvider) {
        log.info("Sending account merge notification to: {}", to);
        String subject = "OmniNet - Security Alert: New Login Provider Connected";
        String content = buildAccountMergeEmailContent(name, newProvider);
        sendHtmlEmail(to, subject, content);
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email to {} not sent. Content:\n{}", to, htmlContent);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.setFrom(fromEmail);

            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage(), e);
        }
    }

    private String buildOtpEmailContent(String otp) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
                    .card { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                    .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
                    .code { font-size: 36px; font-weight: 900; letter-spacing: 8px; text-align: center; color: #38bdf8; background: #0f172a; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px dashed #38bdf8; }
                    .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">⚡ OmniNet</div>
                    <h2 style="margin-top:0; text-align:center;">Verify Your Email</h2>
                    <p style="color: #cbd5e1; text-align:center;">Please enter the 6-digit verification code below to complete your registration or login:</p>
                    <div class="code">%s</div>
                    <p style="color: #94a3b8; font-size: 14px; text-align:center;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                    <div class="footer">OmniNet Secure Cloud Architecture &bull; Automated Message</div>
                </div>
            </body>
            </html>
            """, otp);
    }

    private String buildWelcomeEmailContent(String name) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
                    .card { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; }
                    .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; margin-bottom: 24px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="logo">⚡ OmniNet</div>
                    <h2>Welcome aboard, %s!</h2>
                    <p style="color: #cbd5e1;">Your OmniNet account is now active. You have full access to intelligent Notes, encrypted Cloud Storage, and next-gen AI Chat assistance.</p>
                    <p style="color: #94a3b8; font-size: 13px;">Enjoy 5GB free high-speed cloud storage automatically provisioned for your workspace.</p>
                </div>
            </body>
            </html>
            """, name);
    }

    private String buildAccountMergeEmailContent(String name, String newProvider) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
                    .card { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="color: #f59e0b;">Security Alert: Account Connected</h2>
                    <p>Hello %s,</p>
                    <p>A new authentication provider (<b>%s</b>) was successfully linked to your OmniNet account.</p>
                    <p style="color: #94a3b8; font-size: 13px;">If you performed this action, no further steps are needed. If this wasn't you, please reset your password immediately.</p>
                </div>
            </body>
            </html>
            """, name, newProvider);
    }
}
