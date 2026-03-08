#!/bin/bash

# 測試運行腳本
# 用於運行所有測試並生成報告

set -e

echo "=========================================="
echo "  合同風險管理系統 - 測試套件"
echo "=========================================="
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo -e "${RED}錯誤: Node.js 未安裝${NC}"
    exit 1
fi

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo -e "${RED}錯誤: npm 未安裝${NC}"
    exit 1
fi

# 進入 desktop 目錄
cd "$(dirname "$0")/desktop"

# 檢查依賴是否安裝
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安裝依賴...${NC}"
    npm install
fi

echo ""
echo "=========================================="
echo "  運行完整測試套件"
echo "=========================================="

# 運行所有測試並生成覆蓋率報告
if npm test 2>&1 | tee ../test_results.log; then
    echo -e "${GREEN}✓ 所有測試通過${NC}"
    TEST_PASSED=true
else
    echo -e "${RED}✗ 部分測試失敗${NC}"
    TEST_PASSED=false
fi

echo ""
echo "=========================================="
echo "  測試結果匯總"
echo "=========================================="

cd ..

# 提取測試結果
if [ -f "test_results.log" ]; then
    echo "測試統計:"
    grep -E "Tests:|Test Suites:" test_results.log | tail -2 || echo "無法獲取測試統計"
    echo ""
    echo "覆蓋率報告:"
    grep -A 10 "Coverage summary" test_results.log || echo "無法獲取覆蓋率報告"
fi

echo ""
echo "詳細報告:"
echo "  - 測試日誌: test_results.log"
echo "  - 覆蓋率報告: desktop/coverage/index.html"

echo ""
echo "=========================================="

# 返回退出碼
if [ "$TEST_PASSED" = true ]; then
    echo -e "${GREEN}✓ 測試套件執行完成${NC}"
    exit 0
else
    echo -e "${RED}✗ 測試套件執行失敗${NC}"
    exit 1
fi
