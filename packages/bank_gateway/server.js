const express = require('express');
const bodyParser = require('body-parser');
const server = require('./data/schema.js');
const path = require('path');
const axios = require('axios');

const config = require('../bank_gateway/config');
const port = config.port;
const customer_port = config.customerServiceDatabase.port;
const account_port = config.accountServiceDatabase.port;
const hostname = `http://localhost`;

const app = express();

server.applyMiddleware({ app });
app.set("view engine", "ejs");

const view_path = path.join(__dirname, '/public/views/');
const static_files = path.join(__dirname, '/public/');

/* serve get routes for web pages */ 
let router = express.Router();
app.use('/', router);
app.use(express.static(static_files));

let urlencodedParser = bodyParser.urlencoded({extended: false});

router.get('/', function(req, res) {
	res.render(view_path + 'index');
});

router.get('/transactions', function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				{
					moneytransfers {
						transaction_id
						from_account
						to_account
						amount
						remark
						created_at
					}
				}
			`
		}
	}).then((transactions) => {
		res.render(view_path + 'transactions', {data: transactions.data.data});
	});
});

router.get('/money_transfer', function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				{
					accounts {
						account_number
						balance
					}
				}
			`
		}
	}).then((accounts) => {
		res.render(view_path + 'money_transfer', {data: accounts.data.data});
	});
});

router.post('/transfer_money', urlencodedParser, async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				mutation moneytransfer
				(
					$from_account: String!,
					$to_account: String!,
					$amount: Float!,
					$remark: String,
				) {
					moneytransfer(from_account: $from_account, to_account: $to_account, amount: $amount, remark: $remark) {
						transaction_id
					}
				}`,
				variables: {
					from_account: req.body.from_account,
					to_account: req.body.to_account,
					amount: parseFloat(req.body.amount),
					remark: req.body.remark,
				}
		},
		headers: {
			'Content-Type': 'application/json'
		}
	  }).then((result) => {
		res.render(view_path + 'money_transfer', {transaction_id: result});
	});
});

router.get('/view_transaction/:transaction_id', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				query {
					moneytransfer(transaction_id: "${req.params.transaction_id.toString()}") {
						transaction_id
						from_account
						to_account
						amount
						remark
						created_at
					}
				} 
			`
		},
		headers: {
			'Content-Type': 'application/json'
		}
	}).then((response) => {
		res.render(view_path + 'view_transaction', {'data': response.data.data});
	}, (error) => {
		console.log('error while fetching transaction', error)
	});
});


router.get('/accounts', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				{
					accounts {
						account_number
						account_type
						balance
						bank_name
						branch
						customer_id
					}
				}
			`
		}
	}).then((accounts) => {
		res.render(view_path + 'accounts', {data: accounts.data.data});
	});
});

router.get('/create_account', function(req, res) {
	res.render(view_path + 'create_account');
});

router.get('/update_account/:account_number', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				query {
					account(account_number: "${req.params.account_number.toString()}") {
						account_number
						account_type
						balance
						bank_name
						branch
						ifsc_code
						is_active
						customer_id
					}
				}
			`
		},
		headers: {
			'Content-Type': 'application/json'
		}
	}).then((response) => {
		res.render(view_path + 'update_account', {'data': response.data.data});
	}, (error) => {
		console.log('error while fetching account', error)
	});
});

router.get('/view_account/:account_number', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				query {
					account(account_number: "${req.params.account_number.toString()}") {
						account_number
						account_type
						balance
						bank_name
						branch
						ifsc_code
						is_active
						customer_id
					}
				}
			`
		},
		headers: {
			'Content-Type': 'application/json'
		}
	}).then((response) => { 
		res.render(view_path + 'view_account', {'data': response.data.data});
	}, (error) => {
		console.log('error while fetching account', error)
	});
});

router.post('/create_account', urlencodedParser, async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				mutation account
				(
					$account_type: String!,
					$bank_name: String!,
					$branch: String!,
					$ifsc_code: String!,
					$balance: Float
				) {
					account(account_type: $account_type, bank_name: $bank_name, branch: $branch, ifsc_code: $ifsc_code, balance: $balance) {
						account_number
					}
				}`,
				variables: {
					account_type: req.body.account_type,
					bank_name: req.body.bank_name,
					branch: req.body.branch,
					ifsc_code: req.body.ifsc_code,
					balance: parseFloat(req.body.opening_balance)
				}
		},
			headers: {
			  'Content-Type': 'application/json'
			}
	  }).then((result) => {
		res.render(view_path + 'create_account', {account_number: result});
	});
});

router.post('/update_account/:account_number', urlencodedParser, async function(req, res) {
	axios.put(`${hostname}:${account_port}/update_account/${req.params.account_number}`, req.body)
		.then(response => {
			res.render(view_path + 'update_account', {is_updated: response.data.status});
		});
});

router.post('/delete_account/:account_number', async function(req, res) {
	axios.delete(`${hostname}:${account_port}/delete_account/${req.params.account_number}`)
		.then(response => {
			res.render(view_path + 'accounts', {is_deleted: response.data.payload.deletedCount});
		});
});

router.get('/customers', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				{
					customers {
				    customer_id
                    customer_name
                    active_accounts
                    phone_no
                    address
					}
				}
			`
		}
	}).then((customers) => {
		res.render(view_path + 'customers', {data: customers.data.data});
	});
});

router.get('/create_customer', function(req, res) {
	res.render(view_path + 'create_customer');
});

router.get('/update_customer/:customer_id', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				query {
					customer(customer_id:"${req.params.customer_id.toString()}") {
						customer_id
						customer_name
                        active_accounts
                        phone_no
                        address
					}
				}
			`
		},
		headers: {
			'Content-Type': 'application/json'
		}
	}).then((response) => {
		console.log("Hello world======================================================",response);
		res.render(view_path + 'update_customer', {'data': response.data.data});
	}, (error) => {
		console.log('error while fetching customer', error)
	});
});

router.get('/view_customer/:customer_id', async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				query {
					customer(customer_id: "${req.params.customer_id.toString()}") {
					customer_id
					customer_name
                    active_accounts
                    phone_no
                    address
					}
				}
			`
		},
		headers: {
			'Content-Type': 'application/json'
		}
	}).then((response) => { 
		res.render(view_path + 'view_customer', {'data': response.data.data});
	}, (error) => {
		console.log('error while fetching customer', error)
	});
});

router.post('/create_customer', urlencodedParser, async function(req, res) {
	axios({
		url: `http://localhost:${port}/graphql`,
		method: 'POST',
		data: {
			query: `
				mutation customer
				(
                    $customer_name: String!,
                    $phone_no: Float,
                    $address: String
				) {
					customer(customer_name : $customer_name,
						phone_no: $phone_no,
						address: $address) {
						customer_id
					}
				}`,
				variables: {
					customer_name: req.body.customer_name,
					phone_no: parseFloat(req.body.phone_no),
					address: req.body.address
				}
		},
			headers: {
			  'Content-Type': 'application/json'
			}
	  }).then((result) => {
		res.render(view_path + 'create_customer', {customer_id: result});
	});
});

router.post('/update_customer/:customer_id', urlencodedParser, async function(req, res) {
	axios.put(`${hostname}:${customer_port}/update_customer/${req.params.customer_id}`, req.body)
		.then(response => {
			res.render(view_path + 'update_customer', {is_updated: response.data.status});
		});
});

router.post('/delete_customer/:customer_id', async function(req, res) {
	axios.delete(`${hostname}:${customer_port}/delete_customer/${req.params.customer_id}`)
		.then(response => {
			res.render(view_path + 'customers', {is_deleted: response.data.payload.deletedCount});
		});
});


app.listen({ port: port });