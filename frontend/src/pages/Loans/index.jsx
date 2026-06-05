import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker,
  message, Popconfirm, Card, Tag, Steps, Descriptions } from 'antd';
import { PlusOutlined, RollbackOutlined, StopOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getLoans, createLoan, returnLoan, cancelLoan, getArtifacts } from '../../api';

const statusColor = { '借出中': 'blue', '已归还': 'green', '逾期': 'red', '取消': 'default' };

export default function Loans() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen]   = useState(false);
  const [returnOpen, setReturnOpen]   = useState(false);
  const [detailOpen, setDetailOpen]   = useState(false);
  const [currentLoan, setCurrentLoan] = useState(null);
  const [artifacts, setArtifacts]     = useState([]);
  const [pagination, setPagination]   = useState({ page: 1, pageSize: 10 });
  const [search, setSearch]           = useState({});
  const [createForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await getLoans({ ...pagination, ...search }); setData(res.data); setTotal(res.total); }
    finally { setLoading(false); }
  }, [pagination, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    getArtifacts({ pageSize: 200 }).then(d =>
      setArtifacts(d.data.map(a => ({ label: `${a.name}（${a.era || ''}）`, value: a.artifact_id })))
    );
  }, []);

  const openCreate = () => { createForm.resetFields(); setCreateOpen(true); };
  const openReturn = (r) => { setCurrentLoan(r); returnForm.resetFields(); setReturnOpen(true); };
  const openDetail = (r) => { setCurrentLoan(r); setDetailOpen(true); };

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    values.loan_date = values.loan_date.format('YYYY-MM-DD');
    values.expected_return_date = values.expected_return_date.format('YYYY-MM-DD');
    try { await createLoan(values); message.success('借展记录创建成功'); setCreateOpen(false); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleReturn = async () => {
    const values = await returnForm.validateFields();
    values.actual_return_date = values.actual_return_date.format('YYYY-MM-DD');
    try { await returnLoan(currentLoan.loan_id, values); message.success('归还办理成功'); setReturnOpen(false); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleCancel = async (id) => {
    try { await cancelLoan(id); message.success('借展已取消'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '编号', dataIndex: 'loan_id', width: 70 },
    { title: '藏品名称', dataIndex: 'artifact_name', ellipsis: true, width: 180 },
    { title: '借展机构', dataIndex: 'borrower_name', ellipsis: true, width: 160 },
    { title: '借出日期', dataIndex: 'loan_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '预计归还', dataIndex: 'expected_return_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '实际归还', dataIndex: 'actual_return_date', width: 110, render: v => v?.slice(0, 10) || '-' },
    { title: '状态', dataIndex: 'status', width: 90, render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '审批人', dataIndex: 'approver_name', width: 90 },
    { title: '操作', width: 200, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
        {(r.status === '借出中' || r.status === '逾期') && (
          <Button size="small" icon={<RollbackOutlined />} type="primary" onClick={() => openReturn(r)}>归还</Button>
        )}
        {r.status === '借出中' && (
          <Popconfirm title="确认取消此借展？" onConfirm={() => handleCancel(r.loan_id)} okText="确认" cancelText="取消" okType="danger">
            <Button size="small" icon={<StopOutlined />} danger>取消</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }}>
          <Form.Item name="artifact_name"><Input placeholder="藏品名称" prefix={<SearchOutlined />} allowClear /></Form.Item>
          <Form.Item name="borrower_name"><Input placeholder="借展机构" allowClear /></Form.Item>
          <Form.Item name="status"><Select placeholder="状态" allowClear style={{ width: 100 }}
            options={['借出中','已归还','逾期','取消'].map(v => ({ label: v, value: v }))} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item>
          <Form.Item><Button onClick={() => { searchForm.resetFields(); setSearch({}); }}>重置</Button></Form.Item>
        </Form>
      </Card>

      <Card title="借展流程说明" style={{ marginBottom: 16 }}>
        <Steps size="small" items={[
          { title: '提交借展申请', description: '填写借展机构、藏品和时间' },
          { title: '记录借出状态', description: '藏品标记为借出中' },
          { title: '办理归还', description: '填写实际归还日期和状况' },
          { title: '借展完成', description: '状态更新为已归还' },
        ]} />
      </Card>

      <Card title={`借展记录（共 ${total} 条）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新增借展</Button>}>
        <Table dataSource={data} columns={columns} rowKey="loan_id" loading={loading}
          pagination={{ current: pagination.page, pageSize: pagination.pageSize, total, onChange: (p, ps) => setPagination({ page: p, pageSize: ps }) }}
          scroll={{ x: 1100 }} rowClassName={r => r.status === '逾期' ? 'ant-table-row-danger' : ''} />
      </Card>

      {/* 新增借展 */}
      <Modal title="新增借展记录" open={createOpen} onOk={handleCreate}
        onCancel={() => setCreateOpen(false)} okText="确认借出" cancelText="取消" width={640}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="artifact_id" label="借出藏品" rules={[{ required: true }]}>
            <Select options={artifacts} showSearch filterOption={(i, o) => o.label.includes(i)} placeholder="请选择藏品" />
          </Form.Item>
          <Form.Item name="borrower_name" label="借展机构" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="borrower_contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="borrower_phone" label="联系电话"><Input /></Form.Item>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="loan_date" label="借出日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="expected_return_date" label="预计归还日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="purpose" label="借展目的"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="condition_before" label="借出前状况说明"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 办理归还 */}
      <Modal title="办理归还" open={returnOpen} onOk={handleReturn}
        onCancel={() => setReturnOpen(false)} okText="确认归还" cancelText="取消">
        <Form form={returnForm} layout="vertical">
          <Form.Item name="actual_return_date" label="实际归还日期" rules={[{ required: true }]}>
            <DatePicker defaultValue={dayjs()} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="condition_after" label="归还后状况"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* 详情 */}
      <Modal title="借展记录详情" open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>} width={640}>
        {currentLoan && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="藏品" span={2}>{currentLoan.artifact_name}</Descriptions.Item>
            <Descriptions.Item label="借展机构" span={2}>{currentLoan.borrower_name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{currentLoan.borrower_contact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentLoan.borrower_phone}</Descriptions.Item>
            <Descriptions.Item label="借出日期">{currentLoan.loan_date?.slice(0, 10)}</Descriptions.Item>
            <Descriptions.Item label="预计归还">{currentLoan.expected_return_date?.slice(0, 10)}</Descriptions.Item>
            <Descriptions.Item label="实际归还">{currentLoan.actual_return_date?.slice(0, 10) || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusColor[currentLoan.status]}>{currentLoan.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="借出前状况" span={2}>{currentLoan.condition_before}</Descriptions.Item>
            <Descriptions.Item label="归还后状况" span={2}>{currentLoan.condition_after || '-'}</Descriptions.Item>
            <Descriptions.Item label="借展目的" span={2}>{currentLoan.purpose}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
