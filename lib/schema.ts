import * as z from 'zod';

export const EvidenceSchema = z.object({
  sentenceIndex: z.number().int().nonnegative(),
  quote: z.string().min(3).max(240),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const PrioritySchema = z.enum(['P0', 'P1', 'P2']);
export type Priority = z.infer<typeof PrioritySchema>;

export const SizeSchema = z.enum(['XS', 'S', 'M', 'L', 'XL']);
export type Size = z.infer<typeof SizeSchema>;

export const UserStorySchema = z.object({
  id: z.string().regex(/^US-\d{3}$/),
  persona: z.string(),
  want: z.string(),
  soThat: z.string(),
  evidence: z.array(EvidenceSchema).min(1),
});
export type UserStory = z.infer<typeof UserStorySchema>;

export const RequirementSchema = z.object({
  id: z.string().regex(/^FR-\d{3}$/),
  text: z.string(),
  priority: PrioritySchema,
  evidence: z.array(EvidenceSchema).min(1),
});
export type Requirement = z.infer<typeof RequirementSchema>;

export const AcceptanceCriteriaSchema = z.object({
  id: z.string().regex(/^AC-\d{3}$/),
  requirementId: z.string(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
});
export type AcceptanceCriteria = z.infer<typeof AcceptanceCriteriaSchema>;

export const RiskSchema = z.object({
  id: z.string().regex(/^RK-\d{3}$/),
  text: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  evidence: z.array(EvidenceSchema).min(1),
});
export type Risk = z.infer<typeof RiskSchema>;

export const OpenQuestionSchema = z.object({
  id: z.string().regex(/^OQ-\d{3}$/),
  question: z.string(),
  reason: z.string(),
  evidence: z.array(EvidenceSchema).min(1),
});
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;

export const TaskSchema = z.object({
  id: z.string().regex(/^T-\d{3}$/),
  title: z.string(),
  description: z.string(),
  priority: PrioritySchema,
  size: SizeSchema,
  requirementIds: z.array(z.string()),
  dependsOn: z.array(z.string()),
  evidence: z.array(EvidenceSchema).min(1),
});
export type Task = z.infer<typeof TaskSchema>;

export const SpecSchema = z.object({
  title: z.string().max(100),
  summary: z.string().max(400),
  problem: z.string().max(800),
  userStories: z.array(UserStorySchema).max(12),
  requirements: z.array(RequirementSchema).max(25),
  acceptanceCriteria: z.array(AcceptanceCriteriaSchema).max(40),
  risks: z.array(RiskSchema),
  openQuestions: z.array(OpenQuestionSchema),
  tasks: z.array(TaskSchema).max(30),
});
export type Spec = z.infer<typeof SpecSchema>;

export const GenerateResultSchema = z.object({
  spec: SpecSchema,
  sentences: z.array(z.string()),
  meta: z.object({
    mode: z.enum(['gemini', 'demo']),
    model: z.string(),
    latencyMs: z.number(),
    warnings: z.array(z.string()),
    grounding: z.object({
      verified: z.number(),
      dropped: z.number(),
    }),
  }),
});
export type GenerateResult = z.infer<typeof GenerateResultSchema>;
