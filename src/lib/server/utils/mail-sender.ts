import z from "zod/v4";
import path from "path";
import fs from "node:fs";
import nodemailer from "nodemailer";
import {Options} from "nodemailer/lib/mailer";


interface EmailOptions {
    to: string;
    link: string;
    subject: string;
    username: string;
    template: "password_reset" | "register";
}


// Password Reset and Verification Email
export const sendEmail = async (options: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const templatePath = path.join(process.cwd(), "public", "templates", `${options.template}.html`);

    let htmlContent = fs.readFileSync(templatePath, "utf-8");

    htmlContent = htmlContent.replace(/\{\{\s*link\s*}}/g, options.link);
    htmlContent = htmlContent.replace(/\{\{\s*username\s*}}/g, options.username);

    const mailOptions: Options = {
        to: options.to,
        html: htmlContent,
        subject: options.subject,
        from: process.env.MAIL_USERNAME,
    };

    await transporter.sendMail(mailOptions);
}


// Error email to Admin
export const sendAdminErrorMail = async (error: Error | z.ZodError, message: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    const errorData = {
        message: message,
        stack: error.stack,
        errorName: error.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
    }

    const mailOptions: Options = {
        to: process.env.MAIL_USERNAME,
        from: process.env.MAIL_USERNAME,
        subject: "MyLists - An Error Occurred",
        html: JSON.stringify(errorData, null, 4),
    };

    await transporter.sendMail(mailOptions);
}
