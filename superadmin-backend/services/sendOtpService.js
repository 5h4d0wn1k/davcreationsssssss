import { Resend } from "resend";
import OTP from "../models/otpModel.js";

// const resend = new Resend("re_7fDB5hbt_2hJk3pJUt1sjYsJKWaDZBnRN");

export const sendOtpService = async (email) => {
  const otp = Math.floor(Math.random() * 9000 + 1000).toString();
  console.log(otp);

  await OTP.upsert(
    email,
    { otp, createdAt: new Date() },
    { upsert: true }
  );

  const html = `
  <div style="font-family:sans-sarif;">
    <h2>Your OTP is: ${otp}</h2>
    <p>This OTP is valid for 10 minutes.</p>
  </div>
  `;

  // await resend.emails.send({
  //   from: "Storage App <otp@parumalbsp.online>",
  //   to: email,
  //   subject: "Storage App OTP",
  //   html,
  // });

  return { success: true, message: "OTP sent successfully" };
};
