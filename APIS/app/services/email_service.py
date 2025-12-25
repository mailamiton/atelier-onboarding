import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..config import settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            if text_body:
                part1 = MIMEText(text_body, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(html_body, 'html')
            msg.attach(part2)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_registration_confirmation(
        self,
        to_email: str,
        student_name: str,
        parent_name: str
    ) -> bool:
        subject = "Registration Confirmed - Ashish Patel Atelier"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d63c35;">Thank You for Registering!</h2>
                <p>Dear {parent_name},</p>
                <p>Thank you for registering <strong>{student_name}</strong> for a demo class at Ashish Patel Atelier.</p>
                <p>We have received your registration and our team will review it shortly. You will receive another email once we assign a teacher and schedule your demo class.</p>
                <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0ba5e9; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #0ba5e9;">What Happens Next?</h3>
                    <ol>
                        <li>Our team will review your registration</li>
                        <li>We'll assign the best teacher for your child</li>
                        <li>You'll receive an email with teacher details and demo class link</li>
                        <li>Join your free demo class and start the art journey!</li>
                    </ol>
                </div>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Ashish Patel Atelier Team</strong><br>
                    <a href="https://ashishpatelatelier.com" style="color: #d63c35;">ashishpatelatelier.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Thank You for Registering!
        
        Dear {parent_name},
        
        Thank you for registering {student_name} for a demo class at Ashish Patel Atelier.
        
        We have received your registration and our team will review it shortly. You will receive another email once we assign a teacher and schedule your demo class.
        
        What Happens Next?
        1. Our team will review your registration
        2. We'll assign the best teacher for your child
        3. You'll receive an email with teacher details and demo class link
        4. Join your free demo class and start the art journey!
        
        If you have any questions, please don't hesitate to contact us.
        
        Best regards,
        Ashish Patel Atelier Team
        https://ashishpatelatelier.com
        """
        
        return self.send_email(to_email, subject, html_body, text_body)
    
    def send_teacher_assignment_notification(
        self,
        to_email: str,
        student_name: str,
        parent_name: str,
        teacher_name: str,
        demo_link: str
    ) -> bool:
        subject = "Teacher Assigned - Your Demo Class is Ready!"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d63c35;">Your Demo Class is Ready!</h2>
                <p>Dear {parent_name},</p>
                <p>Great news! We have assigned a teacher for <strong>{student_name}</strong>'s demo class.</p>
                <div style="background-color: #fef3f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #d63c35;">Teacher Details</h3>
                    <p><strong>Teacher:</strong> {teacher_name}</p>
                </div>
                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #059669;">Join Your Demo Class</h3>
                    <p>Click the button below to join your demo class:</p>
                    <a href="{demo_link}" style="display: inline-block; padding: 12px 24px; background-color: #d63c35; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Join Demo Class</a>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        Or copy this link: {demo_link}
                    </p>
                </div>
                <p>We're excited to see {student_name} explore the world of Renaissance art!</p>
                <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>Ashish Patel Atelier Team</strong><br>
                    <a href="https://ashishpatelatelier.com" style="color: #d63c35;">ashishpatelatelier.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Your Demo Class is Ready!
        
        Dear {parent_name},
        
        Great news! We have assigned a teacher for {student_name}'s demo class.
        
        Teacher Details:
        Teacher: {teacher_name}
        
        Join Your Demo Class:
        {demo_link}
        
        We're excited to see {student_name} explore the world of Renaissance art!
        
        Best regards,
        Ashish Patel Atelier Team
        https://ashishpatelatelier.com
        """
        
        return self.send_email(to_email, subject, html_body, text_body)


email_service = EmailService()
