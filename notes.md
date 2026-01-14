# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      |   home.jsx                 |           none        |       none       |
| Register new user<br/>(t@jwt.com, pw: test)         |     register.tsx               |         [POST] /api/auth          |       `INSERT INTO user (name, email, password) VALUES (?, ?, ?)` <br/>    INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)`    |
| Login new user<br/>(t@jwt.com, pw: test)            |         login.tsx           |         [PUT] /api/auth          |     `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`         |
| Order pizza                                         |        menu.tsx             |        [POST] ${config.factory.url}/api/order`          |       `INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())` <br/>   `INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)`     |
| Verify pizza                                        |       delivery.tsx             |         [POST] '/api/order/verify'          |       None       |
| View profile page                                   |        dinerDashboard.txt            |        getOrders in orderRouter.js           |      `SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}` <br/>     `SELECT id, menuId, description, price FROM orderItem WHERE orderId=?`    |
| View franchise<br/>(as diner)                       |          franchiseDashboard.tsx          |         getFranchises in franchiseRouter (will return none)          |      `SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset}` <br/>    `SELECT id, name FROM store WHERE franchiseId=?`     |
| Logout                                              |      logout.tsx              |        [DELETE] '/api/auth'           |       `DELETE FROM auth WHERE token=?`       |
| View About page                                     |         about.tsx           |        None           |        None      |
| View History page                                   |         history.tsx           |         None          |        None      |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) |          login.tsx          |          [PUT] '/api/auth'         |        `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`      |
| View franchise<br/>(as franchisee)                  |          franchise-dashboard.tsx          |         getFranchises in franchiseRouter          |       `SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset}` <br/>    `SELECT id, name FROM store WHERE franchiseId=?`       |
| Create a store                                      |          createStore.tsx          |         [POST] '/:franchiseId/store          |       `INSERT INTO store (franchiseId, name) VALUES (?, ?)`       |
| Close a store                                       |         closeStore.tsx           |        [DELETE] '/:franchiseId/store/:storeId'           |       `DELETE FROM store WHERE franchiseId=? AND id=?`       |
| Login as admin<br/>(a@jwt.com, pw: admin)           |         login.tsx           |         [PUT] '/api/auth'          |      `INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token`           |
| View Admin page                                     |         adminDashboard.tsx           |         getFranchises in franchiseRouter          |       `SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset}` <br/>    `SELECT id, name FROM store WHERE franchiseId=?`       |
| Create a franchise for t@jwt.com                    |       createFranchise.tsx             |        createFranchise in franchiseRouter.js           |       `SELECT id, name FROM user WHERE email=?`       |
| Close the franchise for t@jwt.com                   |         closeFranchise.tsx           |        [DELETE] '/:franchiseId'           |      `DELETE FROM store WHERE franchiseId=?` <br/>     `DELETE FROM userRole WHERE objectId=?`<br/>   `DELETE FROM franchise WHERE id=?`  |
