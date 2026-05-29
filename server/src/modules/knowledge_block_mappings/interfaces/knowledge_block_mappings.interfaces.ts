export interface KnowledgeBlockMappingEntity {
  id: string;
  knowledge_block: string;
  label: string;
  phrases: string[];
  created_at: Date;
  updated_at: Date;
}

export type KnowledgeBlockMappingResponse = KnowledgeBlockMappingEntity;
