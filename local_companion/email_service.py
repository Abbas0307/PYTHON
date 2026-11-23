"""
local_companion/email_service.py
MINDORA 2.0 — AUTOMATED GUARDIAN EMAIL ALERT SYSTEM
Production Python SMTP Email Dispatcher with SSL/STARTTLS and Personalized Dynamic Content.
"""

import os
import re
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))
import smtplib
import ssl
import time
import secrets
import html
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timezone
import logging

logger = logging.getLogger("mindora.email_service")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Exact Subject Lines
LEVEL_1_SUBJECT = "Mindora Alert – Your Student's Stress Level Requires Attention"
LEVEL_2_SUBJECT = "URGENT WELLBEING ALERT – Your Student Needs Immediate Attention"

# Legacy Subject Aliases for backward compatibility with previous test assertions
LEGACY_LEVEL_1_SUBJECT = "Mindora Wellbeing Update – A Gentle Check-In Recommended"
LEGACY_LEVEL_2_SUBJECT = "Mindora Wellbeing Alert – Additional Support Recommended"

VERIFICATION_SUBJECT = "Mindora — Guardian Contact Verification Code"
VERIFICATION_BODY_TEMPLATE = """Hello,

A student has registered this email address as their trusted guardian contact on the Mindora Student Wellbeing Platform.

Your 6-digit verification code is: {code}

This code will expire in 10 minutes. If you did not expect this message, you may safely disregard it.

Regards,
Mindora Student Wellbeing Platform"""


def render_verification_email(code: str, verification_link: Optional[str] = None) -> Tuple[str, str]:
    """Renders plain text and responsive HTML guardian verification emails."""
    link_section = f"\n\nAlternatively, verify immediately by clicking this secure link:\n{verification_link}\n" if verification_link else ""
    text_body = VERIFICATION_BODY_TEMPLATE.format(code=code) + link_section

    link_button_html = ""
    if verification_link:
        link_button_html = f"""
        <div style="margin: 24px 0; text-align: center;">
          <a href="{html.escape(verification_link)}"
             style="background: linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%);
                    color: #ffffff;
                    text-decoration: none;
                    padding: 13px 28px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 700;
                    display: inline-block;
                    box-shadow: 0 4px 14px rgba(108, 92, 231, 0.35);">
            Verify Guardian Email
          </a>
          <p style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
            Link not clicking? Copy & paste this into your browser:<br/>
            <span style="color: #6C5CE7; word-break: break-all;">{html.escape(verification_link)}</span>
          </p>
        </div>
        """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mindora Guardian Contact Verification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
    <tr>
      <td style="background: linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Mindora</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Student Wellbeing &amp; Risk Insights Platform</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1e293b; font-weight: 700;">Guardian Contact Verification</h2>
        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
          A student has registered this email address as their trusted guardian contact for automated wellbeing check-ins on Mindora.
        </p>
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">Your 6-Digit Verification Code</span>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4834D4; margin-top: 6px;">{html.escape(code)}</div>
        </div>
        {link_button_html}
        <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
          This code and link expire in <strong>10 minutes</strong>. If you did not expect this message or do not know the student, you may safely disregard it.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
        Mindora Student Wellbeing Support Team &bull; AES-256 Encrypted Contact Vault
      </td>
    </tr>
  </table>
</body>
</html>"""
    return text_body, html_body

# --- LEVEL 1 (70 <= STRESS < 90) PLAIN-TEXT TEMPLATE ---
LEVEL_1_TEXT_TEMPLATE = """Dear Parent/Guardian,

We would like to bring an important wellbeing update regarding your child, {student_name}, to your attention.

Their latest Mindora wellbeing assessment recorded a stress indicator of {stress_percentage}%, which falls within the elevated range.

This suggests that your child may be experiencing increased academic or personal stress and may benefit from additional attention and emotional support.

We encourage you to:
1. Have a calm and supportive conversation with your child.
2. Ask about their academic workload and daily challenges.
3. Listen patiently without judgment.
4. Offer encouragement and help them manage their responsibilities.
5. Consider additional professional support if their difficulties continue.
Your understanding and support can make a meaningful difference.

Assessment date: {assessment_date}

Mindora Wellbeing Support Team"""

# --- LEVEL 2 (STRESS >= 90) PLAIN-TEXT TEMPLATE ---
LEVEL_2_TEXT_TEMPLATE = """Dear Parent/Guardian,

We are contacting you regarding an important wellbeing concern involving your child, {student_name}.

Their latest Mindora wellbeing assessment recorded a stress indicator of {stress_percentage}%, which falls within the very high range.

This indicates that your child may be experiencing substantial stress and requires prompt attention, understanding and additional support.

We strongly recommend that you:
1. Check in with your child as soon as possible.
2. Speak with them calmly and understand what they are experiencing.
3. Provide a supportive and comfortable environment.
4. Help them manage immediate academic or personal pressures.
5. Consider arranging an appointment with a qualified mental health professional.
Please take this notification seriously and ensure your child receives the support they may need.

Assessment date: {assessment_date}

Mindora Wellbeing Support Team"""


def _render_html_email(
    header_title: str,
    banner_html: str,
    opening_text: str,
    stress_percentage: str,
    stat_theme: Dict[str, str],
    interpretation_text: str,
    actions_heading: str,
    actions_list: List[str],
    closing_text: str,
    assessment_date: str,
    student_name: str
) -> str:
    """Builds a responsive, accessible, Mindora-branded HTML email."""
    escaped_student = html.escape(student_name)
    escaped_date = html.escape(assessment_date)
    escaped_pct = html.escape(str(stress_percentage))

    actions_html = "".join([
        f'<li style="margin-bottom: 8px;">{html.escape(action)}</li>'
        for action in actions_list
    ])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(header_title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #ede9fe; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08);">
          
          <!-- Header with Mindora Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 28px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 14px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.3);">
                      Mindora Student Wellbeing Intelligence
                    </span>
                    <h1 style="color: #ffffff; margin: 14px 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      {html.escape(header_title)}
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.85); margin: 0; font-size: 13px;">
                      Confidential Parent & Guardian Notification
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Banner / Alert Visual -->
          <tr>
            <td style="padding: 24px 28px 0 28px;">
              {banner_html}
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 16px 28px 24px 28px; font-size: 14px; line-height: 1.65; color: #334155;">
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0f172a;">
                Dear Parent/Guardian,
              </p>
              <p style="margin: 0 0 16px 0;">
                {opening_text}
              </p>

              <!-- Prominent Stress Indicator Stat Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background-color: {stat_theme['bg']}; border: 1px solid {stat_theme['border']}; border-radius: 16px; padding: 20px; text-align: center;">
                <tr>
                  <td align="center">
                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: {stat_theme['label']}; margin-bottom: 6px;">
                      Recorded Stress Indicator
                    </span>
                    <span style="display: inline-block; font-size: 44px; font-weight: 900; letter-spacing: -1px; color: {stat_theme['val']}; line-height: 1;">
                      {escaped_pct}%
                    </span>
                    <span style="display: block; font-size: 12px; font-weight: 700; color: {stat_theme['range']}; margin-top: 6px;">
                      {html.escape(stat_theme['range_text'])}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0;">
                {interpretation_text}
              </p>

              <!-- Recommended Actions Section -->
              <div style="margin: 24px 0 16px 0; background-color: #faf5ff; border: 1px solid #f3e8ff; border-radius: 16px; padding: 20px;">
                <span style="display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #6b21a8; margin-bottom: 12px;">
                  {html.escape(actions_heading)}
                </span>
                <ol style="margin: 0; padding-left: 20px; color: #3b0764; font-size: 13px; line-height: 1.8;">
                  {actions_html}
                </ol>
              </div>

              <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b; font-style: italic;">
                {html.escape(closing_text)}
              </p>

              <!-- Meta Info: Assessment Date & Student -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #f1f5f9; padding-top: 14px; margin-top: 16px;">
                <tr>
                  <td style="font-size: 12px; color: #64748b;">
                    <strong>Assessment date:</strong> {escaped_date}
                  </td>
                  <td align="right" style="font-size: 12px; color: #64748b;">
                    <strong>Student:</strong> {escaped_student}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 28px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; line-height: 1.6; color: #94a3b8;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #64748b;">
                Mindora Wellbeing Support Team
              </p>
              <p style="margin: 0 0 8px 0;">
                This automated educational alert was sent in accordance with student-authorized guardian notification preferences. Mindora is an educational wellbeing platform and does not provide clinical diagnoses.
              </p>
              <p style="margin: 0;">
                If you believe this message was sent in error or wish to modify notifications, your student may manage their settings via their Mindora student portal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_level_1_email(
    student_name: str = "your child",
    stress_percentage: Any = 75,
    assessment_date: Optional[str] = None,
    guardian_name: Optional[str] = None
) -> Tuple[str, str]:
    """Renders Level 1 (70 <= stress < 90) plain-text and HTML emails."""
    date_str = assessment_date or datetime.now(timezone.utc).strftime("%B %d, %Y")
    pct_str = f"{round(float(stress_percentage)):.0f}" if isinstance(stress_percentage, (int, float)) else str(stress_percentage)

    text_body = LEVEL_1_TEXT_TEMPLATE.format(
        student_name=student_name,
        stress_percentage=pct_str,
        assessment_date=date_str
    )

    banner_html = (
        '<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; '
        'padding: 10px 16px; text-align: center; color: #b45309; font-size: 12px; font-weight: 700; '
        'letter-spacing: 0.5px;">ELEVATED STRESS LEVEL NOTIFICATION</div>'
    )

    stat_theme = {
        "bg": "#fffbeb",
        "border": "#fde68a",
        "label": "#b45309",
        "val": "#92400e",
        "range": "#b45309",
        "range_text": "Elevated Range (70% – 89%)"
    }

    opening = (
        f"We would like to bring an important wellbeing update regarding your child, "
        f"<strong>{html.escape(student_name)}</strong>, to your attention."
    )

    interpretation = (
        "This suggests that your child may be experiencing increased academic or personal stress "
        "and may benefit from additional attention and emotional support."
    )

    actions = [
        "Have a calm and supportive conversation with your child.",
        "Ask about their academic workload and daily challenges.",
        "Listen patiently without judgment.",
        "Offer encouragement and help them manage their responsibilities.",
        "Consider additional professional support if their difficulties continue."
    ]

    html_body = _render_html_email(
        header_title="Wellbeing Notification",
        banner_html=banner_html,
        opening_text=opening,
        stress_percentage=pct_str,
        stat_theme=stat_theme,
        interpretation_text=interpretation,
        actions_heading="We encourage you to:",
        actions_list=actions,
        closing_text="Your understanding and support can make a meaningful difference.",
        assessment_date=date_str,
        student_name=student_name
    )

    return text_body, html_body


def render_level_2_email(
    student_name: str = "your child",
    stress_percentage: Any = 90,
    assessment_date: Optional[str] = None,
    guardian_name: Optional[str] = None
) -> Tuple[str, str]:
    """Renders Level 2 (stress >= 90) plain-text and HTML emails."""
    date_str = assessment_date or datetime.now(timezone.utc).strftime("%B %d, %Y")
    pct_str = f"{round(float(stress_percentage)):.0f}" if isinstance(stress_percentage, (int, float)) else str(stress_percentage)

    text_body = LEVEL_2_TEXT_TEMPLATE.format(
        student_name=student_name,
        stress_percentage=pct_str,
        assessment_date=date_str
    )

    banner_html = (
        '<div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; '
        'padding: 12px 16px; text-align: center; color: #be123c; font-size: 12px; font-weight: 800; '
        'letter-spacing: 0.5px;">⚠️ URGENT WELLBEING ALERT — PROMPT ATTENTION RECOMMENDED</div>'
    )

    stat_theme = {
        "bg": "#fff1f2",
        "border": "#fecdd3",
        "label": "#be123c",
        "val": "#9f1239",
        "range": "#be123c",
        "range_text": "Very High Range (90% – 100%)"
    }

    opening = (
        f"We are contacting you regarding an important wellbeing concern involving your child, "
        f"<strong>{html.escape(student_name)}</strong>."
    )

    interpretation = (
        "This indicates that your child may be experiencing substantial stress and requires prompt "
        "attention, understanding and additional support."
    )

    actions = [
        "Check in with your child as soon as possible.",
        "Speak with them calmly and understand what they are experiencing.",
        "Provide a supportive and comfortable environment.",
        "Help them manage immediate academic or personal pressures.",
        "Consider arranging an appointment with a qualified mental health professional."
    ]

    html_body = _render_html_email(
        header_title="Urgent Wellbeing Alert",
        banner_html=banner_html,
        opening_text=opening,
        stress_percentage=pct_str,
        stat_theme=stat_theme,
        interpretation_text=interpretation,
        actions_heading="We strongly recommend that you:",
        actions_list=actions,
        closing_text="Please take this notification seriously and ensure your child receives the support they may need.",
        assessment_date=date_str,
        student_name=student_name
    )

    return text_body, html_body


# Default constant string representations
LEVEL_1_BODY = render_level_1_email("your student", 75)[0]
LEVEL_2_BODY = render_level_2_email("your student", 90)[0]


@dataclass
class EmailDeliveryResult:
    success: bool
    status: str  # "sent", "failed", "suppressed", "pending"
    message: str
    message_id: str
    provider_response: Optional[str] = None
    error_code: Optional[str] = None
    recipient_email: Optional[str] = None
    sent_at: Optional[str] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    student_name: Optional[str] = None
    stress_percentage: Optional[str] = None


class SMTPEmailService:
    """
    Production-ready SMTP Email Service for Mindora 2.0.
    Supports standard SSL (port 465) and STARTTLS (port 587).
    Never logs or exposes credentials.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_email: Optional[str] = None,
        use_ssl: Optional[bool] = None,
        timeout: int = 10
    ):
        self.host = host if host is not None else os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
        
        env_port = os.getenv("SMTP_PORT")
        if port is not None:
            self.port = int(port)
        elif env_port and env_port.isdigit():
            self.port = int(env_port)
        else:
            self.port = 465

        self.username = username if username is not None else os.getenv("SMTP_USERNAME", "mindoraparentcare@gmail.com").strip()
        self.password = password if password is not None else os.getenv("SMTP_PASSWORD", "mindoraparentcare@1").strip()
        self.from_email = from_email if from_email is not None else os.getenv("EMAIL_FROM", self.username or "mindoraparentcare@gmail.com").strip()
        
        if use_ssl is not None:
            self.use_ssl = use_ssl
        else:
            env_ssl = os.getenv("SMTP_USE_SSL")
            if env_ssl is not None:
                self.use_ssl = env_ssl.lower() in ("true", "1", "yes")
            else:
                self.use_ssl = (self.port == 465)

        self.timeout = int(os.getenv("SMTP_TIMEOUT", str(timeout)))

    def is_configured(self) -> bool:
        """Check if SMTP credentials and host are provisioned."""
        return bool(self.host and self.username and self.password and self.from_email)

    def validate_email(self, email_address: str) -> bool:
        """Validate recipient email address format."""
        if not email_address or not isinstance(email_address, str):
            return False
        clean = email_address.strip()
        return bool(EMAIL_REGEX.match(clean)) and len(clean) <= 254

    def send_raw_email(
        self,
        to_email: str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        custom_msg_id: Optional[str] = None,
        student_name: Optional[str] = None,
        stress_percentage: Optional[str] = None
    ) -> EmailDeliveryResult:
        """
        Dispatches an email using Python's standard smtplib.
        Handles authentication, connection timeouts, and delivery failures gracefully.
        Attaches plaintext fallback and optional HTML body as multipart/alternative.
        """
        to_clean = to_email.strip()
        msg_id = custom_msg_id or make_msgid(domain="mindora.internal")

        # 1. Validation
        if not self.validate_email(to_clean):
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message=f"Invalid recipient email format: '{to_clean}'",
                message_id=msg_id,
                error_code="INVALID_RECIPIENT",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )

        # 1.5. Simulation Mode Check (for local development & offline testing)
        if os.getenv("SMTP_SIMULATION_MODE", "false").lower() in ("true", "1", "yes"):
            logger.info("SMTP_SIMULATION_MODE active: Simulating dispatch to %s", to_clean)
            return EmailDeliveryResult(
                success=True,
                status="sent",
                message="[Simulated] Notification processed successfully in local simulation mode.",
                message_id=msg_id,
                provider_response="250 Simulated local delivery (SMTP_SIMULATION_MODE=true)",
                recipient_email=to_clean,
                sent_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )

        # 2. Check configuration
        if not self.is_configured():
            logger.warning("SMTP credentials not provisioned. Cannot send real email.")
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP server is not configured. Missing SMTP_HOST, SMTP_USERNAME, or SMTP_PASSWORD.",
                message_id=msg_id,
                error_code="CREDENTIALS_MISSING",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )

        # 3. Construct MIME message
        msg = MIMEMultipart("alternative")
        msg["From"] = self.from_email
        msg["To"] = to_clean
        msg["Subject"] = subject
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = msg_id

        # Plaintext body (standard fallback for all mail clients)
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))

        # 4. Connect and send via SMTP
        try:
            if self.use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.host, self.port, timeout=self.timeout, context=context) as server:
                    server.login(self.username, self.password)
                    send_resp = server.send_message(msg)
            else:
                with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(self.username, self.password)
                    send_resp = server.send_message(msg)

            if send_resp and to_clean in send_resp:
                code, resp_text = send_resp[to_clean]
                return EmailDeliveryResult(
                    success=False,
                    status="failed",
                    message=f"Recipient rejected by mail server: {resp_text.decode('utf-8', errors='ignore')}",
                    message_id=msg_id,
                    provider_response=f"{code} {resp_text}",
                    error_code="RECIPIENT_REJECTED",
                    recipient_email=to_clean,
                    subject=subject,
                    body_text=body_text,
                    body_html=body_html,
                    student_name=student_name,
                    stress_percentage=stress_percentage
                )

            return EmailDeliveryResult(
                success=True,
                status="sent",
                message="Email delivered successfully via SMTP server.",
                message_id=msg_id,
                provider_response="250 Message accepted for delivery",
                recipient_email=to_clean,
                sent_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )

        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error("SMTP Authentication Error: check username/password or App Password.")
            err_text = str(auth_err.smtp_error.decode("utf-8", errors="ignore")) if hasattr(auth_err, "smtp_error") and auth_err.smtp_error else "Authentication failed"
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message=f"SMTP authentication failed: {err_text}. For Gmail, ensure a 16-character Google App Password is used instead of standard account password.",
                message_id=msg_id,
                provider_response=err_text,
                error_code="AUTH_FAILURE",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )
        except smtplib.SMTPServerDisconnected as disc_err:
            logger.error(f"SMTP Server Disconnected: {disc_err}")
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP server unexpectedly disconnected. For Gmail, this indicates authentication rejection (535 BadCredentials) where Google drops the connection after an invalid password or missing App Password.",
                message_id=msg_id,
                provider_response=str(disc_err),
                error_code="AUTH_FAILURE",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )
        except (smtplib.SMTPConnectError, TimeoutError) as conn_err:
            logger.error(f"SMTP Connection Error to {self.host}:{self.port}: {conn_err}")
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message=f"SMTP server connection failed or timed out: {self.host}:{self.port}",
                message_id=msg_id,
                provider_response=str(conn_err),
                error_code="CONNECTION_TIMEOUT",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )
        except smtplib.SMTPException as smtp_err:
            logger.error(f"SMTP General Error: {smtp_err}")
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP protocol error occurred during transmission.",
                message_id=msg_id,
                provider_response=str(smtp_err),
                error_code="SMTP_ERROR",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )
        except Exception as exc:
            logger.error(f"Unexpected email dispatch error: {exc}")
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="An unexpected system error occurred while transmitting email.",
                message_id=msg_id,
                provider_response=str(exc),
                error_code="SYSTEM_ERROR",
                recipient_email=to_clean,
                subject=subject,
                body_text=body_text,
                body_html=body_html,
                student_name=student_name,
                stress_percentage=stress_percentage
            )

    def send_level_1_alert(
        self,
        to_email: str,
        student_name: str = "your child",
        stress_percentage: Any = 75,
        assessment_date: Optional[str] = None,
        guardian_name: Optional[str] = None,
        custom_msg_id: Optional[str] = None
    ) -> EmailDeliveryResult:
        """Dispatches Level 1 High Stress Alert (70 <= stress < 90)."""
        text_body, html_body = render_level_1_email(
            student_name=student_name,
            stress_percentage=stress_percentage,
            assessment_date=assessment_date,
            guardian_name=guardian_name
        )
        return self.send_raw_email(
            to_email=to_email,
            subject=LEVEL_1_SUBJECT,
            body_text=text_body,
            body_html=html_body,
            custom_msg_id=custom_msg_id,
            student_name=student_name,
            stress_percentage=str(stress_percentage)
        )

    def send_level_2_alert(
        self,
        to_email: str,
        student_name: str = "your child",
        stress_percentage: Any = 90,
        assessment_date: Optional[str] = None,
        guardian_name: Optional[str] = None,
        custom_msg_id: Optional[str] = None
    ) -> EmailDeliveryResult:
        """Dispatches Level 2 Critical Stress Alert (stress >= 90)."""
        text_body, html_body = render_level_2_email(
            student_name=student_name,
            stress_percentage=stress_percentage,
            assessment_date=assessment_date,
            guardian_name=guardian_name
        )
        return self.send_raw_email(
            to_email=to_email,
            subject=LEVEL_2_SUBJECT,
            body_text=text_body,
            body_html=html_body,
            custom_msg_id=custom_msg_id,
            student_name=student_name,
            stress_percentage=str(stress_percentage)
        )

    def send_verification_email(self, to_email: str, code: str, verification_link: Optional[str] = None) -> EmailDeliveryResult:
        """Dispatches 6-digit OTP verification email with optional one-click verification link."""
        text_body, html_body = render_verification_email(code=code, verification_link=verification_link)
        return self.send_raw_email(
            to_email=to_email,
            subject=VERIFICATION_SUBJECT,
            body_text=text_body,
            body_html=html_body
        )


_EMAIL_SERVICE_INSTANCE: Optional[SMTPEmailService] = None

def get_email_service() -> SMTPEmailService:
    """Singleton getter for SMTPEmailService."""
    global _EMAIL_SERVICE_INSTANCE
    if _EMAIL_SERVICE_INSTANCE is None:
        _EMAIL_SERVICE_INSTANCE = SMTPEmailService()
    return _EMAIL_SERVICE_INSTANCE

def set_email_service(service: Optional[SMTPEmailService]) -> None:
    """Allow injecting a custom or mock service for automated testing."""
    global _EMAIL_SERVICE_INSTANCE
    _EMAIL_SERVICE_INSTANCE = service
