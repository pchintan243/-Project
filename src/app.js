const express = require("express");
const path = require('path');
const fs = require("fs");
const hbs = require("hbs");
const app = express();
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const { timeStamp } = require("console");
var cors = require('cors');
app.use(cors('*'));
var nm = require('nodemailer');
mongoose.set('strictQuery', true);
const port = 8000;

// Get the mongoose connection conn.js file
require("./db/conn");

// For get the Register schema which is for complaint form
const Complaint = require("./models/complaint");

// For get the Login schema which is for login form
const Login = require("./models/loginSchema");
const adminlogin = require("./models/adminschema");
const signup = require("./models/signup");

// const staticPath = path.join(__dirname, "../img/Aadit.jpg");
// app.use(express.static(staticPath));

// set the view engine as a handlebars(hbs)
app.set("view engine", "hbs");

// Get the path of views directory
const templatePath = path.join(__dirname, "../templates/views/");
app.set("views", templatePath);

// Get the path of partials directory
const partialPath = path.join(__dirname, "../templates/partials/");

// Getting the partials as hbs
hbs.registerPartials(partialPath);

app.use(express.json());
// For get the data in mongodb compass
app.use(express.urlencoded({ extended: false }));

// Home file
app.get('/', (req, res) => {
    res.render('home.hbs');
});

// For User login
app.get('/login', (req, res) => {
    res.render("login");
});

// Complaint form
app.get('/register', (req, res) => {
    res.render("register");
});

// For admin login
app.get('/adminlogin', (req, res) => {
    res.render("adminlogin");
});

// Faculty head login
app.get('/falogin', (req, res) => {
    res.render("fahead");
});

// Lab assistant Login
app.get('/astlogin', (req, res) => {
    res.render("astlogin");
});

// To see all the complaints
app.get('/admin', (req, res) => {
    Complaint.getAllComplaints((err, complaints) => {
        if (err) throw err;

        res.render('assistant', {
            complaints: complaints
        });
    });
});


app.get('/update/:id', function (req, res) {
    Complaint.findByIdAndUpdate(req.params.id, { $set: { flag: 'true' } }, (err, complaints) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render('admin', { complaints: complaints });
        }
    });
});

// To add the new user
app.get('/adduser', (req, res) => {
    res.render("adduser");
});

// For sorting the complaint
app.get('/search', (req, res) => {
    try {
        Complaint.find({ $or: [{ Department: { '$regex': req.query.dsearch } }, { Date: { '$regex': req.query.dsearch } }] }, (err, complaints) => {
            if (err) {
                console.log(err);
            } else {
                res.render('admin', { complaints: complaints });
            }
        })
    } catch (error) {
        console.log(error);
    }
});


var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

let transporter = nm.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',

    auth: {
        user: 'kevinpaghadal8@gmail.com',
        pass: 'orzlqbzozgcbzutn',
    }

});

let email;
let phone;
let Firstname;
let Lastname;

// Get all complaint of particular email ID
app.get('/complaint', (req, res) => {
    try {
        Complaint.find({ Email: email }, (err, complaints) => {
            if (err) {
                console.log(err);
            } else {
                res.render('complaint', { complaints: complaints });
            }
        })
    } catch (error) {
        console.log(error);
    }
});


app.post('/adduser', async (req, res) => {
    try {
        const newUser = new signup({
            Firstname: req.body.Firstname,
            Lastname: req.body.Lastname,
            Phone: req.body.Phone,
            Email: req.body.Email,
            Password: req.body.Password,
        });
        const newUserSuccess = await newUser.save();
        res.send("New User Added Successfully..!!");

    }
    catch (e) {
        res.status(400).send("Login detail not fulfilled");
    }

});


// To get only computer related complaints
app.post('/astlogin', async (req, res) => {

    try {
        Complaint.find({ flag: true }, (err, complaints) => {
            if (err) {
                console.log(err);
            } else {
                res.render('assistant', { complaints: complaints });
            }
        })
    } catch (error) {
        console.log(error);
    }
});


app.get('/update/:id', function (req, res) {
    Complaint.findByIdAndUpdate(req.params.id, { $set: { flag: 'true' } }, (err, complaints) => {
        if (err) {
            console.log(err);
        }
        else {
            res.render('admin', { complaints: complaints });
        }
    });
});


app.post('/send', async (req, res) => {
    email = req.body.Email;

    User.findOne({ email }, { Firstname: 1 }, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        if (!result) {
            console.log("no user found:")
            return;
        }
        Firstname = result.Firstname;
    });

    try {
        // Find the user in the database
        const user = await User.findOne({ email });

        if (!user) {
            res.render('login1', { message: 'Invalid email or password' });
            return;
        }
    }
    catch (e) {
        res.status(400).send("Login detail not fulfilled");
    }

    // send mail with defined transport object
    var mailOptions = {
        to: req.body.Email,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        res.render('loginOTP');
    });
});

// For show Fa-head complaint --> Only Computer related complaint
app.post('/falogin', (req, res) => {
    try {
        Complaint.find({ Query: "Computer" }, (err, complaints) => {
            if (err) {
                console.log(err);
            } else {
                res.render('complaint', { complaints: complaints });
            }
        })
    }
    catch (error) {
        res.status(404).send(error)
    }
})

app.post('/verify', async (req, res) => {

    if (req.body.otp == otp) {
        try {
            Complaint.find({ Email: email }, (err, complaints) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render('client', { complaints: complaints });
                }
            })
        } catch (error) {
            console.log(error);
        }
    }
    else {
        res.render('otp', { msg: 'otp is incorrect' });
    }
});

app.post('/resend', function (req, res) {
    var mailOptions = {
        to: kevin,
        subject: "Otp for registration is: ",
        html: "<h3>OTP for account verification is </h3>" + "<h1 style='font-weight:bold;'>" + otp + "</h1>" // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('otp', { msg: "otp has been sent" });
    });

});


// For login file  --> It opens the login.hbs File
app.post('/login1', async (req, res) => {

    try {
        const loginUser = new Login({
            Email: req.body.Email,
        });
        const loginSuccess = await loginUser.save();
        res.status(201).render("register");
    }
    catch (e) {
        res.status(400).send("Login detail not fulfilled");
    }
});


app.post('/registerComplaint', (req, res) => {
    const Firstname = req.body.Firstname;
    const Lastname = req.body.Lastname;
    const Email = email;
    const Department = req.body.Department;
    const Query = req.body.Query;
    const Computer = req.body.Computer;
    const OtherQuery = req.body.OtherQuery;
    const Phone = req.body.Phone;
    const Note = req.body.Note;

    const postBody = req.body;
    console.log(postBody);
    let errors = false;
    if (errors) {
        res.status(422).render('complaint', {
            errors: errors
        });
    } else {
        const newComplaint = new Complaint({
            Firstname: Firstname,
            Lastname: Lastname,
            Email: Email,
            Department: Department,
            Query: Query,
            Computer: Computer,
            OtherQuery: OtherQuery,
            Phone: Phone,
            Note: Note,
        });
        Complaint.registerComplaint(newComplaint, (err, complaint) => {
            if (err) throw err;
            res.send("Your Complaint Registered Successfully..!!");
        });
    }
});

app.post("/adminlogin", async (req, res) => {
    try {
        const adminloginUser = new adminlogin({
            Email: req.body.Email,
            Password: req.body.Password
        });
        const adminloginSuccess = await adminloginUser.save();
        Complaint.getAllComplaints((err, complaints) => {
            if (err) throw err;

            res.render('admin', {
                complaints: complaints
            });
        });
    }
    catch (e) {
        res.status(400).send("Login detail not fulfilled");
    }
})


app.get('*', (req, res) => {
    res.render('pageNotFound')
})

// Start the server
app.listen(port, () => {
    console.log(`The application started successfully on port ${port}`);
});