import React, { useEffect, useState, useCallback } from 'react';
import { Table, Card, Form, Input, Select, DatePicker, Button, Tag, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAuditLogs } from '../../api';

const { RangePicker } = DatePicker;

const actionColors = {
  CREATE:    'green',
  UPDATE:    'blue',
  DELETE:    'red',
  RETURN:    'cyan',
  CANCEL:    'orange',
  RESET_PWD: 'purple',
};
const actionLabels = {
  CREATE:    '新增',
  UPDATE:    '修改',
  DELETE:    '删除',
  RETURN:    '归还',
  CANCEL:    '取消',
  RESET_PWD: '重置密码',
};
const tableLabels = {
  artifacts: '藏品',
  loans:     '借展',
  sys_users: '用户',
};

const actionOpts = Object.keys(actionLabels).map(k => ({ label: actionLabels[k], value: k }));
const tableOpts  = Object.keys(tableLabels).map(k => ({ label: tableLabels[k], value: k }));

export default function AuditLog() {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [search, setSearch]   = useState({});
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ ...pagination, ...search });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [pagination, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (values) => {
    const params = { ...values };
    if (values.date_range) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD');
      params.end_date   = values.date_range[1].format('YYYY-MM-DD');
      delete params.date_range;
    }
    setSearch(params);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleReset = () => {
    form.resetFields();
    setSearch({});
    setPagination(p => ({ ...p, page: 1 }));
  };

  const columns = [
    { title: '时间', dataIndex: 'created_at', width: 160,
      render: v => v ? new Date(v).toLocaleString('zh-CN') : '-' },
    { title: '操作人', dataIndex: 'username', width: 100 },
    { title: '动作', dataIndex: 'action', width: 90,
      render: v => <Tag color={actionColors[v] || 'default'}>{actionLabels[v] || v}</Tag> },
    { title: '对象类型', dataIndex: 'target_table', width: 90,
      render: v => tableLabels[v] || v },
    { title: '对象名称', dataIndex: 'target_name', ellipsis: true, width: 160 },
    { title: '补充说明', dataIndex: 'detail', ellipsis: true },
    { title: 'IP 地址', dataIndex: 'ip_address', width: 130 },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline" form={form} onFinish={handleSearch}>
          <Form.Item name="username">
            <Input placeholder="操作人" prefix={<SearchOutlined />} allowClear style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="action">
            <Select placeholder="动作类型" options={actionOpts} allowClear style={{ width: 110 }} />
          </Form.Item>
          <Form.Item name="target_table">
            <Select placeholder="对象类型" options={tableOpts} allowClear style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="date_range">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={`操作日志（共 ${total} 条）`}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="log_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['20', '50', '100'],
            onChange: (p, ps) => setPagination({ page: p, pageSize: ps }),
          }}
          size="small"
        />
      </Card>
    </div>
  );
}
