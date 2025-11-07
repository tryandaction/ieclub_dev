// 公告管理页面
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
  DatePicker,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/store/slices/announcementSlice';
import type { Announcement } from '@/types/announcement';
import { formatDateTime } from '@/utils/format';
import { hasPermission } from '@/utils/auth';
import './index.less';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Announcements: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { admin } = useAppSelector((state) => state.auth);
  const { announcements, loading, total } = useAppSelector((state) => state.announcement);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    type: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  useEffect(() => {
    loadAnnouncements();
  }, [filters]);

  const loadAnnouncements = () => {
    dispatch(fetchAnnouncements(filters));
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingId(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Announcement) => {
    form.setFieldsValue({
      ...record,
      validTime: record.startTime && record.endTime
        ? [dayjs(record.startTime), dayjs(record.endTime)]
        : null,
    });
    setEditingId(record.id);
    setModalVisible(true);
  };

  const handleView = (record: Announcement) => {
    setViewingAnnouncement(record);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteAnnouncement(id)).unwrap();
      message.success('删除成功');
      loadAnnouncements();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        startTime: values.validTime ? values.validTime[0].toISOString() : undefined,
        endTime: values.validTime ? values.validTime[1].toISOString() : undefined,
      };
      delete data.validTime;

      if (editingId) {
        await dispatch(updateAnnouncement({ id: editingId, data })).unwrap();
        message.success('更新成功');
      } else {
        await dispatch(createAnnouncement(data)).unwrap();
        message.success('创建成功');
      }

      setModalVisible(false);
      loadAnnouncements();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns: ColumnsType<Announcement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          system: { color: 'blue', text: '系统' },
          event: { color: 'green', text: '活动' },
          maintenance: { color: 'orange', text: '维护' },
          emergency: { color: 'red', text: '紧急' },
          update: { color: 'purple', text: '更新' },
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const priorityMap: Record<string, { color: string; text: string }> = {
          urgent: { color: 'red', text: '紧急' },
          high: { color: 'orange', text: '高' },
          normal: { color: 'blue', text: '普通' },
          low: { color: 'default', text: '低' },
        };
        const config = priorityMap[priority] || { color: 'default', text: priority };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          draft: { color: 'default', text: '草稿' },
          scheduled: { color: 'blue', text: '定时' },
          active: { color: 'green', text: '发布中' },
          expired: { color: 'default', text: '已过期' },
          archived: { color: 'default', text: '已归档' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '有效期',
      key: 'validTime',
      width: 180,
      render: (_, record) => {
        if (!record.startTime || !record.endTime) return '-';
        return (
          <div>
            <div>{formatDateTime(record.startTime)}</div>
            <div>{formatDateTime(record.endTime)}</div>
          </div>
        );
      },
    },
    {
      title: '发布者',
      dataIndex: ['publisher', 'realName'],
      key: 'publisher',
      width: 100,
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
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {hasPermission(admin, 'announcement:write') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {hasPermission(admin, 'announcement:delete') && (
            <Popconfirm
              title="确定删除这条公告吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const stats = {
    total: announcements.length,
    active: announcements.filter((a) => a.status === 'active').length,
    scheduled: announcements.filter((a) => a.status === 'scheduled').length,
  };

  return (
    <div className="announcements-page">
      <h1 className="page-title">公告管理</h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总公告数" value={stats.total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="发布中"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待发布"
              value={stats.scheduled}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <div className="page-header">
        <Space>
          <Select
            placeholder="类型"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, type: value, page: 1 })}
          >
            <Select.Option value="system">系统</Select.Option>
            <Select.Option value="event">活动</Select.Option>
            <Select.Option value="maintenance">维护</Select.Option>
            <Select.Option value="emergency">紧急</Select.Option>
            <Select.Option value="update">更新</Select.Option>
          </Select>

          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="scheduled">定时</Select.Option>
            <Select.Option value="active">发布中</Select.Option>
            <Select.Option value="expired">已过期</Select.Option>
          </Select>
        </Space>

        {hasPermission(admin, 'announcement:write') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建公告
          </Button>
        )}
      </div>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={announcements}
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

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingId ? '编辑公告' : '创建公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="请输入公告内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型">
                  <Select.Option value="system">系统</Select.Option>
                  <Select.Option value="event">活动</Select.Option>
                  <Select.Option value="maintenance">维护</Select.Option>
                  <Select.Option value="emergency">紧急</Select.Option>
                  <Select.Option value="update">更新</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Select.Option value="urgent">紧急</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="normal">普通</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="displayMode"
                label="展示方式"
                rules={[{ required: true, message: '请选择展示方式' }]}
              >
                <Select placeholder="请选择展示方式">
                  <Select.Option value="popup">弹窗</Select.Option>
                  <Select.Option value="banner">横幅</Select.Option>
                  <Select.Option value="notification">通知</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="targetAudience"
                label="目标受众"
                rules={[{ required: true, message: '请选择目标受众' }]}
              >
                <Select placeholder="请选择目标受众">
                  <Select.Option value="all">全体用户</Select.Option>
                  <Select.Option value="students">学生</Select.Option>
                  <Select.Option value="teachers">教师</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="validTime" label="有效期">
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              placeholder={['开始时间', '结束时间']}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="actionUrl" label="操作链接">
            <Input placeholder="点击公告后跳转的链接（可选）" />
          </Form.Item>

          <Form.Item name="actionText" label="操作按钮文本">
            <Input placeholder="操作按钮的文本（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title="公告详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingAnnouncement && (
          <div className="announcement-detail">
            <div className="detail-item">
              <span className="label">标题：</span>
              <span className="value">{viewingAnnouncement.title}</span>
            </div>
            <div className="detail-item">
              <span className="label">内容：</span>
              <div className="value">{viewingAnnouncement.content}</div>
            </div>
            <div className="detail-item">
              <span className="label">类型：</span>
              <span className="value">{viewingAnnouncement.type}</span>
            </div>
            <div className="detail-item">
              <span className="label">优先级：</span>
              <span className="value">{viewingAnnouncement.priority}</span>
            </div>
            <div className="detail-item">
              <span className="label">状态：</span>
              <span className="value">{viewingAnnouncement.status}</span>
            </div>
            <div className="detail-item">
              <span className="label">发布者：</span>
              <span className="value">{viewingAnnouncement.publisher?.realName}</span>
            </div>
            <div className="detail-item">
              <span className="label">创建时间：</span>
              <span className="value">{formatDateTime(viewingAnnouncement.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Announcements;

