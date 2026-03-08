/**
 * Repository 層統一導出
 * 提供所有數據訪問對象的單一入口
 */

export { BaseRepository } from './BaseRepository';
export { UserRepository, userRepository } from './UserRepository';
export { ProjectRepository, projectRepository } from './ProjectRepository';
export { DocumentRepository, documentRepository } from './DocumentRepository';
export { ClauseRepository, clauseRepository } from './ClauseRepository';
export {
  RiskRuleRepository,
  RiskMatchRepository,
  riskRuleRepository,
  riskMatchRepository,
} from './RiskRepository';

// �O�W�G���F�V��ݮe�AriskRepository ���V riskRuleRepository
export { riskRuleRepository as riskRepository } from './RiskRepository';
