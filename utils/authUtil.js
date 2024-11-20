const validator = require("validator");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const userDataValidation = ({ name, email, username, password }) => {
    return new Promise((resolve, reject) => {
        if (!name || !username || !email || !password)
            reject("Missing credentials");

        if (typeof name !== "string") reject("Name is not a string");
        if (typeof username !== "string") reject("username is not a string");
        if (typeof email !== "string") reject("email is not a string");
        if (typeof password !== "string") reject("password is not a string");

        if (username.length <= 2 || username.length > 20)
            reject("username length should be 3-20");

        if (password.length <= 2 || password.length > 20)
            reject("password length should be 3-20");
        //more conditions can be added even to password like this
        // if (!validator.isAlphanumeric(password))
        //   reject("Password should contains a-z, A-Z and 0-9");
        if (!validator.isEmail(email))
            reject("Email format is incorrect");

        resolve();
    });
};

const generateJWTToken = (email) => {
    const token = jwt.sign(email, process.env.SECRET_KEY);
    return token;
};

const sendVerificationEmail = (email, verifiedToken) => {

    //transporter
     const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            service: "gmail",
            auth: {
                user: "yokasdenis@gmail.com",
                pass: "cdin napn jenw aaxu",
            }
        });
    // } else if (domain === "yahoo.com") {
    //     transporter = nodemailer.createTransport({
    //         host: "smtp.mail.yahoo.com",
    //         port: 465,
    //         secure: true,
    //         service: "yahoo",
    //         auth: {
    //             user: "your_yahoo_email@yahoo.com",
    //             pass: "your_yahoo_app_password",
    //         }
    //     });
    // } else if (domain === "hotmail.com" || domain === "outlook.com") {
    //     let transporter = nodemailer.createTransport({
    //         service: "Outlook365",
    //         host: "smtp.office365.com",
    //         port: "587",
    //         tls: {
    //             ciphers: "SSLv3",
    //             rejectUnauthorized: false,
    //         },
    //         auth: {
    //             user: "example@hotmail.com",
    //             pass: "dsdsdddsdsdsd",
    //         },
    //     });
    // } else {
    //     console.log("unsupported email domain")
    //     return;
    // }

    //mail options

    const mailOptions = {
        from: "yokasdenis@gmail.com",
        to: email,
        subject: "Email verification for TODO APP",
        html: `
        <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Todo App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  
    <style type="text/css">
      a[x-apple-data-detectors] {color: inherit !important;}
    </style>
  
  </head>
  <body style="margin: 0; padding: 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding: 20px 0 30px 0;">
  
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border: 1px solid #cccccc;">
    <tr>
      <td align="center" bgcolor="#defcf9" style="padding: 40px 0 30px 0;">
        <img src="https://www.jotform.com/blog/wp-content/uploads/2020/01/email-marketing-intro-02-700x544.png" alt="logo" width="300" height="230" style="display: block;" />
      </td>
    </tr>
    <tr>
      <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td style="color: #00adb5; font-family: Arial, sans-serif;">
              <h3 style="font-size: 24px; margin: 0; margin-bottom:6px; text-align:center; font-family: Montserrat, sans-serif;">Hey</h3>
              <h3 style="font-size: 24px; margin: 0; text-align:center; "color: #00adb5;  font-family: Montserrat, sans-serif;">Activate your Email</h3>
            </td>
          </tr>
          <tr>
            <td style="color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; padding: 20px 0 30px 0;">
            <a href="http://localhost:8001/verifytoken/${verifiedToken}" style=" border: none;
            background-color: #ef7e5c;
    color: white;
    padding: 15px 32px;
    text-align: center;
  
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 175px;
    cursor: pointer;
    border-radius:5px;">Activate Account</a>
            </td>
  
        </table>
      </td>
    </tr>
    <tr>
      <td bgcolor="#ef7e5c" style="padding: 30px 30px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;">
              <p style="margin: 0;">&reg; Someone, somewhere 2021<br/>
             <a href="www.progarten.in" style="color: #ffffff;">Subscribe</a> to us!</p>
            </td>
            </tr>
        </table>
      </td>
    </tr>
    </table>
  
        </td>
      </tr>
    </table>
  </body>
        `
    };

    //send mail
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.log(err);
        else
            console.log(
                `Email has been sent successfully: ${email}` + info.response
            );
    });
};




module.exports = { userDataValidation, generateJWTToken, sendVerificationEmail };