/** ******************************************
SIGN UP
Receives user attributes and registers user
Should send notification to admin (To be in=mplemented)

Input Paramaters:
  firstname - user's first name
  lastname - user's last name
  username - selectd username for the user
  email - email address for the user
  orginzation - nonprofit user belogns to
  role - role of user within organization
******************************************* */
Parse.Cloud.define('signup', (request, response) => new Promise((resolve, reject) => {
  const user = new Parse.User();
  user.set('firstname', String(request.params.firstname));
  user.set('lastname', String(request.params.lastname));
  user.set('username', String(request.params.username));
  user.set('password', String(request.params.password));
  user.set('email', String(request.params.email));
  user.set('organization', String(request.params.organization));

  let userRole = '';
  // Query to count number of users for the organization passed into function
  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo('organization', String(request.params.organization));
  userQuery.count().then((results) => {
    // first user signed up, gets admin accesss
    if (results == 0) {
      user.set('role', 'administrator');
      user.set('adminVerified', true);
      userRole = 'admin';
    } else {
      // others need approval from admin
      user.set('role', 'contributor');
      user.set('adminVerified', false);
      userRole = 'contributor';
    }
    return user;
  }).then((user) => {
    // sign up user
    user.signUp().then((result) => {
      console.log(`User created successfully with name ${result.get('username')} and email: ${result.get('email')}`);
      // Parse.Cloud.useMasterKey();
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      console.log(result);
      acl.setWriteAccess(result, true);
      acl.setRoleWriteAccess('admin', true);
      result.setACL(acl);
      result.save(null, { useMasterKey: true }).then((aclUser) => {
        console.log('SAve user with new ACL');
        const roleQuery = new Parse.Query(Parse.Role);
        roleQuery.equalTo('name', userRole);

        roleQuery.first({ useMasterKey: true }).then((role) => {
          console.log('Found role');
          role.getUsers().add(aclUser);
          console.log('add user to role');
          role.save(null, { useMasterKey: true });
          console.log('saved user to role');
          resolve(aclUser);
        }, (error) => {
          reject(error);
        });
      });
    });
  }, (error) => {
    console.log(`Error: ${error.code} ${error.message}`);
    reject(error);
  });
}));


/** ******************************************
SIGN IN
Signs a user in with given username and password
Will also check the email to see if that is being used

Input Paramaters:
  username - selected username for the user
  password - user password
******************************************* */
Parse.Cloud.define('signin', (request, response) => new Promise((resolve, reject) => {
  Parse.User.logIn(String(request.params.username), String(request.params.password)).then((result) => {
    console.log(`User logged in successful with username: ${result.get('username')}`);
    resolve(result);
  }, (error) => {
    // If the user inputs their email instead of the username
    // attempt to get the username
    console.log('Trying to use email instead of Username');
    const userQuery = new Parse.Query(Parse.User);

    userQuery.equalTo('email', request.params.username);
    userQuery.first().then((success) => {
      const { username } = success.toJSON();
      Parse.User.logIn(username, String(request.params.password)).then((result) => {
        console.log(`User logged in successful with email: ${result.get('email')}`);
        resolve(result);
      }, (error) => {
        console.log(`Error: ${error.code} ${error.message}`);
        response.error(reject(error));
      });
    }, (error) => {
      console.log(`Error: ${error.code} ${error.message}`);
      response.error(reject(error));
    });
  });
}));

/** ******************************************
SIGN OUT
Attempts to log a user out and display success/reject message

Input Paramaters:
  none
******************************************* */
Parse.Cloud.define('signout', (request, response) => new Promise((resolve, reject) => {
  Parse.User.logOut().then((result) => {
    resolve(result);
  }, (error) => {
    reject(error);
  });
}));

/** ******************************************
FORGOT PASSWORD
Recevies a user email address and immediately send out a
reset email link to the user.

Input Paramaters:
  email - user's email associated with the account
******************************************* */
Parse.Cloud.define('forgotPassword', (request, response) => new Promise((resolve, reject) => {
  Parse.User.requestPasswordReset(String(request.params.email)).then(() => {
    console.log('Password reset request was sent successfully');
    resolve('Success');
  }, (error) => {
    console.log(`Error: ${error.code} ${error.message}`);
    reject(error);
  });
}));

/** ******************************************
CURRENT USER
captures the cached current user object to avoid having to
log back in every time

Input Paramaters:
  none
******************************************* */
Parse.Cloud.define('currentUser', () => {
  const u = Parse.User.current();

  if (user) {
    var user = new User();
    user.id = u.id;
    user.name = u.get('username');
    user.email = u.get('email');
    user.organization = u.get('organization');
    user.role = u.get('role');
    return user;
  }
  return null;
});

Parse.Cloud.define('deleteUser', (request) => new Promise((resolve, reject) => {
  const { userId } = request.params;
  const user = new Parse.User();
  user.set('id', userId);
  const query = new Parse.Query(Parse.User);
  query.get(userId).then((user) => user.destroy({ useMasterKey: true }), { useMasterKey: true })
    .then(() => {
      resolve(user);
    }, (error) => {
      reject(error);
    });
}));
