// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

interface ClauseTemplate {
  id: number;
  name: string;
  category: string;
  title: string | null;
  content: string;
  template_type: 'clause' | 'annotation';
  description: string | null;
}

interface TemplateModalProps {
  visible: boolean;
  template: ClauseTemplate | null;
  templateType: 'clause' | 'annotation';
  onOk: (values: any) => void;
  onCancel: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ visible, template, templateType, onOk, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (template) {
        form.setFieldsValue({
          name: template.name,
          category: template.category,
          title: template.title || '',
          content: template.content,
          description: template.description || '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, template]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      onOk(values);
    });
  };

  const isClause = templateType === 'clause';

  return (
    <Modal
      title={template ? '編輯模板' : '新增模板'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText="儲存"
      cancelText="取消"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="模板名稱"
          name="name"
          rules={[{ required: true, message: '請輸入模板名稱' }]}
        >
          <Input placeholder="例：標準付款條款" maxLength={100} />
        </Form.Item>

        <Form.Item
          label="分類"
          name="category"
          rules={[{ required: true, message: '請輸入分類' }]}
        >
          <Input placeholder={isClause ? '例：付款條件、保密義務、違約責任' : '例：合規審查、內容修改、疑問標記'} maxLength={50} />
        </Form.Item>

        {isClause && (
          <Form.Item
            label="條款標題"
            name="title"
            rules={[{ required: true, message: '請輸入條款標題' }]}
          >
            <Input placeholder="例：付款義務" maxLength={200} />
          </Form.Item>
        )}

        <Form.Item
          label="模板內容"
          name="content"
          rules={[{ required: true, message: '請輸入模板內容' }]}
        >
          <TextArea
            placeholder={isClause ? '輸入條款正文內容...' : '輸入批注模板文字...'}
            rows={isClause ? 6 : 3}
            maxLength={5000}
            showCount
          />
        </Form.Item>

        <Form.Item label="說明（可選）" name="description">
          <Input placeholder="模板用途說明" maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TemplateModal;

