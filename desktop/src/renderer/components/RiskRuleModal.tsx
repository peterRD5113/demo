// @ts-nocheck
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Radio, message } from 'antd';
import '../styles/RiskRuleModal.css';

const { TextArea } = Input;
const { Option } = Select;

interface RiskRule {
  id: number;
  name: string;
  category: string;
  keywords: string | string[];
  pattern: string;
  risk_level: 'high' | 'medium' | 'low';
  suggestion: string;
}

interface RiskRuleModalProps {
  visible: boolean;
  rule: RiskRule | null;
  onOk: (values: any) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  '付款條件',
  '違約責任',
  '管轄地',
  '保密期限',
  '自動續約',
  '責任限制',
  '合同解除',
  '知識產權',
  '其他',
];

const RiskRuleModal: React.FC<RiskRuleModalProps> = ({
  visible,
  rule,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (rule) {
        // 編輯模式：填充現有數據
        const keywords = Array.isArray(rule.keywords)
          ? rule.keywords.join(', ')
          : typeof rule.keywords === 'string'
          ? rule.keywords
          : '';

        form.setFieldsValue({
          name: rule.name,
          category: rule.category,
          keywords: keywords,
          pattern: rule.pattern,
          riskLevel: rule.risk_level,
          suggestion: rule.suggestion,
        });
      } else {
        // 新增模式：重置表單
        form.resetFields();
      }
    }
  }, [visible, rule, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      console.error('表單驗證失敗:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 驗證正則表達式
  const validatePattern = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('請輸入匹配模式'));
    }

    try {
      new RegExp(value);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('無效的正則表達式格式'));
    }
  };

  return (
    <Modal
      title={rule ? '編輯風險規則' : '新增風險規則'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText="確定"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          riskLevel: 'medium',
        }}
      >
        <Form.Item
          label="規則名稱"
          name="name"
          rules={[
            { required: true, message: '請輸入規則名稱' },
            { min: 1, max: 100, message: '規則名稱長度應在 1-100 字元之間' },
          ]}
        >
          <Input placeholder="例如：付款期限過長" />
        </Form.Item>

        <Form.Item
          label="類別"
          name="category"
          rules={[{ required: true, message: '請選擇類別' }]}
        >
          <Select placeholder="請選擇規則類別">
            {CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="關鍵字"
          name="keywords"
          tooltip="多個關鍵字用逗號分隔，例如：付款,支付,結算"
        >
          <Input placeholder="例如：付款,支付,結算" />
        </Form.Item>

        <Form.Item
          label="匹配模式（正則表達式）"
          name="pattern"
          rules={[{ validator: validatePattern }]}
          tooltip="使用正則表達式匹配條款內容"
        >
          <TextArea
            rows={3}
            placeholder="例如：(?:收到|簽收).*(?:後|內).*(?:[6-9]\d|\d{3,}).*(?:日|天).*付款"
          />
        </Form.Item>

        <Form.Item
          label="風險等級"
          name="riskLevel"
          rules={[{ required: true, message: '請選擇風險等級' }]}
        >
          <Radio.Group>
            <Radio value="high">
              <span style={{ color: '#ff4d4f' }}>🔴 高風險</span>
            </Radio>
            <Radio value="medium">
              <span style={{ color: '#faad14' }}>🟡 中風險</span>
            </Radio>
            <Radio value="low">
              <span style={{ color: '#1890ff' }}>🔵 低風險</span>
            </Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="建議措辭"
          name="suggestion"
          rules={[
            { required: true, message: '請輸入建議措辭' },
            { min: 1, max: 500, message: '建議措辭長度應在 1-500 字元之間' },
          ]}
          tooltip="當規則匹配時，向用戶顯示的修改建議"
        >
          <TextArea
            rows={4}
            placeholder="例如：建議將付款期限縮短至 30 日內，並明確驗收標準。"
          />
        </Form.Item>

        <div className="form-tips">
          <p>💡 提示：</p>
          <ul>
            <li>正則表達式用於精確匹配條款內容中的風險模式</li>
            <li>關鍵字用於快速篩選可能包含風險的條款</li>
            <li>建議措辭會在風險詳情面板中顯示給用戶</li>
            <li>修改規則後，需要重新執行「識別風險」才會生效</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default RiskRuleModal;
