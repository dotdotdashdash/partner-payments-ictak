const express = require(`express`);
const UserData = require(`../model/user-model`);
const fs = require('fs');
const path = require('path');
const InvoiceData = require(`../model/invoice-model`);
const { TrainingRequest } = require(`../model/work-order-model`);
const { verifyToken } = require('../contoller/auth-controller');
const { 
  userListGen, 
  createWorkOrder, 
  approveInvoice, 
  getPartner,
  addNewRequest
} = require('../contoller/admin-controller');

const adminRouter = express.Router();

adminRouter.get(`/getpartners`, (req, res)=> {
  UserData.find({
    $and: [
      { userType: 'Partner' },
      { adminapproved: true }
    ]
  })
    .then((succ)=> {
      let partnerList =  userListGen(succ) // calling the function to modify the fetched list of users
      res.status(200).send(partnerList);
    }).catch((err)=> {
      console.log(err);
    });
});

adminRouter.get(`/getuserlist`, (req, res)=> {

  UserData.find({adminapproved: false})
  .then((succ)=> {
    let userList = userListGen(succ); 
    res.status(200).json({
      success: true,
      data: userList
    });
  }).catch((err)=> {
    console.log(err);
  });
});

adminRouter.post('/newrequest', async (req, res)=> {
  var newRequest = req.body.trainingRequest;

  var partnerDetails = await getPartner(newRequest.trainingDetails.partnerId);
  
  if(partnerDetails) {
    if(partnerDetails.gstnumber && partnerDetails.address) {
      var addNewRequestStatus = await addNewRequest(newRequest, partnerDetails);
    } else {
      res.status(412).json({
        success: false,
        message: 'Partner profile incomplete. Inform the partner to add address and GST number in their profile',
      });
    }
  } else {
    res.status(412).json({
      success: false,
      message: 'Cannot find partner!'
    });
  }

  if(addNewRequestStatus && addNewRequestStatus.success) {
    res.status(200).json(addNewRequestStatus);
  } else {
    res.status(500).json(addNewRequestStatus);
  }

});

adminRouter.put('/modifyrequest', (req, res)=> {
  console.log(req.body.requestId);

  id=req.body.requestId,
  
  TrainingRequest.findByIdAndUpdate(id,
  {$set: {
    "trainingDetails.topic": req.body.trainingRequest.trainingDetails.topic,
    "trainingDetails.partnerName": req.body.trainingRequest.trainingDetails.partnerName,
    "sessionDetails.mode": req.body.trainingRequest.sessionDetails.mode,
    "sessionDetails.venue": req.body.trainingRequest.sessionDetails.venue,
    "sessionDetails.hourlyPayment": req.body.trainingRequest.sessionDetails.hourlyPayment,
    // "sessionDetails.startTime": req.body.trainingRequest.sessionDetails.startTime,
    // "sessionDetails.endTime": req.body.trainingRequest.sessionDetails.endTime,
  }})
  .then(function(succ){
    console.log(succ)
  })
});

adminRouter.delete('/deleterequest/:id',(req,res)=>{
   
  TrainingRequest.findByIdAndDelete(req.params.id)
  .then(()=>{
      console.log('success')
      res.status(200).json({
        success: true,
        message: 'Deleted successfully'
      });
  }).catch((err)=> {
    console.log(err.message);
    res.status(504).json({
      success: false,
      message: 'Failed to delete'
    });
  });
}) 

adminRouter.get('/trainingrequest', (req, res)=> {
  TrainingRequest.findById(req.query.requestId, (err, data)=> {
    if(err) {
      console.log(err.message);
      res.status(500).json({
        success: false,
        message: err.message
      });
    } else {
      res.status(200).json({
        success: true,
        data: data
      });
    }
  });
});

adminRouter.get(`/trainingrequests`, (req,res)=> {
  TrainingRequest.find({ adminApproved: false })
    .then((succ)=> {
      res.send(succ)
    }).catch((err)=> {
      console.log(err);
      res.send('Some error')
    });
});

adminRouter.route(`/createworkorder`)
  .get((req, res)=> {
    res.render('template', req.query);
  }).post((req, res)=> {
    createWorkOrder(req, res)
      .then((succ)=> {
        if(succ.success) {
          console.log('New work order generated')
          res.status(200).json({
            success: true,
            message: 'New work order generation successfull'
          });
        } else {
          console.log(`New work order generation failed, file: admin-router.js ~ line 118 ~ .then ~ else`)
          res.status(500).json({
            success: false,
            message: 'New work order generation failed'
          });
        }
      }).catch((err)=> {
        console.log('New work order generation failed, A-R: L115', err.message);
        res.status(500).json({
          success: false,
          message: 'New work order generation failed'
        });
      });
});

adminRouter.get(`/getworkorders`, (req,res)=> {

  TrainingRequest.find(req.query)
    .then((succ)=> {
      res.status(200).json({
        success: true,
        workOrders: succ
      });
    }).catch((err)=> {
      console.log('Error on fetching work orders', err.message);
      res.status(500).json({
        success: false,
        message: `Unknown error. Can't get list of work orders`
      });
    });
});

adminRouter.get(`/getworkorder/:id`, (req, res)=> {
  console.log('adminrouter - getworkorder', req.params.id);

  if(fs.existsSync(path.join(__dirname, '../assets/work-orders/generated/', `workorder_${req.params.id}.pdf`))) {
    res.status(200).sendFile(path.join(__dirname, '../assets/work-orders/generated/', `workorder_${req.params.id}.pdf`));
  } else {
    console.log('File not found');
    res.status(404).send('File not found');
  }

});

adminRouter.get('/getinvoice/:id', (req, res)=> {

  console.log('adminrouter - getinvoice', req.params.id);

  if(fs.existsSync((path.join(__dirname, '../assets/uploads/invoices', `${req.params.id}`)))) {
    res.status(200).sendFile(path.join(__dirname, '../assets/uploads/invoices', `${req.params.id}`));
  } else {
    res.status(404).send('File not found');
  }

});

adminRouter.get(`/getinvoices`, (req, res)=> {
  var qry = req.query;
  // console.log('param value',qry.adminApproved);
  if(qry.adminApproved == false || qry.adminApproved == 'false'){
    qry = {adminApproved: { $exists: false }}
  }
  
<<<<<<< HEAD
  InvoiceData.find(qry)//req.query
=======

  //InvoiceData.find(req.query)
  InvoiceData.find({ 
    $and:[
      {adminApproved: true},
      {paid: req.query.paid}
    ]
  })
>>>>>>> main
    .then((succ)=> {
      res.status(200).json({
        success: true,
        data: succ
      })
    }).catch((err)=> {
      console.log('Error while fetching invoices',err);
      res.status(500).json({
        success: false,
        message: `Server error while fetching invoices`
      });
    });
    
});

adminRouter.put('/approveinvoice', (req, res)=> {

  InvoiceData.findById(req.body.invoiceId)
    .then((data)=> {
      // console.log(data);
      approveInvoice(req, res, data);
    }).catch((err)=> {
      console.log('Error while fetching invoice data', err.message);
    });

});
//denyinvoice
adminRouter.put('/denyinvoice', (req, res)=> {
    const id = req.body.invoiceId;
    InvoiceData.findByIdAndUpdate({"_id":id},
    {$set:{
      "adminApproved":false,
    }})
  .then((success)=> {
    console.log('success', success);
    res.status(200).json({
      success: true,
      message: 'Invoice rejected'
    });
  })
  .catch((err)=> {
    res.json({
      success: false,
      message: 'Error while rejecting invoice',
    });
  });

});

adminRouter.put('/approveuser',verifyToken, (req,res) =>{  
  const id = req.body.id;
  
  UserData.findByIdAndUpdate({"_id":id},
  {$set:{
    "adminapproved":true,
    }}).then((success)=> {
      console.log('User approved');
      res.status(200).json({
        success: true,
        message: 'User account approved successfully'
      });
    }).catch((err)=> {
      res.json({
        success: false,
        message: 'User account approval failed',
      });
  });

});

module.exports = adminRouter;