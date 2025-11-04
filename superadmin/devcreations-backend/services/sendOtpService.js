import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpService = async (email) => {
  const otp = Math.floor(Math.random() * 9000 + 1000).toString();
  console.log(otp);

  await OTP.upsert(
    email,
    { otp, created_date: new Date() },
    { upsert: true }
  );

  const html = `
  <div style="font-family:sans-sarif;">
    <h2>Your OTP is: ${otp}</h2>
    <p>This OTP is valid for 10 minutes.</p>
  </div>
  `;

  await resend.emails.send({
    from: `Dav Creation <${process.env.RESEND_FROM_EMAIL}>`,
    to: email,
    subject: "Dav Creation OTP",
    html,
  });

  return { success: true, message: "OTP sent successfully" };
};
