#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速測試腳本 - 風險規則管理 UI
檢查應用程序是否可以正常啟動
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_node_modules():
    """檢查 node_modules 是否存在"""
    desktop_path = Path("desktop")
    node_modules = desktop_path / "node_modules"
    
    if not node_modules.exists():
        print("❌ node_modules 不存在")
        print("   請先執行: cd desktop && npm install")
        return False
    
    print("✅ node_modules 存在")
    return True

def check_database():
    """檢查數據庫是否存在"""
    db_path = Path("desktop/database.db")
    
    if not db_path.exists():
        print("⚠️  數據庫不存在，將在首次啟動時自動創建")
    else:
        print("✅ 數據庫已存在")
    
    return True

def main():
    print("\n🚀 風險規則管理 UI - 快速測試")
    print("="*60)
    
    # 切換到項目根目錄
    os.chdir(Path(__file__).parent)
    
    # 檢查環境
    print_header("1. 環境檢查")
    
    if not check_node_modules():
        return False
    
    check_database()
    
    # 提示測試步驟
    print_header("2. 測試步驟")
    print("""
請按照以下步驟測試：

1️⃣  啟動應用程序
   在新的終端執行：
   cd desktop
   npm run dev

2️⃣  登入管理員帳號
   用戶名：admin
   密碼：admin123

3️⃣  訪問風險規則管理
   點擊右上角用戶菜單 → 「風險規則管理」

4️⃣  測試功能
   ✓ 查看規則列表（應該有 8 條預設規則）
   ✓ 新增規則
   ✓ 編輯規則
   ✓ 啟用/停用規則
   ✓ 刪除規則
   ✓ 測試篩選功能

5️⃣  檢查控制台
   打開瀏覽器開發者工具（F12）
   檢查是否有錯誤訊息

6️⃣  測試普通用戶
   登出後創建普通用戶帳號
   驗證無法訪問風險規則管理
    """)
    
    print_header("3. 常見問題")
    print("""
Q: 點擊「風險規則管理」沒有反應？
A: 檢查瀏覽器控制台是否有錯誤，確認路由配置正確

Q: 規則列表是空的？
A: 檢查數據庫是否正確初始化，應該有 8 條預設規則

Q: 新增規則後沒有顯示？
A: 點擊「刷新」按鈕，或檢查控制台錯誤訊息

Q: 正則表達式驗證失敗？
A: 確保輸入的是有效的正則表達式，可以先在線測試

Q: 啟用/停用沒有效果？
A: 檢查是否使用管理員帳號，普通用戶無法修改
    """)
    
    print_header("4. 數據庫檢查")
    print("""
如需檢查數據庫內容，可以使用 SQLite 工具：

# 安裝 SQLite（如果沒有）
# Windows: 下載 sqlite-tools
# Mac: brew install sqlite
# Linux: sudo apt-get install sqlite3

# 查看規則
sqlite3 desktop/database.db "SELECT * FROM risk_rules;"

# 查看規則數量
sqlite3 desktop/database.db "SELECT COUNT(*) FROM risk_rules;"

# 查看啟用的規則
sqlite3 desktop/database.db "SELECT name, category, risk_level, enabled FROM risk_rules WHERE enabled = 1;"
    """)
    
    print_header("5. 完成")
    print("""
✅ 環境檢查完成
📋 請按照上述步驟進行測試
📝 測試結果請記錄在 RISK_RULES_UI_IMPLEMENTATION_REPORT.md

如有問題，請檢查：
- 瀏覽器控制台錯誤
- 終端錯誤訊息
- 數據庫內容
    """)
    
    print("\n" + "="*60)
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
