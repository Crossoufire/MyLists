import nodemailer from "nodemailer";
import {serverEnv} from "@/env/server";
import {Options} from "nodemailer/lib/mailer";
import {render} from "@react-email/components";
import {createServerOnlyFn} from "@tanstack/react-start";
import {PasswordResetEmail, RegisterEmail} from "@/lib/client/components/emails";


interface EmailOptions {
    to: string;
    link: string;
    subject: string;
    username: string;
    template: "resetPassword" | "register";
}


export const sendEmail = createServerOnlyFn(() => async (options: EmailOptions) => {
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
})();
