import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Button, Tabs, Spin, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { getArtifactsByCategory, getArtifactsByCondition, getBorrowerStats, getDonorStats, getExhibitionVisitors } from '../../api';

const COLORS = ['#8B6914','#c0892c','#5B8C5A','#4A90D9','#9B59B6','#E67E22','#1ABC9C','#E74C3C','#F39C12'];

function exportExcel(columns, data, filename) {
  const header = columns.map(c => c.title);
  const rows = data.map(r => columns.map(c => r[c.dataIndex] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
  message.success('导出成功');
}

export default function Reports() {
  const [catData, setCatData]       = useState([]);
  const [condData, setCondData]     = useState([]);
  const [borrowerData, setBorrower] = useState([]);
  const [donorData, setDonor]       = useState([]);
  const [exhData, setExhData]       = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getArtifactsByCategory(), getArtifactsByCondition(), getBorrowerStats(), getDonorStats(), getExhibitionVisitors()])
      .then(([cat, cond, borrow, donor, exh]) => {
        setCatData(cat); setCondData(cond); setBorrower(borrow); setDonor(donor); setExhData(exh);
      })
      .finally(() => setLoading(false));
  }, []);

  const borrowerCols = [
    { title: '借展机构', dataIndex: 'borrower_name' },
    { title: '借展总次数', dataIndex: 'loan_count' },
    { title: '已归还', dataIndex: 'returned' },
    { title: '逾期次数', dataIndex: 'overdue' },
  ];
  const donorCols = [
    { title: '捐赠人', dataIndex: 'name' },
    { title: '捐赠件数', dataIndex: 'artifact_count' },
    { title: '捐赠总估值(元)', dataIndex: 'total_value', render: v => Number(v).toLocaleString() },
  ];
  const exhCols = [
    { title: '展览名称', dataIndex: 'name' },
    { title: '状态', dataIndex: 'status' },
    { title: '参观人次', dataIndex: 'visitor_count' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const tabItems = [
    {
      key: '1', label: '藏品分类分布',
      children: (
        <Row gutter={16}>
          <Col span={12}>
            <Card title="藏品分类饼图" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => exportExcel([{title:'分类',dataIndex:'name'},{title:'数量',dataIndex:'value'}], catData, '藏品分类统计')}>导出Excel</Button>}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={e => `${e.name}(${e.value})`}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="保存状态分布">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={condData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={e => `${e.name}(${e.value})`}>
                    {condData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: '2', label: '借展机构统计',
      children: (
        <Card title="借展机构统计" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => exportExcel(borrowerCols, borrowerData, '借展机构统计')}>导出Excel</Button>}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={borrowerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="borrower_name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="loan_count" name="借展次数" fill="#8B6914" />
              <Bar dataKey="returned" name="已归还" fill="#5B8C5A" />
              <Bar dataKey="overdue" name="逾期" fill="#E74C3C" />
            </BarChart>
          </ResponsiveContainer>
          <Table dataSource={borrowerData} columns={borrowerCols} rowKey="borrower_name" pagination={false} size="small" style={{ marginTop: 16 }} />
        </Card>
      ),
    },
    {
      key: '3', label: '捐赠人统计',
      children: (
        <Card title="捐赠人贡献统计" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => exportExcel(donorCols, donorData, '捐赠人统计')}>导出Excel</Button>}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={donorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="artifact_count" name="捐赠件数" fill="#8B6914" />
            </BarChart>
          </ResponsiveContainer>
          <Table dataSource={donorData} columns={donorCols} rowKey="name" pagination={false} size="small" style={{ marginTop: 16 }} />
        </Card>
      ),
    },
    {
      key: '4', label: '展览参观统计',
      children: (
        <Card title="展览参观人次排行" extra={<Button size="small" icon={<DownloadOutlined />} onClick={() => exportExcel(exhCols, exhData, '展览统计')}>导出Excel</Button>}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={exhData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="visitor_count" name="参观人次" fill="#5B8C5A" />
            </BarChart>
          </ResponsiveContainer>
          <Table dataSource={exhData} columns={exhCols} rowKey="name" pagination={false} size="small" style={{ marginTop: 16 }} />
        </Card>
      ),
    },
  ];

  return <Tabs items={tabItems} size="large" />;
}
