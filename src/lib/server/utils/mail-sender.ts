import z from "zod";
import nodemailer from "nodemailer";
import {serverEnv} from "@/env/server";
import {Options} from "nodemailer/lib/mailer";
import {render} from "@react-email/components";
import {ErrorEmail, PasswordResetEmail, RegisterEmail} from "@/lib/components/emails";


interface EmailOptions {
    to: string;
    link: string;
    subject: string;
    username: string;
    template: "resetPassword" | "register";
}


export const sendEmail = async (options: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: serverEnv.ADMIN_MAIL_USERNAME,
            pass: serverEnv.ADMIN_MAIL_PASSWORD,
        },
    });

    let htmlContent: string;
    if (options.template === "register") {
        htmlContent = await render(RegisterEmail({ username: options.username, link: options.link }));
    }
    else {
        htmlContent = await render(PasswordResetEmail({ username: options.username, link: options.link }));
    }

    const mailOptions: Options = {
        to: options.to,
        html: htmlContent,
        subject: options.subject,
        from: serverEnv.ADMIN_MAIL_USERNAME,
    };

    await transporter.sendMail(mailOptions);
}


export const sendAdminErrorMail = async (error: Error | z.ZodError, message: string) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: serverEnv.ADMIN_MAIL_USERNAME,
            pass: serverEnv.ADMIN_MAIL_PASSWORD,
        },
    });

    const errorData = {
        message: message,
        stack: error.stack,
        errorName: error.name,
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
    }

    const htmlContent = await render(ErrorEmail({ ctx: errorData }));

    const mailOptions: Options = {
        html: htmlContent,
        to: serverEnv.ADMIN_MAIL_USERNAME,
        from: serverEnv.ADMIN_MAIL_USERNAME,
        subject: "MyLists - An Error Occurred",
    };

    await transporter.sendMail(mailOptions);
}
