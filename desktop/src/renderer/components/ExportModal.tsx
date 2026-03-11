import React, { useState } from 'react';
import { Modal, Checkbox, Button, Space, message, Spin, Typography } from 'antd';
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import './ExportModal.css';

const { Text, Title } = Typography;

interface ExportModalProps {
  visible: boolean;
  documentId: number;
  documentName: string;
  userId: number;
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  documentId,
  documentName,
  userId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeRisks, setIncludeRisks] = useState(true);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.export.pdf(
        documentId,
        includeAnnotations,
        includeRisks
      );
      if (result.success) {
        message.success('PDF 導出成功！');
        onClose();
      } else if (result.message === '已取消儲存') {
        // 使用者取消，不顯示錯誤
      } else {
        message.error(result.message || 'PDF 導出失敗');
      }
    } catch (error: any) {
      message.error(error.message || 'PDF 導出失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.export.docx(
        documentId,
        includeAnnotations,
        includeRisks,
        userId
      );
      if (result.success) {
        message.success('DOCX 導出成功！');
        onClose();
      } else if (result.message === '已取消儲存') {
        // 使用者取消，不顯示錯誤
      } else {
        message.error(result.message || 'DOCX 導出失敗');
      }
    } catch (error: any) {
      message.error(error.message || 'DOCX 導出失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.export.report(documentId, userId);
      if (result.success) {
        message.success('審閱報告導出成功！');
        onClose();
      } else if (result.message === '已取消儲存') {
        // 使用者取消，不顯示錯誤
      } else {
        message.error(result.message || '審閱報告導出失敗');
      }
    } catch (error: any) {
      message.error(error.message || '審閱報告導出失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          <span>導出文檔</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Spin spinning={loading}>
        <div className="export-modal-content">
          <div className="document-info">
            <Text type="secondary">文檔名稱：</Text>
            <Text strong>{documentName}</Text>
          </div>

          <div className="export-options">
            <Title level={5}>導出選項</Title>
            <Space direction="vertical">
              <Checkbox
                checked={includeAnnotations}
                onChange={(e) => setIncludeAnnotations(e.target.checked)}
              >
                包含批註
              </Checkbox>
              <Checkbox
                checked={includeRisks}
                onChange={(e) => setIncludeRisks(e.target.checked)}
              >
                包含風險標註
              </Checkbox>
            </Space>
          </div>

          <div className="export-formats">
            <Title level={5}>選擇導出格式</Title>

            <div className="format-buttons">
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                size="large"
                block
                onClick={handleExportPDF}
                disabled={loading}
                className="export-button pdf-button"
              >
                <div className="button-content">
                  <div className="button-title">導出為 PDF</div>
                  <div className="button-description">
                    適合打印和分享，保留格式和樣式
                  </div>
                </div>
              </Button>

              <Button
                type="primary"
                icon={<FileWordOutlined />}
                size="large"
                block
                onClick={handleExportDOCX}
                disabled={loading}
                className="export-button docx-button"
              >
                <div className="button-content">
                  <div className="button-title">導出為 DOCX</div>
                  <div className="button-description">
                    可編輯的 Word 文檔，支持進一步修改
                  </div>
                </div>
              </Button>

              <Button
                type="default"
                icon={<FileTextOutlined />}
                size="large"
                block
                onClick={handleExportReport}
                disabled={loading}
                className="export-button report-button"
              >
                <div className="button-content">
                  <div className="button-title">導出審閱報告</div>
                  <div className="button-description">
                    包含風險統計、問題列表和修改建議
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="export-note">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              提示：點擊導出後可選擇儲存位置，完成後會自動開啟檔案所在資料夾
            </Text>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default ExportModal;
