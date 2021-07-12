const express = require("express");
const router = express.Router();
const { getTransactionsData } = require('../controllers/transactions.controller');
const Transactions = require("../models/Transactions");
const fs = require('fs')
let months = ['march','april','may','june','july']
const path = require('path');

// router.get('/paypal',async (req,res) => {
//     try {
//         let finalArrToPush = []
//         months.forEach(month => {
//             let data = fs.readFileSync(path.join(__dirname,`../files/paypal/${month}.json`), 'utf8')
//             data = JSON.parse(data)
//             finalArrToPush =  [...finalArrToPush, ...data.transaction_details.map(transaction => {
//                 let { transaction_id:id,transaction_initiation_date:date,transaction_amount:{ value:amount } } = transaction.transaction_info
//                 if(!amount){
//                     console.log(amount)
//                 }
//                 if(!date){
//                     console.log(date)
//                 }
//                 return {
//                     id,
//                     amount:parseFloat(amount) * -1,
//                     mode:"PAYPAL",
//                     date:new Date(date)
//                 }
//             })]
//         })
//         let data = await Transactions.insertMany(finalArrToPush)
//         return res.json({
//             message: `${data.length} Transactions created successfully`
//         })    
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             error:"Something went wrong!"
//         })
//     }
// })


// router.get('/razorpay',async (req,res) => {
//     try {
//         let finalArrToPush = []
//         months.forEach(month => {
//             let data = fs.readFileSync(path.join(__dirname,`../files/razorpay/${month}.json`), 'utf8')
//             data = JSON.parse(data)
//             let capturedTransactions = []
//             data.items.forEach(transaction => {
//                 let { id,amount,status,created_at } = transaction
//                 if(status === "captured"){
//                     capturedTransactions.push({
//                         id,
//                         mode:"RAZORPAY",
//                         amount:amount/100,
//                         date:new Date(created_at*1000)     
//                     })
//                 }
//             })
//             finalArrToPush = [...finalArrToPush,...capturedTransactions]
//         })
//         let data = await Transactions.insertMany(finalArrToPush)
//         return res.json({
//             message: `${data.length} Transactions created successfully`
//         }) 
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({
//             error:"Something went wrong!"
//         })
//     }
// })

router.get('/',getTransactionsData);
module.exports = router;