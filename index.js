//importing modules
const mysql = require('mysql');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
//express app declared
var app = express();

//global variables
global.currentUser = "";
global.products = [];
global.category_type = 0;
global.payment_mode = 0;
global.isAdmin = false;

//configuring express server
app.use(express.json()) // <==== parse request body as JSON
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());
app.use(require('express-session')({
    secret: "the olx webapp secret cryptography code",
    resave: false,
    saveUninitialized: false
}))
app.use(function(req, res, next) {
    //res.locals.currentUser=req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    res.locals.info = req.flash('info');
    next();
})

//middleware used here
//const routes = require('./src/routes');
//app.use('/',routes);
const mysqlConnection = require('./src/db.js');

//landing page
app.get('/', function(req, res) {
    res.render("landing.ejs");
})

//authentication routes
app.get('/login', function(req, res) {
    res.render('login');
})

app.post('/login', (req, res) => {
    var sql = "select password,isAdmin from auth where username = ?";
    mysqlConnection.query(sql, req.body.username, (err, rows, fields) => {
        if (rows.length < 1) {
            req.flash("error", "invalid username");
            res.redirect("/login");
        } else {
            if (rows[0].password == req.body.password) {
                currentUser = req.body.username;
                if (rows[0].isAdmin) {
                    isAdmin = true;
                } else {
                    isAdmin = false;
                }
                res.redirect("/products");
            } else {
                req.flash("error", "invalid password");
                res.redirect("/login");
            }
        }
    })
})
app.get('/signUp', function(req, res) {
    res.render('signUp');
})

app.post('/signup', (req, res) => {
    console.log(req.body.username);
    let user1 = {
        username: req.body.username,
        phone: req.body.phone,
        pin: req.body.pin,
    };
    let user2 = {
        pin: req.body.pin,
        city: req.body.city,
        state: req.body.state,
    }
    var admin = false;
    if (req.body.admin_code == "secretcode123") {
        admin = true;
        isAdmin = true;
    }
    let login = {
        username: req.body.username,
        password: req.body.password,
        isAdmin: admin
    }
    let sql1 = 'INSERT INTO auth SET ?';
    let sql2 = 'INSERT INTO users1 SET ?';
    let sql3 = 'INSERT INTO users2 SET ?';
    let query1 = mysqlConnection.query(sql2, user1, (err, results) => {
        console.log(err);
        let query2 = mysqlConnection.query(sql3, user2, (err, results) => {
            let query3 = mysqlConnection.query(sql1, login, (err, results) => {
                currentUser = req.body.username;
                res.redirect('/products');
            })
        })
    })
})
app.get('/logout', function(req, res) {
    currentUser = "";
    isAdmin = false;
    res.redirect("/products");

})

//product routes
app.get('/products', function(req, res) {
    sql1 = 'SELECT p.product_name,i.image_url,p.id from product_info p inner join images i on p.id=i.productID inner join categories c on p.categoryID = c.id where p.sold is NULL';
    let query1 = mysqlConnection.query(sql1, (err, rows, fields) => {
        res.render("products/index", { products: rows, filter: 1 });
    });
})

app.get('/products/new', (req, res) => {
    console.log(currentUser)
    if (!currentUser) {
        req.flash("error", "please login first");
        res.redirect("/login");
    } else {
        res.render("products/new");
    }
})

app.post('/filter', (req, res) => {
    console.log(req.body.filter);
    var filter = req.body.filter;
    category_type = filter;
    if (filter == 1) {
        res.render("products/vehicle");
    } else if (filter == 2) {
        res.render("products/electronics");
    } else if (filter == 3) {
        res.render("products/furniture");
    } else if (filter == 4) {
        res.render("products/mobile");
    } else if (filter == 5) {
        res.render("products/books");
    } else if (filter == 6) {
        res.render("products/other");
    } else {
        req.flash("error", "Something went wrong!!!");
        res.redirect("/products");
    }
})
app.post("/products", (req, res) => {
    data = {
        conditionn: req.body.condition,
        year_purchased: req.body.year,
        fuel_economy: req.body.fuel,
        brand: req.body.brand,
        kms_driven: req.body.kms_driven,
        device_name: req.body.device_name,
        furniture_type: req.body.furniture_type,
        category_type: category_type
    }
    loc_data = {
        pin: req.body.pin,
        city: req.body.city,
        state: req.body.state
    }
    let sql1 = 'INSERT INTO categories SET ?';
    let sql2 = 'INSERT INTO product_info SET ?';
    let sql4 = 'select * from users2 where pin=?';
    let sql5 = 'INSERT INTO images SET ?';
    let sql6 = 'INSERT INTO users2 SET ?';
    let query1 = mysqlConnection.query(sql1, data, (err, results, fields) => {
        console.log("test");
        console.log(results);
        product_data = {
            product_name: req.body.product_name,
            description: req.body.description,
            price: req.body.price,
            categoryID: results.insertId,
            sellerID: currentUser,
            post_date: new Date(),
            pin: req.body.pin,
        }
        let query2 = mysqlConnection.query(sql2, product_data, (err, result, fields) => {
            console.log(err);
            var img_data = {
                productID: result.insertId,
                image_url: req.body.image
            }
            let query5 = mysqlConnection.query(sql5, img_data, (err, results) => {
                console.log(req.body.image2.length)
                if (req.body.image2.length > 0) {
                    img_data = {
                        productID: result.insertId,
                        image_url: req.body.image2
                    }
                    let query6 = mysqlConnection.query(sql5, img_data, (err, results) => { console.log("2nd image also added") });
                }
                let query3 = mysqlConnection.query(sql4, req.body.pin, (err, rows, results) => {
                    if (rows.length < 1) {
                        loc_data = {
                            pin: req.body.pin,
                            city: req.body.city,
                            state: req.body.state
                        }
                        let query4 = mysqlConnection.query(sql6, loc_data, (err, results) => {
                            console.log("location added");
                            res.redirect("/products")
                        })
                    } else {
                        console.log("location already exists");
                        res.redirect("/products");
                    }
                })
            })
        })
    })
})
app.post('/products/filter', (req, res) => {
    console.log(req.body.filter);
    if (req.body.filter < 1) {
        res.redirect("/products");
    } else {
        sql1 = 'SELECT p.product_name,i.image_url,p.id from product_info p inner join images i on p.id=i.productID inner join categories c on p.categoryID = c.id where c.category_type=? and p.sold is NULL';
        let query1 = mysqlConnection.query(sql1, req.body.filter, (err, rows, fields) => {
            res.render("products/index", { products: rows, filter: req.body.filter });
        });
    }
})
app.get('/products/:id', (req, res) => {
    var sql1 = 'SELECT p.id,u.pin,u.city,u.state,p.product_name,p.price,p.description,i.image_url,c.conditionn,c.brand,c.kms_driven,c.year_purchased,c.device_name,c.furniture_type,c.fuel_economy,p.post_date,p.sellerID from product_info p inner join images i on p.id=i.productID inner join categories c on p.categoryID = c.id inner join users2 u on u.pin=p.pin where p.id=?';
    var sql2 = 'SELECT c.buyerID,c.time_stamp,c.message from chat c where c.productID=?';
    console.log(req.params.id);
    let query1 = mysqlConnection.query(sql1, req.params.id, (err, rows, fields) => {
        console.log(err);
        var img = "";
        if (rows.length > 1) {
            img = rows[1].image_url;
        }
        console.log(rows[0]);
        let query1 = mysqlConnection.query(sql2, req.params.id, (err, rows2, fields) => {
            if (!rows2) {
                rows2 = [];
            }
            res.render("products/show", { prod: rows[0], image2: img, chat: rows2 });
        })
    })
})
app.get('/products/:id/buy', (req, res) => {
    if (!currentUser) {
        req.flash("error", "please login first");
        res.redirect("/login");
    } else {
        sql1 = 'SELECT p.price,p.id,p.product_name from product_info p where p.id=?';
        let query1 = mysqlConnection.query(sql1, req.params.id, (err, rows, fields) => {
            res.render("payment/mode", { prod: rows[0] });
        });
    }

})

app.get("/products/:id/delete", (req, res) => {
    let sql1 = 'UPDATE product_info p set sold=false where p.id=?'
    let sql2 = 'INSERT INTO delete_product SET ?'
    var data = {
        adminID: currentUser,
        product_id: req.params.id
    }
    let query1 = mysqlConnection.query(sql1, req.params.id, (err, result1, fields) => {
        console.log(err)
        let query1 = mysqlConnection.query(sql1, req.params.id, (err, result1, fields) => {
            console.log(err);
            res.redirect("/products")
        })
    })
})

app.post('/payment_mode/:id', (req, res) => {
    var mode = req.body.mode;
    payment_mode = mode;
    if (mode == 1 || mode == 2) {
        res.render("payment/card", { id: req.params.id });
    } else {
        res.render("payment/cod", { id: req.params.id });
    }
})
app.post('/payment/:id', (req, res) => {
    var pay_data = {
        payment_mode_type: payment_mode,
        pin: req.body.pin,
        card_number: req.body.card_number
    }
    var loc_data = {
        pin: req.body.pin,
        city: req.body.city,
        state: req.body.state
    }
    var card_data = {
        card_number: req.body.card_number,
        cvv: req.body.cvv,
        expiry_date: req.body.expiry_date
    }
    let sql1 = 'INSERT INTO payment_mode_1 SET ?';
    let sql2 = 'INSERT INTO payment_mode_2 SET ?';
    let sql3 = 'INSERT INTO order1 SET ?';
    let sql4 = 'select p.price, p.sellerID from product_info p where p.id=?';
    let sql5 = 'INSERT INTO payment SET ?';
    let sql6 = 'INSERT INTO order_details SET ?';
    let sql7 = 'select * from users2 where pin=?';
    let sql8 = 'UPDATE product_info p set sold=true where p.id=? '

    let query1 = mysqlConnection.query(sql1, pay_data, (err, result1, fields) => {
        console.log(err)
        if (req.body.card_number) {
            let query1 = mysqlConnection.query(sql2, card_data, (err, result, fields) => {
                console.log(err)
            })
        }
        let query1 = mysqlConnection.query(sql4, req.params.id, (err, rows, fields) => {
            var data = {
                order_date: new Date(),
                final_price: rows[0].price,
                user_id: currentUser
            }
            let query1 = mysqlConnection.query(sql3, data, (err, result2, fields) => {
                var data = {
                    order_id: result2.insertId,
                    payment_mode_id: result1.insertId
                }
                let query1 = mysqlConnection.query(sql5, data, (err, result3, fields) => {
                    var data = {
                        buyer_id: currentUser,
                        seller_id: rows[0].sellerID,
                        product_id: req.params.id,
                        order_id: result2.insertId
                    }
                    let query1 = mysqlConnection.query(sql6, data, (err, result, fields) => {
                        console.log(err);
                        let query1 = mysqlConnection.query(sql8, req.params.id, (err, result, fields) => {
                            let query3 = mysqlConnection.query(sql7, req.body.pin, (err, rows, results) => {
                                if (rows.length < 1) {
                                    let query4 = mysqlConnection.query(sql6, loc_data, (err, results) => {
                                        console.log("location added");
                                        req.flash("success", "Thank you for shopping with us, your oder will be delivered soon!");
                                        res.redirect("/products")
                                    })
                                } else {
                                    console.log("location already exists");
                                    req.flash("success", "Thank you for shopping with us, your oder will be delivered soon!");
                                    res.redirect("/products");
                                }
                            })
                        })
                    })
                })
            })
        })
    })
})
app.get('/products/:id/chat', (req, res) => {
    if (!currentUser) {
        req.flash("error", "please login first");
        res.redirect("/login");
    } else {
        res.render("chat/new", { id: req.params.id })
    }
})
app.post('/products/:id/chat', (req, res) => {
    sql1 = 'INSERT INTO chat set ?';
    sql2 = 'Select p.sellerID from product_info p where p.id=?';
    let query1 = mysqlConnection.query(sql2, req.params.id, (err, rows, fields) => {
        console.log(err);
        var from_seller = false;
        if (rows[0].sellerID == currentUser) {
            from_seller = true;
        }
        var data = {
            productID: req.params.id,
            buyerID: currentUser,
            time_stamp: new Date(),
            from_seller: from_seller,
            message: req.body.msg
        }
        let query1 = mysqlConnection.query(sql1, data, (err, rows, fields) => {
            console.log(err);
            res.redirect("/products/" + req.params.id);
        })
    })
})


app.get("/products/:id/edit", (req, res) => {
    // let sql1='UPDATE product_info p set sold=false where p.id=?'
    // let sql2='INSERT INTO delete_product SET ?'
    // var data={
    //   adminID : currentUser,
    //   product_id : req.params.id
    // }
    // let query1=mysqlConnection.query(sql1,req.params.id,(err,result1,fields)=>{
    //   console.log(err)
    //   let query1=mysqlConnection.query(sql1,req.params.id,(err,result1,fields)=>{
    //     console.log(err);
    //     res.redirect("/products")
    //   })
    // })
    productId = req.params.id;
    let sql1 = 'select * from product_info p where p.id=?';
    var prod;
    var filter;
    let query1 = mysqlConnection.query(sql1, req.params.id, (err, rows, fields) => {
        prod = rows[0];
        filter = prod.categoryID;
        if (!currentUser) {
            req.flash("error", "please login first");
            res.redirect("/login");
        } else {
            res.render("products/edit/edit", { prod: prod });
        }
    });
})

app.post("/products/:id/edit", (req, res) => {
    product_data = {
            product_name: req.body.product_name,
            description: req.body.description,
            price: req.body.price,
        }
        // let sql1 = `UPDATE product_info p set product_name =${product_data.product_name}, description =${product_data.description}, price =${product_data.price} where p.id=?`;
        // console.log("hello:", sql1);
        // let query1 = mysqlConnection.query(sql1, req.params.id, (err, result1, fields) => {
        //     console.log(err);
        //     res.redirect("/products");
        // })
    let sql1 = `UPDATE product_info p set product_name="${product_data.product_name}" where p.id=?`;
    let sql2 = `UPDATE product_info p set price=${product_data.price} where p.id=?`;
    let sql3 = `UPDATE product_info p set description="${product_data.description}" where p.id=?`;
    console.log("hello1:", sql1);
    console.log("hello2:", sql2);
    console.log("hello3:", sql3);
    let query1 = mysqlConnection.query(sql1, req.params.id, (err, result1, fields) => {
        let query2 = mysqlConnection.query(sql2, req.params.id, (err, result1, fields) => {
            let query3 = mysqlConnection.query(sql3, req.params.id, (err, result1, fields) => {
                console.log(err);
                res.redirect("/products")
            })
        })
    })
})

app.get('/my_products', (req, res) => {
    sql1 = 'Select * from product_info p where p.sellerID=?';
    let query1 = mysqlConnection.query(sql1, currentUser, (err, rows, fields) => {
        console.log(err);
        products = rows;
        res.render("products/my_products", { products: products });
    })
})


// app.get('/past_orders/:id', (req, res)=>{
//     sql1='Select p.sellerID from product_info p where p.id=?';
//     let query1=mysqlConnection.query(sql1,req.params.id,(err,rows,fields)=>{
//       console.log(err);
//         var from_seller=false;
//         if(rows[0].sellerID==currentUser){
//           from_seller=true;
//         }
//         var data={
//           productID : req.params.id,
//           buyerID : currentUser,
//           time_stamp : new Date(),
//           from_seller : from_seller,
//           message: req.body.msg
//         }
//         let query1=mysqlConnection.query(sql1,data,(err,rows,fields)=>{
//           console.log(err);
//           res.redirect("/products/"+req.params.id);
//         })
//       })
// })

// var datetime = new Date();
// console.log(datetime.toISOString().slice(0,10));
// console.log(datetime);
//change port here
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port :', port))