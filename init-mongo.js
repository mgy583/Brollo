// MongoDB 初始化脚本

// 创建数据库
db = db.getSiblingDB('abook');

// 创建集合
db.createCollection('users');
db.createCollection('accounts');
db.createCollection('transactions');
db.createCollection('categories');
db.createCollection('budgets');

// 创建索引
print('Creating indexes...');

// 用户索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 });

// 账户索引
db.accounts.createIndex({ user_id: 1 });
db.accounts.createIndex({ user_id: 1, status: 1 });

// 交易索引
db.transactions.createIndex({ user_id: 1 });
db.transactions.createIndex({ user_id: 1, transaction_date: -1 });
db.transactions.createIndex({ account_id: 1 });
db.transactions.createIndex({ category_id: 1 });

// 分类索引
db.categories.createIndex({ user_id: 1 });
db.categories.createIndex({ user_id: 1, category_type: 1 });

// 预算索引
db.budgets.createIndex({ user_id: 1 });
db.budgets.createIndex({ user_id: 1, period: 1 });

print('Indexes created successfully!');

// 创建应用用户（可选）
// db.createUser({
//   user: 'abook_user',
//   pwd: 'abook_password',
//   roles: [
//     { role: 'readWrite', db: 'abook' }
//   ]
// });

print('Database initialization completed!');
