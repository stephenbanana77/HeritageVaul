import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker,
  message, Popconfirm, Card, Row, Col, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDonors, createDonor, updateDonor, deleteDonor } from '../../api';

const typeOpts = ['个人','机构','企业'].map(v => ({ label: v, value: v }));
const typeColor = { 个人: 'blue', 机构: 'green', 企业: 'orange' };

export default function Donors() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [search, setSearch]   = useState({});
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDonors({ ...pagination, ...search });
      setData(res.data); setTotal(res.total);
    } finally { setLoading(false); }
  }, [pagination, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({ ...r, first_donation_date: r.first_donation_date ? dayjs(r.first_donation_date) : null });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try { await deleteDonor(id); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.first_donation_date) values.first_donation_date = values.first_donation_date.format('YYYY-MM-DD');
    try {
      if (editing) { await updateDonor(editing.donor_id, values); message.success('更新成功'); }
      else         { await createDonor(values);                    message.success('添加成功'); }
      setModalOpen(false); fetchData();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '编号', dataIndex: 'donor_id', width: 70 },
    { title: '姓名/名称', dataIndex: 'name', width: 150 },
    { title: '类型', dataIndex: 'type', width: 80, render: v => <Tag color={typeColor[v]}>{v}</Tag> },
    { title: '联系人', dataIndex: 'contact_person', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', ellipsis: true, width: 180 },
    { title: '捐赠件数', dataIndex: 'donation_count', width: 90 },
    { title: '首次捐赠', dataIndex: 'first_donation_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '操作', width: 140, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.donor_id)} okText="删除" okType="danger" cancelText="取消">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }}>
          <Form.Item name="name"><Input placeholder="姓名/名称" prefix={<SearchOutlined />} allowClear /></Form.Item>
          <Form.Item name="type"><Select placeholder="类型" options={typeOpts} allowClear style={{ width: 100 }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item>
          <Form.Item><Button onClick={() => { searchForm.resetFields(); setSearch({}); }}>重置</Button></Form.Item>
        </Form>
      </Card>
      <Card title={`捐赠人列表（共 ${total} 人）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增捐赠人</Button>}>
        <Table dataSource={data} columns={columns} rowKey="donor_id" loading={loading}
          pagination={{ current: pagination.page, pageSize: pagination.pageSize, total, onChange: (p, ps) => setPagination({ page: p, pageSize: ps }) }}
          scroll={{ x: 1000 }} />
      </Card>
      <Modal title={editing ? '编辑捐赠人' : '新增捐赠人'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={640}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="姓名/名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="type" label="类型"><Select options={typeOpts} defaultValue="个人" /></Form.Item></Col>
            <Col span={12}><Form.Item name="contact_person" label="联系人"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="联系电话"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="邮箱"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="first_donation_date" label="首次捐赠日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="address" label="地址"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
