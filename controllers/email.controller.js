import sellerModel from "../models/seller.model.js";
import path from "path";
import emailsModel from "../models/emails.model.js";
import shopUserModel from "../models/shop-user.model.js";
const __dirname = path.resolve();

class EmailController {
    static enterEmail = async (req, res) => {
        return res.sendFile(path.join(__dirname, "./", "HTML_PAGES", "index.html"));
    };

    static verifyEmail = async (req, res) => {
        const { email } = req.body;
        try {
            const existingEmail = await sellerModel.find({ email: email });
            const shopUserEmail = await shopUserModel.find({ email: email });
            if (existingEmail.length != 0 || shopUserEmail.length != 0) {
                req.reqEmail = email;
                return res.redirect(`/emails/${email}`);
            }
            else {
                return res.redirect("/emails");
            }
        }
        catch (err) {
            res
                .status(500)
                .send({ message: "An error occurred during email verification" });
        }
    };

    static getEmails = async (req, res) => {
        try {
            const { email } = req.params;
            let savedEmails = await emailsModel
                .find({ email: email })
                .sort({ createdAt: -1 });
            let myStr = "";

            if (savedEmails.length == 0) {
                return res.redirect("/emails");
            }

            for (let e of savedEmails) {
                let attchType = "Email Verification";
                if (e.type == "reset") {
                    attchType = "Reset Password";
                }

                myStr += ` 
        <a href="/emails/view/${e._id}">
          <div class="card mt-3">
                <div class="card-body" style="background-color: #eeeeee;">
                    <p class="fw-bold my-0">${attchType}</p>
                    <p class="mb-0">${e.createdAt}</p>
                </div>
          </div>
        </a>
`;
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
`;
            return res.send(myHtml);
        }
        catch (err) {
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static getVerifyEmailDetails = async (req, res) => {
        try {
            const { emailId } = req.params;
            let email = await emailsModel.findById(emailId);

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
        }
        catch (err) {
            return res.status(400).send({ message: "Error Occured" });
        }
    };

    static getemailDetails = async (req, res) => {
        try {
            const { emailId } = req.params;
            let type = "Verify Email";
            let buttonMsg = "Verify My Email Address";

            let emailDetails = await emailsModel.findById(emailId);
            if (emailDetails.type == "reset") {
                type = "Reset Password";
                buttonMsg = "Reset Password";
            }

            return res.render("emailDetails", {
                name: emailDetails.name,
                link: emailDetails.link,
                type: type,
                buttonMsg
            });
        }
        catch (err) {
            console.log(err);
            return res.status(400).send({ message: "Error Occurred" });
        }
    };

    static getResetEmailDetails = async (req, res) => {
        try {
            try {
                const { emailId } = req.params;
                let email = await emailsModel.findById(emailId);
                res.send(email);
            }
            catch (err) {
                return res.status(400).send({ message: "Error Occured" });
            }
        }
        catch (err) {
            res.status(400).send({ message: err.error.message });
        }
    };
}

export default EmailController;
