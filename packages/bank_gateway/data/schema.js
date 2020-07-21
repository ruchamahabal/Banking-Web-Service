const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const resolvers = require('./resolvers');

const app = express();
const typeDefs = `
    type Query {
        customers: [Customer]
        accounts: [Account]
        moneytransfers:[MoneyTransfer]
    }

    type Mutation {
        customer(customer_id: ID!, customer_name: String!, active_accounts: Float!): Customer
        account(account_number: ID!, account_type: String!, bank_name: String!, balance: Float, customer_id: String, is_active: Boolean): Account
    }

    type Customer {
        customer_id: ID,
        customer_name: String,
        active_accounts: Float,
        _id: String
    }

    type Account {
        account_number: ID,
        account_type: String,
        bank_name: String,
        balance: Float,
        customer_id: String,
        is_active: Boolean,
        _id: String
    }

    type MoneyTransfer {
        t_id :Number,
        rec_accno:Number,    
        rec_Fname :String,   
        rec_Lname:String,    
        bank_name:String,    
        ifsc_code:String,    
        mob_no:Number,       
        amt:Number,          
        remark:String,       
        acc_no:Number,        
        trans_type: String, 
        customer_id:Number   
    }
`;

module.exports = new ApolloServer({
    typeDefs,
    resolvers
});