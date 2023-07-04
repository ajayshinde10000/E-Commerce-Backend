import sellerModel from "../Models/seller.js";
import resetPasswordModel from "../Models/resetPassword.js";
import emailVerificationModel from "../Models/emailVerification.js";

import path from "path";
import emailsModel from "../Models/Emails.js";
const __dirname = path.resolve();

class EmailController {
  static enterEmail = async (req, res) => {
    // res.send(`
    //         <html>
    //         <head>
    //         <title>Email Verification</title>
    //         </head>
    //         <body>
    //         <h1>Enter your email address:</h1>
    //             <form action="/emails/verify" method="post">
    //             <input type="email" name="email" required> <br>
    //             <button type="submit">Verify</button>
    //             </form>
    //         </body>
    //         </html>
    // `);

    return res.sendFile(path.join(__dirname, "./", "HTML_PAGES", "index.html"));
  };

  static verifyEmail = async (req, res) => {
    const { email } = req.body;
    console.log(email);
    try {
      // Check if the email exists in MongoDB
      const existingEmail = await sellerModel.find({ email: email });
      console.log(existingEmail, "From Existing Email");
      // console.log(email,"From Existing email");
      if (existingEmail.length != 0) {
        req.reqEmail = email;
        return res.redirect(`/emails/${email}`);
      } else {
        // Render an error message on the current page
        // return res.send(`
        //   <html>
        //     <head>
        //       <title>Email Verification</title>
        //     </head>
        //     <body>
        //       <h1>Email Verification Error</h1>
        //       <p>The email address entered does not exist.</p>
        //       <a href="/emails">Go back</a>
        //     </body>
        //   </html>
        // `);

        //     res.send(`
        //         <html>
        //         <head>
        //         <title>Email Verification</title>
        //         </head>
        //         <body>
        //         <h1>Enter your email address:</h1>
        //             <form action="/emails/verify" method="post">
        //             <input type="email" name="email" required>
        //             <p>Please Enter Valid email</p>
        //             <button type="submit">Verify</button>
        //             </form>
        //         </body>
        //         </html>
        // `);

        //res.sendFile(path.join(__dirname,'./', 'HTML_PAGES','emailErrorPage.html'));
        return res.redirect(`/emails`);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("An error occurred during email verification");
    }
  };

  static getEmails = async (req, res) => {
    try {
      const { email } = req.params;
      console.log(email, "From Params");

      let savedEmails = await emailsModel.find({email:email});
      let myStr = "";

      if(savedEmails.length == 0){
        return res.redirect(`/emails`);
      }

      for(let e of savedEmails){

        let attchType = "Email Verification";
        if(e.type=="reset"){
          attchType = "Reset Password"
        }

        myStr+= ` 
        <a href="/emails/view/${e._id}">
          <div class="card mt-3">
                <div class="card-body" style="background-color: #eeeeee;">
                    <p class="fw-bold my-0">${attchType}</p>
                    <p class="mb-0">${e.createdAt}</p>
                </div>
          </div>
        </a>
`
      }

      let myHtml = `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
      crossorigin="anonymous"
    />

    <title>Emails</title>

    <style>
        *{
            margin: 0;
            padding: 0;
        }
        body{
            font-family: monospace;
        }
    </style>

  </head>
  <body>
    <div class="container">
      <div class="row">
        <div class="col-2"></div>

        <div class="col-8 mt-5">
          <div class="card">
            <div class="card-body d-flex justify-content-between bg-dark text-white rounded"> <span class="fw-bold fs-5">Local Mailbox </span>  <span> ${email} - Logout</span> </div>
          </div>

          ${myStr}
        </div>

        <div class="col-2"></div>
      </div>
    </div>

    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
      crossorigin="anonymous"
    ></script>
  </body>
</html>
`

      return res.send(myHtml);

    } catch (err) {
      return res.send("Error Occurred");
    }
  };

  static getVerifyEmailDetails = async (req, res) => {
    try {
      const { emailId } = req.params;
      let email = await emailVerificationModel.findById(emailId);

      let str = `
        <div class="card">
  <h5 class="card-header">
    From: no-reply@ajayshinde.com <br>
    To: ${email.email} <br>
    Subject: Email Verification
  </h5>

  <div class="card-body">
    <p>
        ${email.description}
    </p>
  </div>
</div>
`;

      let html = `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Bootstrap demo</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
          </head>
          <body>
            <div class="container mx-auto mt-5 pt-5">
                <div class="w-50">
                    ${str}
                </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz" crossorigin="anonymous"></script>
          </body>
        </html>`;

      res.send(html);
    } catch (err) {
      return res.send("Error Occured");
    }
  };

  static getemailDetails = async (req, res) => {
    try {
      const { emailId } = req.params;

      let type = "Verify Email";

      console.log(emailId);

      let emailDetails = await emailsModel.findById(emailId);

      if (emailDetails.type == "reset") {
        type = "Reset Password";
      }

      let html = `
      <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"
      rel="stylesheet"
      integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC"
      crossorigin="anonymous"
    />
    <title>Email Details</title>
    <style>
        *{
            margin: 0;
            padding: 0;
        }
        body{
            font-family: monospace;
        }
    </style>

  </head>
  <body>
    <div class="container mx-auto mt-5 pt-5">
        <div class="row">
            <div class="col-3"></div>

            <div class="col-6 shadow-lg mb-5 bg-body rounded border p-4">

                <div style="background-color: #bbbbbb;" class="p-2">
                    <p>
                
                    <strong>From:</strong> ajayshinde@gmail.com
                    <br><strong>To:</strong> ${emailDetails.email} <br>
                    <strong>Subject:</strong> ${type}

                    </p>

                </div>
                <div class="mt-4 lh-lg">
                    <p class="text-break">
                         Dear user, <br>
                         To reset your password, click on this link: <br>
                        <a href="${emailDetails.link}">${emailDetails.link}</a>
                        <br> If you did not request any ${type}, then ignore this email.
                    </p>
                </div>
            </div>

            <div class="col-3"></div>
        </div>
    </div>

    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
      crossorigin="anonymous"
    ></script>
  </body>
</html>

`;

      return res.send(html);
    } catch (err) {
      return res.send({ message: "Error Occurred" });
    }
  };

  static getResetEmailDetails = async (req, res) => {
    try {
      try {
        const { emailId } = req.params;
        let email = await resetPasswordModel.findById(emailId);
        res.send(email);
      } catch (err) {
        return res.send("Error Occured");
      }
    } catch (err) {}
  };

}

export default EmailController;

// Previous Logic
/*
let verifyEmail = await emailVerificationModel.find({ email: email });
      let resetPasswordEmail = await resetPasswordModel.find({ email: email });

      let str = ``;

      for (let e of verifyEmail) {
        e.type = "verify";
        arr.push(e);
      }

      for (let e of resetPasswordEmail) {
        e.type = "reset";
        arr.push(e);
      }

      arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      for (let item of arr) {
        if (item.type == "verify") {
          let card = `
            <a class="item" href="/emails/verify/${item._id}">
                <div class="card mt-3 w-75">
                <div class="card-body">
                    <p>Email Verification</p>
                 <p>${item.createdAt}</p>
                </div>
                </div>
            </a>
          
            `;

          str += card;
        } else {
          let card = ` <a class="item" href="/emails/reset/${item._id}">
            <div class="card mt-3 w-75">
            <div class="card-body">
                <p>Reset Password</p>
             <p>${item.createdAt}</p>
            </div>
            </div>
        </a>`;
          str += card;
        }
      }

      const html = `
      <!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Emails</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
</head>
<body>
<div class="container mx-auto">
<h1>Emails</h1>
  ${str}
  
</div>
</body>
</html>
      `;

      console.log(str);
      
*/
