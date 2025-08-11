import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: parseInt(process.env.MAIL_PORT || "2525"),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
});

interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: MailOptions) => {
    try {   
        const mailOptions = {
            from: '"Your Rental App" <no-reply@rentalapp.com>',
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error; // Or handle it as you see fit
    }
};