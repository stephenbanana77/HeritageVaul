import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber,
  message, Popconfirm, Card, Row, Col, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getHalls, createHall, updateHall, deleteHall } from '../../api';

const statusOpts = ['开放','关闭','维修中'].map(v => ({ label: v, value: v }));
const statusColor = { 开放: 'green', 关闭: 'default', 维修中: 'orange' };

export default function Halls() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await getHalls(); setData(res); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (r) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };
  const openAdd  = () => { setEditing(null); form.resetFields(); setModalOpen(true); };

  const handleDelete = async (id) => {
    try { await deleteHall(id); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) { await updateHall(editing.hall_id, values); message.success('更新成功'); }
      else         { await createHall(values);                   message.success('添加成功'); }
      setModalOpen(false); fetchData();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '编号', dataIndex: 'hall_id', width: 70 },
    { title: '展馆名称', dataIndex: 'name', width: 150 },
    { title: '位置', dataIndex: 'location', ellipsis: true },
    { title: '面积(㎡)', dataIndex: 'area', width: 90 },
    { title: '容量(人)', dataIndex: 'capacity', width: 90 },
    { title: '当前藏品', dataIndex: 'artifact_count', width: 90, render: v => `${v} 件` },
    { title: '状态', dataIndex: 'status', width: 90, render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '负责人', dataIndex: 'manager', width: 100 },
    { title: '操作', width: 140, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该展馆？" onConfirm={() => handleDelete(r.hall_id)} okText="删除" okType="danger" cancelText="取消">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card title={`展馆列表（共 ${data.length} 个）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增展馆</Button>}>
        <Table dataSource={data} columns={columns} rowKey="hall_id" loading={loading} pagination={false} />
      </Card>
      <Modal title={editing ? '编辑展馆' : '新增展馆'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={600}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="展馆名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="manager" label="负责人"><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="location" label="位置"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="area" label="面积(㎡)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="capacity" label="最大容量(人)"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="状态"><Select options={statusOpts} defaultValue="开放" /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
