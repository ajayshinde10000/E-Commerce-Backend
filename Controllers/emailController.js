import sellerModel from "../Models/seller.js";
import resetPasswordModel from "../Models/resetPassword.js";
import emailVerificationModel from "../Models/emailVerification.js";

class EmailController{
    static enterEmail = async(req,res)=>{
        res.send(`
                <html>
                <head>
                <title>Email Verification</title>
                </head>
                <body>
                <h1>Enter your email address:</h1>
                    <form action="/emails/verify" method="post">
                    <input type="email" name="email" required> <br>
                    <button type="submit">Verify</button>
                    </form>
                </body>
                </html>
        `);
    }

    static verifyEmail = async(req,res)=>{
        const { email } = req.body;
        console.log(req.body)
        try {
          // Check if the email exists in MongoDB
          const existingEmail = await sellerModel.find({ email: email });
         // console.log(email,"From Existing email");
          if (existingEmail) {
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

            res.send(`
                <html>
                <head>
                <title>Email Verification</title>
                </head>
                <body>
                <h1>Enter your email address:</h1>
                    <form action="/emails/verify" method="post">
                    <input type="email" name="email" required>
                    <p>Please Enter Valid email</p>
                    <button type="submit">Verify</button>
                    </form>
                </body>
                </html>
        `);
          }
        } catch (err) {
          console.error(err);
          res.status(500).send('An error occurred during email verification');
        }
    }

    static getEmails = async(req,res)=>{
        try{
            const {email} = req.params;
            console.log(email,"From Params");

            let arr = [];
            let verifyEmail = await emailVerificationModel.find({email:email});
            let resetPasswordEmail = await resetPasswordModel.find({email:email});

            let str=`<div style="height:50px;text-align:center">Verify Email</div>`;
            for(let e of verifyEmail){
                arr.push(e);
                str += `<div style="height:50px;text-align:center">Verify Email</div>`
            }

            for(let e of resetPasswordEmail){
                arr.push(e);
                str += `<div style="height:50px;text-align:center"">Reset Email</div>`
            }
            console.log(verifyEmail,"From Reset Email");

            console.log(email);

           
            return res.send(str);

        }catch(err){
            return res.send("Error Occurred");
        }
    }
}

export default EmailController;