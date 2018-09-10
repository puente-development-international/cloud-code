'use strict';


const Patient = require('./classes/patient.js')

Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
}); 
/*
OLD version of below
Parse.Cloud.define("retrievePatientRecordsAll", function(request, response) {
    var PatientDemographics = Parse.Object.extend('SurveyData');
    var q = new Parse.Query(PatientDemographics);
    q.limit(2000);
    q.find().then((results) =>{
      response.success(results);
    }, (error) => {
      response.error(error);
    });
}); */

Parse.Cloud.define("retrievePatientRecordsAll", function(request, response) {
  let patient = new Patient();

  try {
    patient.retrieveAllPatients().then((results)=>{
      response.success(results);
    })    
  }
  catch(error){
    console.log(response.error(error));
  }
});

//TO REFACTOR
Parse.Cloud.define("retrievePatientRecordByOrgnization", function(request, response) {
  return new Promise((resolve,reject)=> {
    var PatientDemographics = Parse.Object.extend(this.ParseClass);
    var q = new Parse.Query(PatientDemographics);
    q.limit(2000);
    q.equalTo("surveyingOrganization", request.params.organization);
    q.find().then((results) =>{
      response.success(resolve(results));
    }, (error) => {
      response.error(reject(error));
    });
  });
});

//Proto - Don't Know if works, still need to test
Parse.Cloud.define("retrieveAllFormsForPatientByPatientID", function(request, response) {
  let patient = new Patient();

  try {
    patient.retrieveAllFormsForPatientByPatientID(request.patiendID).then((results)=>{
      response.success(results);
    })    
  }
  catch(error){
    console.log(response.error(error));
  }
}); 