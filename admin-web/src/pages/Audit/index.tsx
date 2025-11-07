// 审计日志页面
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, DatePicker, Select, Input, Modal, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { auditApi } from '@/api/audit';
import type { AuditLog } from '@/types/common';
import { formatDateTime } from '@/utils/format';
import './index.less';

const { RangePicker } = DatePicker;

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    action: undefined as string | undefined,
    level: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    keyword: '',
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getLogs(filters);
      setLogs(response.data.list);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleExport = async () => {
    try {
      await auditApi.exportLogs(filters);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '操作者',
      key: 'admin',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.admin?.realName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.admin?.username}</div>
        </div>
      ),
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => {
        const actionMap: Record<string, { color: string; text: string }> = {
          'announcement.create': { color: 'green', text: '创建公告' },
          'announcement.update': { color: 'blue', text: '更新公告' },
          'announcement.delete': { color: 'red', text: '删除公告' },
          'user.warn': { color: 'orange', text: '警告用户' },
          'user.ban': { color: 'red', text: '封禁用户' },
          'user.unban': { color: 'green', text: '解封用户' },
          'user.delete': { color: 'red', text: '删除用户' },
          'admin.login': { color: 'blue', text: '管理员登录' },
        };
        const config = actionMap[action] || { color: 'default', text: action };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
    },
    {
      title: '资源ID',
      dataIndex: 'resourceId',
      key: 'resourceId',
      width: 100,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const levelMap: Record<string, { color: string; text: string }> = {
          info: { color: 'blue', text: '信息' },
          warning: { color: 'orange', text: '警告' },
          error: { color: 'red', text: '错误' },
        };
        const config = levelMap[level] || { color: 'default', text: level };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="audit-page">
      <h1 className="page-title">审计日志</h1>

      {/* 搜索和筛选 */}
      <div className="page-header">
        <Space wrap>
          <Input.Search
            placeholder="搜索操作者、IP"
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => setFilters({ ...filters, keyword: value, page: 1 })}
            enterButton={<SearchOutlined />}
          />

          <Select
            placeholder="操作类型"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, action: value, page: 1 })}
          >
            <Select.Option value="announcement.create">创建公告</Select.Option>
            <Select.Option value="announcement.update">更新公告</Select.Option>
            <Select.Option value="announcement.delete">删除公告</Select.Option>
            <Select.Option value="user.warn">警告用户</Select.Option>
            <Select.Option value="user.ban">封禁用户</Select.Option>
            <Select.Option value="user.unban">解封用户</Select.Option>
            <Select.Option value="admin.login">管理员登录</Select.Option>
          </Select>

          <Select
            placeholder="级别"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, level: value, page: 1 })}
          >
            <Select.Option value="info">信息</Select.Option>
            <Select.Option value="warning">警告</Select.Option>
            <Select.Option value="error">错误</Select.Option>
          </Select>

          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            onChange={(dates) => {
              setFilters({
                ...filters,
                startDate: dates?.[0]?.toISOString(),
                endDate: dates?.[1]?.toISOString(),
                page: 1,
              });
            }}
          />

          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出日志
          </Button>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total,
          onChange: (page, pageSize) => setFilters({ ...filters, page, pageSize }),
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1400 }}
      />

      {/* 详情模态框 */}
      <Modal
        title="日志详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedLog && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="操作者">
              {selectedLog.admin?.realName} ({selectedLog.admin?.username})
            </Descriptions.Item>
            <Descriptions.Item label="操作类型">{selectedLog.action}</Descriptions.Item>
            <Descriptions.Item label="资源类型">{selectedLog.resourceType}</Descriptions.Item>
            <Descriptions.Item label="资源ID">{selectedLog.resourceId}</Descriptions.Item>
            <Descriptions.Item label="级别">{selectedLog.level}</Descriptions.Item>
            <Descriptions.Item label="描述">{selectedLog.description}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{selectedLog.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="User-Agent">{selectedLog.userAgent}</Descriptions.Item>
            <Descriptions.Item label="操作时间">
              {formatDateTime(selectedLog.createdAt)}
            </Descriptions.Item>
            {selectedLog.metadata && (
              <Descriptions.Item label="元数据">
                <pre style={{ maxHeight: 300, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Audit;

