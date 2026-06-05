import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber,
  message, Popconfirm, Card, Tag, Drawer, List, Transfer } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UnorderedListOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getExhibitions, getExhibition, createExhibition, updateExhibition, deleteExhibition,
  addExhibitionArtifacts, removeExhibitionArtifact, getAllHalls, getArtifacts } from '../../api';

const statusOpts = ['筹备中','进行中','已结束','已取消'].map(v => ({ label: v, value: v }));
const statusColor = { '筹备中': 'blue', '进行中': 'green', '已结束': 'default', '已取消': 'red' };

export default function Exhibitions() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentExh, setCurrentExh] = useState(null);
  const [editing, setEditing] = useState(null);
  const [halls, setHalls]     = useState([]);
  const [allArtifacts, setAllArtifacts] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [search, setSearch]   = useState({});
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await getExhibitions({ ...pagination, ...search }); setData(res.data); setTotal(res.total); }
    finally { setLoading(false); }
  }, [pagination, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    getAllHalls().then(d => setHalls(d.map(x => ({ label: x.name, value: x.hall_id }))));
    getArtifacts({ pageSize: 200 }).then(d => setAllArtifacts(d.data.map(a => ({ key: String(a.artifact_id), title: `${a.name}（${a.era || ''}）` }))));
  }, []);

  const openAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({ ...r, start_date: dayjs(r.start_date), end_date: dayjs(r.end_date) });
    setModalOpen(true);
  };
  const openArtifacts = async (r) => {
    const detail = await getExhibition(r.exhibition_id);
    setCurrentExh(detail);
    setTargetKeys(detail.artifacts.map(a => String(a.artifact_id)));
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    try { await deleteExhibition(id); message.success('删除成功'); fetchData(); }
    catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    values.start_date = values.start_date.format('YYYY-MM-DD');
    values.end_date   = values.end_date.format('YYYY-MM-DD');
    try {
      if (editing) { await updateExhibition(editing.exhibition_id, values); message.success('更新成功'); }
      else         { await createExhibition(values);                        message.success('创建成功'); }
      setModalOpen(false); fetchData();
    } catch (e) { message.error(e.message); }
  };

  const handleTransferChange = async (nextKeys, direction, moved) => {
    try {
      if (direction === 'right') {
        await addExhibitionArtifacts(currentExh.exhibition_id, moved.map(Number));
        message.success('藏品已加入展览');
      } else {
        for (const k of moved) await removeExhibitionArtifact(currentExh.exhibition_id, k);
        message.success('藏品已移出展览');
      }
      setTargetKeys(nextKeys);
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '编号', dataIndex: 'exhibition_id', width: 70 },
    { title: '展览名称', dataIndex: 'name', ellipsis: true, width: 200 },
    { title: '主题', dataIndex: 'theme', ellipsis: true, width: 120 },
    { title: '展馆', dataIndex: 'hall_name', width: 120 },
    { title: '开始日期', dataIndex: 'start_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '结束日期', dataIndex: 'end_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '状态', dataIndex: 'status', width: 90, render: v => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '展品数', dataIndex: 'artifact_count', width: 80 },
    { title: '参观人次', dataIndex: 'visitor_count', width: 90, render: v => v?.toLocaleString() },
    { title: '操作', width: 200, render: (_, r) => (
      <Space>
        <Button size="small" icon={<UnorderedListOutlined />} onClick={() => openArtifacts(r)}>展品</Button>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该展览？" onConfirm={() => handleDelete(r.exhibition_id)} okText="删除" okType="danger" cancelText="取消">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={v => { setSearch(v); setPagination(p => ({ ...p, page: 1 })); }}>
          <Form.Item name="name"><Input placeholder="展览名称" prefix={<SearchOutlined />} allowClear /></Form.Item>
          <Form.Item name="status"><Select placeholder="状态" options={statusOpts} allowClear style={{ width: 110 }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">查询</Button></Form.Item>
          <Form.Item><Button onClick={() => { searchForm.resetFields(); setSearch({}); }}>重置</Button></Form.Item>
        </Form>
      </Card>
      <Card title={`展览列表（共 ${total} 个）`} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新建展览</Button>}>
        <Table dataSource={data} columns={columns} rowKey="exhibition_id" loading={loading}
          pagination={{ current: pagination.page, pageSize: pagination.pageSize, total, onChange: (p, ps) => setPagination({ page: p, pageSize: ps }) }}
          scroll={{ x: 1200 }} />
      </Card>

      <Modal title={editing ? '编辑展览' : '新建展览'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" width={680}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="展览名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="theme" label="主题"><Input /></Form.Item>
          <Form.Item name="hall_id" label="展馆"><Select options={halls} allowClear placeholder="请选择展馆" /></Form.Item>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
          </Space>
          <Form.Item name="status" label="状态"><Select options={statusOpts} defaultValue="筹备中" /></Form.Item>
          <Form.Item name="curator" label="策展人"><Input /></Form.Item>
          <Form.Item name="visitor_count" label="参观人次"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="description" label="展览说明"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Drawer title={`管理展品 —— ${currentExh?.name}`} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} width={700}>
        <Transfer
          dataSource={allArtifacts}
          titles={['全部藏品', '已入展览']}
          targetKeys={targetKeys}
          onChange={handleTransferChange}
          render={item => item.title}
          listStyle={{ width: 300, height: 400 }}
          showSearch
        />
      </Drawer>
    </div>
  );
}
