import path from "path";
import fs from "node:fs";
import nodemailer from "nodemailer";


interface EmailOptions {
    to: string;
    link: string;
    subject: string;
    username: string;
    template: "password_reset" | "register";
}


export const sendEmail = async (options: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const templatePath = path.join(process.cwd(), "public", "templates", `${options.template}.html`);

    try {
        let htmlContent = fs.readFileSync(templatePath, "utf-8");

        htmlContent = htmlContent.replace(/\{\{\s*link\s*}}/g, options.link);
        htmlContent = htmlContent.replace(/\{\{\s*username\s*}}/g, options.username);

        const mailOptions = {
            to: options.to,
            html: htmlContent,
            subject: options.subject,
            from: process.env.MAIL_USERNAME,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
