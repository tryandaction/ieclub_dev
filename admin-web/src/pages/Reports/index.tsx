// 举报管理页面
import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Descriptions,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchReports, handleReport } from '@/store/slices/reportSlice';
import type { Report } from '@/types/common';
import { formatDateTime, formatRelativeTime } from '@/utils/format';
import { hasPermission } from '@/utils/auth';
import './index.less';

const { TextArea } = Input;

const Reports: React.FC = () => {
  const [handleForm] = Form.useForm();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.auth);
  const { reports, loading, total } = useAppSelector((state) => state.report);

  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    type: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = () => {
    dispatch(fetchReports(filters));
  };

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  const handleProcess = (report: Report) => {
    setSelectedReport(report);
    handleForm.resetFields();
    setHandleModalVisible(true);
  };

  const submitHandle = async () => {
    try {
      const values = await handleForm.validateFields();
      if (!selectedReport) return;

      await dispatch(
        handleReport({
          id: selectedReport.id,
          data: values,
        })
      ).unwrap();

      message.success('处理成功');
      setHandleModalVisible(false);
      loadReports();
    } catch (error: any) {
      message.error(error.message || '处理失败');
    }
  };

  const columns: ColumnsType<Report> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '举报类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          spam: { color: 'orange', text: '垃圾信息' },
          harassment: { color: 'red', text: '骚扰' },
          inappropriate: { color: 'volcano', text: '不当内容' },
          illegal: { color: 'red', text: '违法内容' },
          other: { color: 'default', text: '其他' },
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '被举报内容',
      key: 'target',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.targetType}</div>
          <div style={{ fontSize: 12, color: '#999' }}>ID: {record.targetId}</div>
        </div>
      ),
    },
    {
      title: '举报原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '举报人',
      key: 'reporter',
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.reporter?.realName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.reporter?.email}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { status: any; text: string }> = {
          pending: { status: 'processing', text: '待处理' },
          approved: { status: 'success', text: '已通过' },
          rejected: { status: 'error', text: '已驳回' },
        };
        const config = statusMap[status] || { status: 'default', text: status };
        return <Badge status={config.status} text={config.text} />;
      },
    },
    {
      title: '举报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>

          {hasPermission(admin, 'report:handle') && record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleProcess(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: total,
    pending: reports.filter((r) => r.status === 'pending').length,
    approved: reports.filter((r) => r.status === 'approved').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="reports-page">
      <h1 className="page-title">举报管理</h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总举报数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已驳回"
              value={stats.rejected}
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <div className="page-header">
        <Space>
          <Select
            placeholder="举报类型"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, type: value, page: 1 })}
          >
            <Select.Option value="spam">垃圾信息</Select.Option>
            <Select.Option value="harassment">骚扰</Select.Option>
            <Select.Option value="inappropriate">不当内容</Select.Option>
            <Select.Option value="illegal">违法内容</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>

          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
          >
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="approved">已通过</Select.Option>
            <Select.Option value="rejected">已驳回</Select.Option>
          </Select>
        </Space>
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={reports}
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
        scroll={{ x: 1200 }}
      />

      {/* 处理模态框 */}
      <Modal
        title="处理举报"
        open={handleModalVisible}
        onOk={submitHandle}
        onCancel={() => setHandleModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="action"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Select placeholder="请选择处理结果">
              <Select.Option value="approve">通过（确认违规）</Select.Option>
              <Select.Option value="reject">驳回（无违规）</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label="处理说明"
            rules={[{ required: true, message: '请输入处理说明' }]}
          >
            <TextArea rows={4} placeholder="请说明处理原因和依据" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="举报详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedReport && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="举报类型">{selectedReport.type}</Descriptions.Item>
            <Descriptions.Item label="被举报内容类型">
              {selectedReport.targetType}
            </Descriptions.Item>
            <Descriptions.Item label="被举报内容ID">{selectedReport.targetId}</Descriptions.Item>
            <Descriptions.Item label="举报原因">{selectedReport.reason}</Descriptions.Item>
            <Descriptions.Item label="举报人">
              {selectedReport.reporter?.realName} ({selectedReport.reporter?.email})
            </Descriptions.Item>
            <Descriptions.Item label="状态">{selectedReport.status}</Descriptions.Item>
            <Descriptions.Item label="举报时间">
              {formatDateTime(selectedReport.createdAt)}
            </Descriptions.Item>
            {selectedReport.handler && (
              <>
                <Descriptions.Item label="处理人">
                  {selectedReport.handler.realName}
                </Descriptions.Item>
                <Descriptions.Item label="处理时间">
                  {formatDateTime(selectedReport.handledAt!)}
                </Descriptions.Item>
                <Descriptions.Item label="处理说明">{selectedReport.note}</Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Reports;

