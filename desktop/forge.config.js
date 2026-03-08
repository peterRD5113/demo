module.exports = {
  packagerConfig: {
    asar: true,
    name: 'ContractRiskManagement',
    executableName: 'contract-risk-management',
    appBundleId: 'com.example.contract-risk-management',
    appCategoryType: 'public.app-category.business',
    icon: './assets/icon',
    extraResource: [
      './resources'
    ],
    ignore: [
      /^\/src/,
      /\.ts$/,
      /\.map$/,
      /^\/\.vscode/,
      /^\/\.git/,
      /^\/test/,
      /^\/coverage/
    ]
  },
  rebuildConfig: {
    force: true
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ContractRiskManagement',
        authors: 'Contract Risk Management Team',
        description: '合同風險管理系統 - 智能識別合同風險',
        setupIcon: './assets/icon.ico',
        noMsi: true
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'contract-risk-management',
          productName: 'Contract Risk Management',
          genericName: 'Contract Risk Management System',
          description: '合同風險管理系統 - 智能識別合同風險',
          categories: ['Office', 'Business'],
          maintainer: 'Contract Risk Management Team',
          homepage: 'https://example.com',
          icon: './assets/icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'contract-risk-management',
          productName: 'Contract Risk Management',
          genericName: 'Contract Risk Management System',
          description: '合同風險管理系統 - 智能識別合同風險',
          categories: ['Office', 'Business'],
          homepage: 'https://example.com',
          icon: './assets/icon.png'
        }
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ]
};
