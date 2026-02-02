import { Resend } from "resend";
import nodemailer from "nodemailer";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.EMAIL_FROM || "StoryKeeper <no-reply@storykeeper.test>";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
};

export async function sendEmail(payload: EmailPayload) {
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: defaultFrom,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType
      }))
    });
    return;
  }

  const transporter = nodemailer.createTransport(
    process.env.EMAIL_SERVER || {
      host: "localhost",
      port: 1025,
      secure: false
    }
  );

  await transporter.sendMail({
    from: defaultFrom,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    attachments: payload.attachments
  });
}
