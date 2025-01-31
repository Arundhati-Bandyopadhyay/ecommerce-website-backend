const User = require("../models/userModel");
const ErrorHandeler = require("../utils/errorHandeler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");


// REGISTER USER

exports.registerUser = async (req, res) => {


    try {

        const { name, email, password } = req.body;

        const user = await User.create({

            name,
            email,
            password,
            avatar: {
                public_id: "this ia apublic id",
                url: "profilepicurl"
            }
        });

        sendToken(user, 201, res);

    }
    catch (err) {

        res.status(400).json({

            success: false,
            message: `cannot create user for ${err}`
        });



    }

}


//LOGIN USER

exports.loginUser = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return next(new ErrorHandeler("please enter email & password", 404));
        }

        const user = await User.findOne({ email: email }).select("+password");

        if (!user) {

            return next(new ErrorHandeler("invalid email or password", 401));
        }

        const isPasswordMatched = await user.comparePassword(password);


        if (!isPasswordMatched) {

            return next(new ErrorHandeler("invalid email or password", 401));
        }

        sendToken(user, 200, res);

    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `Cant login for ${err.message}`
        });

    }
}


// LOGOUT USER

exports.logout = async (req, res, next) => {

    res.cookie("token", null, {

        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({

        success: true,
        message: "Logout successfully"
    });


}



// FORGET PASSWORD

exports.forgetPassword = async (req, res, next) => {

    try {

        const user = await User.findOne({ email: req.body.email });

        if (!user) {

            return next(new ErrorHandeler("User not found", 404));
        }

        // getResetPasswordToken

        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

        const message = `Your password reset token is:-  \n\n ${resetPasswordUrl}`;

        try {

            await sendEmail({

                email: user.email,
                subject: `ecommerce ankush password recovery`,
                message,

            });

            res.status(200).json({

                success: true,
                message: `email send to ${user.email} successfully`
            });


        }
        catch (err) {

            user.resetPasswordToken = undefined;
            user.resetPaswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return next(new ErrorHandeler(err.message, 500));
        }

    }
    catch (error) {

        res.status(400).json({
            success: false,
            message: `forget password not working for ${error.message}`
        });

    }

}


// RESET PASSWORD

exports.resetPassword = async (req, res, next) => {


    try {
        // Creating token hash

        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {

            return next(new ErrorHandeler("Reset password token has been invalid or expired", 400));
        }

        if (req.body.password !== req.body.confirmPassword) {

            return next(new ErrorHandeler("password does not matched", 400));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPaswordExpire = undefined;

        await user.save();

        sendToken(user, 200, res);

    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `reset password not working for ${err}`
        });


    }

}


// GET USER DETIALS

exports.getUserDetials = async (req, res) => {

    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({

            success: true,
            user,
        });
    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `Get User not working for ${err}`
        });

    }

}

// UPDATE USER PASSWORD

exports.updateUserPassword = async (req, res, next) => {

    try {

        const user = await User.findById(req.user.id).select("+password");

        console.log(user);



        const isPasswordMatched = await user.comparePassword(req.body.oldPassword);


        if (!isPasswordMatched) {

            return next(new ErrorHandeler("Old password is incorrect", 400));
        }

        if (req.body.newPassword !== req.body.confirmPassword) {


            return next(new ErrorHandeler("Password doesnot match", 400));
        }

        user.password = req.body.newPassword;

        await user.save();

        sendToken(user, 200, res);


    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `Update password not working for ${err}`
        });

    }
}



// UPDATE USER PROFILE

exports.updateUserProfile = async (req, res, next) => {

    try {

        const newUserData = {

            name: req.body.name,
            email: req.body.email

        }


        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators:true,
            useFindAndModify:false
        });


        res.status(200).json({

            success:true,
            user
        
        });


    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `Update password not working for ${err}`
        });

    }
}


// GET ALL USERS - ADMIN

exports.getAllUsers = async (req,res) => {

    try{

        const users = await User.find();

        res.status(200).json({

            success: true,
            users
        });
    }
    catch(err){

        res.status(400).json({
            success: false,
            message: `Cannot get users for:- ${err}`
        });

    }

}



// GET SINGLE USER - ADMIN

exports.getSingleUser = async (req,res,next) => {

    try{

        const email = req.body.email;


        if (email == null) {

            return next(new ErrorHandeler("please enter email id", 404));
        }

        if (!email) {

            return next(new ErrorHandeler("please enter valid email id", 404));
        }

        const user = await User.findOne({ email: email });


        if (!user) {

            return next(new ErrorHandeler("User not found", 404));
        }

        res.status(200).json({

            success: true,
            user
        });
    }
    catch(err){

        res.status(400).json({
            success: false,
            message: `Cannot get user for:- ${err}`
        });

    }

}





// UPDATE USER ROLE -- ADMIN

exports.updateUserRole = async (req, res, next) => {

    try {

        const email = req.body.email;
        const role = req.body.role;
        

        if (!email || !role) {

            return next(new ErrorHandeler("please enter user email or role", 404));
        }

        const user = await User.findOne({ email: email });

        if (!user) {

            return next(new ErrorHandeler("User not found", 404));
        }



        updatedUserRole = await User.findOneAndUpdate({ email: req.body.email }, { role: req.body.role }, { new: true });

        res.status(201).json({
            success: true,
            updatedUserRole
        });

    }
    catch (err) {

        res.status(400).json({
            success: false,
            message: `Cant update user role for ${err.message}`
        });

    }
}


// DELETE USER --ADMIN

exports.deleteUser = async (req,res,next) => {

    try{
    const email = req.body.email;

    if (!email) {

        return next(new ErrorHandeler("please enter user email", 404));
    }

    const user = await User.findOne({ email: email });


    if (!user) {

        return next(new ErrorHandeler("User not found", 404));
    }

    delUser = await User.findOneAndDelete({ email: req.body.email },{new:true});

    res.status(201).json({
        success: true,
        message: "User deleted successfully"
    });
   }
   catch(err){


    res.status(400).json({
        success: false,
        message: `Cant delete user for ${err.message}`
    });

   }

}



