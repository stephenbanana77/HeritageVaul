import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, InputNumber, DatePicker,
  Tag, message, Popconfirm, Card, Row, Col, Descriptions, Switch, Upload, Image } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getArtifacts, createArtifact, updateArtifact, deleteArtifact, getCategoriesFlat, getAllDonors, getAllHalls } from '../../api';
import { getToken } from '../../utils/auth';

const conditionColors = { '完好': 'green', '良好': 'cyan', '一般': 'orange', '破损': 'red', '修复中': 'purple' };
const methodOpts = ['捐赠','购买','发掘','借展','其他'].map(v => ({ label: v, value: v }));
const conditionOpts = ['完好','良好','一般','破损','修复中'].map(v => ({ label: v, value: v }));

export default function Artifacts() {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail]     = useState(null);
  const [editing, setEditing]   = useState(null);
  const [categories, setCategories] = useState([]);
  const [donors, setDonors]     = useState([]);
  const [halls, setHalls]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [search, setSearch]     = useState({});
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getArtifacts({ ...pagination, ...search });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [pagination, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    getCategoriesFlat().then(d => setCategories(d.map(c => ({ label: c.name, value: c.category_id }))));
    getAllDonors().then(d => setDonors(d.map(x => ({ label: x.name, value: x.donor_id }))));
    getAllHalls().then(d => setHalls(d.map(x => ({ label: x.name, value: x.hall_id }))));
  }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      acquisition_date: r.acquisition_date ? dayjs(r.acquisition_date) : null,
    });
    setFileList(r.image_url ? [{ uid: '-1', name: '当前图片', status: 'done', url: `http://localhost:3001${r.image_url}` }] : []);
    setModalOpen(true);
  };

  const openDetail = (r) => { setDetail(r); setDetailOpen(true); };

  const handleDelete = async (id) => {
    try {
      await deleteArtifact(id);
      message.success('删除成功');
      fetchData();
    } catch (e) { message.error(e.message); }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.acquisition_date) values.acquisition_date = values.acquisition_date.format('YYYY-MM-DD');
    // 如果已通过上传组件上传了新图片，使用服务器返回的 url；否则保留原值
    if (fileList.length > 0 && fileList[0].response) {
      values.image_url = fileList[0].response.url;
    } else if (fileList.length > 0 && fileList[0].url) {
      // 编辑时保留原有图片路径
      const match = fileList[0].url.match(/\/uploads\/.+/);
      values.image_url = match ? match[0] : (editing?.image_url || null);
    } else {
      values.image_url = null;
    }
    try {
      if (editing) { await updateArtifact(editing.artifact_id, values); message.success('更新成功'); }
      else         { await createArtifact(values);                      message.success('添加成功'); }
      setModalOpen(false);
      fetchData();
    } catch (e) { message.error(e.message); }
  };

  const handleSearch = (values) => {
    setSearch(values);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const uploadProps = {
    name: 'image',
    action: 'http://localhost:3001/api/upload',
    headers: { Authorization: `Bearer ${getToken()}` },
    listType: 'picture',
    maxCount: 1,
    fileList,
    accept: 'image/*',
    onChange({ fileList: fl }) { setFileList(fl); },
    onRemove() { setFileList([]); },
    beforeUpload(file) {
      const isImage = file.type.startsWith('image/');
      if (!isImage) { message.error('只能上传图片文件'); return Upload.LIST_IGNORE; }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) { message.error('图片大小不能超过 5MB'); return Upload.LIST_IGNORE; }
      return true;
    },
  };

  const columns = [
    { title: '编号', dataIndex: 'artifact_id', width: 70 },
    { title: '图片', dataIndex: 'image_url', width: 70,
      render: v => v ? <Image src={`http://localhost:3001${v}`} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} preview={{ mask: false }} /> : <span style={{ color: '#ccc', fontSize: 12 }}>无</span> },
    { title: '藏品名称', dataIndex: 'name', ellipsis: true, width: 160 },
    { title: '分类', dataIndex: 'category_name', width: 100 },
    { title: '年代', dataIndex: 'era', width: 100 },
    { title: '材质', dataIndex: 'material', ellipsis: true, width: 100 },
    { title: '保存状态', dataIndex: 'condition_status', width: 90,
      render: v => <Tag color={conditionColors[v]}>{v}</Tag> },
    { title: '是否展出', dataIndex: 'is_on_display', width: 80,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? '展出中' : '库存'}</Tag> },
    { title: '估值(万元)', dataIndex: 'appraised_value', width: 100,
      render: v => v ? (v / 10000).toFixed(1) : '-' },
    { title: '入藏日期', dataIndex: 'acquisition_date', width: 110, render: v => v?.slice(0, 10) },
    { title: '操作', width: 160, render: (_, r) => (
      <Space>
        <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openEdit(r)}>编辑</Button>
        <Popconfirm title="确认删除该藏品？" onConfirm={() => handleDelete(r.artifact_id)} okText="删除" cancelText="取消" okType="danger">
          <Button size="small" icon={<DeleteOutlined />} danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={searchForm} onFinish={handleSearch}>
          <Form.Item name="name"><Input placeholder="藏品名称" prefix={<SearchOutlined />} allowClear /></Form.Item>
          <Form.Item name="category_id"><Select placeholder="选择分类" options={categories} allowClear style={{ width: 130 }} /></Form.Item>
          <Form.Item name="era"><Input placeholder="年代" allowClear style={{ width: 100 }} /></Form.Item>
          <Form.Item name="condition_status"><Select placeholder="保存状态" options={conditionOpts} allowClear style={{ width: 110 }} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => { searchForm.resetFields(); setSearch({}); }}>重置</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title={`藏品列表（共 ${total} 件）`} extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增藏品</Button>
      }>
        <Table
          dataSource={data} columns={columns} rowKey="artifact_id" loading={loading}
          pagination={{ current: pagination.page, pageSize: pagination.pageSize, total,
            onChange: (p, ps) => setPagination({ page: p, pageSize: ps }) }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal title={editing ? '编辑藏品' : '新增藏品'} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)}
        width={800} okText="保存" cancelText="取消">
        <Form form={form} layout="vertical" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="藏品名称" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category_id" label="分类"><Select options={categories} placeholder="请选择" allowClear /></Form.Item></Col>
            <Col span={12}><Form.Item name="era" label="年代/朝代"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="origin" label="产地"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="material" label="材质"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="dimensions" label="尺寸规格"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="weight" label="重量(kg)"><InputNumber style={{ width: '100%' }} min={0} step={0.001} /></Form.Item></Col>
            <Col span={12}><Form.Item name="condition_status" label="保存状态"><Select options={conditionOpts} /></Form.Item></Col>
            <Col span={12}><Form.Item name="acquisition_date" label="入藏日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="acquisition_method" label="获取方式"><Select options={methodOpts} /></Form.Item></Col>
            <Col span={12}><Form.Item name="donor_id" label="捐赠人"><Select options={donors} allowClear placeholder="如非捐赠可不填" /></Form.Item></Col>
            <Col span={12}><Form.Item name="current_hall_id" label="所在展馆"><Select options={halls} allowClear /></Form.Item></Col>
            <Col span={12}><Form.Item name="storage_location" label="存放位置"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="appraised_value" label="估值(元)"><InputNumber style={{ width: '100%' }} min={0} step={1000} /></Form.Item></Col>
            <Col span={12}><Form.Item name="is_on_display" label="是否展出" valuePropName="checked"><Switch checkedChildren="展出" unCheckedChildren="库存" /></Form.Item></Col>
            <Col span={24}>
              <Form.Item label="藏品图片">
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>点击上传（jpg/png/gif，≤5MB）</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={24}><Form.Item name="description" label="描述说明"><Input.TextArea rows={3} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal title="藏品详情" open={detailOpen} onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>关闭</Button>} width={720}>
        {detail && (
          <>
            {detail.image_url && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image src={`http://localhost:3001${detail.image_url}`} style={{ maxHeight: 220, objectFit: 'contain', borderRadius: 8 }} />
              </div>
            )}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="藏品名称" span={2}>{detail.name}</Descriptions.Item>
              <Descriptions.Item label="分类">{detail.category_name}</Descriptions.Item>
              <Descriptions.Item label="年代">{detail.era}</Descriptions.Item>
              <Descriptions.Item label="产地">{detail.origin}</Descriptions.Item>
              <Descriptions.Item label="材质">{detail.material}</Descriptions.Item>
              <Descriptions.Item label="尺寸">{detail.dimensions}</Descriptions.Item>
              <Descriptions.Item label="重量">{detail.weight} kg</Descriptions.Item>
              <Descriptions.Item label="保存状态"><Tag color={conditionColors[detail.condition_status]}>{detail.condition_status}</Tag></Descriptions.Item>
              <Descriptions.Item label="是否展出"><Tag color={detail.is_on_display ? 'green' : 'default'}>{detail.is_on_display ? '展出中' : '库存'}</Tag></Descriptions.Item>
              <Descriptions.Item label="入藏日期">{detail.acquisition_date?.slice(0, 10)}</Descriptions.Item>
              <Descriptions.Item label="获取方式">{detail.acquisition_method}</Descriptions.Item>
              <Descriptions.Item label="捐赠人">{detail.donor_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="所在展馆">{detail.hall_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="存放位置">{detail.storage_location}</Descriptions.Item>
              <Descriptions.Item label="估值">{detail.appraised_value ? `¥ ${Number(detail.appraised_value).toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{detail.description}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
}
