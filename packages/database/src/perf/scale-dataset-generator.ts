import { PGlite } from '@electric-sql/pglite';
import { CANONICAL_ORG_ID_A } from '../client.js';

export interface ScaleDatasetConfig {
  organizationId?: string;
  schoolsCount: number;
  campusesPerSchool: number;
  preAdmissionsPerCampus: number;
  auditLogsPerCampus: number;
  batchSize?: number;
  onNodeCreated?: (node: { id: string; code: string; name: string; type: string; parentId?: string }) => void;
}

export interface ScaleGenerationResult {
  totalSchools: number;
  totalCampuses: number;
  totalPreAdmissions: number;
  totalAuditLogs: number;
  durationMs: number;
}

/**
 * Enterprise Scale Synthetic Dataset Generator
 *
 * Designed to generate realistic high-scale data volumes:
 * - 1,000+ Campuses / Schools
 * - 1,000,000+ Pre-Admissions & Operational Records
 * - Millions of Audit Logs
 *
 * Utilizes batch chunking and direct multi-row parameterized inserts
 * to maximize throughput without memory exhaustion.
 */
export async function generateSyntheticScaleDataset(
  dbEngine: PGlite | any,
  config: ScaleDatasetConfig
): Promise<ScaleGenerationResult> {
  const startTime = Date.now();
  const orgId = config.organizationId || CANONICAL_ORG_ID_A;
  const batchSize = config.batchSize || 1000;

  const totalCampusesTarget = config.schoolsCount * config.campusesPerSchool;
  const totalPreAdmissionsTarget = totalCampusesTarget * config.preAdmissionsPerCampus;
  const totalAuditLogsTarget = totalCampusesTarget * config.auditLogsPerCampus;

  const schoolIds: string[] = [];
  const campusIds: { id: string; schoolId: string }[] = [];

  // 1. Generate Schools
  for (let s = 1; s <= config.schoolsCount; s++) {
    const schoolId = `33333333-0000-0000-0000-${String(s).padStart(12, '0')}`;
    const code = `SCH-P${s}`;
    const name = `Benchmark School Alpha ${s}`;
    schoolIds.push(schoolId);

    await dbEngine.query(
      `INSERT INTO schools (id, organization_id, name, code, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (id) DO NOTHING`,
      [schoolId, orgId, name, code]
    );

    if (config.onNodeCreated) {
      config.onNodeCreated({ id: schoolId, code, name, type: 'SCHOOL', parentId: 'ho-alpha' });
    }
  }

  // 2. Generate Campuses / Branches
  let campusSeq = 1;
  for (const sId of schoolIds) {
    for (let c = 1; c <= config.campusesPerSchool; c++) {
      const campusId = `44444444-0000-0000-0000-${String(campusSeq).padStart(12, '0')}`;
      const code = `CMP-P${campusSeq}`;
      const name = `Benchmark Campus ${campusSeq}`;
      campusIds.push({ id: campusId, schoolId: sId });
      campusSeq++;

      await dbEngine.query(
        `INSERT INTO branches (id, organization_id, school_id, code, name, short_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (id) DO NOTHING`,
        [campusId, orgId, sId, code, name, `Campus ${campusSeq}`]
      );

      if (config.onNodeCreated) {
        config.onNodeCreated({ id: campusId, code, name, type: 'CAMPUS', parentId: sId });
      }
    }
  }

  // 3. Batch Generate Pre-Admissions
  const statuses = ['SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'ON_HOLD'];
  const verStatuses = ['UNVERIFIED', 'AUTO_VERIFIED', 'STAFF_VERIFIED', 'NEEDS_REVIEW'];
  const firstNames = ['Muhammad', 'Fatima', 'Ali', 'Zainab', 'Ahmed', 'Ayesha', 'Hamza', 'Maryam', 'Bilal', 'Sara'];
  const lastNames = ['Khan', 'Ahmed', 'Qureshi', 'Malik', 'Siddiqui', 'Shah', 'Raza', 'Farooq', 'Sheikh', 'Ansari'];

  let appCounter = 1;
  let preAdmBatch: any[][] = [];

  for (const camp of campusIds) {
    for (let a = 1; a <= config.preAdmissionsPerCampus; a++) {
      const fn = firstNames[appCounter % firstNames.length] || 'Student';
      const ln = lastNames[(appCounter + a) % lastNames.length] || 'Alpha';
      const studentName = `${fn} ${ln}`;
      const fatherName = `${lastNames[a % lastNames.length] || 'Father'} Senior`;
      const appNo = `PA-PERF-${String(appCounter).padStart(7, '0')}`;
      const mobile = `0300${String(appCounter).padStart(7, '0')}`;
      const status = statuses[appCounter % statuses.length] || 'SUBMITTED';
      const verStatus = verStatuses[appCounter % verStatuses.length] || 'UNVERIFIED';
      const appliedDate = new Date(Date.now() - (appCounter % 60) * 86400000);
      const preAdmId = `55555555-0000-0000-0000-${String(appCounter).padStart(12, '0')}`;

      preAdmBatch.push([
        preAdmId,
        orgId,
        camp.schoolId,
        camp.id,
        appNo,
        'ay_2026_2027',
        'Academic Year 2026–2027',
        'cls-g1',
        'Grade 1',
        'f_prereg_2026',
        'Online Pre-Registration 2026–2027',
        studentName,
        'MALE',
        '2019-03-15',
        fatherName,
        '42101-1234567-1',
        mobile,
        `${fn.toLowerCase()}.${appCounter}@benchmark.example`,
        'ONLINE',
        status,
        verStatus,
        's_test_1',
        verStatus === 'UNVERIFIED' ? 'Verification' : 'Entrance Test',
        verStatus === 'UNVERIFIED' ? 'APPLICATION_REVIEW' : 'ASSESSMENT_TEST',
        appliedDate.toISOString(),
      ]);

      appCounter++;

      if (preAdmBatch.length >= batchSize) {
        await flushPreAdmissionsBatch(dbEngine, preAdmBatch);
        preAdmBatch = [];
      }
    }
  }

  if (preAdmBatch.length > 0) {
    await flushPreAdmissionsBatch(dbEngine, preAdmBatch);
    preAdmBatch = [];
  }

  // 4. Batch Generate Audit Logs
  let auditCounter = 1;
  let auditBatch: any[][] = [];

  for (const camp of campusIds) {
    for (let l = 1; l <= config.auditLogsPerCampus; l++) {
      const auditId = `66666666-0000-0000-0000-${String(auditCounter).padStart(12, '0')}`;
      auditBatch.push([
        auditId,
        orgId,
        camp.id,
        '99999999-9999-9999-9999-999999999999',
        'admin@campus-os.local',
        'ADMISSIONS',
        'STATUS_CHANGE',
        'pre_admission',
        '00000000-0000-0000-0000-000000000000',
        JSON.stringify({ status: { before: 'SUBMITTED', after: 'IN_PROGRESS' } }),
        'SUCCESS',
        new Date(Date.now() - (auditCounter % 30) * 86400000).toISOString(),
      ]);

      auditCounter++;

      if (auditBatch.length >= batchSize) {
        await flushAuditBatch(dbEngine, auditBatch);
        auditBatch = [];
      }
    }
  }

  if (auditBatch.length > 0) {
    await flushAuditBatch(dbEngine, auditBatch);
    auditBatch = [];
  }

  const durationMs = Date.now() - startTime;

  return {
    totalSchools: config.schoolsCount,
    totalCampuses: totalCampusesTarget,
    totalPreAdmissions: totalPreAdmissionsTarget,
    totalAuditLogs: totalAuditLogsTarget,
    durationMs,
  };
}

async function flushPreAdmissionsBatch(dbEngine: any, batch: any[][]) {
  for (const row of batch) {
    await dbEngine.query(
      `INSERT INTO pre_admissions (
         id, organization_id, school_id, campus_id, application_number,
         academic_year_id, academic_year_name, class_id, class_name,
         form_definition_id, form_name, student_name, gender, date_of_birth,
         father_or_guardian_name, father_cnic, primary_mobile, primary_email,
         source, status, verification_status, current_step_id, current_step_name,
         current_step_type, submitted_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
       ) ON CONFLICT (id) DO NOTHING`,
      row
    );
  }
}

async function flushAuditBatch(dbEngine: any, batch: any[][]) {
  for (const row of batch) {
    await dbEngine.query(
      `INSERT INTO audit_logs (
         id, organization_id, hierarchy_node_id, actor_id, actor_email,
         module, action, entity_type, entity_id, diff, outcome, created_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
       ) ON CONFLICT (id) DO NOTHING`,
      row
    );
  }
}
