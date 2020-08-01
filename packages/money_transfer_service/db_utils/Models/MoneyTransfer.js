const {Schema} = require('mongoose');

const MoneyTransferSchema = new Schema({
    account_number: String,
    from_account: String,
    to_account: String,
    amount: Number, 
    remark: String,
    transaction_time: String   
});
 
module.exports = MoneyTransferSchema;