const admin = require('firebase-admin');

exports.notification = async function (title, body, token) {

    let message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
    }
    
    admin
        .messaging()
        .send(message)
        .then(function (response) {
          console.log('Successfully sent message: ', response)
        })
        .catch(function (err) {
            console.log('Error Sending message: ', err)
        });
};