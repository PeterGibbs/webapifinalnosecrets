
const express = require('express');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("ITS A SECRET");
var port = process.env.PORT || 8080;
mongoose=require('mongoose');

mongoose.connect("ITS A SECRET",(err,db)=>{
    if (err) throw err;
    console.log("connect to db")
});
var User=require("./models/Users");
var Meme=require("./models/Memes");
const {dialogflow,SignIn,DeliveryAddress} = require('actions-on-google');
const {
    SimpleResponse,
    BasicCard,
    Image,
    Suggestions,
    Button,
    Carousel
  } = require('actions-on-google');
const app = dialogflow({
    debug: true,
    clientId: 'ITS A SECRET'
    });
app.middleware((conv) => {
    
});
const Contexts = {
    GET_MEME_FOLLOWUP: 'Getmeme-followup'
  };
app.intent('Default Welcome Intent', conv => {
    conv.ask(new SignIn('To get your account details'))
    
})

app.intent('Get Signin', async (conv, params, signin) => {
    if (signin.status === 'OK') {
      
      
     var userExists=false;
     userExists=await User.findOne({email:conv.user.email},function(err,user){
        if(err) throw err;
        if(user){
            
            return true;
        }else{
            return false;
        }
      });
      if(userExists){
            conv.ask(`Welcome back  ${conv.user.email}. What do you want to do next?`)
      }else{
            var newUser=User({
                email:conv.user.email,
                address:"",
                sendDirect: false
            })
            await newUser.save(function(err){if(err) throw err;})
            
            askForAddress(conv)
      }
      
    } else {
      conv.ask(`I won't be able to save your data, but what do you want to next?`)
    }
})

app.intent('Get meme', (conv, params) => {
    
    displayMemeSources(conv)
    
})

app.intent('Get Address', (conv,params) => {
    askForAddress(conv)
});

function askForAddress(conv){
    
    conv.ask(new DeliveryAddress({
        addressOptions: {
          reason: 'We need your address to know where to send memes',
        }
    }));
}
app.intent('Set Address',(conv,params)=>{
    const arg = conv.arguments.get('DELIVERY_ADDRESS_VALUE');
    if (arg && arg.userDecision ==='ACCEPTED') {
    console.log('DELIVERY ADDRESS: ' +
    arg.location.postalAddress.addressLines[0]);
    var postalAddress=arg.location.postalAddress
    var finalAddress= postalAddress.addressLines[0]+", "+postalAddress.locality+", "+postalAddress.administrativeArea+", "+postalAddress.postalCode
    var updateSuccess=User.findOneAndUpdate({email:conv.user.email},{address:finalAddress},function(err,user){
        if (err) throw err;
        if(user){
            return true;
        }else{
            return false;
        }

    })
    if(updateSuccess){
        conv.ask(`Ok your address is now set to ${arg.location.postalAddress.addressLines[0]}`)
    }else{
        conv.close('Somthing went wrong. You are not in the database');
    }
        
    } else {
        conv.close('You failed to set your address, Goodbye!');
    }
})

function displayMemeSources(conv){
    conv.ask("Please select a source for your memes")
    conv.ask(new Carousel({
        items: {
          cnn: {
            title: 'CNN',
            description: 'CNN',
            
          },
          bbc: {
            title: 'BBC',
            description: 'BBC',
          },
          fox: {
            title: 'Fox',
            description: 'Fox',
          },
          wikihow: {
            title: 'Wikihow',
            description: 'Wikihow',
          }
        }
      }));
}
async function getMeme(option){
    /*
        MATT ADD YOUR CODE HERE. 

        option is either [cnn,bbc,fox,wikihow]
    */
    return "https://assets.entrepreneur.com/content/3x2/2000/20180703190744-rollsafe-meme.jpeg?width=700&crop=2:1"
}
app.intent('get_carousel_option', async (conv, input, option) => {
    
     conv.ask(`Your meme created from content collected from  ${option} will be delivered to you in 2-5 buisness days`);
      
     var memeURL=await getMeme(option)
     var newMeme=Meme({
        url:memeURL,
        userEmail:conv.user.email
    })
    
    await newMeme.save(function(err){if(err) throw err;})
    const msg = {
        to: "ITSASECRET@gmail.com", //employee email
        from: 'memeinc@memes.com',
        subject: 'Meme Assignment',
        text: 'Meme Assignment',
        html: "You have new memes to deliver! ",
    };
    sgMail.send(msg);
});


app.intent('Default Fallback Intent', (conv) => {
    conv.ask("I did not get that, go home!");
})

express().use(bodyParser.json(), app).listen(port)
