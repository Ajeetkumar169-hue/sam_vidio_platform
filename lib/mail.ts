import nodemailer from "nodemailer";

/**
 * 📧 EMAIL SERVICE
 * Handles sending notifications and system emails.
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendNotificationEmail({
  to,
  subject,
  channelName,
  videoTitle,
  videoUrl,
  thumbnailUrl,
}: {
  to: string;
  subject: string;
  channelName: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl?: string;
}) {
  try {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #ff0000; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">VidStream</h1>
        </div>
        <div style="padding: 20px;">
          <h2>New video from ${channelName}</h2>
          <p>Hi there! <strong>${channelName}</strong> just uploaded a new video: <strong>${videoTitle}</strong></p>
          
          ${thumbnailUrl ? `<div style="margin: 20px 0;"><img src="${thumbnailUrl}" alt="${videoTitle}" style="width: 100%; border-radius: 10px;" /></div>` : ""}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${videoUrl}" style="background: #ff0000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Watch Video</a>
          </div>
        </div>
        <div style="background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          <p>You received this because you are subscribed to ${channelName}.</p>
          <p>&copy; ${new Date().getFullYear()} VidStream Pro</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${channelName} via VidStream" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
