import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Table, Tag } from 'antd';
import { PictureOutlined, CalendarOutlined, SwapOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { getOverview, getArtifactsByCategory, getLoansByMonth, getExhibitionVisitors } from '../../api';

const COLORS = ['#8B6914','#c0892c','#5B8C5A','#4A90D9','#9B59B6','#E67E22','#1ABC9C','#E74C3C'];

const statusColor = { '进行中': 'green', '筹备中': 'blue', '已结束': 'default', '已取消': 'red' };

export default function Dashboard() {
  const [overview, setOverview] = useState({});
  const [catData, setCatData]   = useState([]);
  const [loanData, setLoanData] = useState([]);
  const [exhData, setExhData]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getArtifactsByCategory(), getLoansByMonth(), getExhibitionVisitors()])
      .then(([ov, cat, loans, exh]) => {
        setOverview(ov);
        setCatData(cat);
        setLoanData(loans);
        setExhData(exh);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: '藏品总数',     value: overview.total_artifacts,    suffix: '件',  icon: <PictureOutlined />,  color: '#8B6914' },
    { title: '展览总数',     value: overview.total_exhibitions,   suffix: '个',  icon: <CalendarOutlined />, color: '#5B8C5A' },
    { title: '当前借出',     value: overview.active_loans,        suffix: '件',  icon: <SwapOutlined />,     color: '#4A90D9' },
    { title: '捐赠人数',     value: overview.total_donors,        suffix: '位',  icon: <TeamOutlined />,     color: '#9B59B6' },
    { title: '进行中展览',   value: overview.ongoing_exhibitions,  suffix: '个',  icon: <CalendarOutlined />, color: '#1ABC9C' },
    { title: '陈列展出',     value: overview.on_display,          suffix: '件',  icon: <PictureOutlined />,  color: '#E67E22' },
    { title: '逾期未还',     value: overview.overdue_loans,       suffix: '件',  icon: <WarningOutlined />,  color: '#E74C3C' },
    { title: '藏品总估值',   value: overview.total_value,         prefix: '¥',   icon: <PictureOutlined />,  color: '#F39C12',
      formatter: v => (Number(v) / 10000).toFixed(0) + ' 万元' },
  ];

  const exhColumns = [
    { title: '展览名称', dataIndex: 'name', ellipsis: true },
    { title: '状态', dataIndex: 'status', render: s => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: '参观人次', dataIndex: 'visitor_count', render: v => v.toLocaleString() },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div>
      <Row gutter={[16, 16]}>
        {stats.map(s => (
          <Col span={6} key={s.title}>
            <Card hoverable>
              <Statistic
                title={<span style={{ color: '#666' }}>{s.title}</span>}
                value={s.formatter ? s.formatter(s.value) : s.value}
                prefix={s.prefix}
                suffix={!s.formatter ? s.suffix : undefined}
                valueStyle={{ color: s.color, fontSize: 28, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={10}>
          <Card title="藏品分类分布">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={e => `${e.name} ${e.value}`}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={14}>
          <Card title="近6个月借展趋势">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={loanData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8B6914" strokeWidth={2} dot={{ r: 5 }} name="借展数量" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="展览参观人次排行">
            <Table dataSource={exhData} columns={exhColumns} rowKey="name" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
