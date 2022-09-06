const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserData = require(`../model/user-model`);

passport.use(new LocalStrategy({
  usernameField: 'email'
}, (email, password, done)=> {
  UserData.findOne({ email: email }, (err, user)=> {
    if(err) return done(err); // return error if any
    if(!user) { // return null if no user found
      return done(null, false, {
        message: 'User not found' 
      });
    }
    if(validatePassword(user, password)) { // return  if invalid password
      return done(null, false, {
        message: 'Invalid Password'
      });
    }
    return done(null, user)
  })
}
));

encryptPassword = (password)=> {
  let salt = crypto.randomBytes(16).toString('hex');
  let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return {
    salt: salt,
    hash: hash
  }
}

generateJwt = (user)=> {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: user._id,
    email: user.email,
    name: user.fullname,
    userType: user.userType,
    adminapproved: user.adminapproved,
    exp: parseInt(expiry.getTime() / 1000),
  }, "MY_SECRET"); // DO NOT KEEP YOUR SECRET IN THE CODE!
}

validatePassword = (user, password)=> {
  var hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
  return user.hash === hash;
};

module.exports.addNewUser = async (req)=> {

  let user = {       
    fullname : req.body.name,
    email : req.body.email,
    userType : req.body.userType,
    adminapproved : false
  }

  let encryptedPassword = encryptPassword(req.body.password);
  user.salt = encryptedPassword.salt;
  user.hash = encryptedPassword.hash;


  let newUser = new UserData(user);

  let saveUserStatus = newUser.save()
    .then((user)=>{
      let token = generateJwt(user)
        console.log('New user added');
        return { 
        success: true,
        message: 'Successfully added new user',
        token: token
      }
    }).catch((err)=> {
        let errMsg = (err.code == 11000)? 'Email already used' : '';
        console.log('Failed to add new user-', errMsg, err.code);
        return  { 
        success: false,
        message: `Failed to add new user, ${errMsg}`,
      }
    });

  return saveUserStatus

}

module.exports.loginUser = async (req)=> {

  let fetchedUser = await UserData.findOne({ email: req.body.email });

  if(fetchedUser) {
    userAuthenticated = validatePassword(fetchedUser, req.body.password);
  } else {
    return {
      success: false,
      message: 'User not found'
    }
  }

  if(userAuthenticated) {
    let token = generateJwt(fetchedUser);
    return {
      success: true,
      token: token,
      userId: fetchedUser._id,
      message: 'User authenticated'
    } 
  } else {
    return {
      success: false,
      message: 'Incorrect password'
    }
  }

}