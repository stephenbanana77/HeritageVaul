require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// 静态文件：藏品图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/artifacts',   require('./routes/artifacts'));
app.use('/api/donors',      require('./routes/donors'));
app.use('/api/halls',       require('./routes/halls'));
app.use('/api/exhibitions', require('./routes/exhibitions'));
app.use('/api/loans',       require('./routes/loans'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/categories',  require('./routes/categories'));
app.use('/api/help',        require('./routes/help'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/upload',      require('./routes/upload'));
app.use('/api/auditlogs',   require('./routes/auditlogs'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`博物馆管理系统后端运行于端口 ${PORT}`));
